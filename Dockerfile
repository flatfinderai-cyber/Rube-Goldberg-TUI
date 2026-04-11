# ABOUTME: Docker build for the vibe-coding-platform FastAPI app.
# Copies the platform source, installs Python deps, and starts uvicorn.

FROM python:3.11-slim

WORKDIR /app

# Install deps first (layer cache)
COPY apps/vibe-coding-platform/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY apps/vibe-coding-platform/ .

# Create runtime directories
RUN mkdir -p /tmp/workspaces

EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
