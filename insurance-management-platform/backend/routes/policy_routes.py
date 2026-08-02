from datetime import date
from flask import Blueprint, request
from marshmallow import ValidationError

from extensions import db
from models import Policy, PolicyStatus, Customer, Role
from schemas.policy_schema import PolicySchema, PolicyRenewSchema
from services.policy_service import generate_policy_number, refresh_expiries
from middleware.auth import role_required, current_scope
from utils.responses import success, error

bp = Blueprint("policies", __name__, url_prefix="/api/policies")


@bp.get("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def list_policies():
    refresh_expiries()
    status = request.args.get("status")
    customer_id = request.args.get("customer_id", type=int)
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 10)), 100)

    role, _uid, cid = current_scope()
    query = Policy.query
    if role == Role.CUSTOMER:
        # A customer only ever sees their own policies, whatever they ask for.
        query = query.filter_by(customer_id=cid)
    elif customer_id:
        query = query.filter_by(customer_id=customer_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Policy.created_at.desc())
    pag = query.paginate(page=page, per_page=per_page, error_out=False)
    return success(
        [p.to_dict(with_customer=True) for p in pag.items],
        total=pag.total, page=page, per_page=per_page, pages=pag.pages,
    )


@bp.post("")
@role_required(Role.ADMIN, Role.AGENT)
def create_policy():
    try:
        data = PolicySchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    if not Customer.query.get(data["customer_id"]):
        return error("Customer not found", 404)
    if data["end_date"] <= data["start_date"]:
        return error("End date must be after the start date.", 422)

    policy = Policy(
        customer_id=data["customer_id"],
        policy_type=data["policy_type"],
        policy_number=generate_policy_number(data["policy_type"]),
        premium_amount=data["premium_amount"],
        start_date=data["start_date"],
        end_date=data["end_date"],
        status=PolicyStatus.ACTIVE,
    )
    db.session.add(policy)
    db.session.commit()
    return success(policy.to_dict(with_customer=True), "Policy created", 201)


@bp.get("/<int:pid>")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def get_policy(pid):
    role, _uid, cid = current_scope()
    policy = Policy.query.get(pid)
    # Return 404 (not 403) for someone else's policy so IDs can't be probed.
    if not policy or (role == Role.CUSTOMER and policy.customer_id != cid):
        return error("Policy not found", 404)
    data = policy.to_dict(with_customer=True)
    data["claims"] = [c.to_dict() for c in policy.claims]
    data["payments"] = [p.to_dict() for p in policy.payments]
    return success(data)


@bp.post("/<int:pid>/renew")
@role_required(Role.ADMIN, Role.AGENT)
def renew_policy(pid):
    policy = Policy.query.get(pid)
    if not policy:
        return error("Policy not found", 404)
    try:
        data = PolicyRenewSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    if data["end_date"] <= date.today():
        return error("Renewal end date must be in the future.", 422)
    policy.end_date = data["end_date"]
    if data.get("premium_amount") is not None:
        policy.premium_amount = data["premium_amount"]
    policy.status = PolicyStatus.ACTIVE
    db.session.commit()
    return success(policy.to_dict(), "Policy renewed")


@bp.post("/<int:pid>/cancel")
@role_required(Role.ADMIN, Role.AGENT)
def cancel_policy(pid):
    policy = Policy.query.get(pid)
    if not policy:
        return error("Policy not found", 404)
    policy.status = PolicyStatus.CANCELLED
    db.session.commit()
    return success(policy.to_dict(), "Policy cancelled")


@bp.get("/expiring")
@role_required(Role.ADMIN, Role.AGENT)
def expiring_soon():
    """Policies whose end_date falls within the next N days (default 30)."""
    from datetime import timedelta
    days = int(request.args.get("days", 30))
    cutoff = date.today() + timedelta(days=days)
    rows = Policy.query.filter(
        Policy.status == PolicyStatus.ACTIVE,
        Policy.end_date <= cutoff,
        Policy.end_date >= date.today(),
    ).order_by(Policy.end_date.asc()).all()
    return success([p.to_dict(with_customer=True) for p in rows])
