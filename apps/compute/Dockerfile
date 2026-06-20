# Use uv for deterministic builds
FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS builder

WORKDIR /app
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src/ ./src/
RUN uv sync --frozen --no-dev

FROM python:3.12-slim-bookworm
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src
COPY pyproject.toml ./

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

CMD ["fastapi", "run"]
