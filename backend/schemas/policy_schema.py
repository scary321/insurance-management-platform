from marshmallow import Schema, fields, validate


class PolicySchema(Schema):
    customer_id = fields.Int(required=True)
    policy_type = fields.Str(required=True, validate=validate.Length(min=2, max=60))
    premium_amount = fields.Decimal(required=True, as_string=False)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)


class PolicyRenewSchema(Schema):
    end_date = fields.Date(required=True)
    premium_amount = fields.Decimal(as_string=False)
