import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


def is_allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]


def save_upload(file_storage):
    """Store an uploaded file under a collision-proof name; return (original, stored, path)."""
    original = secure_filename(file_storage.filename)
    ext = original.rsplit(".", 1)[1].lower() if "." in original else "bin"
    stored = f"{uuid.uuid4().hex}.{ext}"
    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, stored)
    file_storage.save(path)
    return original, stored, path
