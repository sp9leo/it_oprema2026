import frappe


@frappe.whitelist()
def attach_device(**kwargs):
    return {"ok": False, "warning": "This API is deprecated. Use it_oprema2026.api.frontend.attach_device instead."}


@frappe.whitelist()
def detach_device(**kwargs):
    return {"ok": False, "warning": "This API is deprecated. Use it_oprema2026.api.frontend.detach_device instead."}


@frappe.whitelist()
def attach_ip(device_link, ip_address_link, force=False):
    from it_oprema2026.api.frontend import attach_ip as new_attach
    return new_attach(device_link, ip_address_link, force)


@frappe.whitelist()
def detach_ip(device_link, ip_address_link):
    from it_oprema2026.api.frontend import detach_ip as new_detach
    return new_detach(device_link, ip_address_link)
