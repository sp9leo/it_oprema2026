import frappe
from frappe.model.document import Document


class DeviceLocationLog(Document):
    def validate(self):
        if not self.user:
            self.user = frappe.session.user
        if not self.timestamp:
            self.timestamp = frappe.utils.now()
