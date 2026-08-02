from datetime import datetime
from extensions import db, bcrypt


class Role:
    ADMIN = "administrator"
    AGENT = "agent"
    CUSTOMER = "customer"
    ALL = (ADMIN, AGENT, CUSTOMER)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=Role.CUSTOMER)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # A customer user optionally links to a customer record.
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=True)

    def set_password(self, raw):
        self.password = bcrypt.generate_password_hash(raw).decode("utf-8")

    def check_password(self, raw):
        return bcrypt.check_password_hash(self.password, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "customer_id": self.customer_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
