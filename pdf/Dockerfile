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

CMD ["/bin/bash", "-c", "./warmup.sh && uvicorn main:app --host 0.0.0.0 --port 2003 --workers 2"]
