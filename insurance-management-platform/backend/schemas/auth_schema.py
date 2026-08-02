from marshmallow import Schema, fields, validate
from models import Role


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    role = fields.Str(validate=validate.OneOf(Role.ALL), load_default=Role.CUSTOMER)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
