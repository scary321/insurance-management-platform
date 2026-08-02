"""Seed the database with demo users and sample data.

Usage:
    python seed.py
"""
import random
from datetime import date, timedelta

from app import create_app
from extensions import db
from models import (
    User, Role, Customer, Policy, PolicyStatus,
    Claim, ClaimStatus, PremiumPayment, PaymentStatus,
)
from services.policy_service import generate_policy_number

app = create_app()

DEMO_USERS = [
    ("Admin User", "admin@insure.dev", "admin123", Role.ADMIN),
    ("Agent Riya", "agent@insure.dev", "agent123", Role.AGENT),
]

CUSTOMERS = [
    ("Nadia Okonkwo", "nadia@example.com", "+1-201-555-0110", "12 Maple Ave, Vineland, NJ"),
    ("Marcus Feldman", "marcus@example.com", "+1-201-555-0134", "89 Birch St, Trenton, NJ"),
    ("Priya Anand", "priya@example.com", "+1-201-555-0178", "45 Cedar Rd, Newark, NJ"),
    ("Diego Alvarez", "diego@example.com", "+1-201-555-0192", "7 Willow Ln, Camden, NJ"),
    ("Sofia Lindqvist", "sofia@example.com", "+1-201-555-0203", "301 Oak Blvd, Edison, NJ"),
]

POLICY_TYPES = ["Life", "Health", "Auto", "Property", "Travel"]


def run():
    with app.app_context():
        db.drop_all()
        db.create_all()

        for name, email, pw, role in DEMO_USERS:
            u = User(name=name, email=email, role=role)
            u.set_password(pw)
            db.session.add(u)

        customers = []
        for i, (name, email, phone, addr) in enumerate(CUSTOMERS):
            c = Customer(
                name=name, email=email, phone=phone, address=addr,
                dob=date(1985 + i, (i % 12) + 1, (i % 27) + 1),
                created_at=date.today() - timedelta(days=150 - i * 25),
            )
            db.session.add(c)
            customers.append(c)
        db.session.flush()

        # A linked customer login
        cust_user = User(name=customers[0].name, email="customer@insure.dev",
                         role=Role.CUSTOMER, customer_id=customers[0].id)
        cust_user.set_password("customer123")
        db.session.add(cust_user)

        for c in customers:
            for _ in range(random.randint(1, 2)):
                ptype = random.choice(POLICY_TYPES)
                start = date.today() - timedelta(days=random.randint(0, 400))
                end = start + timedelta(days=365)
                status = PolicyStatus.ACTIVE if end >= date.today() else PolicyStatus.EXPIRED
                premium = random.choice([450, 780, 1200, 2400, 3600])
                p = Policy(
                    customer_id=c.id, policy_type=ptype,
                    policy_number=generate_policy_number(ptype),
                    premium_amount=premium, start_date=start, end_date=end, status=status,
                )
                db.session.add(p)
                db.session.flush()

                # Premium payments
                for m in range(random.randint(1, 3)):
                    st = random.choice([PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.OVERDUE])
                    due = date.today() - timedelta(days=random.randint(-30, 120))
                    db.session.add(PremiumPayment(
                        policy_id=p.id, amount=premium / 12,
                        due_date=due,
                        payment_date=due if st == PaymentStatus.PAID else None,
                        payment_status=st,
                    ))

                # An occasional claim
                if random.random() < 0.5:
                    st = random.choice(ClaimStatus.ALL)
                    db.session.add(Claim(
                        policy_id=p.id, claim_amount=random.choice([500, 1500, 4000]),
                        reason=random.choice([
                            "Accidental damage repair", "Hospitalisation reimbursement",
                            "Theft of insured property", "Roadside collision",
                        ]),
                        status=st,
                    ))

        db.session.commit()
        print("Seed complete.")
        print("Logins:")
        print("  admin@insure.dev / admin123      (administrator)")
        print("  agent@insure.dev / agent123      (agent)")
        print("  customer@insure.dev / customer123 (customer)")


if __name__ == "__main__":
    run()
