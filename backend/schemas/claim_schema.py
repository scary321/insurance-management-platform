from marshmallow import Schema, fields, validate

class ClaimSchema(Schema):
    policy_id = fields.Int(required=True)
    claim_amount = fields.Decimal(required=True, as_string=False)
    reason = fields.Str(required=True, validate=validate.Length(min=5))

class ClaimReviewSchema(Schema):
    review_note = fields.Str(allow_none=True)
