import frappe
from frappe.utils import now_datetime


@frappe.whitelist(allow_guest=True)
def get_bookable_devices():
    devices = frappe.get_all(
        "Device",
        filters={"is_bookable": 1},
        fields=["name", "device_name", "device_inventory_code", "device_serial",
                "device_group", "device_manufacturer", "device_manufacturer_model"]
    )
    for d in devices:
        d.image = frappe.db.get_value("File", {
            "attached_to_doctype": "Device",
            "attached_to_name": d.name
        }, "file_url") or None
    return devices


@frappe.whitelist(allow_guest=True)
def check_availability(device, from_date, to_date):
    from frappe.utils import getdate
    from_date = getdate(from_date)
    to_date = getdate(to_date)

    if from_date > to_date:
        return {"available": False, "error": "Za\u010detni datum je kasnej\u0161i od kon\u010dnega"}

    overlaps = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabDevice Loan`
        WHERE device = %(device)s
          AND status NOT IN ('Cancelled', 'Returned')
          AND %(to_date)s >= from_date
          AND %(from_date)s <= to_date
    """, {"device": device, "from_date": from_date, "to_date": to_date}, as_dict=True)

    return {"available": overlaps[0].cnt == 0}


@frappe.whitelist(allow_guest=True)
def create_loan(device, customer_name, customer_email, from_date, to_date, purpose=None):
    from frappe.utils import getdate
    from_date = getdate(from_date)
    to_date = getdate(to_date)

    if from_date > to_date:
        frappe.throw("Za\u010detni datum je kasnej\u0161i od kon\u010dnega")

    avail = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabDevice Loan`
        WHERE device = %(device)s
          AND status NOT IN ('Cancelled', 'Returned')
          AND %(to_date)s >= from_date
          AND %(from_date)s <= to_date
    """, {"device": device, "from_date": from_date, "to_date": to_date}, as_dict=True)

    if avail[0].cnt > 0:
        frappe.throw("Naprava v izbranem obdobju ni na voljo")

    loan = frappe.get_doc({
        "doctype": "Device Loan",
        "device": device,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "from_date": from_date,
        "to_date": to_date,
        "purpose": purpose,
        "status": "Confirmed"
    })
    loan.insert(ignore_permissions=True)

    return {
        "name": loan.name,
        "booking_ref": loan.booking_ref,
        "access_token": loan.access_token
    }


@frappe.whitelist(allow_guest=True)
def lookup_loan(email, booking_ref):
    loan = frappe.db.get_value(
        "Device Loan",
        {"customer_email": email, "booking_ref": booking_ref},
        ["name", "device", "customer_name", "customer_email",
         "from_date", "to_date", "purpose", "status", "booking_ref"],
        as_dict=True
    )
    if loan:
        loan.device_name = frappe.db.get_value("Device", loan.device, "device_name")
    return loan


@frappe.whitelist(allow_guest=True)
def cancel_loan(access_token):
    loan = frappe.get_doc("Device Loan", {"access_token": access_token})
    if loan.status == "Cancelled":
        return {"ok": False, "message": "\u017de preklicano"}
    if loan.status == "Returned":
        return {"ok": False, "message": "Naprava je \u017ee vrnjena"}
    loan.status = "Cancelled"
    loan.save(ignore_permissions=True)
    return {"ok": True, "message": "Izposoja preklicana"}


@frappe.whitelist(allow_guest=True)
def get_booked_dates(device):
    loans = frappe.db.sql("""
        SELECT from_date, to_date FROM `tabDevice Loan`
        WHERE device = %(device)s
          AND status NOT IN ('Cancelled', 'Returned')
        ORDER BY from_date
    """, {"device": device}, as_dict=True)

    dates = set()
    for l in loans:
        from frappe.utils import date_diff, add_days, getdate
        delta = date_diff(l.to_date, l.from_date)
        for i in range(delta + 1):
            dates.add(str(add_days(l.from_date, i)))
    return sorted(list(dates))


@frappe.whitelist(allow_guest=True)
def get_loans_by_email(email):
    loans = frappe.get_all(
        "Device Loan",
        filters={"customer_email": email},
        fields=["name", "device", "customer_name", "from_date", "to_date",
                "purpose", "status", "booking_ref", "access_token"],
        order_by="from_date DESC"
    )
    for l in loans:
        l.device_name = frappe.db.get_value("Device", l.device, "device_name")
    return loans


# Scheduled tasks
@frappe.whitelist()
def expire_stale_tokens():
    frappe.db.sql("""
        UPDATE `tabDevice Loan` SET status = 'Returned'
        WHERE status = 'Confirmed' AND to_date < CURDATE()
    """)


# Internal notification helpers (called via frappe.enqueue)
def notify_loan_confirmed(docname, method=None):
    loan = frappe.get_doc("Device Loan", docname)
    device_name = frappe.db.get_value("Device", loan.device, "device_name")
    frappe.sendmail(
        recipients=[loan.customer_email],
        subject=f"Izposoja potrjena: {device_name}",
        message=f"Va\u0161a izposoja {device_name} je potrjena.\n"
                f"Od: {loan.from_date} Do: {loan.to_date}\n"
                f"Koda: {loan.booking_ref}"
    )


def notify_loan_cancelled(docname, method=None):
    loan = frappe.get_doc("Device Loan", docname)
    frappe.sendmail(
        recipients=[loan.customer_email],
        subject="Izposoja preklicana",
        message=f"Izposoja ({loan.booking_ref}) je preklicana."
    )
