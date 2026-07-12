import frappe


def before_save(doc, method):
    if doc.is_new() or not hasattr(doc, "current_location"):
        return

    old_location = frappe.db.get_value("Device", doc.name, "current_location")
    new_location = doc.current_location

    if old_location != new_location:
        log = frappe.get_doc(
            {
                "doctype": "Device Location Log",
                "device": doc.name,
                "location": new_location,
                "previous_location": old_location,
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user,
            }
        )
        log.insert(ignore_permissions=True)
