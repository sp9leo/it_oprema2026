app_name = "it_oprema2026"
app_title = "IT Oprema 2026"
app_publisher = "OS\u017d"
app_description = "IT asset management and device booking"
app_email = "info@osaz.si"
app_license = "MIT"

app_include_js = "/assets/it_oprema2026/js/it_oprema.js"
app_include_icons = "/assets/it_oprema2026/icons/icons.svg"

add_to_apps_screen = [
    {
        "name": "it_oprema2026",
        "logo": "/assets/it_oprema2026/images/logo.svg",
        "title": "IT Oprema 2026",
        "route": "/it_oprema2026",
    }
]

scheduler_events = {
    "daily": [
        "it_oprema2026.device_loan.api.expire_stale_tokens"
    ]
}
