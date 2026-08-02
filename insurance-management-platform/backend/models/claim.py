from datetime import datetime
from extensions import db


class ClaimStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ALL = (PENDING, APPROVED, REJECTED)


class Claim(db.Model):
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey("policies.id"), nullable=False)
    claim_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=ClaimStatus.PENDING)
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    review_note = db.Column(db.Text, nullable=True)

    policy = db.relationship("Policy", back_populates="claims")

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "policy_number": self.policy.policy_number if self.policy else None,
            "claim_amount": float(self.claim_amount or 0),
            "reason": self.reason,
            "status": self.status,
            "submission_date": self.submission_date.isoformat() if self.submission_date else None,
            "reviewed_by": self.reviewed_by,
            "review_note": self.review_note,
        }
