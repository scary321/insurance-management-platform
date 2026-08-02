from marshmallow import Schema, fields, validate


class CustomerSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    dob = fields.Date(allow_none=True)
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    address = fields.Str(allow_none=True, validate=validate.Length(max=255))


class CustomerUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=2, max=120))
    email = fields.Email()
    dob = fields.Date(allow_none=True)
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    address = fields.Str(allow_none=True, validate=validate.Length(max=255))
