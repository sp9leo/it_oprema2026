import frappe


@frappe.whitelist(allow_guest=True)
def ping() -> dict:
    return {"message": "pong"}


@frappe.whitelist()
def get_dashboard_stats() -> dict:
    return {
        "total_devices": frappe.db.count("Device"),
        "total_computers": frappe.db.count("Computer"),
        "total_locations": frappe.db.count("Location"),
    }


@frappe.whitelist()
def get_devices(
    filters: str | None = None, limit: int = 50, offset: int = 0
) -> dict:
    filters_dict = frappe.parse_json(filters) if filters else {}
    conditions = ""
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    devices = frappe.db.sql(
        f"""
        SELECT name, device_inventory_code, device_id, device_name, device_group,
               status, location, current_location, company, device_serial, is_computer
        FROM `tabDevice`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """,
        as_dict=True,
    )

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
    return {
        "device": device.as_dict(),
        "attachments": attachments,
    }


@frappe.whitelist()
def get_computers(
    filters: str | None = None, limit: int = 50, offset: int = 0
) -> dict:
    filters_dict = frappe.parse_json(filters) if filters else {}
    conditions = ""
    for key, val in filters_dict.items():
        conditions += f" AND {key} = {frappe.db.escape(val)}"

    computers = frappe.db.sql(
        f"""
        SELECT name, computer_name, computer_inventory_code, computer_id,
               manufacturer, status, location, computer_admin, device_user
        FROM `tabComputer`
        WHERE 1=1 {conditions}
        ORDER BY modified DESC
        LIMIT {int(limit)} OFFSET {int(offset)}
    """,
        as_dict=True,
    )

    total = frappe.db.count("Computer", filters_dict)
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
