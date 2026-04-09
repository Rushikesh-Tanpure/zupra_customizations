frappe.ui.form.on("Customer Inquiry", {
	refresh: function (frm) {
		if (!frm.doc.__islocal) {
			frm.add_custom_button(__("Quotation"), function () {
				frappe.new_doc("Quotation", {
					customer_enquiry: frm.doc.name
				});
			}, __("Create"));
		}
	}
});

frappe.listview_settings["Customer Inquiry"] = {
	onload: function (listview) {
		listview.page.add_action_item(__("Create Quotation"), function () {
			const selected = listview.get_checked_items();
			if (selected.length !== 1) {
				frappe.msgprint(__("Please select exactly one Customer Inquiry to create a Quotation."));
				return;
			}
			frappe.new_doc("Quotation", {
				customer_enquiry: selected[0].name
			});
		});
	}
};
