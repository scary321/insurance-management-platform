from datetime import datetime
from extensions import db


class PolicyStatus:
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    ALL = (ACTIVE, EXPIRED, CANCELLED)

class Policy(db.Model):
    __tablename__ = "policies"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    policy_type = db.Column(db.String(60), nullable=False)   # life, health, auto, property...
    policy_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    premium_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=PolicyStatus.ACTIVE)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    customer = db.relationship("Customer", back_populates="policies")
    claims = db.relationship("Claim", back_populates="policy", cascade="all, delete-orphan")
    payments = db.relationship("PremiumPayment", back_populates="policy", cascade="all, delete-orphan")

    def to_dict(self, with_customer=False):
        data = {
            "id": self.id,
            "customer_id": self.customer_id,
            "policy_type": self.policy_type,
            "policy_number": self.policy_number,
            "premium_amount": float(self.premium_amount or 0),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
        }
        if with_customer and self.customer:
            data["customer_name"] = self.customer.name
        return data
