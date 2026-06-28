import frappe
import json

def get_context(context):
    device = frappe.form_dict.get("device")
    if not device:
        frappe.local.flags.redirect_location = "/devices"
        raise frappe.Redirect

    context.device = frappe.get_doc("Device", device)
    if not context.device.is_bookable:
        frappe.throw("Ta naprava ni na voljo za izposojo")

    # Get booked dates for calendar display
    booked = frappe.db.sql("""
        SELECT from_date, to_date FROM `tabDevice Loan`
        WHERE device = %(device)s
          AND status NOT IN ('Cancelled', 'Returned')
        ORDER BY from_date
    """, {"device": device}, as_dict=True)

    dates = set()
    for l in booked:
        from frappe.utils import date_diff, add_days, getdate
        delta = date_diff(l.to_date, l.from_date)
        for i in range(delta + 1):
            dates.add(str(add_days(l.from_date, i)))

    context.booked_dates_json = json.dumps(sorted(list(dates)))
    context.device_json = json.dumps({"name": device, "device_name": context.device.device_name})
    context.today = frappe.utils.today()
