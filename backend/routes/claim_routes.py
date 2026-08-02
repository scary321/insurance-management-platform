from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from extensions import db
from models import Claim, ClaimStatus, Policy, Role
from schemas.claim_schema import ClaimSchema, ClaimReviewSchema
from middleware.auth import role_required, current_scope
from utils.responses import success, error

bp = Blueprint("claims", __name__, url_prefix="/api/claims")


@bp.get("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def list_claims():
    status = request.args.get("status")
    policy_id = request.args.get("policy_id", type=int)
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 10)), 100)

    role, _uid, cid = current_scope()
    query = Claim.query
    if role == Role.CUSTOMER:
        # Only claims on policies this customer owns.
        query = query.join(Policy).filter(Policy.customer_id == cid)
    if status:
        query = query.filter(Claim.status == status)
    if policy_id:
        query = query.filter(Claim.policy_id == policy_id)
    query = query.order_by(Claim.submission_date.desc())
    pag = query.paginate(page=page, per_page=per_page, error_out=False)
    return success(
        [c.to_dict() for c in pag.items],
        total=pag.total, page=page, per_page=per_page, pages=pag.pages,
    )


@bp.post("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def submit_claim():
    try:
        data = ClaimSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    role, _uid, cid = current_scope()
    policy = Policy.query.get(data["policy_id"])
    if not policy or (role == Role.CUSTOMER and policy.customer_id != cid):
        # A customer can only file against their own policy.
        return error("Policy not found", 404)
    if data["claim_amount"] <= 0:
        return error("Claim amount must be greater than zero.", 422)

    claim = Claim(
        policy_id=data["policy_id"],
        claim_amount=data["claim_amount"],
        reason=data["reason"],
        status=ClaimStatus.PENDING,
    )
    db.session.add(claim)
    db.session.commit()
    return success(claim.to_dict(), "Claim submitted", 201)


@bp.get("/<int:cid>")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def get_claim(cid):
    role, _uid, scope_cid = current_scope()
    claim = Claim.query.get(cid)
    if not claim or (role == Role.CUSTOMER and claim.policy.customer_id != scope_cid):
        return error("Claim not found", 404)
    return success(claim.to_dict())


@bp.post("/<int:cid>/approve")
@role_required(Role.ADMIN, Role.AGENT)
def approve_claim(cid):
    return _review(cid, ClaimStatus.APPROVED, "Claim approved")


@bp.post("/<int:cid>/reject")
@role_required(Role.ADMIN, Role.AGENT)
def reject_claim(cid):
    return _review(cid, ClaimStatus.REJECTED, "Claim rejected")


def _review(cid, new_status, message):
    claim = Claim.query.get(cid)
    if not claim:
        return error("Claim not found", 404)
    if claim.status != ClaimStatus.PENDING:
        return error(f"Claim is already {claim.status}.", 409)
    try:
        data = ClaimReviewSchema().load(request.get_json(silent=True) or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    claim.status = new_status
    claim.reviewed_by = int(get_jwt_identity())
    claim.review_note = data.get("review_note")
    db.session.commit()
    return success(claim.to_dict(), message)
