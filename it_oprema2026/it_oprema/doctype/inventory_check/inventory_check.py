import frappe
from frappe.model.document import Document


class InventoryCheck(Document):
    def before_save(self):
        checked = sum(1 for i in self.items if i.check_status != "Pending")
        self.checked_devices = checked
        self.total_devices = len(self.items)
