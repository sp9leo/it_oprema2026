import frappe

def get_context(context):
    context.devices = frappe.get_all(
        "Device",
        filters={"is_bookable": 1},
        fields=["name", "device_name", "device_inventory_code", "device_group", "device_manufacturer"]
    )
    for d in context.devices:
        d.manufacturer_name = frappe.db.get_value("IT-Device Manufacturer", d.device_manufacturer, "manufacturer_name") if d.device_manufacturer else ""
        d.group_name = frappe.db.get_value("Device Group", d.device_group, "device_group_name") if d.device_group else ""
