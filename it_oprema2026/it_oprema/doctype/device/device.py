import frappe
from frappe.model.document import Document


class Device(Document):
    def validate(self):
        self.validate_group_consistency()
        self.update_member_parent_references()
        self.auto_place_on_room()

    def auto_place_on_room(self):
        prev_room = None
        if self.get("name"):
            prev_room = frappe.db.get_value("Device", self.name, "room")

        if not self.room:
            if prev_room:
                self.map_x = None
                self.map_y = None
            return

        if prev_room != self.room:
            self.map_x = None
            self.map_y = None

        if self.map_x is not None and self.map_y is not None:
            return

        room = frappe.db.get_value(
            "Room",
            self.room,
            ["bounds_top", "bounds_left", "bounds_bottom", "bounds_right"],
            as_dict=True,
        )
        if not room:
            return
        top, left = room.bounds_top, room.bounds_left
        bottom, right = room.bounds_bottom, room.bounds_right
        if None in (top, left, bottom, right):
            return
        room_w = int(right) - int(left)
        room_h = int(bottom) - int(top)
        if room_w <= 0 or room_h <= 0:
            return

        idx = frappe.db.count("Device", filters={"room": self.room})
        if self.get("name") and prev_room == self.room:
            idx = max(0, idx - 1)

        padding = 20
        cols = max(1, room_w // 50)
        col = idx % cols
        row = idx // cols
        self.map_x = int(left + padding + col * 50)
        self.map_y = int(top + padding + row * 40)

    def validate_group_consistency(self):
        if self.is_computer and self.parent_device:
            frappe.throw(
                frappe._("Device marked as computer cannot be a member of another group.")
            )
        if self.parent_device == self.name:
            frappe.throw(frappe._("Device cannot be its own parent."))
        if self.parent_device:
            parent = frappe.get_doc("Device", self.parent_device)
            if not parent.is_computer:
                frappe.throw(
                    frappe._("Parent device {0} is not marked as a computer.").format(self.parent_device)
                )
        for row in self.get("device_group_members") or []:
            if row.device == self.name:
                frappe.throw(
                    frappe._("Device {0} cannot be added as a member of itself.").format(self.name)
                )

    def update_member_parent_references(self):
        if not self.is_computer:
            return
        member_devices = set()
        for row in self.get("device_group_members") or []:
            if row.device:
                member_devices.add(row.device)

        for member_name in member_devices:
            current_parent = frappe.db.get_value("Device", member_name, "parent_device")
            if current_parent != self.name:
                frappe.db.set_value("Device", member_name, "parent_device", self.name)

        linked_to_me = frappe.get_all(
            "Device Group Member",
            filters={"parent": self.name},
            fields=["device"]
        )
        current_members = {d.device for d in linked_to_me}
        removed_members = current_members - member_devices
        for removed in removed_members:
            current_parent = frappe.db.get_value("Device", removed, "parent_device")
            if current_parent == self.name:
                frappe.db.set_value("Device", removed, "parent_device", None)
