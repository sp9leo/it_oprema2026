app_name = "it_oprema2026"
app_title = "IT Oprema 2026"
app_publisher = "OS\u017d"
app_description = "IT asset management and device booking"
app_email = "info@osaz.si"
app_license = "MIT"

use_json_request_body = True

app_include_js = "/assets/it_oprema2026/js/it_oprema.js"
app_include_icons = "/assets/it_oprema2026/icons/icons.svg"

scheduler_events = {
    "daily": [
        "it_oprema2026.device_loan.api.expire_stale_tokens"
    ]
}

export_python_type_annotations = True
require_type_annotated_api_methods = True

doc_events = {
    "Device": {
        "before_save": "it_oprema2026.overrides.device.before_save",
    }
}
