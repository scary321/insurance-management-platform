import os
from flask import Blueprint, request, send_file
from marshmallow import ValidationError

from extensions import db
from models import Document, Customer, Role
from schemas.document_schema import DocumentMetaSchema
from middleware.auth import role_required, current_scope
from utils.files import save_upload, is_allowed
from utils.responses import success, error

bp = Blueprint("documents", __name__, url_prefix="/api/documents")


@bp.get("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def list_documents():
    role, _uid, cid = current_scope()
    customer_id = request.args.get("customer_id", type=int)
    query = Document.query
    if role == Role.CUSTOMER:
        query = query.filter_by(customer_id=cid)
    elif customer_id:
        query = query.filter_by(customer_id=customer_id)
    rows = query.order_by(Document.uploaded_at.desc()).all()
    return success([d.to_dict() for d in rows])


@bp.post("")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def upload_document():
    if "file" not in request.files:
        return error("No file part in the request.", 422)
    file = request.files["file"]
    if not file or file.filename == "":
        return error("No file selected.", 422)
    if not is_allowed(file.filename):
        return error("File type not allowed. Use pdf, png, jpg, jpeg, doc or docx.", 422)

    role, _uid, cid = current_scope()
    form = request.form.to_dict()
    if role == Role.CUSTOMER:
        # A customer can only attach documents to their own record.
        form["customer_id"] = cid
    try:
        meta = DocumentMetaSchema().load(form)
    except ValidationError as e:
        return error("Validation failed", 422, errors=e.messages)
    if not Customer.query.get(meta["customer_id"]):
        return error("Customer not found", 404)

    original, stored, path = save_upload(file)
    doc = Document(
        customer_id=meta["customer_id"],
        file_name=original,
        stored_name=stored,
        file_path=path,
        doc_type=meta["doc_type"],
    )
    db.session.add(doc)
    db.session.commit()
    return success(doc.to_dict(), "Document uploaded", 201)


@bp.get("/<int:did>/download")
@role_required(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
def download_document(did):
    role, _uid, cid = current_scope()
    doc = Document.query.get(did)
    if not doc or (role == Role.CUSTOMER and doc.customer_id != cid):
        return error("Document not found", 404)
    if not os.path.exists(doc.file_path):
        return error("Stored file is missing.", 410)
    return send_file(doc.file_path, as_attachment=True, download_name=doc.file_name)
