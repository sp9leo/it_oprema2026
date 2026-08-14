import frappe


def _enrich_location_display(rows: list) -> list:
    locations = {r.get("location") for r in rows if r.get("location")}
    loc_names = {}
    if locations:
        for loc in frappe.db.get_all(
            "Location", {"name": ["in", list(locations)]}, ["name", "location_name"]
        ):
            loc_names[loc.name] = loc.location_name

    rooms = {r.get("room") for r in rows if r.get("room")}
    room_map = {}
    if rooms:
        for room in frappe.db.get_all(
            "Room", {"name": ["in", list(rooms)]}, ["name", "room_name", "floorplan"]
        ):
            room_map[room.name] = room

    floorplans = {room.floorplan for room in room_map.values() if room.floorplan}
    fp_titles = {}
    if floorplans:
        for fp in frappe.db.get_all(
            "Floorplan", {"name": ["in", list(floorplans)]}, ["name", "title"]
        ):
            fp_titles[fp.name] = fp.title

    for row in rows:
        if row.get("location"):
            row["location_display"] = loc_names.get(row["location"]) or row["location"]
        elif row.get("room"):
            room = room_map.get(row["room"])
            if not room:
                row["location_display"] = ""
                continue
            fp_title = fp_titles.get(room.floorplan)
            row["location_display"] = (
                f"{room.room_name} · {fp_title}" if fp_title else room.room_name
            )
        else:
            row["location_display"] = ""
    return rows


@frappe.whitelist()
def get_csrf_token() -> str:
    return frappe.sessions.get_csrf_token()


@frappe.whitelist(allow_guest=True)
def ping() -> dict:
    return {"message": "pong"}


@frappe.whitelist(allow_guest=True)
def get_device_public_info(name: str) -> dict:
    device = frappe.get_doc("Device", name)
    result = {
        "name": device.name,
        "device_inventory_code": device.device_inventory_code,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "device_serial": device.device_serial,
        "device_group": device.device_group,
        "device_manufacturer": device.device_manufacturer,
        "device_manufacturer_model": device.device_manufacturer_model,
        "status": device.status,
        "location": device.location,
        "is_computer": device.is_computer,
        "parent_device": device.parent_device,
    }
    display_rows = _enrich_location_display([{"location": device.location, "room": device.room}])
    result["location_display"] = display_rows[0]["location_display"]
    if device.is_computer:
        result["group_members"] = frappe.get_all(
            "Device Group Member",
            filters={"parent": name},
            fields=["device", "role", "notes"],
        )
    return result


@frappe.whitelist()
def get_dashboard_stats() -> dict:
    return {
        "total_devices": frappe.db.count("Device"),
        "total_groups": frappe.db.count("Device", filters={"is_computer": 1}),
        "total_locations": frappe.db.count("Location"),
    }


@frappe.whitelist()
def get_devices(
    filters: str | None = None, search: str = "", limit: int = 50, offset: int = 0
) -> dict:
    filters_dict = frappe.parse_json(filters) if filters else {}
    conditions = ""
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    if search:
        like = frappe.db.escape(f"%{search}%")
        conditions += f" AND (device_name LIKE {like} OR device_inventory_code LIKE {like} OR device_id LIKE {like})"

    devices = frappe.db.sql(
        f"""
        SELECT name, device_inventory_code, device_id, device_name, device_group,
               status, location, room, company, device_serial, is_computer, parent_device
        FROM `tabDevice`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """,
        as_dict=True,
    )

    _enrich_location_display(devices)
    total = frappe.db.count("Device", filters_dict)
    return {"data": devices, "total": total}


@frappe.whitelist()
def get_device_detail(name: str) -> dict:
    device = frappe.get_doc("Device", name)
    attachments = frappe.get_all(
        "File",
        {"attached_to_doctype": "Device", "attached_to_name": name},
        ["name", "file_name", "file_url", "file_size"],
    )
    group_members = []
    if device.is_computer:
        group_members = frappe.get_all(
            "Device Group Member",
            filters={"parent": name},
            fields=["device", "role", "attached_on", "notes"],
        )
    result = {
        "device": device.as_dict(),
        "attachments": attachments,
        "group_members": group_members,
    }
    display_rows = _enrich_location_display([{"location": device.location, "room": device.room}])
    result["device"]["location_display"] = display_rows[0]["location_display"]
    return result

@frappe.whitelist()
def get_computers(
    filters: str | None = None, limit: int = 50, offset: int = 0
) -> dict:
    filters_dict = frappe.parse_json(filters) if filters else {}
    filters_dict["is_computer"] = 1
    conditions = ""
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    computers = frappe.db.sql(
        f"""
        SELECT name AS computer_name, device_inventory_code AS computer_inventory_code,
               device_id AS computer_id, device_name, device_manufacturer AS manufacturer,
               status, location, device_admin AS computer_admin, device_user,
               device_serial AS computer_serial, parent_device
        FROM `tabDevice`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """,
        as_dict=True,
    )

    total = frappe.db.count("Device", {"is_computer": 1})
    return {"data": computers, "total": total}


@frappe.whitelist()
def get_locations() -> list:
    return frappe.db.sql(
        """
        SELECT name, location_name, parent_location, location_number, is_group
        FROM `tabLocation`
        ORDER BY lft ASC
    """,
        as_dict=True,
    )


@frappe.whitelist()
def get_device_groups() -> list:
    return frappe.db.sql(
        """
        SELECT name, title AS device_group_name, is_group
        FROM `tabDevice Group`
        ORDER BY name ASC
        """,
        as_dict=True,
    )


@frappe.whitelist()
def get_doctype_list() -> list:
    tables = frappe.db.sql_list(
        "SELECT name FROM information_schema.tables WHERE table_name LIKE 'tab%' AND table_schema = DATABASE()"
    )
    return [t.replace("tab", "") for t in sorted(tables)]


@frappe.whitelist()
def get_device_location_log(
    device: str, limit: int = 50, offset: int = 0
) -> dict:
    logs = frappe.db.sql(
        f"""
        SELECT name, device, location, previous_location, timestamp, user, notes
        FROM `tabDevice Location Log`
        WHERE device = {frappe.db.escape(device)}
        ORDER BY timestamp DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """,
        as_dict=True,
    )
    total = frappe.db.count("Device Location Log", {"device": device})
    return {"data": logs, "total": total}


@frappe.whitelist()
def attach_device(group_leader: str, member_device: str, role: str = "Other", force: bool = False) -> dict:
    leader_doc = frappe.get_doc("Device", group_leader)
    if not leader_doc.is_computer:
        return {"ok": False, "warning": f"Device {group_leader} is not marked as a computer group."}

    existing_member = frappe.db.get_value("Device Group Member", {"device": member_device}, "parent")
    if existing_member:
        if existing_member == group_leader:
            return {"ok": False, "warning": f"Device {member_device} is already in this group."}
        if not force:
            return {"ok": False, "warning": f"Device {member_device} is already a member of group {existing_member}."}
        frappe.db.delete("Device Group Member", {"device": member_device})
        frappe.db.set_value("Device", member_device, "parent_device", None)

    row = leader_doc.append("device_group_members", {
        "device": member_device,
        "role": role,
        "attached_on": frappe.utils.now_datetime(),
    })
    leader_doc.save(ignore_permissions=True)

    leader_location = frappe.db.get_value("Device", group_leader, "location")
    if leader_location:
        frappe.db.set_value("Device", member_device, "location", leader_location)

    frappe.db.set_value("Device", member_device, "parent_device", group_leader)
    frappe.get_doc("Device", group_leader).add_comment("Info", f"Device {member_device} attached as {role}.")
    frappe.get_doc("Device", member_device).add_comment("Info", f"Attached to group {group_leader} as {role}.")
    return {"ok": True, "message": f"Device {member_device} attached to group {group_leader} as {role}."}


@frappe.whitelist()
def detach_device(group_leader: str, member_device: str) -> dict:
    existing = frappe.db.get_value(
        "Device Group Member",
        {"parent": group_leader, "device": member_device},
        "name"
    )
    if not existing:
        return {"ok": False, "warning": f"Device {member_device} is not a member of group {group_leader}."}

    frappe.db.delete("Device Group Member", {"name": existing})
    frappe.db.set_value("Device", member_device, "parent_device", None)
    frappe.get_doc("Device", group_leader).add_comment("Info", f"Device {member_device} detached.")
    frappe.get_doc("Device", member_device).add_comment("Info", f"Detached from group {group_leader}.")
    return {"ok": True, "message": f"Device {member_device} detached from group {group_leader}."}


@frappe.whitelist()
def attach_ip(device: str, ip_address: str, force: bool = False) -> dict:
    existing = frappe.get_all(
        "Device IP Link",
        filters={"ip_address_link": ip_address},
        fields=["device_link"],
    )
    if existing and existing[0].device_link != device and not force:
        return {
            "ok": False,
            "warning": f"IP {ip_address} is already attached to Device {existing[0].device_link}.",
        }
    if existing and existing[0].device_link != device:
        frappe.db.delete("Device IP Link", {
            "device_link": existing[0].device_link,
            "ip_address_link": ip_address,
        })
        frappe.get_doc("Device", existing[0].device_link).add_comment(
            "Info", f"IP {ip_address} detached (re-attached to {device})."
        )

    frappe.get_doc({
        "doctype": "Device IP Link",
        "device_link": device,
        "ip_address_link": ip_address,
        "attached_on": frappe.utils.now_datetime(),
    }).insert(ignore_permissions=True)

    frappe.db.set_value("IP Address", ip_address, {
        "is_linked": 1,
        "device_link": device,
    })
    frappe.get_doc("Device", device).add_comment("Info", f"IP {ip_address} attached.")
    frappe.get_doc("IP Address", ip_address).add_comment("Info", f"Attached to Device {device}.")
    return {"ok": True, "message": f"IP {ip_address} attached to Device {device}"}


@frappe.whitelist()
def detach_ip(device: str, ip_address: str) -> dict:
    frappe.db.delete("Device IP Link", {
        "device_link": device,
        "ip_address_link": ip_address,
    })
    frappe.db.set_value("IP Address", ip_address, {
        "is_linked": 0,
        "device_link": None,
    })
    frappe.get_doc("Device", device).add_comment("Info", f"IP {ip_address} detached.")
    frappe.get_doc("IP Address", ip_address).add_comment("Info", f"Detached from Device {device}.")
    return {"ok": True, "message": f"IP {ip_address} detached from Device {device}"}


@frappe.whitelist()
def get_inventory_checks() -> list:
    checks = frappe.db.sql(
        """
        SELECT name, title, date, status, total_devices, checked_devices
        FROM `tabInventory Check`
        ORDER BY creation DESC
        """,
        as_dict=True,
    )
    return checks


@frappe.whitelist()
def get_inventory_check_detail(name: str) -> dict:
    doc = frappe.get_doc("Inventory Check", name)
    return doc.as_dict()


@frappe.whitelist()
def create_inventory_check(
    title: str,
    date: str,
    device_group: str | None = None,
    location: str | None = None,
) -> dict:
    conditions = "1=1"
    if device_group:
        conditions += f" AND device_group = {frappe.db.escape(device_group)}"
    if location:
        conditions += f" AND location = {frappe.db.escape(location)}"

    devices = frappe.db.sql(
        f"""
        SELECT name, device_name, device_inventory_code, device_group, location, room
        FROM `tabDevice`
        WHERE {conditions}
        ORDER BY name ASC
        """,
        as_dict=True,
    )

    _enrich_location_display(devices)

    doc = frappe.get_doc({
        "doctype": "Inventory Check",
        "title": title,
        "date": date,
        "status": "In Progress",
        "device_group": device_group or "",
        "location": location or "",
        "total_devices": len(devices),
        "checked_devices": 0,
        "items": [
            {
                "device": d.name,
                "device_name": d.device_name,
                "device_inventory_code": d.device_inventory_code,
                "device_group": d.device_group,
                "location": d.location_display,
            }
            for d in devices
        ],
    })
    doc.insert(ignore_permissions=True)
    return doc.as_dict()


@frappe.whitelist()
def update_inventory_item(
    check_name: str,
    device: str,
    check_status: str,
    checked_by: str = "",
    notes: str = "",
) -> dict:
    doc = frappe.get_doc("Inventory Check", check_name)
    for item in doc.items:
        if item.device == device:
            item.check_status = check_status
            item.checked_by = checked_by
            item.checked_on = frappe.utils.now_datetime()
            item.notes = notes
            break

    doc.save(ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def complete_inventory_check(name: str) -> dict:
    doc = frappe.get_doc("Inventory Check", name)
    doc.status = "Completed"
    doc.save(ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def get_device_inventory_history(device: str) -> list:
    items = frappe.db.sql(
        """
        SELECT parent AS check_name, check_status, checked_by, checked_on, notes
        FROM `tabInventory Check Item`
        WHERE device = %s AND check_status != 'Pending'
        ORDER BY checked_on DESC
        """,
        device,
        as_dict=True,
    )

    check_names = list({i.check_name for i in items})
    checks = {}
    if check_names:
        rows = frappe.db.sql(
            "SELECT name, title, date FROM `tabInventory Check` WHERE name IN %s",
            [check_names],
            as_dict=True,
        )
        for r in rows:
            checks[r.name] = r

    for item in items:
        c = checks.get(item.check_name, {})
        item["check_title"] = c.get("title", "")
        item["check_date"] = c.get("date", "")

    return items


@frappe.whitelist()
def update_device_status(name: str, status: str) -> dict:
    frappe.db.set_value("Device", name, "status", status)
    frappe.get_doc("Device", name).add_comment("Info", f"Status changed to {status}.")
    return {"ok": True}


@frappe.whitelist()
def delete_device(name: str) -> dict:
    frappe.delete_doc("Device", name, ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def update_device_floorplan(name: str, room: str | None = None, map_x: int | None = None, map_y: int | None = None) -> dict:
    doc = frappe.get_doc("Device", name)
    if room is not None:
        doc.room = room or None
    if map_x is not None:
        doc.map_x = map_x
    if map_y is not None:
        doc.map_y = map_y
    doc.save(ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def backfill_device_positions(floorplan: str) -> dict:
    rooms = frappe.db.get_all("Room", {"floorplan": floorplan}, pluck="name")
    if not rooms:
        return {"ok": True, "placed": 0}
    placeholders = ", ".join(["%s"] * len(rooms))
    devices = frappe.db.sql(
        f"""
        SELECT name FROM `tabDevice`
        WHERE room IN ({placeholders})
          AND (map_x IS NULL OR map_y IS NULL)
        """,
        tuple(rooms),
        as_dict=True,
    )
    placed = 0
    for d in devices:
        frappe.get_doc("Device", d.name).save(ignore_permissions=True)
        placed += 1
    return {"ok": True, "placed": placed}


# --- Maintenance ---

MAINTENANCE_STATUSES = [
    {"value": "Pending", "label": "Pending", "icon": "mdi-clock-outline", "color": "warning"},
    {"value": "Sent to Repair", "label": "Sent to Repair", "icon": "mdi-send-check", "color": "purple"},
    {"value": "Parts Ordered", "label": "Parts Ordered", "icon": "mdi-cart-check", "color": "info"},
    {"value": "Awaiting Parts", "label": "Awaiting Parts", "icon": "mdi-package-variant", "color": "orange"},
    {"value": "In Progress", "label": "In Progress", "icon": "mdi-tools", "color": "primary"},
    {"value": "Completed", "label": "Completed", "icon": "mdi-check-circle", "color": "success"},
]


def _set_device_status(device: str, status: str | None) -> None:
    if not device:
        return
    if status and not frappe.db.exists("IT-Status", status):
        return
    frappe.db.set_value("Device", device, "status", status)


def _apply_status_transition(record, old_status: str, new_status: str) -> None:
    if new_status == "Completed" and old_status != "Completed":
        record.completed_date = frappe.utils.today()
        _set_device_status(record.device, record.previous_device_status or None)
    elif old_status == "Completed" and new_status != "Completed":
        record.completed_date = None
        _set_device_status(record.device, "Maintenance")


@frappe.whitelist()
def get_maintenance_statuses() -> list:
    return MAINTENANCE_STATUSES


@frappe.whitelist()
def get_maintenance_records(device: str) -> list:
    records = frappe.db.sql(
        """
        SELECT name, device, maintenance_type, description, maintenance_date,
               scheduled_date, estimated_return, completed_date, status,
               performed_by, cost, notes
        FROM `tabMaintenance Record`
        WHERE device = %s
        ORDER BY maintenance_date DESC
        """,
        device,
        as_dict=True,
    )
    for record in records:
        record["updates"] = frappe.db.get_all(
            "Maintenance Record Update",
            filters={"parent": record["name"]},
            fields=["name", "update_date", "user", "note", "status_change"],
            order_by="update_date ASC",
        )
    return records


@frappe.whitelist()
def create_maintenance_record(
    device: str,
    maintenance_type: str = "Other",
    description: str = "",
    maintenance_date: str | None = None,
    scheduled_date: str | None = None,
    estimated_return: str | None = None,
    performed_by: str = "",
    cost: float = 0.0,
    notes: str = "",
    status: str = "Pending",
) -> dict:
    previous_status = frappe.db.get_value("Device", device, "status")
    doc = frappe.get_doc({
        "doctype": "Maintenance Record",
        "device": device,
        "maintenance_type": maintenance_type,
        "description": description,
        "maintenance_date": maintenance_date or frappe.utils.today(),
        "scheduled_date": scheduled_date,
        "estimated_return": estimated_return,
        "status": status,
        "performed_by": performed_by,
        "cost": cost,
        "notes": notes,
        "previous_device_status": previous_status,
    })
    doc.insert(ignore_permissions=True)
    if status != "Completed":
        _set_device_status(device, "Maintenance")
    frappe.get_doc("Device", device).add_comment(
        "Info", f"Maintenance record created: {maintenance_type} - {description}"
    )
    return doc.as_dict()


@frappe.whitelist()
def update_maintenance_record(
    name: str,
    maintenance_type: str | None = None,
    description: str | None = None,
    maintenance_date: str | None = None,
    scheduled_date: str | None = None,
    estimated_return: str | None = None,
    performed_by: str | None = None,
    cost: float | None = None,
    notes: str | None = None,
    status: str | None = None,
) -> dict:
    doc = frappe.get_doc("Maintenance Record", name)
    if maintenance_type is not None:
        doc.maintenance_type = maintenance_type
    if description is not None:
        doc.description = description
    if maintenance_date is not None:
        doc.maintenance_date = maintenance_date
    if scheduled_date is not None:
        doc.scheduled_date = scheduled_date or None
    if estimated_return is not None:
        doc.estimated_return = estimated_return or None
    if performed_by is not None:
        doc.performed_by = performed_by
    if cost is not None:
        doc.cost = cost
    if notes is not None:
        doc.notes = notes
    old_status = doc.status
    if status is not None and status != old_status:
        doc.status = status
        _apply_status_transition(doc, old_status, status)
    doc.save(ignore_permissions=True)
    return doc.as_dict()


@frappe.whitelist()
def complete_maintenance_record(name: str) -> dict:
    doc = frappe.get_doc("Maintenance Record", name)
    old_status = doc.status
    if old_status != "Completed":
        doc.status = "Completed"
        _apply_status_transition(doc, old_status, "Completed")
    doc.save(ignore_permissions=True)
    return doc.as_dict()


@frappe.whitelist()
def add_maintenance_update(
    name: str, note: str = "", status_change: str | None = None
) -> dict:
    doc = frappe.get_doc("Maintenance Record", name)
    new_status = None
    if status_change and "\u2192" in status_change:
        new_status = status_change.split("\u2192")[-1].strip()
    doc.append(
        "updates",
        {
            "update_date": frappe.utils.now_datetime(),
            "user": frappe.utils.get_fullname(frappe.session.user),
            "note": note,
            "status_change": status_change or None,
        },
    )
    if new_status and new_status != doc.status:
        old_status = doc.status
        doc.status = new_status
        _apply_status_transition(doc, old_status, new_status)
    doc.save(ignore_permissions=True)
    return doc.as_dict()


@frappe.whitelist()
def get_upcoming_maintenance(days: int = 30) -> list:
    today = frappe.utils.today()
    end = frappe.utils.add_days(today, int(days))
    return frappe.db.sql(
        """
        SELECT name, device, maintenance_type, maintenance_date, scheduled_date,
               estimated_return, status, performed_by, notes
        FROM `tabMaintenance Record`
        WHERE status != 'Completed'
          AND maintenance_date BETWEEN %s AND %s
        ORDER BY maintenance_date ASC
        """,
        (today, end),
        as_dict=True,
    )


# --- Audit Log ---

@frappe.whitelist()
def get_device_audit_log(device: str) -> list:
    comments = frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": "Device",
            "reference_name": device,
        },
        fields=["name", "comment_type", "content", "owner", "creation"],
        order_by="creation DESC",
    )
    return comments


# --- Floorplans ---

ROOM_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
]


@frappe.whitelist()
def create_room(
    floorplan: str,
    room_name: str,
    bounds_top: int,
    bounds_left: int,
    bounds_bottom: int,
    bounds_right: int,
    color: str = "",
) -> dict:
    if frappe.db.exists("Room", {"floorplan": floorplan, "room_name": room_name}):
        return {"ok": False, "message": "A room with this name already exists on this floorplan."}
    if not color:
        used = {
            r[0]
            for r in frappe.db.get_values("Room", {"floorplan": floorplan}, "color")
        }
        color = next((c for c in ROOM_COLORS if c not in used), ROOM_COLORS[0])
    doc = frappe.get_doc({
        "doctype": "Room",
        "room_name": room_name,
        "floorplan": floorplan,
        "bounds_top": int(bounds_top),
        "bounds_left": int(bounds_left),
        "bounds_bottom": int(bounds_bottom),
        "bounds_right": int(bounds_right),
        "color": color,
    }).insert(ignore_permissions=True)
    return {"ok": True, "room": doc.as_dict()}


@frappe.whitelist()
def get_floorplans() -> list:
    plans = frappe.db.sql(
        """
        SELECT name, title, image, image_width, image_height
        FROM `tabFloorplan`
        ORDER BY title ASC
        """,
        as_dict=True,
    )
    room_counts = frappe.db.sql(
        """
        SELECT floorplan, COUNT(*) AS count
        FROM `tabRoom`
        GROUP BY floorplan
        """,
        as_dict=True,
    )
    count_map = {r.floorplan: r.count for r in room_counts}
    for p in plans:
        p["room_count"] = count_map.get(p.name, 0)
    return plans


@frappe.whitelist()
def get_floorplan_rooms(floorplan: str) -> list:
    return frappe.get_all("Room", {"floorplan": floorplan}, ["name", "room_name", "bounds_top", "bounds_left", "bounds_bottom", "bounds_right", "color"], order_by="name")


@frappe.whitelist()
def get_floorplan_detail(name: str) -> dict:
    doc = frappe.get_doc("Floorplan", name)

    rooms_data = []
    rooms = frappe.get_all("Room", {"floorplan": doc.name}, order_by="name")

    for r in rooms:
        room = frappe.get_doc("Room", r.name)
        devices = frappe.db.sql(
            """
            SELECT name AS device_id, device_name, device_inventory_code, device_group, status,
                   map_x, map_y
            FROM `tabDevice`
            WHERE room = %s
            ORDER BY name ASC
            """,
            room.name,
            as_dict=True,
        )

        rooms_data.append({
            "room_name": room.room_name,
            "bounds": [[room.bounds_top, room.bounds_left], [room.bounds_bottom, room.bounds_right]],
            "color": room.color or "#3b82f6",
            "devices": devices,
        })

    return {
        "name": doc.name,
        "title": doc.title,
        "image": doc.image,
        "image_width": doc.image_width,
        "image_height": doc.image_height,
        "rooms": rooms_data,
    }


# --- Map ---

@frappe.whitelist()
def get_map_data() -> dict:
    locations = frappe.db.sql(
        """
        SELECT name, location_name, parent_location, location, latitude, longitude
        FROM `tabLocation`
        ORDER BY location_name ASC
        """,
        as_dict=True,
    )

    result = []
    for loc in locations:
        devices = frappe.db.sql(
            """
            SELECT name AS device_id, device_name, device_inventory_code, device_group, status
            FROM `tabDevice`
            WHERE location = %s
            """,
            loc.name,
            as_dict=True,
        )

        geometry = None
        geo = loc.get("location")
        if geo:
            try:
                parsed = frappe.parse_json(geo) if isinstance(geo, str) else geo
                features = parsed.get("features", [])
                if features:
                    geometry = features[0].get("geometry")
            except Exception:
                pass

        if not geometry and loc.latitude and loc.longitude:
            geometry = {"type": "Point", "coordinates": [float(loc.longitude), float(loc.latitude)]}

        if not geometry:
            continue

        result.append({
            "name": loc.name,
            "location_name": loc.location_name,
            "parent_location": loc.parent_location,
            "geometry": geometry,
            "device_count": len(devices),
            "devices": devices,
        })

    return {"locations": result}
