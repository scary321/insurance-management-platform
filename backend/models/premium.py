from datetime import datetime
from extensions import db


class PaymentStatus:
    PAID = "paid"
    PENDING = "pending"
    OVERDUE = "overdue"
    ALL = (PAID, PENDING, OVERDUE)

class PremiumPayment(db.Model):
    __tablename__ = "premium_payments"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey("policies.id"), nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    payment_status = db.Column(db.String(20), nullable=False, default=PaymentStatus.PENDING)

    policy = db.relationship("Policy", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "policy_number": self.policy.policy_number if self.policy else None,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "amount": float(self.amount or 0),
            "payment_status": self.payment_status,
        }
