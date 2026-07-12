app_name = "it_oprema2026"
app_title = "IT Oprema 2026"
app_publisher = "OS\u017d"
app_description = "IT asset management and device booking"
app_email = "info@osaz.si"
app_license = "MIT"

use_json_request_body = True

app_include_js = "/assets/it_oprema2026/js/it_oprema.js"
app_include_icons = "/assets/it_oprema2026/icons/icons.svg"

add_to_apps_screen = [
    {
        "name": "it_oprema2026",
        "logo": "/assets/it_oprema2026/images/logo.svg",
        "title": "IT Oprema 2026",
        "route": "/app/reservations",
        "has_permission": "it_oprema2026.api.permission.has_app_permission",
    }
]

scheduler_events = {
    "daily": [
        "it_oprema2026.device_loan.api.expire_stale_tokens"
    ]
}

export_python_type_annotations = True
require_type_annotated_api_methods = True

custom_fields = {
    "Device": [
        {
            "fieldname": "current_location",
            "fieldtype": "Link",
            "insert_after": "location",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Current Location",
            "options": "Location",
            "search_index": 1,
        }
    ]
}

doc_events = {
    "Device": {
        "before_save": "it_oprema2026.overrides.device.before_save",
    }
}
