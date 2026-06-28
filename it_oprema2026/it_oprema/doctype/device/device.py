import frappe
from frappe.model.document import Document


class Device(Document):
    def on_update(self):
        if self.computer_link:
            existing = frappe.get_all(
                "Computer Device Link",
                filters={"computer_link": self.computer_link, "device_link": self.name}
            )
            if not existing:
                frappe.get_doc({
                    "doctype": "Computer Device Link",
                    "computer_link": self.computer_link,
                    "device_link": self.name
                }).insert(ignore_permissions=True)

            comp_location = frappe.db.get_value("Device", self.computer_link, "location")
            if comp_location:
                frappe.db.set_value("Device", self.name, "location", comp_location)

            self.add_comment("Info", f"Attached to Computer {self.computer_link}")
            frappe.get_doc("Computer", self.computer_link).add_comment("Info", f"Device {self.name} attached")
        else:
            links = frappe.get_all(
                "Computer Device Link",
                filters={"device_link": self.name},
                fields=["name", "computer_link"]
            )
            for link in links:
                frappe.delete_doc("Computer Device Link", link.name, ignore_permissions=True)
                comp = frappe.get_doc("Computer", link.computer_link)
                comp.add_comment("Info", f"Device {self.name} detached")
            self.add_comment("Info", "Detached from Computer")
