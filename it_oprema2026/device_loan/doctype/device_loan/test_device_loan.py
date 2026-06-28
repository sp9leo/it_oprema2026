import frappe
from frappe.tests.utils import FrappeTestCase


class TestDeviceLoan(FrappeTestCase):
    def setUp(self):
        self.device = frappe.get_doc({
            "doctype": "Device",
            "device_name": "Test Laptop",
            "device_inventory_code": "TEST-001",
            "device_group": frappe.get_all("Device Group", pluck="name")[0],
            "is_bookable": 1
        }).insert(ignore_permissions=True)

    def test_create_loan(self):
        loan = frappe.get_doc({
            "doctype": "Device Loan",
            "device": self.device.name,
            "customer_name": "Janez Novak",
            "customer_email": "janez@test.si",
            "from_date": "2026-07-10",
            "to_date": "2026-07-12",
            "status": "Confirmed"
        })
        loan.insert(ignore_permissions=True)
        self.assertTrue(loan.booking_ref)
        self.assertTrue(loan.access_token)
        self.assertEqual(loan.status, "Confirmed")

    def test_overlap_prevention(self):
        loan1 = frappe.get_doc({
            "doctype": "Device Loan",
            "device": self.device.name,
            "customer_name": "A",
            "customer_email": "a@test.si",
            "from_date": "2026-07-10",
            "to_date": "2026-07-12",
            "status": "Confirmed"
        }).insert(ignore_permissions=True)

        loan2 = frappe.get_doc({
            "doctype": "Device Loan",
            "device": self.device.name,
            "customer_name": "B",
            "customer_email": "b@test.si",
            "from_date": "2026-07-11",
            "to_date": "2026-07-13",
            "status": "Confirmed"
        })
        with self.assertRaises(frappe.ValidationError):
            loan2.insert(ignore_permissions=True)

    def tearDown(self):
        frappe.delete_doc("Device Loan", frappe.get_all("Device Loan", pluck="name"), ignore_permissions=True)
        frappe.delete_doc("Device", self.device.name, ignore_permissions=True)
