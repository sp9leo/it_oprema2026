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
               status, location, company, device_serial, is_computer
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


@frappe.whitelist()
def attach_device(computer: str, device: str, force: bool = False) -> dict:
    existing = frappe.get_all(
        "Computer Device Link",
        filters={"device_link": device},
        fields=["name", "computer_link"],
    )
    if existing:
        current_computer = existing[0].computer_link
        if current_computer != computer and not force:
            return {
                "ok": False,
                "warning": f"Device {device} is already attached to Computer {current_computer}.",
            }
        if current_computer != computer:
            frappe.delete_doc("Computer Device Link", existing[0].name, ignore_permissions=True)
            frappe.db.set_value("Device", device, "computer_link", None)
            frappe.get_doc("Computer", current_computer).add_comment(
                "Info", f"Device {device} detached (re-attached to {computer})."
            )

    frappe.get_doc({
        "doctype": "Computer Device Link",
        "computer_link": computer,
        "device_link": device,
        "attached_on": frappe.utils.now_datetime(),
    }).insert(ignore_permissions=True)
    frappe.db.set_value("Device", device, "computer_link", computer)

    comp_location = frappe.db.get_value("Computer", computer, "location")
    if comp_location:
        frappe.db.set_value("Device", device, "location", comp_location)

    return {"ok": True, "message": f"Device {device} attached to Computer {computer}"}


@frappe.whitelist()
def detach_device(computer: str, device: str) -> dict:
    existing = frappe.get_all(
        "Computer Device Link",
        filters={"computer_link": computer, "device_link": device},
        fields=["name"],
    )
    if not existing:
        return {"ok": False, "warning": f"Device {device} is not attached to Computer {computer}."}

    frappe.delete_doc("Computer Device Link", existing[0].name, ignore_permissions=True)
    frappe.db.set_value("Device", device, "computer_link", None)
    frappe.db.set_value("Device", device, "location", None)
    frappe.get_doc("Computer", computer).add_comment("Info", f"Device {device} detached.")
    return {"ok": True, "message": f"Device {device} detached from Computer {computer}"}


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
