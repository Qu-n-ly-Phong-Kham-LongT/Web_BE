import os, uuid, shutil, subprocess, logging
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

logger = logging.getLogger("libreoffice-api")
logging.basicConfig(level=logging.INFO)

app = FastAPI()

API_KEY = os.getenv("X_API_KEY", "")
MAX_SIZE_MB = 30

@app.get("/health")
def health():
    return {"status": "ok"}

def cleanup_dir(path: str):
    shutil.rmtree(path, ignore_errors=True)

def err(error_code: str, message: str, *, status: int = 500, detail=None, extra=None):
    payload = {"error_code": error_code, "message": message}
    if detail is not None:
        payload["detail"] = detail
    if extra is not None:
        payload.update(extra)
    return JSONResponse(status_code=status, content=payload)

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

    logger.info("convert_start uid=%s filename=%s size=%sB", uid, file.filename, len(content))

    try:
        # capture stdout/stderr để trả về cho client khi lỗi
        res = subprocess.run(
            [
                "soffice",
                "--headless",
                "--nologo",
                "--nofirststartwizard",
                "--convert-to", "pdf",
                "--outdir", workdir,
                input_path
            ],
            check=True,
            timeout=60,
            capture_output=True,
            text=True
        )
        if res.stdout:
            logger.info("soffice_stdout uid=%s %s", uid, res.stdout.strip())
        if res.stderr:
            logger.warning("soffice_stderr uid=%s %s", uid, res.stderr.strip())

    except subprocess.TimeoutExpired as e:
        logger.exception("convert_timeout uid=%s", uid)
        cleanup_dir(workdir)
        return err(
            "CONVERT_TIMEOUT",
            "Conversion timed out",
            status=504,
            extra={"uid": uid, "timeout_sec": 60}
        )

    except subprocess.CalledProcessError as e:
        # lỗi từ soffice: trả stdout/stderr cho client để biết nguyên nhân
        logger.exception("convert_failed uid=%s returncode=%s", uid, e.returncode)
        cleanup_dir(workdir)
        return err(
            "CONVERT_FAILED",
            "LibreOffice conversion failed",
            status=500,
            extra={
                "uid": uid,
                "returncode": e.returncode,
                "libreoffice_output": {
                    "stdout": (e.stdout or "").strip(),
                    "stderr": (e.stderr or "").strip(),
                },
            }
        )

    except Exception as e:
        logger.exception("convert_error uid=%s", uid)
        cleanup_dir(workdir)
        # tránh trả raw exception quá nhiều (có thể lộ info)
        return err("INTERNAL_ERROR", "Internal server error", status=500, extra={"uid": uid})

    if not os.path.exists(output_path):
        logger.error("output_not_found uid=%s expected=%s", uid, output_path)
        cleanup_dir(workdir)
        return err(
            "OUTPUT_NOT_FOUND",
            "Convert succeeded but output PDF not found",
            status=500,
            extra={"uid": uid, "expected_output": output_name}
        )

    background_tasks.add_task(cleanup_dir, workdir)
    logger.info("convert_success uid=%s output=%s", uid, output_name)

    return FileResponse(output_path, media_type="application/pdf", filename=output_name)
