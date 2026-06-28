app_name = "it_oprema2026"
app_title = "IT Oprema 2026"
app_publisher = "OS\u0160"
app_description = "IT asset management and device booking"
app_email = "info@osaz.si"
app_license = "MIT"

app_include_js = "/assets/it_oprema2026/js/it_oprema.js"

scheduler_events = {
    "daily": [
        "it_oprema2026.device_loan.api.expire_stale_tokens"
    ]
}
