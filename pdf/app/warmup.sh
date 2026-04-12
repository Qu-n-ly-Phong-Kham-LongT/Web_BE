#!/bin/bash
echo "==================================="
echo "PDF Service Warmup Started"
echo "==================================="
echo "Configuration:"
echo "  X_API_KEY: ${X_API_KEY:-(not set - required!)}"
echo "  MAX_CONCURRENT_CONVERSIONS: ${MAX_CONCURRENT_CONVERSIONS:-2}"
echo "  CONVERT_TIMEOUT: ${CONVERT_TIMEOUT:-60}s"
echo "  MAX_RETRIES: ${MAX_RETRIES:-2}"
echo "  LOG_LEVEL: ${LOG_LEVEL:-INFO}"
echo "==================================="

echo "Warming up LibreOffice..."
soffice --headless --nologo --nofirststartwizard --terminate_after_init

if [ $? -eq 0 ]; then
    echo "✓ LibreOffice warmup successful"
else
    echo "⚠ LibreOffice warmup had issues (may be recoverable)"
fi

echo "PDF Service ready to start"
echo "==================================="

