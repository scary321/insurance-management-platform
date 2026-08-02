"""Role-based authorization helpers layered on top of Flask-JWT-Extended."""
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from utils.responses import error


def role_required(*roles):
    """Allow the route only for the listed roles. Empty = any authenticated user."""
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if roles and claims.get("role") not in roles:
                return error("You do not have permission to perform this action.", 403)
            return fn(*args, **kwargs)
        return decorated
    return wrapper


def current_scope():
    """Return (role, user_id, customer_id) for the authenticated caller."""
    from flask_jwt_extended import get_jwt_identity
    verify_jwt_in_request()
    claims = get_jwt()
    return claims.get("role"), int(get_jwt_identity()), claims.get("customer_id")


def is_customer():
    _role, _uid, _cid = current_scope()
    from models import Role
    return _role == Role.CUSTOMER
