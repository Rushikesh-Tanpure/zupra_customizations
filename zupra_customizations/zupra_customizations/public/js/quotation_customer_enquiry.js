function fetch_enquiry_details(frm, enquiry_name) {
	frappe.db.get_doc("Customer Inquiry", enquiry_name).then((enq) => {
		// Do NOT set quotation_to via set_value — that triggers ERPNext's
		// toggle_reqd_lead_customer which makes party_name mandatory.
		// Set directly on doc instead.
		frm.doc.quotation_to = "Customer";

		// Contact person
		if (enq.customer_name) {
			frm.set_value("contact_display", enq.customer_name);
		}

		// Contact details
		if (enq.email_address) {
			frm.set_value("contact_email", enq.email_address);
		}
		if (enq.mobile_no) {
			frm.set_value("contact_mobile", enq.mobile_no);
		}

		// Address
		if (enq.company_address) {
			frm.set_value("address_display", enq.company_address);
		}

		// Cust Inq Date → transaction_date (Quotation Date)
		if (enq.inquiry_date) {
			frm.set_value("transaction_date", enq.inquiry_date);
		}

		// Requested Delivery Date → valid_till
		if (enq.requested_delivery_date) {
			frm.set_value("valid_till", enq.requested_delivery_date);
		}

		// Company / Site Name → custom company_name field
		if (enq.company_name) {
			frm.set_value("company_name", enq.company_name);
		}

		// Tank details
		if (enq.type_of_tank) {
			frm.set_value("type_of_tank", enq.type_of_tank);
		}
		if (enq.tank_size_capacity) {
			frm.set_value("tank_size_capacity", enq.tank_size_capacity);
		}
		if (enq.number_of_tanks) {
			frm.set_value("number_of_tanks", enq.number_of_tanks);
		}

		frm.refresh_fields();
		hide_party_fields(frm);
		frappe.show_alert({
			message: __("Details fetched from Customer Enquiry: {0}", [enquiry_name]),
			indicator: "green"
		});
	});
}

function hide_party_fields(frm) {
	// Hide quotation_to and party_name rows via CSS on their wrappers
	const fields = ["quotation_to", "party_name", "customer_name"];
	fields.forEach(function (fn) {
		frm.set_df_property(fn, "hidden", 1);
		frm.set_df_property(fn, "reqd", 0);
		const field = frm.get_field(fn);
		if (field && field.df) field.df.reqd = 0;
		if (field && field.$wrapper) field.$wrapper.hide();
	});
}

frappe.ui.form.on("Quotation", {
	setup: function (frm) {
		// Monkey-patch toggle_reqd so party_name can never be made mandatory
		const original_toggle_reqd = frm.toggle_reqd.bind(frm);
		frm.toggle_reqd = function (fieldname, reqd) {
			if (fieldname === "party_name") return;
			return original_toggle_reqd(fieldname, reqd);
		};
	},

	onload: function (frm) {
		hide_party_fields(frm);

		if (frm.doc.__islocal && frm.doc.customer_enquiry) {
			fetch_enquiry_details(frm, frm.doc.customer_enquiry);
		}
	},

	refresh: function (frm) {
		hide_party_fields(frm);
	},

	customer_enquiry: function (frm) {
		if (!frm.doc.customer_enquiry) return;
		fetch_enquiry_details(frm, frm.doc.customer_enquiry);
	},

	before_save: function (frm) {
		// Ensure party_name is never sent — Python hook also enforces this
		frm.doc.party_name = null;
	}
});
