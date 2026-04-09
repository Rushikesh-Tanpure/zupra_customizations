// ═══════════════════════════════════════════════════════════════════════════
//  ZUPRA TECH — Global Desk JS  (Frappe v15)  v2.0
//
//  1. Logo injection       — "Z" badge + "Zupra Tech" (belt-and-suspenders)
//  2. Sidebar overflow     — measures height, hides overflow items, adds
//                            "More" button that opens a dark popup panel
//  3. Sidebar active sync  — keeps selected state on route change
// ═══════════════════════════════════════════════════════════════════════════

frappe.ready(function () {
    _zupra_inject_logo();
    _zupra_sync_navbar_height();   // set --z-navbar-h CSS var from real DOM measurement
    _zupra_toggle_page_head();     // hide/show page-head based on action buttons

    // Watch for logo images Frappe may inject dynamically after page load
    var _navbar = document.querySelector('.navbar');
    if (_navbar) {
        new MutationObserver(function () {
            document.querySelectorAll('.navbar-home img, .navbar .app-logo')
                .forEach(function (img) { img.style.display = 'none'; });
        }).observe(_navbar, { childList: true, subtree: true });
    }

    // Sidebar needs items to be in the DOM — wait two frames for Frappe render
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            _zupra_inject_home();          // ensure Home item exists at top of sidebar
            _zupra_sidebar_overflow();     // measure + hide overflow items, add More btn
            _zupra_setup_submenus();       // attach hover-popup to items with children
            _zupra_init_hover_popups();    // accounting-specific hardcoded hover menus
            _zupra_watch_sidebar();        // re-run above on DOM mutations
        });
    });
    _zupra_sync_sidebar();
    _zupra_bind_resize();

    // Inject Home link in list filter sidebar on initial load
    setTimeout(_zupra_inject_home_in_list_sidebar, 300);

    // Collapse workspace sidebar gap — must run early to set body class
    setTimeout(_zupra_collapse_workspace_sidebar, 80);

    // Issue 2 — remove top gap on home page
    setTimeout(_zupra_fix_home_top_gap, 150);

    // Issue 3 — hide injected nav links on non-home pages
    setTimeout(_zupra_manage_filter_sidebar_content, 300);

    // Inner-page scoping — adds body.z-inner-page on non-home routes (CSS Section 14)
    setTimeout(_zupra_scope_inner_page, 100);

    // Issue 4 — lock logo position (no shift from Frappe runtime styles)
    _zupra_lock_logo_position();

    // Re-evaluate page-head visibility on every route/page change
    $(document).on('page-change', function () {
        // Small delay so Frappe finishes rendering action buttons first
        setTimeout(_zupra_toggle_page_head, 80);
        setTimeout(_zupra_lock_logo_position, 100);      // Issue 4
        setTimeout(_zupra_setup_submenus, 150);
        setTimeout(_zupra_init_hover_popups, 200);
        setTimeout(_zupra_fix_home_top_gap, 200);        // Issue 2
        setTimeout(_zupra_collapse_workspace_sidebar, 50);   // gap fix — early, sets body class
        setTimeout(_zupra_inject_home_in_list_sidebar, 400);
        setTimeout(_zupra_manage_filter_sidebar_content, 250);  // Issue 3
        setTimeout(_zupra_scope_inner_page, 150);

        // CSS Sections 11 and 14 handle filter sidebar width, overflow, and
        // white-space — no inline-style overrides needed here.
    });

    // Belt-and-suspenders: also hook frappe.after_ajax for dynamic pages
    frappe.after_ajax(function () {
        _zupra_toggle_page_head();
        _zupra_scope_inner_page();
    });
});


// ── 0a. Sync navbar height → CSS custom property ─────────────────────────
/**
 * Measures the real rendered navbar height and writes it to --z-navbar-h
 * so the CSS sidebar positioning stays accurate regardless of Frappe version
 * or any padding changes.
 */
function _zupra_sync_navbar_height() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;
    var h = navbar.getBoundingClientRect().height;
    if (h > 0) {
        document.documentElement.style.setProperty('--z-navbar-h', h + 'px');
    }
}


// ── 0b. Show/hide page-head ("≡ Home" bar) ───────────────────────────────
/**
 * The .page-head element holds both:
 *   (a) workspace/module breadcrumb titles  → should be hidden (no use)
 *   (b) form/list action buttons (Save, Submit, …) → must stay visible
 *
 * CSS hides .page-head globally via `display:none !important`.
 * This function adds .z-show when real action buttons are present so they
 * remain accessible, and removes it when the page is a plain workspace/title.
 */
function _zupra_toggle_page_head() {
    var head = document.querySelector('.page-head');
    if (!head) return;

    var route = frappe.get_route ? frappe.get_route() : [];

    // Form pages: ALWAYS show the page-head.
    // It contains the document title, status badge, navigation arrows (< >),
    // print button and any action buttons — all useful regardless of doc state.
    // Button-counting is unreliable for submitted/read-only docs where Frappe
    // renders controls outside .page-actions or defers their render timing.
    if (route && route[0] === 'Form') {
        head.classList.add('z-show');
        return;
    }

    // Other pages (list, workspace): show only when real action buttons exist
    var btns = head.querySelectorAll('.page-actions .btn, .page-actions button');
    var visibleCount = 0;
    for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        if (
            !btn.classList.contains('hide') &&
            btn.style.display !== 'none' &&
            getComputedStyle(btn).display !== 'none'
        ) {
            visibleCount++;
        }
    }

    if (visibleCount > 0) {
        head.classList.add('z-show');
    } else {
        head.classList.remove('z-show');
    }
}


// ── 1. Logo — hide native image + strip "No Logo" text node ─────────────
/**
 * The visual logo ("Z" badge + "Zupra Tech") is now rendered entirely via
 * CSS ::before and ::after pseudo-elements on .navbar-home.
 *
 * This function's only job is to:
 *   1. Hide any <img> Frappe placed inside the brand link.
 *   2. Empty any bare text nodes (e.g. "No Logo") so they don't bleed through
 *      the CSS font-size:0 rule.
 */
function _zupra_inject_logo() {
    var brand = document.querySelector('.navbar-brand.navbar-home');
    if (!brand) return;

    // Hide every img inside the brand (covers app-logo and any future variants)
    brand.querySelectorAll('img').forEach(function (img) {
        img.style.display = 'none';
    });

    // Strip bare "No Logo" (or similar) text nodes
    Array.from(brand.childNodes).forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = '';
        }
    });
}


// ── 1b. Inject Home item if missing ──────────────────────────────────────
/**
 * Frappe v15 may not include a Home workspace item in the sidebar.
 * This ensures it always appears as the first item.
 */
function _zupra_inject_home() {
    var section = document.querySelector(
        '.desk-sidebar .standard-sidebar-section, .desk-sidebar'
    );
    if (!section) return;

    // Check all anchors for a Home route
    var existing = section.querySelector(
        'a[href="/app/home"], a[href="/app"], a[data-route="app/home"]'
    );
    if (existing) {
        console.log('[Zupra] Home item already in DOM — skipping injection');
        return;
    }

    console.log('[Zupra] Home item NOT found — injecting');
    var homeItem = document.createElement('div');
    homeItem.className          = 'standard-sidebar-item';
    homeItem.dataset.zHomeItem  = '1';  // marker so we can find it later
    homeItem.innerHTML = (
        '<a href="/app/home" data-route="app/home">' +
            '<span class="es-icon">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"' +
                '     stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
                '     stroke-linejoin="round">' +
                '  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
                '  <polyline points="9,22 9,12 15,12 15,22"/>' +
                '</svg>' +
            '</span>' +
            '<span>Home</span>' +
        '</a>'
    );

    // Insert as very first child so it appears above Buying/Selling etc.
    section.insertBefore(homeItem, section.firstChild);
}


// ── 1b-2. Inject Home link at top of LIST PAGE filter sidebar ─────────────
/**
 * On list pages (Items, Purchase Order, etc.) the left panel is .list-sidebar,
 * not .desk-sidebar.  This ensures a "Home" link appears at the very top of
 * that filter sidebar so users can navigate back from any list view.
 *
 * Called with a short delay on frappe.ready() and on every page-change so it
 * works for both hard-loads and Frappe's SPA navigation.
 */
function _zupra_inject_home_in_list_sidebar() {
    var listSidebar = document.querySelector(
        '.list-sidebar, .layout-side-section .list-sidebar-wrapper'
    );
    if (!listSidebar) return;

    // Already injected in this render
    if (listSidebar.querySelector('[data-label="Home"], .z-home-link')) return;

    var homeLink = document.createElement('div');
    homeLink.className = 'sidebar-item z-home-link';
    homeLink.style.cssText = [
        'padding:6px 12px',
        'margin-bottom:8px',
        'border-bottom:1px solid #e0e0e0',
    ].join(';');
    homeLink.innerHTML = (
        '<a href="/app/home"' +
        '   style="display:flex;align-items:center;gap:8px;' +
        '          color:#1a1f36;text-decoration:none;' +
        '          font-size:13px;font-weight:500;">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"' +
            '     stroke="currentColor" stroke-width="2"' +
            '     stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
                '<polyline points="9,22 9,12 15,12 15,22"/>' +
            '</svg>' +
            'Home' +
        '</a>'
    );
    listSidebar.insertBefore(homeLink, listSidebar.firstChild);
}


// ── 0c-2. Collapse workspace sidebar gap — route-based ───────────────────
/**
 * Frappe reuses the .list-sidebar class on both list pages (filter panel)
 * and workspace pages (bookmarks sidebar).  CSS :has() selectors can't
 * distinguish them, so this function uses the route instead.
 *
 * On list pages  (route[0] === 'List'):
 *   • Adds body.zupra-list-page  → CSS Sections 11 & 12 show the filter panel
 *   • Restores inline styles on the inner .layout-side-section
 *
 * On all other pages (workspace, home, form …):
 *   • Removes body.zupra-list-page → CSS collapses the inner sidebar
 *   • Forces inline display:none as a belt-and-suspenders backup
 */
function _zupra_collapse_workspace_sidebar() {
    var route      = frappe.get_route ? frappe.get_route() : [];
    var isListPage = !!(route && route.length >= 2 && route[0] === 'List');

    // Sync body class — CSS Sections 11 and 12 use this for all sidebar rules
    document.body.classList.toggle('zupra-list-page', isListPage);

    document.querySelectorAll('.layout-main-section-wrapper').forEach(function (wrapper) {
        var inner = wrapper.querySelector(':scope > .layout-side-section');
        if (!inner) return;

        if (isListPage) {
            // List page — clear overrides; Section 11 CSS handles sizing
            inner.style.display  = '';
            inner.style.width    = '';
            inner.style.minWidth = '';
            inner.style.maxWidth = '';
            inner.style.padding  = '';
            inner.style.border   = '';
        } else {
            // Workspace / home / form — collapse to eliminate the gap
            inner.style.display  = 'none';
            inner.style.width    = '0';
            inner.style.minWidth = '0';
            inner.style.maxWidth = '0';
            inner.style.padding  = '0';
            inner.style.border   = 'none';
        }
    });
}


// ── 0c. Remove top gap on home page only ─────────────────────────────────
/**
 * On the workspace/home page Frappe may render top padding on .layout-main
 * or its first .page-container, creating a gap below the navbar.
 * Zeros it on home, restores default spacing on all other pages.
 */
function _zupra_fix_home_top_gap() {
    var route  = frappe.get_route ? frappe.get_route() : [];
    var isHome = !route || route.length === 0 || route[0] === '' ||
                 route[0] === 'home' ||
                 window.location.pathname === '/app/home' ||
                 window.location.pathname === '/app';

    var layoutMain = document.querySelector('.layout-main');
    if (!layoutMain) return;

    if (isHome) {
        layoutMain.style.paddingTop = '0';
        layoutMain.style.marginTop  = '0';
        var firstPage = layoutMain.querySelector('.page-container');
        if (firstPage) {
            firstPage.style.paddingTop = '0';
            firstPage.style.marginTop  = '0';
        }
    } else {
        // Restore: clear the inline overrides so CSS defaults take over
        layoutMain.style.paddingTop = '';
        layoutMain.style.marginTop  = '';
    }
}


// ── 1f. Show/hide injected nav links based on current page ───────────────
/**
 * The .z-home-link injected into .list-sidebar must only be visible on
 * home/workspace pages.  On list and form pages the filter sidebar should
 * show only its native filter options, not module-navigation links.
 */
function _zupra_manage_filter_sidebar_content() {
    var route  = frappe.get_route ? frappe.get_route() : [];
    var isHome = !route || route.length === 0 || route[0] === '' || route[0] === 'home';

    var injectedLinks = document.querySelectorAll(
        '.list-sidebar .z-home-link, .list-sidebar .z-nav-link'
    );
    injectedLinks.forEach(function (el) {
        el.style.display = isHome ? 'block' : 'none';
    });
}


// ── 1g. Lock logo position — prevent nav transitions from shifting it ─────
/**
 * Resets any inline styles that Frappe or route changes may apply to
 * .navbar-home, ensuring the Z badge stays flush-left on every page.
 */
function _zupra_lock_logo_position() {
    var navbarHome = document.querySelector('.navbar-home');
    if (!navbarHome) return;

    navbarHome.style.position  = 'static';
    navbarHome.style.left      = 'auto';
    navbarHome.style.transform = 'none';

    // Ensure any runtime-injected <img> stays hidden
    navbarHome.querySelectorAll('img').forEach(function (img) {
        img.style.display = 'none';
    });
}


// ── 1c. Hover submenu popups ──────────────────────────────────────────────
/**
 * For any sidebar item that has a .sidebar-child-items descendant,
 * replace the click-dropdown with a smooth hover popup to the right.
 * Uses a single shared popup element (#z-sub-popup).
 */
function _zupra_setup_submenus() {
    var sidebar = document.querySelector('.desk-sidebar');
    if (!sidebar) return;

    // Create shared popup once
    var popup = document.getElementById('z-sub-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id        = 'z-sub-popup';
        popup.className = 'z-submenu-popup';
        document.body.appendChild(popup);
    }

    var hideTimer = null;

    function showPopup(item) {
        clearTimeout(hideTimer);

        // Collect child links
        var childAnchors = Array.from(item.querySelectorAll(
            '.sidebar-child-items .standard-sidebar-item a, ' +
            '.sidebar-child-items .sidebar-item a'
        ));
        if (!childAnchors.length) return;

        popup.innerHTML = '';
        childAnchors.forEach(function (a) {
            var row = document.createElement('a');
            row.href = a.getAttribute('href') || '#';

            // Grab icon if present
            var iconEl = a.querySelector('.es-icon, .icon');
            if (iconEl) {
                var iconWrap = document.createElement('span');
                iconWrap.className = 'z-popup-icon';
                iconWrap.innerHTML = iconEl.innerHTML;
                iconWrap.style.cssText = [
                    'display:inline-flex', 'align-items:center', 'justify-content:center',
                    'width:22px', 'height:22px', 'border-radius:5px',
                    'background:rgba(255,255,255,0.08)', 'flex-shrink:0',
                ].join(';');
                row.appendChild(iconWrap);
            }

            var labelEl = a.querySelector('span:not(.es-icon):not(.icon)');
            var txt = document.createElement('span');
            txt.textContent = labelEl ? labelEl.textContent.trim() : a.textContent.trim();
            row.appendChild(txt);

            row.addEventListener('click', function () {
                popup.classList.remove('z-visible');
            });
            popup.appendChild(row);
        });

        var rect = item.getBoundingClientRect();
        popup.style.top = rect.top + 'px';
        popup.classList.add('z-visible');
    }

    function scheduleHide() {
        hideTimer = setTimeout(function () {
            popup.classList.remove('z-visible');
        }, 120);
    }

    // Attach hover to every sidebar item that has children
    // (guard with data-z-sub-bound to avoid duplicate listeners;
    //  skip items already claimed by _zupra_init_hover_popups)
    sidebar.querySelectorAll('.standard-sidebar-item, .sidebar-item').forEach(function (item) {
        if (item.dataset.zSubBound) return;
        if (item.dataset.zHoverManaged) return;  // claimed by _zupra_init_hover_popups
        var children = item.querySelector('.sidebar-child-items');
        if (!children) return;

        item.dataset.zSubBound = '1';
        item.addEventListener('mouseenter', function () { showPopup(item); });
        item.addEventListener('mouseleave', scheduleHide);
    });

    popup.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    popup.addEventListener('mouseleave', function () {
        popup.classList.remove('z-visible');
    });
}


// ── 1d. Hardcoded hover menus for specific sidebar items ─────────────────
/**
 * Shows a floating #z-hover-popup to the right of the sidebar when the
 * user hovers over sidebar items listed in `hoverMenus`.
 *
 * Differs from _zupra_setup_submenus in that the popup items are defined
 * here in JS rather than scraped from .sidebar-child-items in the DOM —
 * allowing arbitrary routes even when Frappe hasn't rendered child nodes.
 */
function _zupra_init_hover_popups() {
    var sidebar = document.querySelector('.desk-sidebar');
    if (!sidebar) return;

    // Create / reuse a single shared popup element
    var popup = document.getElementById('z-hover-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'z-hover-popup';
        document.body.appendChild(popup);
    }

    var hideTimer = null;

    function showPopup(anchorEl, config) {
        clearTimeout(hideTimer);
        var rect = anchorEl.getBoundingClientRect();
        popup.style.top = rect.top + 'px';
        popup.innerHTML =
            '<div class="z-popup-label">' + config.title + '</div>' +
            config.items.map(function (item) {
                return '<a href="' + item.route + '">' + item.label + '</a>';
            }).join('');
        popup.classList.add('z-visible');
    }

    function hidePopup() {
        hideTimer = setTimeout(function () {
            popup.classList.remove('z-visible');
        }, 120);
    }

    popup.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    popup.addEventListener('mouseleave', hidePopup);

    // ── Define which sidebar items get a hover popup ──────────────────────
    // Key = lowercase label text of the sidebar item
    var hoverMenus = {
        'accounting': {
            title: 'Accounting',
            items: [
                { label: 'Account Receivable', route: '/app/accounts-receivable' },
                { label: 'Account Payable',    route: '/app/accounts-payable' },
                { label: 'Finance Reporting',  route: '/app/financial-statements' },
            ]
        }
    };

    function attachHoverListeners() {
        var sidebarLinks = sidebar.querySelectorAll(
            '.standard-sidebar-item > a, .standard-sidebar-item > span'
        );

        sidebarLinks.forEach(function (link) {
            if (link.dataset.zHoverBound) return;  // already wired

            var labelEl = link.querySelector('span:not(.es-icon):not(.icon)');
            if (!labelEl) return;

            var labelText  = labelEl.textContent.trim().toLowerCase();
            var menuConfig = hoverMenus[labelText];
            if (!menuConfig) return;

            link.dataset.zHoverBound = '1';

            // Mark parent item so _zupra_setup_submenus won't double-bind it
            if (link.parentElement) {
                link.parentElement.dataset.zHoverManaged = '1';
            }

            link.addEventListener('mouseenter', function () {
                showPopup(link, menuConfig);
            });
            link.addEventListener('mouseleave', hidePopup);

            // Belt-and-suspenders: also hide any inline drop-icon
            var dropIcon = link.querySelector('.drop-icon');
            if (dropIcon) dropIcon.style.display = 'none';
        });
    }

    attachHoverListeners();
}


// ── 2. Sidebar overflow — "More" popup ───────────────────────────────────

/**
 * Main entry point. Measures sidebar height, shows as many items as fit,
 * hides the rest, and injects a "More •••" button that opens a popup.
 */
function _zupra_sidebar_overflow() {
    var sidebar = document.querySelector('.desk-sidebar');
    if (!sidebar) return;

    // All sidebar items, excluding any we already injected
    var items = Array.from(
        sidebar.querySelectorAll('.standard-sidebar-item, .sidebar-item')
    ).filter(function (el) { return !el.dataset.zInjected; });

    if (!items.length) return;

    // Tear down any previous More button/popup
    _zupra_remove_more_btn();

    // Reset visibility so we can measure real heights
    items.forEach(function (el) { el.style.display = ''; });

    requestAnimationFrame(function () {
        var sidebarH = sidebar.getBoundingClientRect().height;
        if (sidebarH < 10) {
            // Not rendered yet — retry shortly
            setTimeout(_zupra_sidebar_overflow, 250);
            return;
        }

        var MORE_RESERVE = 54; // px reserved for the More button at the bottom
        var available    = sidebarH - MORE_RESERVE;

        var usedH  = 0;
        var cutoff = items.length;

        for (var i = 0; i < items.length; i++) {
            var h = items[i].getBoundingClientRect().height || 52;
            if (usedH + h > available) { cutoff = i; break; }
            usedH += h;
        }

        if (cutoff >= items.length) return; // everything fits — nothing to do

        // Hide overflow items
        var overflow = items.slice(cutoff);
        overflow.forEach(function (el) { el.style.display = 'none'; });

        _zupra_add_more_btn(sidebar, overflow);
    });
}

/** Create and append the More button + popup to the sidebar / body. */
function _zupra_add_more_btn(sidebar, overflowItems) {
    // ── More button ──
    var btn = document.createElement('button');
    btn.id = 'z-more-btn';
    btn.setAttribute('aria-label', 'More navigation items');
    btn.innerHTML =
        '<span class="z-more-dots">' +
            '<span class="z-dot"></span>' +
            '<span class="z-dot"></span>' +
            '<span class="z-dot"></span>' +
        '</span>' +
        '<span>More</span>';

    // ── Popup panel ──
    var popup = document.createElement('div');
    popup.id = 'z-more-popup';
    popup.style.display = 'none';

    overflowItems.forEach(function (item) {
        var origLink = item.querySelector('a');
        if (!origLink) return;

        var href    = origLink.getAttribute('href') || '#';
        var iconEl  = origLink.querySelector('.es-icon, .icon');
        var labelEl = origLink.querySelector('span:not(.es-icon):not(.icon)');
        var label   = labelEl ? labelEl.textContent.trim() : 'Item';

        var row = document.createElement('a');
        row.href      = href;
        row.className = 'z-popup-item';

        if (iconEl) {
            var wrap = document.createElement('span');
            wrap.className = 'z-popup-icon';
            wrap.innerHTML = iconEl.innerHTML;
            row.appendChild(wrap);
        }

        var txt = document.createElement('span');
        txt.textContent = label;
        row.appendChild(txt);

        row.addEventListener('click', function () {
            popup.style.display = 'none';
        });

        popup.appendChild(row);
    });

    // ── Toggle logic ──
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (popup.style.display !== 'none') {
            popup.style.display = 'none';
            return;
        }
        // Position popup: anchored to bottom of the More button, left of sidebar
        var btnRect  = btn.getBoundingClientRect();
        var rowCount = popup.children.length;
        var popupH   = rowCount * 42 + 12;
        var topPos   = Math.max(8, btnRect.top - popupH);
        popup.style.top    = topPos + 'px';
        popup.style.bottom = 'auto';
        popup.style.display = 'block';
    });

    // ── Close on outside click ──
    var _closePopup = function (e) {
        if (!popup.contains(e.target) && e.target !== btn) {
            popup.style.display = 'none';
        }
    };
    document.addEventListener('click', _closePopup);
    // Store cleanup ref on the popup element
    popup._closeHandler = _closePopup;

    document.body.appendChild(popup);
    sidebar.appendChild(btn);
}

/** Remove any previously injected More button and popup. */
function _zupra_remove_more_btn() {
    var btn   = document.getElementById('z-more-btn');
    var popup = document.getElementById('z-more-popup');
    if (popup) {
        if (popup._closeHandler) {
            document.removeEventListener('click', popup._closeHandler);
        }
        popup.remove();
    }
    if (btn) btn.remove();
}

/**
 * Watch the sidebar for newly added items (Frappe can inject them lazily)
 * and re-run overflow calculation when the list changes.
 */
function _zupra_watch_sidebar() {
    var sidebar = document.querySelector('.desk-sidebar');
    if (!sidebar || !window.MutationObserver) return;

    var timer;
    var observer = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(_zupra_sidebar_overflow, 120);
    });
    observer.observe(sidebar, { childList: true, subtree: true });
}

/** Debounced window resize — recalculate overflow when viewport changes. */
function _zupra_bind_resize() {
    var timer;
    window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(_zupra_sidebar_overflow, 200);
    });
}


// ── 0d. Scope inner-page class ───────────────────────────────────────────
/**
 * Adds body.z-inner-page on every non-home route so CSS Section 14 targets
 * list / form / module pages without affecting the home workspace.
 * Called on frappe.ready, page-change, and frappe.after_ajax.
 */
function _zupra_scope_inner_page() {
    var route = frappe.get_route ? frappe.get_route() : [];
    var path  = window.location.pathname;

    var isHome = (
        !route ||
        route.length === 0 ||
        route[0] === '' ||
        route[0] === 'home' ||
        path === '/app' ||
        path === '/app/' ||
        path === '/app/home'
    );

    if (isHome) {
        document.body.classList.remove('z-inner-page');
    } else {
        document.body.classList.add('z-inner-page');
    }
}


// ── 3. Sidebar active-state sync on route change ─────────────────────────
function _zupra_sync_sidebar() {
    if (!frappe.router) return;
    frappe.router.on('change', function () {
        // Close the More popup on navigation
        var popup = document.getElementById('z-more-popup');
        if (popup) popup.style.display = 'none';

        var route = frappe.get_route_str() || '';
        document.querySelectorAll(
            '.desk-sidebar .standard-sidebar-item, .desk-sidebar .sidebar-item'
        ).forEach(function (el) {
            var link = el.querySelector('a');
            if (!link) return;
            var href     = (link.getAttribute('href') || '').replace('/app/', '');
            var isActive = !!href && route.startsWith(href);
            el.classList.toggle('selected', isActive);
        });

        // Re-evaluate page-head (action buttons differ per route)
        setTimeout(_zupra_toggle_page_head, 80);
    });
}
