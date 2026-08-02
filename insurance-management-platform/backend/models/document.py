from datetime import datetime
from extensions import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    stored_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    doc_type = db.Column(db.String(40), default="identity")  # identity | policy | claim
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    customer = db.relationship("Customer", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "file_name": self.file_name,
            "doc_type": self.doc_type,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
