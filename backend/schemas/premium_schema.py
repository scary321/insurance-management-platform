from marshmallow import Schema, fields, validate
from models import PaymentStatus

class PremiumSchema(Schema):
    policy_id = fields.Int(required=True)
    amount = fields.Decimal(required=True, as_string=False)
    payment_date = fields.Date(allow_none=True)
    due_date = fields.Date(allow_none=True)
    payment_status = fields.Str(validate=validate.OneOf(PaymentStatus.ALL), load_default=PaymentStatus.PAID)
