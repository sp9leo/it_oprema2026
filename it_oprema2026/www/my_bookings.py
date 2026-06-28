import frappe

def get_context(context):
    email = frappe.form_dict.get("email")
    context.email = email
    context.loans = []
    if email:
        context.loans = frappe.get_all(
            "Device Loan",
            filters={"customer_email": email},
            fields=["name", "device", "customer_name", "from_date", "to_date",
                    "purpose", "status", "booking_ref", "access_token"],
            order_by="from_date DESC"
        )
        for l in context.loans:
            l.device_name = frappe.db.get_value("Device", l.device, "device_name") or "?"
