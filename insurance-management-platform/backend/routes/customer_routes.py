from flask import Blueprint, request
from marshmallow import ValidationError
from sqlalchemy import or_

from extensions import db
from models import Customer, Role
from schemas.customer_schema import CustomerSchema, CustomerUpdateSchema
from middleware.auth import role_required
from utils.responses import success, error

bp = Blueprint("customers", __name__, url_prefix="/api/customers")


@bp.get("")
@role_required(Role.ADMIN, Role.AGENT)
def list_customers():
    q = request.args.get("q", "").strip()
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 10)), 100)

    query = Customer.query
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Customer.name.ilike(like),
                                 Customer.email.ilike(like),
                                 Customer.phone.ilike(like)))
    query = query.order_by(Customer.created_at.desc())
    pag = query.paginate(page=page, per_page=per_page, error_out=False)
    return success(
        [c.to_dict(with_counts=True) for c in pag.items],
        total=pag.total, page=page, per_page=per_page, pages=pag.pages,
    )


@bp.post("")
@role_required(Role.ADMIN, Role.AGENT)
def create_customer():
    try:
        data = CustomerSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    if Customer.query.filter_by(email=data["email"]).first():
        return error("A customer with that email already exists.", 409)
    customer = Customer(**data)
    db.session.add(customer)
    db.session.commit()
    return success(customer.to_dict(), "Customer registered", 201)


@bp.get("/<int:cid>")
@role_required(Role.ADMIN, Role.AGENT)
def get_customer(cid):
    customer = Customer.query.get(cid)
    if not customer:
        return error("Customer not found", 404)
    return success(customer.to_dict(with_counts=True))


@bp.put("/<int:cid>")
@role_required(Role.ADMIN, Role.AGENT)
def update_customer(cid):
    customer = Customer.query.get(cid)
    if not customer:
        return error("Customer not found", 404)
    try:
        data = CustomerUpdateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    for k, v in data.items():
        setattr(customer, k, v)
    db.session.commit()
    return success(customer.to_dict(), "Customer updated")


@bp.get("/<int:cid>/history")
@role_required(Role.ADMIN, Role.AGENT)
def customer_history(cid):
    customer = Customer.query.get(cid)
    if not customer:
        return error("Customer not found", 404)
    return success({
        "customer": customer.to_dict(),
        "policies": [p.to_dict() for p in customer.policies],
        "documents": [d.to_dict() for d in customer.documents],
    })
