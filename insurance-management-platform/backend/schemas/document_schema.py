from marshmallow import Schema, fields, validate


class DocumentMetaSchema(Schema):
    customer_id = fields.Int(required=True)
    doc_type = fields.Str(load_default="identity", validate=validate.OneOf(["identity", "policy", "claim"]))
