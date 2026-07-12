frappe.ui.form.on('Device', {
    refresh: function(frm) {
        if (!frm.doc.__islocal) {
            load_location_log(frm);
        }
    }
});

frappe.ui.form.on('Device', {
    refresh: function(frm) {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Device IP Link",
                filters: { device_link: frm.doc.name },
                fields: ["ip_address_link", "attached_on", "notes"]
            },
            callback: function(r) {
                let links = r.message || [];
                if (!links.length) {
                    frm.fields_dict.attached_ips_html.$wrapper.html("<p>No IPs attached.</p>");
                    return;
                }

                let ip_names = links.map(ip => ip.ip_address_link);

                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "IP Address",
                        filters: { name: ["in", ip_names] },
                        fields: ["name", "ip_address", "network", "status"]
                    },
                    callback: function(res2) {
                        let ip_docs = {};
                        (res2.message || []).forEach(doc => {
                            ip_docs[doc.name] = doc;
                        });

                        let html = `
                            <h4>
                                Attached IP Addresses
                                <button class="btn btn-xs btn-primary pull-right attach-ip-btn">
                                    Attach IP
                                </button>
                            </h4>
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>IP Address</th>
                                        <th>Status</th>
                                        <th>Network</th>
                                        <th>Attached On</th>
                                        <th>Notes</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;

                        links.forEach(link => {
                            let ip_doc = ip_docs[link.ip_address_link] || {};
                            let status_color = "gray";
                            if (ip_doc.status === "Active") status_color = "green";
                            else if (ip_doc.status === "Reserved") status_color = "orange";
                            else if (ip_doc.status === "Inactive") status_color = "red";

                            html += `
                                <tr>
                                    <td><a href="/app/ip-address/${link.ip_address_link}">${ip_doc.ip_address || link.ip_address_link}</a></td>
                                    <td><span style="color:${status_color}; font-weight:bold;">● ${ip_doc.status || ''}</span></td>
                                    <td>${ip_doc.network || '-'}</td>
                                    <td>${link.attached_on ? moment(link.attached_on).format("YYYY-MM-DD HH:mm:ss") : ''}</td>
                                    <td>${link.notes || ''}</td>
                                    <td>
                                        <button class="btn btn-xs btn-danger detach-ip-btn" data-ip="${link.ip_address_link}">
                                            Detach
                                        </button>
                                    </td>
                                </tr>
                            `;
                        });

                        html += `</tbody></table>`;
                        frm.fields_dict.attached_ips_html.$wrapper.html(html);

                        frm.fields_dict.attached_ips_html.$wrapper.find('.detach-ip-btn').on('click', function() {
                            let ip = $(this).data('ip');
                            frappe.confirm(
                                `Detach IP ${ip} from Device ${frm.doc.name}?`,
                                () => {
                                    frappe.call({
                                        method: "it_oprema.it_oprema.api.detach_ip",
                                        args: {
                                            device_link: frm.doc.name,
                                            ip_address_link: ip
                                        },
                                        callback: function() {
                                            frappe.msgprint(`IP ${ip} detached successfully`);
                                            frm.reload_doc();
                                        }
                                    });
                                }
                            );
                        });

                        frm.fields_dict.attached_ips_html.$wrapper.find('.attach-ip-btn').on('click', function() {
                            frappe.prompt([
                                {
                                    fieldname: 'ip_address_link',
                                    label: 'Select IP Address',
                                    fieldtype: 'Link',
                                    options: 'IP Address',
                                    reqd: 1,
                                    get_query: () => {
                                        return {
                                            filters: [
                                                ["IP Address", "is_linked", "=", 0]
                                            ]
                                        };
                                    }
                                }
                            ],
                            (values) => {
                                frappe.call({
                                    method: "it_oprema.it_oprema.api.attach_ip",
                                    args: {
                                        device_link: frm.doc.name,
                                        ip_address_link: values.ip_address_link
                                    },
                                    callback: function(r) {
                                        if (r.message && r.message.warning) {
                                            frappe.confirm(
                                                r.message.warning,
                                                () => {
                                                    frappe.call({
                                                        method: "it_oprema.it_oprema.api.attach_ip",
                                                        args: {
                                                            device_link: frm.doc.name,
                                                            ip_address_link: values.ip_address_link,
                                                            force: true
                                                        },
                                                        callback: function() {
                                                            frappe.msgprint(`IP ${values.ip_address_link} re-attached to Device ${frm.doc.name}`);
                                                            frm.reload_doc();
                                                        }
                                                    });
                                                }
                                            );
                                        } else if (r.message && r.message.ok) {
                                            frappe.msgprint(r.message.message);
                                            frm.reload_doc();
                                        }
                                    }
                                });
                            },
                            'Attach IP Address',
                            'Attach'
                            );
                        });
                    }
                });
            }
        });
    }
});

function load_location_log(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Device Location Log",
            filters: { device: frm.doc.name },
            fields: ["name", "location", "previous_location", "timestamp", "user", "notes"],
            order_by: "timestamp desc",
            limit_page_length: 50
        },
        callback: function(r) {
            let logs = r.message || [];
            let html = `<h4>Location History</h4>`;
            if (logs.length) {
                html += `<table class="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>Date/Time</th>
                            <th>Location</th>
                            <th>Previous</th>
                            <th>User</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>`;
                logs.forEach(function(log) {
                    html += `<tr>
                        <td>${log.timestamp}</td>
                        <td>${log.location || '-'}</td>
                        <td>${log.previous_location || '-'}</td>
                        <td>${log.user || '-'}</td>
                        <td>${log.notes || ''}</td>
                    </tr>`;
                });
                html += `</tbody></table>`;
            } else {
                html += `<p>No location changes recorded.</p>`;
            }
            frm.fields_dict.movements_html.$wrapper.html(html);
        }
    });
}
