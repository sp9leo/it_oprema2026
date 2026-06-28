import frappe
from frappe import _
from frappe.model.document import Document


class DeviceMovement(Document):
    def validate(self):
        self.validate_asset()
        self.validate_location()
        self.validate_employee()

    def validate_asset(self):
        for d in self.assets:
            status, company = frappe.db.get_value("Device", d.asset, ["status", "company"])
            if self.purpose == _("Prenos") and status in ("Draft", "Scrapped", "Sold"):
                frappe.throw(_("{0} naprave ni mogo\u010de prenesti").format(status))

            if not (d.source_location or d.target_location or d.from_employee or d.to_employee):
                frappe.throw(_("Potrebna je lokacija ali uporabnik"))

    def validate_location(self):
        for d in self.assets:
            if self.purpose in [_("Prenos"), _("Izdaja")]:
                current_location = frappe.db.get_value("Device", d.asset, "device_location")
                if d.source_location:
                    if current_location != d.source_location:
                        frappe.throw(
                            _("Naprava {0} ni na lokaciji {1}").format(d.asset, d.source_location)
                        )
                else:
                    d.source_location = current_location

            if self.purpose == _("Izdaja"):
                if d.target_location:
                    frappe.throw(_("Izdaje ni mogo\u010de izvesti na lokacijo"), title=_("Napa\u010den namen"))
                if not d.to_employee:
                    frappe.throw(_("Uporabnik je obvezen pri izdaji naprave {0}").format(d.asset))

            if self.purpose == _("Prenos"):
                if d.to_employee:
                    frappe.throw(_("Prenosa ni mogo\u010de izvesti na uporabnika"), title=_("Napa\u010den namen"))
                if not d.target_location:
                    frappe.throw(_("Ciljna lokacija je obvezna pri prenosu naprave {0}").format(d.asset))
                if d.source_location == d.target_location:
                    frappe.throw(_("Izvorna in ciljna lokacija ne smeta biti enaki"))

            if self.purpose == _("Prevzem"):
                if not d.source_location and not (d.target_location or d.to_employee):
                    frappe.throw(_("Ciljna lokacija ali uporabnik je obvezen pri prevzemu naprave {0}").format(d.asset))
                elif d.source_location:
                    if d.target_location and not d.from_employee:
                        frappe.throw(_("Od uporabnika je obvezno pri prevzemu na lokacijo"))
                    if d.from_employee and not d.target_location:
                        frappe.throw(_("Ciljna lokacija je obvezna pri prevzemu od uporabnika"))
                    if d.to_employee and d.target_location:
                        frappe.throw(_("Naprave ni mogo\u010de prevzeti na lokacijo in dati uporabniku hkrati"))

    def validate_employee(self):
        for d in self.assets:
            if d.from_employee:
                current_custodian = frappe.db.get_value("Device", d.asset, "device_user")
                if current_custodian != d.from_employee:
                    frappe.throw(_("Naprava {0} ni dodeljena uporabniku {1}").format(d.asset, d.from_employee))

            if d.to_employee and frappe.db.get_value("User", d.to_employee, "company") != self.company:
                frappe.throw(_("Uporabnik {0} ne pripada organizaciji {1}").format(d.to_employee, self.company))

    def on_submit(self):
        self.set_latest_location_and_custodian()

    def on_cancel(self):
        self.set_latest_location_and_custodian()

    def set_latest_location_and_custodian(self):
        for d in self.assets:
            args = {"asset": d.asset, "company": self.company}
            latest = frappe.db.sql("""
                SELECT asm_item.target_location, asm_item.to_employee
                FROM `tabDevice Movement Item` asm_item, `tabDevice Movement` asm
                WHERE asm_item.parent = asm.name
                  AND asm_item.asset = %(asset)s
                  AND asm.company = %(company)s
                  AND asm.docstatus = 1
                ORDER BY asm.transaction_date DESC LIMIT 1
            """, args)

            if latest:
                frappe.db.set_value("Device", d.asset, "device_location", latest[0][0] or "")
                frappe.db.set_value("Device", d.asset, "device_user", latest[0][1] or "")
