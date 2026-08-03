"""Application configuration.

Defaults target PostgreSQL as specified in the project brief. Any value can be
overridden through environment variables (loaded from a local .env file).
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change-in-production-0001")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-please-change-in-production-0002")

    # PostgreSQL by default. Set DATABASE_URL to switch environments.
    _url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/insurance_db",
    )
    # Managed hosts (e.g. Render) may hand out the legacy "postgres://" scheme,
    # which SQLAlchemy no longer recognises. Normalise it.
    if _url.startswith("postgres://"):
        _url = _url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_HOURS", "8")))

    # File uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    REPORT_FOLDER = os.path.join(BASE_DIR, "reports")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_MB", "16")) * 1024 * 1024
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}

    # Comma-separated list of allowed browser origins. "*" allows any (dev default).
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
