from flask import Blueprint, send_file
from models import Role
from services.report_service import dashboard_summary, build_monthly_pdf
from services.policy_service import refresh_expiries
from middleware.auth import role_required
from utils.responses import success

bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@bp.get("/summary")
@role_required(Role.ADMIN, Role.AGENT)
def summary():
    refresh_expiries()
    return success(dashboard_summary())


@bp.get("/monthly.pdf")
@role_required(Role.ADMIN, Role.AGENT)
def monthly_pdf():
    refresh_expiries()
    path, filename = build_monthly_pdf()
    return send_file(path, as_attachment=True, download_name=filename, mimetype="application/pdf")
