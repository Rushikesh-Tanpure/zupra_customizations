import frappe
from frappe import _
from frappe.utils import getdate, nowdate
from frappe.model.mapper import get_mapped_doc


def set_party_name(doc, method=None):
    """
    Before validate: keep party_name blank when a Customer Inquiry is linked.
    ERPNext's set_missing_lead_customer_details only runs if party_name is set,
    so keeping it empty avoids any Customer lookup.
    """
    if doc.get("customer_enquiry"):
        doc.party_name = ""
        doc.quotation_to = "Customer"


@frappe.whitelist()
def make_sales_order(source_name, target_doc=None, args=None):
    """
    Override of ERPNext's make_sales_order.
    When party_name is blank (no Customer linked), skip the customer lookup
    and open the Sales Order form so the user can fill customer manually.
    """
    import json
    from erpnext.selling.doctype.quotation.quotation import (
        _make_sales_order,
        get_ordered_items,
    )

    # Validity check (same as ERPNext original)
    if not frappe.db.get_singles_value(
        "Selling Settings", "allow_sales_order_creation_for_expired_quotation"
    ):
        quotation = frappe.db.get_value(
            "Quotation", source_name, ["transaction_date", "valid_till"], as_dict=1
        )
        if quotation.valid_till and (
            quotation.valid_till < quotation.transaction_date
            or quotation.valid_till < getdate(nowdate())
        ):
            frappe.throw(_("Validity period of this quotation has ended."))

    party_name = frappe.db.get_value("Quotation", source_name, "party_name")

    if not party_name:
        # No customer — temporarily patch _make_customer to return None
        import erpnext.selling.doctype.quotation.quotation as q_module

        original = q_module._make_customer
        q_module._make_customer = lambda source, ignore_permissions=False: None
        try:
            result = _make_sales_order(source_name, target_doc, args=args)
        finally:
            q_module._make_customer = original
        return result

    # Normal path — customer exists
    return _make_sales_order(source_name, target_doc, args=args)
