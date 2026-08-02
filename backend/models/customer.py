from datetime import datetime
from extensions import db


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    policies = db.relationship("Policy", back_populates="customer", cascade="all, delete-orphan")
    documents = db.relationship("Document", back_populates="customer", cascade="all, delete-orphan")

    def to_dict(self, with_counts=False):
        data = {
            "id": self.id,
            "name": self.name,
            "dob": self.dob.isoformat() if self.dob else None,
            "phone": self.phone,
            "address": self.address,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if with_counts:
            data["policy_count"] = len(self.policies)
            data["document_count"] = len(self.documents)
        return data
