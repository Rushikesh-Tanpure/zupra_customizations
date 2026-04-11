frappe.pages['zupra-dashboard'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({ parent: wrapper, title: '', single_column: true });
	var $main = $(wrapper).find('.layout-main-section');
	$main.html(ZupraDashboard.render());
	ZupraDashboard.setup_events(wrapper);
	ZupraDashboard.load_recent(wrapper);
};

// ─── Dashboard Builder ────────────────────────────────────────────────────────
var ZupraDashboard = {

	// Setup items — drives both "Attention Required" count and checklist
	_setup: [
		{ label: 'Company Details',    route: '/app/company',                                  done: true  },
		{ label: 'Fiscal Year',        route: '/app/fiscal-year',                              done: true  },
		{ label: 'Chart of Accounts',  route: '/app/account',                                  done: true  },
		{ label: 'Letter Head',        route: '/app/letter-head',                              done: false },
		{ label: 'Terms & Conditions', route: '/app/terms-and-conditions',                     done: false },
		{ label: 'Cost Center',        route: '/app/cost-center',                              done: false },
		{ label: 'Payment Terms',      route: '/app/payment-terms-template',                   done: false },
		{ label: 'Sales Tax Template', route: '/app/sales-taxes-and-charges-template',         done: false },
		{ label: 'Customer Groups',    route: '/app/customer-group',                           done: false },
		{ label: 'Price Lists',        route: '/app/price-list',                               done: false },
		{ label: 'Warehouses',         route: '/app/warehouse',                                done: false },
		{ label: 'Supplier Groups',    route: '/app/supplier-group',                           done: false },
	],

	_quicklinks: [
		{ label: 'Quotation',      route: '/app/quotation',      color: '#4361ee' },
		{ label: 'Sales Invoice',  route: '/app/sales-invoice',  color: '#10b981' },
		{ label: 'Purchase Order', route: '/app/purchase-order', color: '#f59e0b' },
		{ label: 'Customer',       route: '/app/customer',       color: '#8b5cf6' },
		{ label: 'Item',           route: '/app/item',           color: '#ec4899' },
		{ label: 'Reports',        route: '/app/query-report',   color: '#6366f1' },
		{ label: 'Supplier',       route: '/app/supplier',       color: '#0ea5e9' },
		{ label: 'Payment Entry',  route: '/app/payment-entry',  color: '#f43f5e' },
	],

	render: function () {
		var full_name  = frappe.session.user_fullname || frappe.session.user;
		var first_name = frappe.utils.escape_html(full_name.split(' ')[0]);
		var pending    = this._setup.filter(function (i) { return !i.done; });
		var done_cnt   = this._setup.length - pending.length;
		var pct        = Math.round((done_cnt / this._setup.length) * 100);

		return [
			ZupraDashboard.styles(),

			// ── Hero ───────────────────────────────────────────────────────────
			'<div class="zd-wrap">',
			'<div class="zd-hero">',
			'  <div>',
			'    <h1 class="zd-title">Welcome, ' + first_name + '!</h1>',
			'    <p class="zd-sub">Your Zupra Tech ERP is ready. ' + done_cnt + ' of ' + this._setup.length + ' setup steps complete.</p>',
			'  </div>',
			'  <div class="zd-hero-btns">',
			'    <a href="/app/quotation/new-quotation-1" class="zd-btn-primary">+ New Quotation</a>',
			'    <a href="/app/sales-invoice/new-sales-invoice-1" class="zd-btn-outline">+ New Invoice</a>',
			'  </div>',
			'</div>',

			// Webinar banner (dismissible)
			'<div class="zd-banner" id="zd-banner">',
			'  <span class="zd-live">LIVE</span>',
			'  <span class="zd-banner-msg"><strong>Free Onboarding Webinar</strong> &mdash; Every Thursday, 11 AM IST.</span>',
			'  <a href="#" class="zd-banner-link">Register Now &rarr;</a>',
			'  <button class="zd-banner-x" onclick="document.getElementById(\'zd-banner\').style.display=\'none\'">&times;</button>',
			'</div>',

			// ── 2-column card grid ─────────────────────────────────────────────
			'<div class="zd-grid">',

			//   Card 1 — Attention Required
			'  <div class="zd-card">',
			'    <div class="zd-card-head">',
			'      <h2 class="zd-card-title">',
			'        Attention Required',
			pending.length
				? '<span class="zd-badge">' + pending.length + '</span>'
				: '',
			'      </h2>',
			'    </div>',
			pending.length
				? [
					'<div class="zd-pb-track"><div class="zd-pb-fill" style="width:' + pct + '%"></div></div>',
					'<p class="zd-pb-lbl">' + done_cnt + ' of ' + this._setup.length + ' completed</p>',
					pending.slice(0, 6).map(function (it) {
						return '<div class="zd-cl-row">'
							+ '<span class="zd-cl-icon">&#9675;</span>'
							+ '<span class="zd-cl-lbl">' + frappe.utils.escape_html(it.label) + '</span>'
							+ '<a href="' + it.route + '" class="zd-btn-cfg">Configure &rarr;</a>'
							+ '</div>';
					}).join(''),
					pending.length > 6
						? '<p class="zd-see-all"><a href="#" class="zd-link" data-action="show-all-setup">+ ' + (pending.length - 6) + ' more items</a></p>'
						: '',
				  ].join('')
				: '<div class="zd-empty"><span class="zd-check-big">&#10003;</span><p>All set! No action needed.</p></div>',
			'  </div>',

			//   Card 2 — Quick Links
			'  <div class="zd-card">',
			'    <div class="zd-card-head">',
			'      <h2 class="zd-card-title">Quick Links</h2>',
			'    </div>',
			'    <div class="zd-quick">',
			this._quicklinks.map(function (q) {
				var abbr = q.label.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
				return '<a href="' + q.route + '" class="zd-ql">'
					+ '<div class="zd-ql-ico" style="background:' + q.color + '1a;color:' + q.color + '">' + abbr + '</div>'
					+ '<span class="zd-ql-lbl">' + q.label + '</span>'
					+ '</a>';
			}).join(''),
			'    </div>',
			'  </div>',

			//   Card 3 — Recent Activity
			'  <div class="zd-card">',
			'    <div class="zd-card-head">',
			'      <h2 class="zd-card-title">Getting Started</h2>',
			'    </div>',
			'    <div class="zd-gs">',
			'      <div class="zd-gs-thumb">',
			'        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">',
			'          <circle cx="12" cy="12" r="10"/>',
			'          <polygon points="10,8 16,12 10,16" fill="white" stroke="none"/>',
			'        </svg>',
			'        <span>Watch Overview</span>',
			'      </div>',
			'      <div class="zd-gs-body">',
			'        <p>Configure your company, import data, and manage operations in minutes.</p>',
			'        <ul class="zd-bullets">',
			'          <li>&#10003; Company &amp; chart of accounts</li>',
			'          <li>&#10003; Import customers, suppliers &amp; items</li>',
			'          <li>&#10003; Set up taxes &amp; payment terms</li>',
			'        </ul>',
			'        <div class="zd-gs-actions">',
			'          <button class="zd-btn-primary" onclick="frappe.msgprint(\'Our team will reach out within 24 hours.\')">Write to Us</button>',
			'          <a href="https://docs.frappe.io/erpnext" target="_blank" class="zd-btn-ghost">Docs &#8599;</a>',
			'        </div>',
			'      </div>',
			'    </div>',
			'  </div>',

			//   Card 4 — Recently Visited
			'  <div class="zd-card">',
			'    <div class="zd-card-head">',
			'      <h2 class="zd-card-title">Recently Visited</h2>',
			'    </div>',
			'    <div id="zd-recent-list"><p class="zd-muted">Loading&hellip;</p></div>',
			'  </div>',

			'</div>', // .zd-grid
			'</div>', // .zd-wrap
		].join('\n');
	},

	/** Populate "Recently Visited" card from Frappe's view log. */
	load_recent: function (wrapper) {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype:  'Access Log',
				fields:   ['reference_doctype', 'reference_document', 'creation'],
				filters:  [['owner', '=', frappe.session.user]],
				order_by: 'creation desc',
				limit:    8,
			},
			callback: function (r) {
				var el = document.getElementById('zd-recent-list');
				if (!el) return;

				var rows = (r && r.message && r.message.length)
					? r.message
					: [];

				if (!rows.length) {
					el.innerHTML = '<p class="zd-muted">No recently visited documents.</p>';
					return;
				}

				el.innerHTML = rows.map(function (row) {
					var route = '/app/' + frappe.router.slug(row.reference_doctype)
						+ '/' + encodeURIComponent(row.reference_document);
					return '<a href="' + route + '" class="zd-recent-row">'
						+ '<span class="zd-recent-type">' + frappe.utils.escape_html(row.reference_doctype) + '</span>'
						+ '<span class="zd-recent-name">' + frappe.utils.escape_html(row.reference_document) + '</span>'
						+ '</a>';
				}).join('');
			},
			error: function () {
				var el = document.getElementById('zd-recent-list');
				if (el) el.innerHTML = '<p class="zd-muted">Could not load recent documents.</p>';
			}
		});
	},

	setup_events: function (wrapper) {
		$(wrapper).on('click', '[data-action="show-all-setup"]', function (e) {
			e.preventDefault();
			// Expand to show all pending items — simple toggle
			var card = $(this).closest('.zd-card');
			card.find('.zd-cl-row').show();
			$(this).closest('.zd-see-all').remove();
		});
	},

	styles: function () {
		return [
			'<style>',

			/* ── Outer wrapper — full width, no centering cap ── */
			'.zd-wrap{padding:28px 32px 64px;font-family:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;}',

			/* ── Hero ── */
			'.zd-hero{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:20px;}',
			'.zd-title{font-size:24px;font-weight:700;color:#1a1f36;margin:0 0 4px;}',
			'.zd-sub{color:#6b7280;font-size:13px;margin:0;}',
			'.zd-hero-btns{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}',

			/* ── Buttons ── */
			'.zd-btn-primary{background:#4361ee;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-block;}',
			'.zd-btn-primary:hover{background:#3451d1;color:#fff;text-decoration:none;}',
			'.zd-btn-outline{background:transparent;color:#4361ee;border:1.5px solid #4361ee;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-block;}',
			'.zd-btn-outline:hover{background:#4361ee12;text-decoration:none;}',
			'.zd-btn-ghost{background:transparent;color:#6b7280;border:none;padding:9px 16px;font-size:13px;cursor:pointer;text-decoration:none;}',
			'.zd-btn-ghost:hover{color:#4361ee;text-decoration:none;}',
			'.zd-btn-cfg{background:#4361ee12;color:#4361ee;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;text-decoration:none;margin-left:auto;white-space:nowrap;}',
			'.zd-btn-cfg:hover{background:#4361ee22;color:#3451d1;text-decoration:none;}',

			/* ── Webinar banner ── */
			'.zd-banner{background:linear-gradient(135deg,#1a1f36,#2d3561);border-radius:10px;padding:12px 18px;display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;}',
			'.zd-live{background:#ef4444;color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;padding:3px 7px;border-radius:4px;flex-shrink:0;}',
			'.zd-banner-msg{flex:1;font-size:13px;color:rgba(255,255,255,.9);}',
			'.zd-banner-link{font-size:13px;color:#93c5fd;text-decoration:none;font-weight:500;white-space:nowrap;}',
			'.zd-banner-link:hover{color:#fff;text-decoration:none;}',
			'.zd-banner-x{background:none;border:none;color:rgba(255,255,255,.45);font-size:16px;cursor:pointer;padding:0 4px;line-height:1;}',

			/* ── 2-column card grid ── */
			'.zd-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}',
			'@media(max-width:900px){.zd-grid{grid-template-columns:1fr;}}',

			/* ── Card base ── */
			'.zd-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,.04);}',

			/* ── Card header ── */
			'.zd-card-head{margin-bottom:16px;border-bottom:1px solid #f3f4f6;padding-bottom:12px;}',
			'.zd-card-title{font-size:14px;font-weight:600;color:#1a1f36;margin:0;display:flex;align-items:center;gap:8px;}',
			'.zd-badge{background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px;}',

			/* ── Progress bar ── */
			'.zd-pb-track{background:#e5e7eb;border-radius:99px;height:5px;margin-bottom:5px;}',
			'.zd-pb-fill{background:#4361ee;height:100%;border-radius:99px;transition:width .4s;}',
			'.zd-pb-lbl{font-size:11px;color:#9ca3af;margin:0 0 12px;}',

			/* ── Setup checklist rows ── */
			'.zd-cl-row{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:7px;margin-bottom:1px;transition:background .12s;}',
			'.zd-cl-row:hover{background:#f9fafb;}',
			'.zd-cl-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;color:#9ca3af;}',
			'.zd-cl-lbl{flex:1;font-size:13px;color:#374151;}',
			'.zd-see-all{margin:8px 0 0;text-align:center;}',
			'.zd-link{color:#4361ee;font-size:12px;text-decoration:none;}',
			'.zd-link:hover{text-decoration:underline;}',

			/* ── Empty state ── */
			'.zd-empty{text-align:center;padding:24px 0;color:#6b7280;}',
			'.zd-check-big{font-size:36px;color:#10b981;display:block;margin-bottom:8px;}',
			'.zd-empty p{font-size:13px;margin:0;}',

			/* ── Quick links grid ── */
			'.zd-quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px;}',
			'.zd-ql{background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;transition:box-shadow .18s,transform .18s;}',
			'.zd-ql:hover{box-shadow:0 4px 14px rgba(67,97,238,.12);transform:translateY(-2px);text-decoration:none;}',
			'.zd-ql-ico{width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;}',
			'.zd-ql-lbl{font-size:11px;font-weight:500;color:#374151;text-align:center;}',

			/* ── Getting Started (card 3) ── */
			'.zd-gs{display:flex;gap:16px;align-items:flex-start;}',
			'.zd-gs-thumb{flex-shrink:0;width:90px;height:68px;background:linear-gradient(135deg,#1a1f36,#2d3561);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;cursor:pointer;transition:opacity .2s;}',
			'.zd-gs-thumb:hover{opacity:.85;}',
			'.zd-gs-thumb svg{width:28px;height:28px;margin-bottom:4px;}',
			'.zd-gs-thumb span{font-size:9px;color:rgba(255,255,255,.7);}',
			'.zd-gs-body p{color:#6b7280;font-size:12px;margin:0 0 10px;}',
			'.zd-bullets{list-style:none;padding:0;margin:0 0 14px;}',
			'.zd-bullets li{font-size:12px;color:#374151;padding:1px 0;}',
			'.zd-gs-actions{display:flex;gap:8px;align-items:center;}',

			/* ── Recently Visited (card 4) ── */
			'.zd-recent-row{display:flex;flex-direction:column;gap:1px;padding:8px 10px;border-radius:6px;text-decoration:none;transition:background .12s;border-bottom:1px solid #f3f4f6;}',
			'.zd-recent-row:last-child{border-bottom:none;}',
			'.zd-recent-row:hover{background:#f9fafb;text-decoration:none;}',
			'.zd-recent-type{font-size:10px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:.5px;}',
			'.zd-recent-name{font-size:13px;color:#374151;font-weight:500;}',
			'.zd-muted{color:#9ca3af;font-size:13px;padding:8px 0;}',

			'@media(max-width:640px){',
			'  .zd-gs{flex-direction:column;}',
			'  .zd-gs-thumb{width:100%;height:80px;}',
			'  .zd-hero{flex-direction:column;}',
			'}',

			'</style>',
		].join('\n');
	},
};
