FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y \
      libreoffice \
      libreoffice-writer \
      python3 \
      python3-pip \
      fonts-dejavu \
      fonts-liberation \
      fonts-noto \
      supervisor \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY app/requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app /app
RUN chmod +x /app/warmup.sh

# Default configuration optimized for low-resource (1 core, 512MB-1GB RAM):
#   MAX_CONCURRENT_CONVERSIONS=1 (sequential only)
#   CONVERT_TIMEOUT=120s (longer timeout for slower systems)
#   MAX_RETRIES=1 (minimal retries to save time)
#
# For higher-resource environments, override these env vars:
#   docker run -e MAX_CONCURRENT_CONVERSIONS=2 -e CONVERT_TIMEOUT=60 -e MAX_RETRIES=2 ...
#
# Note: Using single worker (--workers 1) to ensure Semaphore-based concurrency limiting
# works correctly across all requests. LibreOffice conversion is CPU/IO intensive.

CMD ["/bin/bash", "-c", "./warmup.sh && uvicorn main:app --host 0.0.0.0 --port 2003 --workers 1"]
