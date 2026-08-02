"""Create database tables if they do not already exist.

Safe to run on every deploy: create_all() never drops or alters existing tables.
Used as Render's preDeployCommand. For demo data, run seed.py manually instead.
"""
from app import create_app
from extensions import db

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables ensured.")
