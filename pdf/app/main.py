import os, uuid, shutil, subprocess, logging, time, asyncio
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger = logging.getLogger("libreoffice-api")
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI()

# Configuration from environment variables or defaults
# Defaults optimized for low-resource environments (1 core, 512MB-1GB RAM)
API_KEY = os.getenv("X_API_KEY", "")
MAX_SIZE_MB = 30
MAX_CONCURRENT_CONVERSIONS = int(os.getenv("MAX_CONCURRENT_CONVERSIONS", "1"))
CONVERT_TIMEOUT = int(os.getenv("CONVERT_TIMEOUT", "120"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "1"))
RETRY_BACKOFF = (1, 3)  # min, max seconds

logger.info(
    "PDF Service initialized: max_concurrent=%d timeout=%ds retries=%d log_level=%s",
    MAX_CONCURRENT_CONVERSIONS,
    CONVERT_TIMEOUT,
    MAX_RETRIES,
    LOG_LEVEL
)

# Semaphore để giới hạn số convert đồng thời
_conversion_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CONVERSIONS)

@app.get("/health")
def health():
    return {"status": "ok"}

def cleanup_dir(path: str):
    """Cleanup working directory sau conversion"""
    try:
        shutil.rmtree(path, ignore_errors=True)
        logger.info("cleanup_done path=%s", path)
    except Exception as e:
        logger.warning("cleanup_error path=%s error=%s", path, str(e))

def err(error_code: str, message: str, *, status: int = 500, detail=None, extra=None):
    payload = {"error_code": error_code, "message": message}
    if detail is not None:
        payload["detail"] = detail
    if extra is not None:
        payload.update(extra)
    return JSONResponse(status_code=status, content=payload)

async def _convert_with_retry(
    input_path: str,
    output_path: str,
    workdir: str,
    uid: str,
    filename: str,
    file_size: int
) -> tuple[bool, str, dict]:
    """
    Convert DOCX to PDF với retry logic và separate LibreOffice profile.
    Return: (success, output_path, error_info)
    """
    last_error = None
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            logger.info(
                "convert_attempt uid=%s attempt=%d/%d",
                uid,
                attempt + 1,
                MAX_RETRIES + 1
            )
            
            # Create separate profile directory for this soffice process
            profile_dir = f"{workdir}/lo-profile"
            os.makedirs(profile_dir, exist_ok=True)
            
            start_time = time.time()
            
            # Gọi soffice với separate profile để tránh race condition
            res = subprocess.run(
                [
                    "soffice",
                    "--headless",
                    "--nologo",
                    "--nofirststartwizard",
                    f"-env:UserInstallation=file://{profile_dir}",  # Separate profile
                    "--convert-to", "pdf",
                    "--outdir", workdir,
                    input_path
                ],
                check=True,
                timeout=CONVERT_TIMEOUT,
                capture_output=True,
                text=True
            )
            
            elapsed = time.time() - start_time
            
            if res.stdout:
                logger.info("soffice_stdout uid=%s %s", uid, res.stdout.strip())
            if res.stderr:
                logger.warning("soffice_stderr uid=%s %s", uid, res.stderr.strip())
            
            logger.info(
                "convert_success uid=%s attempt=%d elapsed_sec=%.2f file_size=%dB",
                uid,
                attempt + 1,
                elapsed,
                file_size
            )
            
            return (True, output_path, {})
        
        except subprocess.TimeoutExpired as e:
            elapsed = time.time() - start_time
            error_msg = f"Timeout after {CONVERT_TIMEOUT}s"
            logger.warning(
                "convert_timeout uid=%s attempt=%d elapsed_sec=%.2f stderr=%s",
                uid,
                attempt + 1,
                elapsed,
                (e.stderr or "").strip()
            )
            last_error = {
                "type": "TIMEOUT",
                "returncode": None,
                "stdout": (e.stdout or "").strip(),
                "stderr": (e.stderr or "").strip(),
            }
            # Timeout không nên retry
            break
        
        except subprocess.CalledProcessError as e:
            elapsed = time.time() - start_time
            logger.warning(
                "convert_failed uid=%s attempt=%d returncode=%s elapsed_sec=%.2f stderr=%s",
                uid,
                attempt + 1,
                e.returncode,
                elapsed,
                (e.stderr or "").strip()
            )
            last_error = {
                "type": "CONVERSION_FAILED",
                "returncode": e.returncode,
                "stdout": (e.stdout or "").strip(),
                "stderr": (e.stderr or "").strip(),
            }
            
            # Retry chỉ khi attempt < MAX_RETRIES
            if attempt < MAX_RETRIES:
                backoff = RETRY_BACKOFF[0] + (attempt * (RETRY_BACKOFF[1] - RETRY_BACKOFF[0]) / MAX_RETRIES)
                logger.info("retry_backoff uid=%s backoff_sec=%.2f", uid, backoff)
                await asyncio.sleep(backoff)
                continue
            else:
                break
        
        except Exception as e:
            logger.exception("convert_error uid=%s attempt=%d", uid, attempt + 1)
            last_error = {
                "type": "INTERNAL_ERROR",
                "returncode": None,
                "stdout": "",
                "stderr": str(e),
            }
            break
    
    # All attempts failed
    return (False, None, last_error or {"type": "UNKNOWN", "returncode": None, "stdout": "", "stderr": ""})


@app.post("/convert")
async def convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_api_key: str = Header(None)
):
    if x_api_key != API_KEY:
        return err("UNAUTHORIZED", "Unauthorized", status=401)

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        return err("FILE_TOO_LARGE", "File too large", status=413, extra={"max_mb": MAX_SIZE_MB})

    uid = str(uuid.uuid4())
    workdir = f"/tmp/{uid}"
    os.makedirs(workdir, exist_ok=True)

    input_path = f"{workdir}/{file.filename}"
    output_name = f"{file.filename.rsplit('.', 1)[0]}.pdf"
    output_path = f"{workdir}/{output_name}"

    with open(input_path, "wb") as f:
        f.write(content)

    logger.info(
        "convert_start uid=%s filename=%s size=%sB",
        uid,
        file.filename,
        len(content)
    )

    # Acquire semaphore - limit concurrent LibreOffice processes
    async with _conversion_semaphore:
        success, result_path, error_info = await _convert_with_retry(
            input_path=input_path,
            output_path=output_path,
            workdir=workdir,
            uid=uid,
            filename=file.filename,
            file_size=len(content)
        )

    if not success:
        logger.error("convert_failed_all_attempts uid=%s error_info=%s", uid, error_info)
        cleanup_dir(workdir)
        
        error_code = error_info.get("type", "CONVERT_FAILED")
        if error_code == "TIMEOUT":
            return err(
                "CONVERT_TIMEOUT",
                "Conversion timed out",
                status=504,
                extra={
                    "uid": uid,
                    "timeout_sec": CONVERT_TIMEOUT,
                    "libreoffice_output": {
                        "stdout": error_info.get("stdout", ""),
                        "stderr": error_info.get("stderr", ""),
                    },
                }
            )
        else:
            return err(
                error_code,
                "LibreOffice conversion failed after all retries",
                status=500,
                extra={
                    "uid": uid,
                    "returncode": error_info.get("returncode"),
                    "libreoffice_output": {
                        "stdout": error_info.get("stdout", ""),
                        "stderr": error_info.get("stderr", ""),
                    },
                }
            )

    if not os.path.exists(result_path):
        logger.error("output_not_found uid=%s expected=%s", uid, result_path)
        cleanup_dir(workdir)
        return err(
            "OUTPUT_NOT_FOUND",
            "Convert succeeded but output PDF not found",
            status=500,
            extra={"uid": uid, "expected_output": output_name}
        )

    background_tasks.add_task(cleanup_dir, workdir)
    logger.info("convert_complete uid=%s output=%s", uid, output_name)

    return FileResponse(result_path, media_type="application/pdf", filename=output_name)
