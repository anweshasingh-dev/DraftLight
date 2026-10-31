from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent


class Config:
    """Default local backend configuration."""

    DATABASE = str(BACKEND_DIR / "draftlight.db")
