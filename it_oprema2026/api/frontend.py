import frappe


@frappe.whitelist(allow_guest=True)
def ping():
    return {"message": "pong"}


@frappe.whitelist()
def get_dashboard_stats():
    return {
        "total_devices": frappe.db.count("Device"),
        "total_computers": frappe.db.count("Computer"),
        "active_loans": frappe.db.count("Asset Booking", {"booking_status": ["in", ["Approved", "Active"]]}),
        "total_locations": frappe.db.count("Location"),
        "recent_movements": _get_recent_movements(),
        "recent_loans": _get_recent_loans(),
    }


@frappe.whitelist()
def get_devices(filters=None, limit=50, offset=0):
    filters = frappe.parse_json(filters) if filters else {}
    conditions = ""
    for key, val in filters.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    devices = frappe.db.sql(f"""
        SELECT name, device_inventory_code, device_id, device_name, device_group,
               status, location, company, device_serial, is_computer
        FROM `tabDevice`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Device", filters)
    return {"data": devices, "total": total}


@frappe.whitelist()
def get_device_detail(name):
    device = frappe.get_doc("Device", name)
    attachments = frappe.get_all("File", {
        "attached_to_doctype": "Device",
        "attached_to_name": name
    }, ["name", "file_name", "file_url", "file_size"])
    return {
        "device": device.as_dict(),
        "attachments": attachments,
    }


@frappe.whitelist()
def get_computers(filters=None, limit=50, offset=0):
    conditions = ""
    if filters:
        filters = frappe.parse_json(filters)
        for key, val in filters.items():
            conditions += f" AND {key} = {frappe.db.escape(val)}"

    computers = frappe.db.sql(f"""
        SELECT name, computer_name, computer_inventory_code, computer_id,
               manufacturer, status, location, computer_admin, device_user
        FROM `tabComputer`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Computer", filters if isinstance(filters, dict) else {})
    return {"data": computers, "total": total}


@frappe.whitelist()
def get_loans(status=None, limit=50, offset=0):
    conditions = ""
    if status:
        conditions = f" AND booking_status = {frappe.db.escape(status)}"

    loans = frappe.db.sql(f"""
        SELECT name, booking_asset, booking_user, booking_start, booking_end,
               booking_status, booking_note, creation
        FROM `tabAsset Booking`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Asset Booking", {"booking_status": status} if status else {})
    return {"data": loans, "total": total}


@frappe.whitelist()
def get_movements(limit=50, offset=0):
    movements = frappe.db.sql(f"""
        SELECT name, asset, from_location, to_location, moved_by,
               movement_date, notes
        FROM `tabAsset Movement`
        ORDER BY movement_date DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Asset Movement")
    return {"data": movements, "total": total}


@frappe.whitelist()
def get_locations():
    return frappe.db.sql("""
        SELECT name, location_name, parent_location, location_number, is_group
        FROM `tabLocation`
        ORDER BY lft ASC
    """, as_dict=True)


def _get_recent_movements():
    return frappe.db.sql("""
        SELECT name, asset, from_location, to_location, movement_date
        FROM `tabAsset Movement`
        ORDER BY movement_date DESC
        LIMIT 5
    """, as_dict=True)


def _get_recent_loans():
    return frappe.db.sql("""
        SELECT name, booking_asset, booking_user, booking_start, booking_end, booking_status
        FROM `tabAsset Booking`
        WHERE booking_status IN ("Approved", "Active")
        ORDER BY booking_start DESC
        LIMIT 5
    """, as_dict=True)
