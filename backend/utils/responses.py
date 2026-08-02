"""Consistent JSON envelopes so the React client always parses the same shape."""
from flask import jsonify


def success(data=None, message="OK", status=200, **extra):
    payload = {"success": True, "message": message, "data": data}
    payload.update(extra)
    return jsonify(payload), status


def error(message="Something went wrong", status=400, **extra):
    payload = {"success": False, "message": message, "data": None}
    payload.update(extra)
    return jsonify(payload), status
