frappe.ui.form.on('Device Movement', {
    setup: (frm) => {
        frm.set_query("to_employee", "assets", () => ({
            filters: { company: frm.doc.company }
        }));
        frm.set_query("from_employee", "assets", () => ({
            filters: { company: frm.doc.company }
        }));
        frm.set_query("asset", "assets", () => ({
            filters: { status: ["not in", ["Draft"]] }
        }));
    },
    purpose: (frm) => {
        let fields;
        switch (frm.doc.purpose) {
            case "Prenos":
                fields = { target_location: { read_only: 0, reqd: 1 }, source_location: { read_only: 1, reqd: 1 }, from_employee: { read_only: 1, reqd: 0 }, to_employee: { read_only: 1, reqd: 0 } };
                break;
            case "Prevzem":
                fields = { target_location: { read_only: 0, reqd: 1 }, source_location: { read_only: 1, reqd: 0 }, from_employee: { read_only: 0, reqd: 1 }, to_employee: { read_only: 1, reqd: 0 } };
                break;
            case "Izdaja":
                fields = { target_location: { read_only: 1, reqd: 0 }, source_location: { read_only: 1, reqd: 0 }, from_employee: { read_only: 1, reqd: 0 }, to_employee: { read_only: 0, reqd: 1 } };
                break;
        }
        if (fields) {
            Object.keys(fields).forEach(fn => {
                Object.keys(fields[fn]).forEach(prop => {
                    frm.fields_dict.assets.grid.update_docfield_property(fn, prop, fields[fn][prop]);
                });
            });
            frm.refresh_field('assets');
        }
    }
});

frappe.ui.form.on('Device Movement Item', {
    asset: function(frm, cdt, cdn) {
        const asset = locals[cdt][cdn].asset;
        if (asset) {
            frappe.db.get_doc('Device', asset).then(doc => {
                if (doc.device_location) frappe.model.set_value(cdt, cdn, 'source_location', doc.device_location);
                if (doc.device_user) frappe.model.set_value(cdt, cdn, 'from_employee', doc.device_user);
            });
        }
    }
});
