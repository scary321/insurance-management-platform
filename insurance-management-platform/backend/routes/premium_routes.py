from datetime import date
from flask import Blueprint, request
from marshmallow import ValidationError

from extensions import db
from models import PremiumPayment, PaymentStatus, Policy, Role
from schemas.premium_schema import PremiumSchema
from middleware.auth import role_required, current_scope
from utils.responses import success, error

bp = Blueprint("premiums", __name__, url_prefix="/api/premiums")


def _mark_overdue():
    today = date.today()
    stale = PremiumPayment.query.filter(
        PremiumPayment.payment_status == PaymentStatus.PENDING,
        PremiumPayment.due_date < today,
    ).all()
    for p in stale:
        p.payment_status = PaymentStatus.OVERDUE
    if stale:
        db.session.commit()


@bp.get("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def list_payments():
    _mark_overdue()
    status = request.args.get("status")
    policy_id = request.args.get("policy_id", type=int)
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 10)), 100)

    role, _uid, cid = current_scope()
    query = PremiumPayment.query
    if role == Role.CUSTOMER:
        query = query.join(Policy).filter(Policy.customer_id == cid)
    if status:
        query = query.filter(PremiumPayment.payment_status == status)
    if policy_id:
        query = query.filter(PremiumPayment.policy_id == policy_id)
    query = query.order_by(PremiumPayment.id.desc())
    pag = query.paginate(page=page, per_page=per_page, error_out=False)
    return success(
        [p.to_dict() for p in pag.items],
        total=pag.total, page=page, per_page=per_page, pages=pag.pages,
    )


@bp.post("")
@role_required(Role.ADMIN, Role.AGENT)
def record_payment():
    try:
        data = PremiumSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    if not Policy.query.get(data["policy_id"]):
        return error("Policy not found", 404)

    payment = PremiumPayment(
        policy_id=data["policy_id"],
        amount=data["amount"],
        payment_date=data.get("payment_date") or (date.today() if data["payment_status"] == PaymentStatus.PAID else None),
        due_date=data.get("due_date"),
        payment_status=data["payment_status"],
    )
    db.session.add(payment)
    db.session.commit()
    return success(payment.to_dict(), "Payment recorded", 201)


@bp.get("/overdue")
@role_required(Role.ADMIN, Role.AGENT)
def overdue():
    _mark_overdue()
    rows = PremiumPayment.query.filter_by(payment_status=PaymentStatus.OVERDUE).all()
    return success([p.to_dict() for p in rows])
