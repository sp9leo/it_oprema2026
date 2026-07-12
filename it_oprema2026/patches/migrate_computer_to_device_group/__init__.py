import frappe


def execute():
    migrate_computers()
    migrate_computer_device_links()
    frappe.db.commit()


def migrate_computers():
    computers = frappe.get_all("Computer", fields=["name", "device_link"])
    for comp in computers:
        if not comp.device_link:
            continue
        device_name = comp.device_link
        frappe.db.set_value("Device", device_name, "is_computer", 1)
        frappe.get_doc("Device", device_name).add_comment(
            "Info", "Migrated from Computer doctype — marked as group leader."
        )


def migrate_computer_device_links():
    links = frappe.get_all(
        "Computer Device Link",
        fields=["computer_link", "device_link", "attached_on", "notes"],
    )
    for link in links:
        computer = frappe.get_all("Computer", filters={"name": link.computer_link}, fields=["device_link"], limit=1)
        if not computer or not computer[0].device_link:
            continue
        group_leader = computer[0].device_link
        member_device = link.device_link
        if not member_device:
            continue

        existing = frappe.db.get_value(
            "Device Group Member",
            {"parent": group_leader, "device": member_device},
            "name"
        )
        if existing:
            continue

        member_doc = frappe.get_doc("Device", member_device)
        device_group = member_doc.device_group or "Other"

        leader_doc = frappe.get_doc("Device", group_leader)
        leader_doc.append("device_group_members", {
            "device": member_device,
            "role": device_group,
            "attached_on": link.attached_on or frappe.utils.now_datetime(),
            "notes": link.notes or "",
        })
        leader_doc.save(ignore_permissions=True)

        frappe.db.set_value("Device", member_device, "parent_device", group_leader)

        leader_location = frappe.db.get_value("Device", group_leader, "location")
        if leader_location:
            frappe.db.set_value("Device", member_device, "location", leader_location)

        frappe.get_doc("Device", member_device).add_comment(
            "Info", f"Migrated — attached to group leader {group_leader} as {device_group}."
        )
