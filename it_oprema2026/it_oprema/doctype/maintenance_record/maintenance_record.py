import frappe
from frappe.model.document import Document


class MaintenanceRecord(Document):
    def after_insert(self):
        frappe.get_doc("Device", self.device).add_comment(
            "Info",
            f"Maintenance record created: {self.maintenance_type} - {self.description or ''}"
        )
