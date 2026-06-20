from fastapi import FastAPI

app = FastAPI(
    title="HardwarePilot Compute",
    description="Geometry, constraint solving, and enclosure generation service",
    version="0.0.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
