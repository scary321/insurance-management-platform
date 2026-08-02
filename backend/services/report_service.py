"""Dashboard statistics and PDF report generation (ReportLab)."""
import os
from datetime import date, datetime
from io import BytesIO
from collections import OrderedDict

from sqlalchemy import func
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)

from extensions import db
from models import Policy, PolicyStatus, Claim, ClaimStatus, PremiumPayment, PaymentStatus, Customer


def dashboard_summary():
    active = Policy.query.filter_by(status=PolicyStatus.ACTIVE).count()
    expired = Policy.query.filter_by(status=PolicyStatus.EXPIRED).count()
    cancelled = Policy.query.filter_by(status=PolicyStatus.CANCELLED).count()

    claims = {
        s: Claim.query.filter_by(status=s).count() for s in ClaimStatus.ALL
    }

    collected = db.session.query(func.coalesce(func.sum(PremiumPayment.amount), 0)).filter(
        PremiumPayment.payment_status == PaymentStatus.PAID
    ).scalar()
    outstanding = db.session.query(func.coalesce(func.sum(PremiumPayment.amount), 0)).filter(
        PremiumPayment.payment_status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE])
    ).scalar()

    return {
        "policies": {"active": active, "expired": expired, "cancelled": cancelled},
        "claims": claims,
        "premium": {
            "collected": float(collected or 0),
            "outstanding": float(outstanding or 0),
        },
        "customers": Customer.query.count(),
        "customer_growth": _customer_growth(),
        "premium_by_month": _premium_by_month(),
    }


def _customer_growth():
    """Cumulative customer count by month for the trailing 6 months."""
    rows = db.session.query(Customer.created_at).all()
    buckets = OrderedDict()
    now = date.today()
    for i in range(5, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year + ((now.month - i - 1) // 12)
        buckets[f"{y}-{m:02d}"] = 0
    for (created,) in rows:
        if not created:
            continue
        key = created.strftime("%Y-%m")
        if key in buckets:
            buckets[key] += 1
    # make it cumulative
    running = Customer.query.count() - sum(buckets.values())
    cumulative = OrderedDict()
    for k, v in buckets.items():
        running += v
        cumulative[k] = running
    return [{"month": k, "count": v} for k, v in cumulative.items()]


def _premium_by_month():
    rows = db.session.query(PremiumPayment.payment_date, PremiumPayment.amount).filter(
        PremiumPayment.payment_status == PaymentStatus.PAID
    ).all()
    buckets = OrderedDict()
    now = date.today()
    for i in range(5, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year + ((now.month - i - 1) // 12)
        buckets[f"{y}-{m:02d}"] = 0.0
    for pay_date, amount in rows:
        if not pay_date:
            continue
        key = pay_date.strftime("%Y-%m")
        if key in buckets:
            buckets[key] += float(amount or 0)
    return [{"month": k, "amount": round(v, 2)} for k, v in buckets.items()]


def build_monthly_pdf():
    """Render a monthly business report PDF and return its filesystem path."""
    summary = dashboard_summary()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=20 * mm, bottomMargin=18 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
    )
    styles = getSampleStyleSheet()
    ink = colors.HexColor("#14181C")
    teal = colors.HexColor("#1F5F5B")

    title = ParagraphStyle("t", parent=styles["Title"], textColor=teal, fontSize=20, spaceAfter=2)
    sub = ParagraphStyle("s", parent=styles["Normal"], textColor=colors.HexColor("#6B7280"), fontSize=9)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=ink, fontSize=12, spaceBefore=14, spaceAfter=6)

    story = [
        Paragraph("Insurance Management Platform", title),
        Paragraph(f"Monthly Business Report &mdash; generated {datetime.utcnow():%d %b %Y %H:%M UTC}", sub),
        Spacer(1, 8),
    ]

    def block(heading, rows):
        story.append(Paragraph(heading, h2))
        t = Table(rows, colWidths=[90 * mm, 70 * mm])
        t.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#4B5563")),
            ("TEXTCOLOR", (1, 0), (1, -1), ink),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#E1E4E0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    p = summary["policies"]
    block("Policies", [["Active policies", str(p["active"])],
                       ["Expired policies", str(p["expired"])],
                       ["Cancelled policies", str(p["cancelled"])]])
    c = summary["claims"]
    block("Claims", [["Pending", str(c["pending"])],
                     ["Approved", str(c["approved"])],
                     ["Rejected", str(c["rejected"])]])
    pr = summary["premium"]
    block("Premium collection", [["Collected", f"$ {pr['collected']:,.2f}"],
                                 ["Outstanding", f"$ {pr['outstanding']:,.2f}"]])
    block("Customers", [["Total customers", str(summary["customers"])]])

    doc.build(story)
    buf.seek(0)

    folder = os.environ.get("REPORT_FOLDER") or os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
    os.makedirs(folder, exist_ok=True)
    filename = f"monthly_report_{date.today():%Y_%m_%d}.pdf"
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(buf.read())
    return path, filename
