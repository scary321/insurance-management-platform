from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import ValidationError

from extensions import db
from models import User, Role, Customer
from schemas.auth_schema import RegisterSchema, LoginSchema
from middleware.auth import role_required
from utils.responses import success, error

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    """Public self-registration creates a customer account. Staff accounts
    (agent/administrator) can only be created by an administrator."""
    try:
        data = RegisterSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)

    requested_role = data.get("role", Role.CUSTOMER)
    if requested_role in (Role.ADMIN, Role.AGENT):
        # Elevated roles require an admin caller.
        try:
            role_required(Role.ADMIN)(lambda: None)()
        except Exception:
            return error("Only an administrator can create staff accounts.", 403)

    if User.query.filter_by(email=data["email"]).first():
        return error("An account with that email already exists.", 409)
    if requested_role == Role.CUSTOMER and Customer.query.filter_by(email=data["email"]).first():
        return error("An account with that email already exists.", 409)

    user = User(name=data["name"], email=data["email"], role=requested_role)
    user.set_password(data["password"])

    # A self-registering customer also gets a linked customer record.
    if requested_role == Role.CUSTOMER:
        customer = Customer(name=data["name"], email=data["email"])
        db.session.add(customer)
        db.session.flush()
        user.customer_id = customer.id

    db.session.add(user)
    db.session.commit()
    return success(user.to_dict(), "Account created", 201)


@bp.post("/login")
def login():
    try:
        data = LoginSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error("Validation failed", 422,errors=e.messages)

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return error("Invalid email or password.", 401)

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name, "customer_id": user.customer_id},
    )
    return success({"token": token, "user": user.to_dict()},"Signed in")


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return error("User not found", 404)
    return success(user.to_dict())


@bp.get("/users")
@role_required(Role.ADMIN)
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return success([u.to_dict() for u in users])
