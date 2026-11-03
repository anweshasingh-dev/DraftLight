import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent


def _positive_float(value: str | None, default: float) -> float:
    try:
        parsed = float(value) if value is not None else default
    except ValueError:
        return default
    return parsed if parsed > 0 else default


class Config:
    """Default local backend configuration."""

    DATABASE = str(BACKEND_DIR / "draftlight.db")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
    OLLAMA_TIMEOUT_SECONDS = _positive_float(
        os.getenv("OLLAMA_TIMEOUT_SECONDS"),
        60.0,
    )
