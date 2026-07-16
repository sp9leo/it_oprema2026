frappe.ui.form.on("Inventory Check", {
    refresh(frm) {
        if (frm.doc.status === "In Progress") {
            frm.add_custom_button(__("Complete Check"), () => {
                frm.set_value("status", "Completed");
                frm.save();
            });
        }
    }
});
