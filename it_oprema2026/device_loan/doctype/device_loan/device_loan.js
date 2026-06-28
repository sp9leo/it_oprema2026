frappe.ui.form.on('Device Loan', {
    refresh: (frm) => {
        if (frm.doc.status === 'Confirmed' && !frm.doc.__islocal) {
            frm.add_custom_button('Ozna\u010di kot vrnjeno', () => {
                frm.set_value('status', 'Returned');
                frm.save();
            });
        }
    }
});
