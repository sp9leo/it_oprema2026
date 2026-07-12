import frappe


def before_save(doc, method):
    track_location_change(doc)
    propagate_location_to_members(doc)


def track_location_change(doc):
    if doc.is_new() or not hasattr(doc, "location"):
        return
    old_location = frappe.db.get_value("Device", doc.name, "location") if not doc.is_new() else None
    new_location = doc.location
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


def propagate_location_to_members(doc):
    if not doc.is_computer or doc.is_new():
        return
    old_location = frappe.db.get_value("Device", doc.name, "location")
    new_location = doc.location
    if old_location == new_location:
        return
    members = frappe.get_all(
        "Device Group Member",
        filters={"parent": doc.name},
        fields=["device"]
    )
    for m in members:
        frappe.db.set_value("Device", m.device, "location", new_location)
        log = frappe.get_doc(
            {
                "doctype": "Device Location Log",
                "device": m.device,
                "location": new_location,
                "previous_location": old_location,
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user,
                "notes": f"Auto-sync from group leader {doc.name}",
            }
        )
        log.insert(ignore_permissions=True)
