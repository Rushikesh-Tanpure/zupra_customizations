frappe.ui.form.on("Sales Order", {
	onload: function (frm) {
		// When a Sales Order is created from a Quotation that has no Customer,
		// party_name/customer arrives as "" or "None" — clear it so the user can enter manually.
		if (frm.doc.__islocal) {
			if (!frm.doc.customer || frm.doc.customer === "None") {
				frm.set_value("customer", "");
			}
		}
	}
});
