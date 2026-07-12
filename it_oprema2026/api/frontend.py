import frappe


@frappe.whitelist(allow_guest=True)
def ping():
    return {"message": "pong"}


@frappe.whitelist()
def get_dashboard_stats() -> dict:
    return {
        "total_devices": frappe.db.count("Device"),
        "total_computers": frappe.db.count("Computer"),
        "active_loans": frappe.db.count("Asset Booking", {"booking_status": ["in", ["Approved", "Active"]]}),
        "total_locations": frappe.db.count("Location"),
        "recent_movements": _get_recent_movements(),
        "recent_loans": _get_recent_loans(),
    }


@frappe.whitelist()
def get_devices(filters: str | None = None, limit: int = 50, offset: int = 0) -> dict:
    filters_dict = frappe.parse_json(filters) if filters else {}
    conditions = ""
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    devices = frappe.db.sql(f"""
        SELECT name, device_inventory_code, device_id, device_name, device_group,
               status, location, company, device_serial, is_computer
        FROM `tabDevice`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Device", filters_dict)
    return {"data": devices, "total": total}


@frappe.whitelist()
def get_device_detail(name: str) -> dict:
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
def get_computers(filters: str | None = None, limit: int = 50, offset: int = 0) -> dict:
    conditions = ""
    filters_dict = frappe.parse_json(filters) if filters else {}
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    computers = frappe.db.sql(f"""
        SELECT name, computer_name, computer_inventory_code, computer_id,
               manufacturer, status, location, computer_admin, device_user
        FROM `tabComputer`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """, as_dict=True)

    total = frappe.db.count("Computer", filters_dict)
    return {"data": computers, "total": total}


@frappe.whitelist()
def get_loans(status: str | None = None, limit: int = 50, offset: int = 0) -> dict:
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
def get_movements(limit: int = 50, offset: int = 0) -> dict:
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
def get_locations() -> list:
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
