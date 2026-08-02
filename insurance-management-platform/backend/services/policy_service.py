"""Small domain helpers shared across routes."""
import random
from datetime import date
from extensions import db
from models import Policy, PolicyStatus


def generate_policy_number(policy_type):
    prefix = (policy_type[:3] or "POL").upper()
    suffix = "".join(str(random.randint(0, 9)) for _ in range(6))
    number = f"{prefix}-{date.today().year}-{suffix}"
    # Guard against the rare collision.
    while Policy.query.filter_by(policy_number=number).first():
        suffix = "".join(str(random.randint(0, 9)) for _ in range(6))
        number = f"{prefix}-{date.today().year}-{suffix}"
    return number


def refresh_expiries():
    """Flip active policies to expired when their end_date has passed."""
    today = date.today()
    stale = Policy.query.filter(
        Policy.status == PolicyStatus.ACTIVE, Policy.end_date < today
    ).all()
    for p in stale:
        p.status = PolicyStatus.EXPIRED
    if stale:
        db.session.commit()
    return len(stale)
