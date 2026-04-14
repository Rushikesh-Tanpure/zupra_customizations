from . import __version__ as app_version

app_name        = "zupra_customizations"
app_title       = "Zupra Tech"
app_publisher   = "Zupra Tech"
app_description = "UI Customizations for Zupra Tech ERP"
app_email       = "admin@zupra.tech"
app_license     = "MIT"
app_version     = app_version

# Logo shown in the top-left navbar
app_logo_url = "/assets/zupra_customizations/images/zupra_logo.svg"

# Injected into EVERY Frappe desk page after login
app_include_css = ["/assets/zupra_customizations/css/zupra_desk.css"]
app_include_js  = ["/assets/zupra_customizations/js/zupra_desk.js"]

# After login → redirect to our welcome dashboard instead of default workspace
home_page = "zupra-dashboard"

# Fixtures – export/import custom fields
fixtures = [
    {
        "dt": "Custom Field",
        "filters": [["dt", "=", "Quotation"]]
    }
]

# Override ERPNext whitelisted methods
override_whitelisted_methods = {
    "erpnext.selling.doctype.quotation.quotation.make_sales_order":
        "zupra_customizations.zupra_customizations.overrides.quotation.make_sales_order"
}

# Server-side event hooks
doc_events = {
    "Quotation": {
        "before_validate": "zupra_customizations.zupra_customizations.overrides.quotation.set_party_name"
    }
}

# Client scripts per doctype
doctype_js = {
    "Quotation": "public/js/quotation_customer_enquiry.js",
    "Customer Inquiry": "public/js/customer_inquiry.js",
    "Sales Order": "public/js/sales_order.js"
}