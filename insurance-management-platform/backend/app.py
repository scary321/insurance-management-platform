"""Application factory for the Insurance Management Platform API."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended.exceptions import NoAuthorizationError

from config import config_map
from extensions import db, migrate, jwt, bcrypt


def create_app(config_name=None):
    config_name = config_name or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["default"]))

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["REPORT_FOLDER"], exist_ok=True)
    os.environ["REPORT_FOLDER"] = app.config["REPORT_FOLDER"]

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Models must be imported so migrations and create_all see them.
    from models import User, Customer, Policy, Claim, PremiumPayment, Document  # noqa: F401

    # Blueprints
    from routes.auth_routes import bp as auth_bp
    from routes.customer_routes import bp as customer_bp
    from routes.policy_routes import bp as policy_bp
    from routes.claim_routes import bp as claim_bp
    from routes.premium_routes import bp as premium_bp
    from routes.document_routes import bp as document_bp
    from routes.report_routes import bp as report_bp

    for bp in (auth_bp, customer_bp, policy_bp, claim_bp, premium_bp, document_bp, report_bp):
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "insurance-management-platform"})

    # Uniform JSON errors
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"success": False, "message": "Resource not found", "data": None}), 404

    @app.errorhandler(NoAuthorizationError)
    def missing_token(_):
        return jsonify({"success": False, "message": "Authentication required", "data": None}), 401

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"success": False, "message": "File exceeds the maximum allowed size", "data": None}), 413

    @app.errorhandler(500)
    def server_error(_):
        db.session.rollback()
        return jsonify({"success": False, "message": "Internal server error", "data": None}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
