import frappe
import secrets
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, date_diff


def generate_booking_ref():
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(chars) for _ in range(6))


class DeviceLoan(Document):
    def validate(self):
        if self.from_date and self.to_date and self.from_date > self.to_date:
            frappe.throw("Za\u010detni datum ne more biti kasnej\u0161i od kon\u010dnega")

        if self.status not in ("Cancelled", "Returned") and self.from_date and self.to_date:
            overlaps = frappe.db.sql("""
                SELECT name FROM `tabDevice Loan`
                WHERE device = %(device)s
                  AND name != %(name)s
                  AND status NOT IN ('Cancelled', 'Returned')
                  AND %(to_date)s >= from_date
                  AND %(from_date)s <= to_date
            """, {
                "device": self.device,
                "name": self.name or "",
                "from_date": self.from_date,
                "to_date": self.to_date
            })
            if overlaps:
                frappe.throw("Naprava v izbranem obdobju ni na voljo")

    def before_insert(self):
        self.booking_ref = generate_booking_ref()
        self.access_token = secrets.token_urlsafe(32)

    def on_update(self):
        before = self.get_doc_before_save()
        if before and before.status != "Confirmed" and self.status == "Confirmed":
            frappe.enqueue("it_oprema2026.device_loan.api.notify_loan_confirmed", docname=self.name)

    def after_insert(self):
        if self.status == "Confirmed":
            frappe.enqueue("it_oprema2026.device_loan.api.notify_loan_confirmed", docname=self.name)
