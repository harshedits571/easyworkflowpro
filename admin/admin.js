/* ===== Easy Workflow Admin Dashboard — JavaScript ===== */
/* 
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  FIREBASE SETUP INSTRUCTIONS                                     │
 * │                                                                   │
 * │  1. Go to https://console.firebase.google.com                     │
 * │  2. Create a new project (or use existing one)                   │
 * │  3. Enable Firestore Database (start in Production mode)          │
 * │  4. Enable Authentication → Email/Password                       │
 * │  5. Create an admin user in Auth → Users → Add User              │
 * │  6. Copy your Firebase config below                               │
 * │  7. Set Firestore Security Rules (see bottom of this file)       │
 * └──────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// 🔑 FIREBASE CONFIGURATION — (These keys are PUBLIC and safe to share)
// Note: In Firebase, the apiKey is NOT a secret. It just tells Google 
// which project to connect to. Real security is handled by your Firestore Rules.
// ═══════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyDE0F8ZF1yGWuju-tBUmzCAvN8_LinhW9Y",
    authDomain: "easy-workflow-pro.firebaseapp.com",
    projectId: "easy-workflow-pro",
    storageBucket: "easy-workflow-pro.firebasestorage.app",
    messagingSenderId: "326042721605",
    appId: "1:326042721605:web:759d3d272f263299dd722c",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ═══════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const loginBtnText = document.getElementById('login-btn-text');
const loginBtnLoader = document.getElementById('login-btn-loader');
const logoutBtn = document.getElementById('logout-btn');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const hamburgerAdmin = document.getElementById('hamburger-admin');
const pageTitle = document.getElementById('page-title');

// All data stores
const USD_TO_INR = 92; // Fixed exchange rate for dashboard reporting
let allLeads = [];
let allPayments = [];
let allCoupons = [];
let unsubLeads = null;
let unsubPayments = null;
let unsubCoupons = null;
let unsubLicenses = null;
let currentLeadsLimit = 10;
let currentPaymentsLimit = 10;
let currentLicensesLimit = 10;
let analyticsChartInstance = null;

// ═══════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION & SECURITY
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('error', function (e) {
    alert('Global JS Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
});

// IMPORTANT: Add your exact admin Firebase UIDs here. Only these accounts can log in.
const ALLOWED_ADMIN_UIDS = [
    'htqWVNfy8GYaCwvcMnerPKFjUFu2' // Replace this with your actual UID
];

auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            // SECURITY CHECK: Is this user in the allowed UID list?
            if (!ALLOWED_ADMIN_UIDS.includes(user.uid)) {
                // We do NOT call auth.signOut() here, because if they have the main website 
                // open in another tab, it will log them out there too! We just block the UI.
                loginScreen.style.display = 'flex';
                dashboard.style.display = 'none';
                loginError.textContent = 'Access Denied: Your account UID is not authorized.';
                loginError.style.display = 'block';
                return;
            }

            loginScreen.style.display = 'none';
            dashboard.style.display = 'flex';
            document.getElementById('admin-name').textContent = user.displayName || 'Admin';
            document.getElementById('admin-email').textContent = user.email;
            initDashboard();
        } else {
            loginScreen.style.display = 'flex';
            dashboard.style.display = 'none';
            // Cleanup listeners
            if (unsubLeads) unsubLeads();
            if (unsubPayments) unsubPayments();
        }
    } catch (err) {
        alert('Error during login init: ' + err.message);
        console.error(err);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        loginBtn.disabled = true;
        loginBtnText.style.display = 'none';
        loginBtnLoader.style.display = 'inline-block';
        loginError.style.display = 'none';

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            let msg = 'Invalid email or password.';
            if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
            if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
            if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
            loginError.textContent = msg;
            loginError.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline';
            loginBtnLoader.style.display = 'none';
        }
    } catch (fatalErr) {
        alert("Form submission error: " + fatalErr.message);
        console.error(fatalErr);
        loginBtn.disabled = false;
        loginBtnText.style.display = 'inline';
        loginBtnLoader.style.display = 'none';
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = item.dataset.page;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${targetPage}`).classList.add('active');

        const titleMap = {
            overview: 'Overview',
            leads: 'Leads & Customers',
            pricing: 'Pricing',
            payments: 'Payments',
            coupons: 'Promo Codes',
            customlinks: 'Custom Links',
            settings: 'Site Settings',
            licenses: 'Licenses'
        };
        pageTitle.textContent = titleMap[targetPage] || targetPage;

        // Close mobile sidebar
        sidebar.classList.remove('open');
    });
});

// Mobile sidebar toggle
hamburgerAdmin.addEventListener('click', () => sidebar.classList.add('open'));
sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD INITIALIZATION — Real-time Firestore Listeners
// ═══════════════════════════════════════════════════════════════════
function initDashboard() {
    startConfigListeners();
    listenToLeads();
    listenToPayments();
    listenToCoupons();
    listenToLicenses();
    listenToCustomLinks();
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG MANAGEMENT — Real-time Listeners
// ═══════════════════════════════════════════════════════════════════
let pricingUnsub = null;
let settingsUnsub = null;
let downloadsUnsub = null;

function startConfigListeners() {
    // 1. Pricing Listener
    if (pricingUnsub) pricingUnsub();
    pricingUnsub = db.collection('config').doc('pricing').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('price-basic-inr').value = data.basic_inr || 100;
            document.getElementById('price-basic-usd').value = data.basic_usd || 2;
            document.getElementById('price-pro-inr').value = data.pro_inr || 1500;
            document.getElementById('price-pro-usd').value = data.pro_usd || 18;
            document.getElementById('price-autocaptions-inr').value = data.autocaptions_inr || 800;
            document.getElementById('price-autocaptions-usd').value = data.autocaptions_usd || 10;
            if (document.getElementById('price-projectmanager-inr')) document.getElementById('price-projectmanager-inr').value = data.projectmanager_inr || 1500;
            if (document.getElementById('price-projectmanager-usd')) document.getElementById('price-projectmanager-usd').value = data.projectmanager_usd || 18;
        }
    }, err => console.error('Pricing sync error:', err));

    // 2. Settings Listener
    if (settingsUnsub) settingsUnsub();
    settingsUnsub = db.collection('config').doc('settings').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.deadlineDate) {
                let d = new Date(data.deadlineDate);
                let formatted = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
                document.getElementById('site-deadline-date').value = formatted;
            }
            if (data.bannerText !== undefined) {
                document.getElementById('site-banner-text').value = data.bannerText;
            }
        }
    }, err => console.error('Settings sync error:', err));

    // 3. Downloads Listener
    if (downloadsUnsub) downloadsUnsub();
    downloadsUnsub = db.collection('config').doc('downloads').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (document.getElementById('dl-projectmanager')) document.getElementById('dl-projectmanager').value = data.projectmanager || '';
            if (document.getElementById('dl-autocaptions')) document.getElementById('dl-autocaptions').value = data.autocaptions || '';
            if (document.getElementById('dl-pro')) document.getElementById('dl-pro').value = data.pro || '';
            if (document.getElementById('dl-basic')) document.getElementById('dl-basic').value = data.basic || '';
        }
    }, err => console.error('Downloads sync error:', err));
}

document.getElementById('save-pricing-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-pricing-btn');
    const statusEl = document.getElementById('pricing-save-status');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const pricing = {
        basic_inr: parseInt(document.getElementById('price-basic-inr').value) || 100,
        basic_usd: parseInt(document.getElementById('price-basic-usd').value) || 2,
        pro_inr: parseInt(document.getElementById('price-pro-inr').value) || 1500,
        pro_usd: parseInt(document.getElementById('price-pro-usd').value) || 18,
        autocaptions_inr: parseInt(document.getElementById('price-autocaptions-inr').value) || 800,
        autocaptions_usd: parseInt(document.getElementById('price-autocaptions-usd').value) || 10,
        projectmanager_inr: parseInt(document.getElementById('price-projectmanager-inr') ? document.getElementById('price-projectmanager-inr').value : 1500) || 1500,
        projectmanager_usd: parseInt(document.getElementById('price-projectmanager-usd') ? document.getElementById('price-projectmanager-usd').value : 18) || 18,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('config').doc('pricing').set(pricing, { merge: true });
        showToast('Prices saved successfully! Website will update in real-time.', 'success');
        statusEl.textContent = '✓ Saved just now';
        setTimeout(() => { statusEl.textContent = ''; }, 5000);
    } catch (err) {
        console.error('Failed to save pricing:', err);
        showToast('Failed to save prices: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save All Prices';
    }
});

document.getElementById('downloads-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-downloads-btn');
    const spinner = btn.querySelector('.fa-spinner');
    
    btn.disabled = true;
    spinner.style.display = 'inline-block';
    
    const downloads = {
        projectmanager: document.getElementById('dl-projectmanager').value.trim(),
        autocaptions: document.getElementById('dl-autocaptions').value.trim(),
        pro: document.getElementById('dl-pro').value.trim(),
        basic: document.getElementById('dl-basic').value.trim(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('config').doc('downloads').set(downloads, { merge: true });
        showToast('Download links saved successfully!', 'success');
    } catch (err) {
        console.error('Failed to save downloads:', err);
        showToast('Failed to save download links: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        spinner.style.display = 'none';
    }
});

// ═══════════════════════════════════════════════════════════════════
// LEADS — Real-time Listener
// ═══════════════════════════════════════════════════════════════════
function listenToLeads() {
    if (unsubLeads) unsubLeads();
    unsubLeads = db.collection('leads')
        .orderBy('timestamp', 'desc')
        .limit(currentLeadsLimit)
        .onSnapshot(snapshot => {
            allLeads = [];
            snapshot.forEach(doc => {
                allLeads.push({ id: doc.id, ...doc.data() });
            });
            renderLeads();
            updateOverviewStats();
            updateRecentActivity();
        }, err => {
            console.error('Leads listener error:', err);
        });
}

function renderLeads(filterStatus = 'all', filterTier = 'all', search = '') {
    const tbody = document.getElementById('leads-tbody');
    const emptyState = document.getElementById('leads-empty');
    const searchLower = search.toLowerCase();

    let filtered = allLeads.filter(lead => {
        if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
        if (filterTier !== 'all') {
            const tierLower = (lead.tier || '').toLowerCase();
            if (!tierLower.includes(filterTier)) return false;
        }
        if (search) {
            const haystack = `${lead.name || ''} ${lead.email || ''} ${lead.phone || ''}`.toLowerCase();
            if (!haystack.includes(searchLower)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(lead => {
        const statusClass = lead.status || 'interested';
        const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
        const date = lead.timestamp ? formatDate(lead.timestamp) : '—';
        const phone = lead.phone || '—';
        const gateway = lead.gateway || '—';
        const tier = lead.tier || '—';

        return `
            <tr>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(lead.name || 'Unknown')}</span>
                        <span class="customer-email">${escapeHtml(lead.email || '—')}</span>
                    </div>
                </td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(tier)}</td>
                <td><span class="status-badge status-${statusClass}">${statusLabel}</span></td>
                <td><span class="gateway-badge">${escapeHtml(gateway)}</span></td>
                <td>${date}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="View Details" onclick="viewLead('${lead.id}')">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="table-btn whatsapp" title="WhatsApp" onclick="openWhatsApp('${escapeAttr(phone)}', '${escapeAttr(lead.name || '')}', '${escapeAttr(lead.status || '')}', '${escapeAttr(tier)}')">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteLead('${lead.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update count badge
    document.getElementById('leads-count-badge').textContent = allLeads.length;
}

// Lead Filters / Search
document.getElementById('leads-search').addEventListener('input', applyLeadFilters);
document.getElementById('leads-filter').addEventListener('change', applyLeadFilters);
document.getElementById('leads-tier-filter').addEventListener('change', applyLeadFilters);
document.getElementById('leads-limit-select')?.addEventListener('change', (e) => {
    currentLeadsLimit = parseInt(e.target.value) || 10;
    listenToLeads();
});

function applyLeadFilters() {
    const search = document.getElementById('leads-search').value;
    const status = document.getElementById('leads-filter').value;
    const tier = document.getElementById('leads-tier-filter').value;
    renderLeads(status, tier, search);
}

// View Lead Details
window.viewLead = function (leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const modal = document.getElementById('lead-modal');
    const body = document.getElementById('lead-modal-body');
    const footer = document.getElementById('lead-modal-footer');
    const statusClass = lead.status || 'interested';

    body.innerHTML = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Name</span>
            <span class="modal-detail-value">${escapeHtml(lead.name || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">${escapeHtml(lead.email || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Phone</span>
            <span class="modal-detail-value">${escapeHtml(lead.phone || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Product</span>
            <span class="modal-detail-value">${escapeHtml(lead.tier || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value"><span class="status-badge status-${statusClass}">${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span></span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Gateway</span>
            <span class="modal-detail-value">${escapeHtml(lead.gateway || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Payment ID</span>
            <span class="modal-detail-value" style="font-family:monospace;font-size:12px;">${escapeHtml(lead.paymentId || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Amount</span>
            <span class="modal-detail-value" style="color:var(--accent-green);font-weight:600;">${escapeHtml(lead.amount || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Date</span>
            <span class="modal-detail-value">${lead.timestamp ? formatDate(lead.timestamp, true) : '—'}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Session Nonce</span>
            <span class="modal-detail-value" style="font-family:monospace;font-size:10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(lead.nonce || '—')}</span>
        </div>
    `;

    // Action buttons based on status
    let actions = `
        <button class="modal-action-btn whatsapp-btn" onclick="openWhatsApp('${escapeAttr(lead.phone || '')}', '${escapeAttr(lead.name || '')}', '${escapeAttr(lead.status || '')}', '${escapeAttr(lead.tier || '')}')">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </button>
        <button class="modal-action-btn primary" onclick="openLicenseComposer('${lead.id}')">
            <i class="fa-solid fa-paper-plane"></i> Send License
        </button>
        <button class="modal-action-btn success" onclick="copyLeadEmail('${escapeAttr(lead.email || '')}')">
            <i class="fa-solid fa-envelope"></i> Copy Email
        </button>
    `;

    if (lead.status === 'interested') {
        actions += `
            <button class="modal-action-btn success" onclick="updateLeadStatus('${lead.id}', 'paid')">
                <i class="fa-solid fa-check"></i> Mark as Paid
            </button>
            <button class="modal-action-btn primary" style="background:var(--accent-orange);border-color:var(--accent-orange);" onclick="openFollowUpComposer('${lead.id}')">
                <i class="fa-solid fa-envelope"></i> Send Follow-Up
            </button>
        `;
    }
    if (lead.status === 'paid') {
        actions += `
            <button class="modal-action-btn success" onclick="updateLeadStatus('${lead.id}', 'verified')">
                <i class="fa-solid fa-shield-check"></i> Mark Verified
            </button>
        `;
    }
    actions += `
        <button class="modal-action-btn danger" onclick="deleteLead('${lead.id}'); closeLeadModal();">
            <i class="fa-solid fa-trash-can"></i> Delete
        </button>
    `;

    footer.innerHTML = actions;
    modal.style.display = 'flex';
    // Reset composer state
    closeLicenseComposer();
    closeFollowUpComposer();
};

// License Email Composer Logic
let currentEditingLeadId = null;

window.openLicenseComposer = function (leadId) {
    currentEditingLeadId = leadId;
    const composer = document.getElementById('license-composer');
    const lead = allLeads.find(l => l.id === leadId);

    // Auto-fill some defaults if possible
    document.getElementById('manual-license-link').value = '';
    document.getElementById('manual-license-message').value = `Hey ${lead.name || 'Creator'}, thank you for your purchase! Here is your access link to download the files.`;

    composer.style.display = 'block';
    composer.scrollIntoView({ behavior: 'smooth' });
};

window.closeLicenseComposer = function () {
    const composer = document.getElementById('license-composer');
    if (composer) composer.style.display = 'none';
};

document.getElementById('cancel-license-btn').addEventListener('click', closeLicenseComposer);

document.getElementById('send-license-btn').addEventListener('click', async () => {
    const leadId = currentEditingLeadId;
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const licenseLink = document.getElementById('manual-license-link').value.trim();
    const message = document.getElementById('manual-license-message').value.trim();
    const sendBtn = document.getElementById('send-license-btn');

    if (!licenseLink) {
        showToast('Please provide a Gumroad diskcount link.', 'error');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/send-license'
            : '/api/send-license';

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: lead.email,
                name: lead.name,
                tier: lead.tier,
                licenseLink: licenseLink,
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('License email sent successfully!', 'success');
            // If it was paid, automatically mark as verified
            if (lead.status === 'paid') {
                await updateLeadStatus(leadId, 'verified');
            }
            closeLicenseComposer();
        } else {
            throw new Error(data.error || 'Failed to send email.');
        }
    } catch (err) {
        console.error('Send License Error:', err);
        showToast('Error: ' + err.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send License Now';
    }
});

// Follow Up Email Composer Logic
window.openFollowUpComposer = function (leadId) {
    currentEditingLeadId = leadId;
    const composer = document.getElementById('followup-composer');
    const lead = allLeads.find(l => l.id === leadId);

    const productName = lead.tier || 'Easy Workflow Pro';
    const customerName = lead.name || 'Customer';

    const defaultMessage = `Dear ${customerName},\n\nHello, I hope you are doing well.\n\nI am writing to confirm if you requested access to ${productName}.\nPlease let me know so that we can proceed accordingly.\n\nBest regards,\nHarsh Edits`;

    document.getElementById('manual-followup-message').value = defaultMessage;

    composer.style.display = 'block';
    composer.scrollIntoView({ behavior: 'smooth' });
};

window.closeFollowUpComposer = function () {
    const composer = document.getElementById('followup-composer');
    if (composer) composer.style.display = 'none';
};

document.getElementById('cancel-followup-btn').addEventListener('click', closeFollowUpComposer);

document.getElementById('send-followup-btn').addEventListener('click', async () => {
    const leadId = currentEditingLeadId;
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const message = document.getElementById('manual-followup-message').value.trim();
    const sendBtn = document.getElementById('send-followup-btn');

    if (!message) {
        showToast('Message cannot be empty.', 'error');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/send-license'
            : '/api/send-license';

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: lead.email,
                name: lead.name,
                tier: lead.tier,
                message: message,
                isFollowUp: true
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Follow-up email sent successfully!', 'success');
            closeFollowUpComposer();
        } else {
            throw new Error(data.error || 'Failed to send email.');
        }
    } catch (err) {
        console.error('Send Follow-Up Error:', err);
        showToast('Error: ' + err.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Follow-Up';
    }
});

// Close modal
document.getElementById('lead-modal-close').addEventListener('click', closeLeadModal);
document.getElementById('lead-modal').addEventListener('click', (e) => {
    if (e.target.id === 'lead-modal') closeLeadModal();
});

function closeLeadModal() {
    document.getElementById('lead-modal').style.display = 'none';
}

// Update lead status
window.updateLeadStatus = async function (leadId, newStatus) {
    try {
        const leadRef = db.collection('leads').doc(leadId);
        const leadDoc = await leadRef.get();
        const leadData = leadDoc.data();

        // 1. Update the lead status
        await leadRef.update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. If marking as paid/verified, ensure it shows up in the Payments section
        if (newStatus === 'paid' || newStatus === 'verified') {
            // Check if payment already exists to avoid duplicates
            const paymentSnap = await db.collection('payments').where('email', '==', leadData.email).limit(1).get();

            if (paymentSnap.empty) {
                await db.collection('payments').add({
                    paymentId: leadData.paymentId || 'MANUAL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    name: leadData.name || 'Unknown',
                    email: leadData.email || '—',
                    amount: leadData.amount || '₹0',
                    tier: leadData.tier || '—',
                    gateway: leadData.gateway || 'Manual',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    verified: newStatus === 'verified'
                });
                showToast(`Status updated & payment record created!`, 'success');
            } else {
                showToast(`Status updated to "${newStatus}"`, 'success');
            }
        } else {
            showToast(`Status updated to "${newStatus}"`, 'success');
        }

        closeLeadModal();
    } catch (err) {
        console.error('Update Status Error:', err);
        showToast('Failed to update: ' + err.message, 'error');
    }
};

// Delete lead
window.deleteLead = async function (leadId) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
        await db.collection('leads').doc(leadId).delete();
        showToast('Lead deleted.', 'success');
    } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
    }
};

// WhatsApp (Enhanced for Abandoned Carts)
window.openWhatsApp = function (phone, name, status, product) {
    if (!phone || phone === '—') {
        showToast('No phone number available.', 'error');
        return;
    }
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);

    let msg = `Hi ${name || ''}, thank you for your interest in Easy Workflow! `;
    if (status === 'interested') {
        msg = `Hi ${name || ''}, noticed you were trying to grab the ${product || 'Easy Workflow Pro'} but couldn't complete the payment. Did you face any issues with the gateway? Let me know if I can help!`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
};

// Copy email
window.copyLeadEmail = function (email) {
    if (!email || email === '—') return;
    navigator.clipboard.writeText(email).then(() => showToast('Email copied!', 'success'));
};

// Export CSV
document.getElementById('export-leads-btn').addEventListener('click', () => {
    if (allLeads.length === 0) {
        showToast('No leads to export.', 'error');
        return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Product', 'Status', 'Gateway', 'Payment ID', 'Amount', 'Date'];
    const rows = allLeads.map(l => [
        l.name || '',
        l.email || '',
        l.phone || '',
        l.tier || '',
        l.status || '',
        l.gateway || '',
        l.paymentId || '',
        l.amount || '',
        l.timestamp ? formatDate(l.timestamp, true) : ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy-workflow-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
});

// ═══════════════════════════════════════════════════════════════════
// UTILS — Currency & Parsing
// ═══════════════════════════════════════════════════════════════════
function parseAmountToInr(amountStr) {
    if (!amountStr) return 0;
    const isUsd = amountStr.includes('$');
    const numMatch = amountStr.match(/[\d,.]+/);
    if (!numMatch) return 0;

    let value = parseFloat(numMatch[0].replace(/,/g, ''));
    if (isUsd) {
        value = value * USD_TO_INR;
    }
    return value;
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENTS — Real-time Listener 
// ═══════════════════════════════════════════════════════════════════
function listenToPayments() {
    if (unsubPayments) unsubPayments();
    unsubPayments = db.collection('payments')
        .orderBy('timestamp', 'desc')
        .limit(currentPaymentsLimit)
        .onSnapshot(snapshot => {
            allPayments = [];
            snapshot.forEach(doc => {
                allPayments.push({ id: doc.id, ...doc.data() });
            });
            renderPayments();
        }, err => {
            console.error('Payments listener error:', err);
        });
}

function renderPayments(search = '') {
    const tbody = document.getElementById('payments-tbody');
    const emptyState = document.getElementById('payments-empty');
    const searchLower = search.toLowerCase();

    let filtered = allPayments;
    if (search) {
        filtered = allPayments.filter(p => {
            const haystack = `${p.paymentId || ''} ${p.name || ''} ${p.email || ''}`.toLowerCase();
            return haystack.includes(searchLower);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(p => {
        const date = p.timestamp ? formatDate(p.timestamp) : '—';
        const verified = p.verified ? 'verified' : 'paid';

        return `
            <tr>
                <td style="font-family:monospace;font-size:12px;color:var(--accent-cyan);">${escapeHtml(p.paymentId || '—')}</td>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(p.name || 'Unknown')}</span>
                        <span class="customer-email">${escapeHtml(p.email || '—')}</span>
                    </div>
                </td>
                <td>${escapeHtml(p.tier || '—')}</td>
                <td style="color:var(--accent-green);font-weight:600;">${escapeHtml(p.amount || '—')}</td>
                <td><span class="gateway-badge">${escapeHtml(p.gateway || '—')}</span></td>
                <td><span class="status-badge status-${verified}">${verified === 'verified' ? 'Verified' : 'Paid'}</span></td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

document.getElementById('payments-search').addEventListener('input', (e) => {
    renderPayments(e.target.value);
});
document.getElementById('payments-limit-select')?.addEventListener('change', (e) => {
    currentPaymentsLimit = parseInt(e.target.value) || 10;
    listenToPayments();
});

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW — Stats + Recent Activity
// ═══════════════════════════════════════════════════════════════════
function updateOverviewStats() {
    const totalLeads = allLeads.length;
    const paid = allLeads.filter(l => l.status === 'paid' || l.status === 'verified').length;
    const pending = allLeads.filter(l => l.status === 'interested').length;

    // Calculate revenue from paid leads (auto-converting USD to INR)
    let revenue = 0;
    allLeads.forEach(l => {
        if (l.status === 'paid' || l.status === 'verified') {
            revenue += parseAmountToInr(l.amount);
        }
    });

    animateValue('stat-total-leads', totalLeads);
    animateValue('stat-paid', paid);
    animateValue('stat-pending', pending);
    document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString()}`;

    // Update Conversion Rate
    const conversionRate = totalLeads > 0 ? Math.round((paid / totalLeads) * 100) : 0;
    const statPaidEl = document.getElementById('stat-paid');
    if (statPaidEl) statPaidEl.textContent = `${conversionRate}%`;

    // Render Chart.js
    renderAnalyticsChart();
}

function renderAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;

    // Group leads by recent 7 days
    const days = 7;
    const labels = [];
    const revenueData = [];
    const leadsData = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }));

        let dayRevenue = 0;
        let dayLeads = 0;

        allLeads.forEach(l => {
            if (!l.timestamp) return;
            const lDate = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
            if (lDate.getDate() === d.getDate() && lDate.getMonth() === d.getMonth() && lDate.getFullYear() === d.getFullYear()) {
                dayLeads++;
                if (l.status === 'paid' || l.status === 'verified') {
                    dayRevenue += parseAmountToInr(l.amount);
                }
            }
        });

        revenueData.push(dayRevenue);
        leadsData.push(dayLeads);
    }

    if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
    }

    analyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124,58,237,0.1)',
                    yAxisID: 'y',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'New Leads',
                    data: leadsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    yAxisID: 'y1',
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: 'rgba(255,255,255,0.7)' } }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                }
            }
        }
    });
}

function animateValue(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function updateRecentActivity() {
    const container = document.getElementById('recent-activity');
    const recent = allLeads.slice(0, 15); // Last 15

    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No activity yet. Leads will appear here in real-time.</p></div>';
        return;
    }

    container.innerHTML = recent.map(lead => {
        const statusClass = lead.status || 'interested';
        const action = statusClass === 'verified' ? 'Payment verified' :
            statusClass === 'paid' ? 'Payment received' : 'New lead';
        const date = lead.timestamp ? timeAgo(lead.timestamp) : '';

        return `
            <div class="activity-item">
                <span class="activity-dot ${statusClass}"></span>
                <div class="activity-info">
                    <span class="activity-name">${escapeHtml(lead.name || 'Unknown')}</span>
                    <span class="activity-detail">${action} — ${escapeHtml(lead.tier || 'N/A')}</span>
                </div>
                <span class="activity-time">${date}</span>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function formatDate(ts, full = false) {
    let date;
    if (ts && ts.toDate) {
        date = ts.toDate();
    } else if (ts instanceof Date) {
        date = ts;
    } else if (typeof ts === 'string') {
        date = new Date(ts);
    } else {
        return '—';
    }

    if (full) {
        return date.toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    let date;
    if (ts && ts.toDate) date = ts.toDate();
    else if (ts instanceof Date) date = ts;
    else if (typeof ts === 'string') date = new Date(ts);
    else return '';

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(ts);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// SITE SETTINGS (Countdown & Banner)
// ═══════════════════════════════════════════════════════════════════
// loadSettings refactored into startConfigListeners() acima

document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-settings-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const rawDate = document.getElementById('site-deadline-date').value;
    const bannerText = document.getElementById('site-banner-text').value.trim();

    let isoDateStr = '';
    if (rawDate) {
        isoDateStr = new Date(rawDate).toISOString();
    }

    try {
        await db.collection('config').doc('settings').set({
            deadlineDate: isoDateStr,
            bannerText: bannerText,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        showToast('Site settings updated!', 'success');
    } catch (err) {
        showToast('Error saving settings: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Site Settings';
    }
});

// ═══════════════════════════════════════════════════════════════════
// COUPONS / PROMO CODES
// ═══════════════════════════════════════════════════════════════════
function listenToCoupons() {
    unsubCoupons = db.collection('coupons')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allCoupons = [];
            snapshot.forEach(doc => {
                allCoupons.push({ id: doc.id, ...doc.data() });
            });
            renderCoupons();
        }, err => {
            console.error('Coupons listener error:', err);
        });
}

function renderCoupons() {
    const tbody = document.getElementById('coupons-tbody');
    if (allCoupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No promo codes created yet.</td></tr>';
        return;
    }

    tbody.innerHTML = allCoupons.map(coupon => {
        const isActive = coupon.active !== false;
        const statusBadge = isActive ? '<span class="status-badge status-verified">Active</span>' : '<span class="status-badge" style="background:#333;color:#999;border:1px solid #444;">Disabled</span>';

        return `
            <tr style="opacity: ${isActive ? '1' : '0.5'}">
                <td style="font-family:monospace;font-weight:700;font-size:14px;color:var(--text-primary);">${escapeHtml(coupon.id)}</td>
                <td style="color:var(--accent-green);font-weight:700;">${coupon.discountPercent}% OFF</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="Toggle Active" onclick="toggleCoupon('${escapeAttr(coupon.id)}', ${isActive})">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteCoupon('${escapeAttr(coupon.id)}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('create-coupon-btn').addEventListener('click', async () => {
    const codeInput = document.getElementById('new-coupon-code');
    const discountInput = document.getElementById('new-coupon-discount');

    const code = codeInput.value.trim().toUpperCase();
    const discount = parseInt(discountInput.value);

    if (!code || isNaN(discount) || discount < 1 || discount > 100) {
        showToast('Please enter a valid code and a discount between 1-100', 'error');
        return;
    }

    try {
        await db.collection('coupons').doc(code).set({
            discountPercent: discount,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(`Promo code ${code} created!`, 'success');
        codeInput.value = '';
        discountInput.value = '';
    } catch (err) {
        showToast('Error creating code: ' + err.message, 'error');
    }
});

window.toggleCoupon = async function (id, currentActive) {
    try {
        await db.collection('coupons').doc(id).update({ active: !currentActive });
    } catch (err) { showToast('Error toggling code: ' + err.message, 'error'); }
}

window.deleteCoupon = async function (id) {
    if (!confirm(`Delete promo code ${id}?`)) return;
    try {
        await db.collection('coupons').doc(id).delete();
    } catch (err) { showToast('Error deleting code: ' + err.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
// LICENSES — Real-time Listener & Manager
// ═══════════════════════════════════════════════════════════════════
let allLicenses = [];

function listenToLicenses() {
    if (unsubLicenses) unsubLicenses();
    unsubLicenses = db.collection('licenses')
        .orderBy('createdAt', 'desc')
        .limit(currentLicensesLimit)
        .onSnapshot(snapshot => {
            allLicenses = [];
            snapshot.forEach(doc => {
                allLicenses.push({ id: doc.id, ...doc.data() });
            });
            applyLicenseFilters();
        }, err => {
            console.error('Licenses listener error:', err);
        });
}

function renderLicenses(filterStatus = 'all', filterTier = 'all', search = '') {
    const tbody = document.getElementById('licenses-tbody');
    const emptyState = document.getElementById('licenses-empty');
    if (!tbody) return;

    const searchLower = search.toLowerCase();

    let filtered = allLicenses.filter(license => {
        if (filterStatus !== 'all' && license.status !== filterStatus) return false;
        if (filterTier !== 'all' && license.tier !== filterTier) return false;
        if (search) {
            const haystack = `${license.email || ''} ${license.licenseKey || ''} ${license.tier || ''}`.toLowerCase();
            if (!haystack.includes(searchLower)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(license => {
        const statusClass = license.status === 'active' ? 'paid' : (license.status === 'blocked' ? 'delete' : 'interested');
        const statusLabel = (license.status || 'unknown').toUpperCase();
        const date = license.createdAt ? formatDate(license.createdAt) : '—';

        const machines = license.machineIds || (license.machineId ? [license.machineId] : []);
        const machineDisplay = machines.length > 0
            ? `<div class="machine-list">${machines.map(id => `
                <div class="machine-tag">
                    <span>${escapeHtml(id)}</span>
                    <button onclick="logoutMachine('${license.id}', '${escapeAttr(id)}')" title="Logout Machine">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                </div>
            `).join('')}</div>`
            : '<span style="color:var(--text-muted);">Unbound</span>';

        return `
            <tr>
                <td><span style="font-family:monospace;font-weight:bold;color:#f59e0b;">${escapeHtml(license.licenseKey || '—')}</span></td>
                <td>${escapeHtml(license.email || '—')}</td>
                <td>${escapeHtml(license.tier || '—')}</td>
                <td>${machineDisplay}</td>
                <td><span class="status-badge status-${statusClass}" style="background:${license.status === 'blocked' ? '#ef4444' : ''}">${statusLabel}</span></td>
                <td>${date}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="${license.status === 'blocked' ? 'Unblock License' : 'Block License'}" onclick="toggleLicenseStatus('${license.id}', '${license.status}')" style="color:${license.status === 'blocked' ? '#22c55e' : '#ef4444'}">
                            <i class="fa-solid ${license.status === 'blocked' ? 'fa-unlock' : 'fa-lock'}"></i>
                        </button>
                        <button class="table-btn delete" title="Revoke & Delete" onclick="deleteLicense('${license.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.logoutMachine = async function (licenseId, machineId) {
    if (!confirm(`Are you sure you want to remotely deactivate machine [${machineId}]?`)) return;

    try {
        const licenseRef = db.collection('licenses').doc(licenseId);
        const doc = await licenseRef.get();
        if (doc.exists) {
            const data = doc.data();
            let machines = data.machineIds || (data.machineId ? [data.machineId] : []);

            // Filter out the specific machine
            machines = machines.filter(id => id.toUpperCase() !== machineId.toUpperCase());

            await licenseRef.update({
                machineIds: machines,
                machineId: firebase.firestore.FieldValue.delete() // Clean legacy field
            });

            // Support Easy Workflow: Delete from Realtime DB to trigger startup logout!
            if (data.email) {
                const safeEmail = data.email.toLowerCase().replace(/[@.]/g, '_');
                fetch("https://easy-workflow-pro-default-rtdb.firebaseio.com/users/" + safeEmail + "/" + machineId + ".json", {
                    method: "DELETE"
                }).catch(e => console.error("RTDB cleanup error:", e));
            }

            showToast(`Machine ${machineId} deactivated!`, 'success');
        }
    } catch (err) {
        showToast('Error deactivating machine: ' + err.message, 'error');
    }
}


document.getElementById('licenses-search')?.addEventListener('input', applyLicenseFilters);
document.getElementById('licenses-status-filter')?.addEventListener('change', applyLicenseFilters);
document.getElementById('licenses-tier-filter')?.addEventListener('change', applyLicenseFilters);
document.getElementById('licenses-limit-select')?.addEventListener('change', (e) => {
    currentLicensesLimit = parseInt(e.target.value) || 10;
    listenToLicenses();
});

function applyLicenseFilters() {
    const search = document.getElementById('licenses-search').value;
    const status = document.getElementById('licenses-status-filter').value;
    const tier = document.getElementById('licenses-tier-filter')?.value || 'all';
    renderLicenses(status, tier, search);
}

window.toggleLicenseStatus = async function (id, currentStatus) {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} this license?`)) return;
    try {
        await db.collection('licenses').doc(id).update({ status: newStatus });
        showToast(`License marked as ${newStatus}`, 'success');
    } catch (err) {
        showToast('Error updating license: ' + err.message, 'error');
    }
}

window.deleteLicense = async function (id) {
    if (!confirm(`WARNING: This will permanently revoke and delete the license. The user will lose access immediately. Proceed?`)) return;
    try {
        await db.collection('licenses').doc(id).delete();
        showToast('License successfully revoked & deleted.', 'success');
    } catch (err) {
        showToast('Error deleting license: ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOM LINKS SYSTEM
// ═══════════════════════════════════════════════════════════════════
let allCustomLinks = [];
let unsubCustomLinks = null;

// UI setup for custom links
function setupCustomLinksUI() {
    const clProdAll = document.getElementById('cl-prod-all');
    const clProdItems = document.querySelectorAll('.cl-prod-item');
    if (clProdAll) {
        clProdAll.addEventListener('change', (e) => {
            const checked = e.target.checked;
            clProdItems.forEach(item => {
                item.disabled = checked;
                if (checked) item.checked = false;
            });
        });
    }

    const modeDiscountBtn = document.getElementById('cl-mode-discount');
    const modeFixedBtn = document.getElementById('cl-mode-fixed');
    const discountFields = document.getElementById('cl-discount-fields');
    const fixedFields = document.getElementById('cl-fixed-fields');

    if (modeDiscountBtn && modeFixedBtn) {
        modeDiscountBtn.addEventListener('click', () => {
            window.selectedPricingMode = 'discount';
            modeDiscountBtn.classList.add('active');
            modeFixedBtn.classList.remove('active');
            if (discountFields) discountFields.style.display = 'block';
            if (fixedFields) fixedFields.style.display = 'none';
        });
        modeFixedBtn.addEventListener('click', () => {
            window.selectedPricingMode = 'fixed';
            modeFixedBtn.classList.add('active');
            modeDiscountBtn.classList.remove('active');
            if (discountFields) discountFields.style.display = 'none';
            if (fixedFields) fixedFields.style.display = 'block';
        });
    }

    const discountSlider = document.getElementById('cl-discount-slider');
    const discountValue = document.getElementById('cl-discount-value');
    if (discountSlider && discountValue) {
        discountSlider.addEventListener('input', (e) => {
            discountValue.textContent = e.target.value + '%';
        });
    }

    const clCodeInput = document.getElementById('cl-code');
    const clCodePreview = document.getElementById('cl-code-preview');
    if (clCodeInput && clCodePreview) {
        clCodeInput.addEventListener('input', (e) => {
            const val = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            clCodeInput.value = val;
            clCodePreview.textContent = val || 'CODE';
        });
    }
}

// Initial UI execution
setupCustomLinksUI();
window.selectedPricingMode = 'discount';

window.listenToCustomLinks = function () {
    if (unsubCustomLinks) unsubCustomLinks();
    unsubCustomLinks = db.collection('custom_links')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            allCustomLinks = [];
            snapshot.forEach(doc => {
                allCustomLinks.push({ id: doc.id, ...doc.data() });
            });
            renderCustomLinks();
            updateCustomLinksStats();
        }, err => {
            console.error('Custom links listener error:', err);
        });
};

function renderCustomLinks() {
    const tbody = document.getElementById('cl-tbody');
    const emptyState = document.getElementById('cl-empty');
    if (!tbody) return;

    if (allCustomLinks.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = allCustomLinks.map(link => {
        const isActive = link.active !== false;
        const productsList = link.products && link.products.length > 0
            ? link.products.map(p => `<span class="cl-prod-badge">${p}</span>`).join('')
            : '<span class="cl-prod-badge" style="background:rgba(124,58,237,0.1);color:var(--accent-purple);">All</span>';

        let pricingDisplay = '';
        if (link.pricingMode === 'fixed') {
            const prices = [];
            if (link.fixedPrices) {
                for (const [prod, price] of Object.entries(link.fixedPrices)) {
                    if (prod.endsWith('_inr') && price) {
                        const baseProd = prod.replace('_inr', '');
                        const usdPrice = link.fixedPrices[`${baseProd}_usd`] || 0;
                        prices.push(`${baseProd.toUpperCase()}: ₹${price} / $${usdPrice}`);
                    }
                }
            }
            pricingDisplay = `<div style="font-size:11px;line-height:1.4;">${prices.join('<br>')}</div>`;
        } else {
            pricingDisplay = `<span style="color:var(--accent-green);font-weight:700;">${link.discountPercent}% OFF</span>`;
        }

        const maxRed = link.maxRedemptions || 0;
        const currRed = link.currentRedemptions || 0;
        const redemptionsDisplay = `
            <div class="cl-redemptions">
                <span class="current">${currRed}</span>
                <span class="max">/ ${maxRed > 0 ? maxRed : '∞'}</span>
            </div>
        `;

        const revINR = link.totalSalesINR || 0;
        const revUSD = link.totalSalesUSD || 0;
        const revenueDisplay = `
            <div style="font-size:12px;font-weight:600;">
                <div>₹${revINR.toLocaleString()}</div>
                <div style="color:var(--text-muted);font-size:10px;">$${revUSD.toLocaleString()}</div>
            </div>
        `;

        const statusBadge = isActive
            ? '<span class="status-badge status-verified">Active</span>'
            : '<span class="status-badge" style="background:#333;color:#999;border:1px solid #444;">Disabled</span>';

        const noteDisplay = link.note
            ? `<div class="cl-note-text" title="${escapeAttr(link.note)}">${escapeHtml(link.note)}</div>`
            : '<span style="color:var(--text-muted);font-style:italic;">—</span>';

        return `
            <tr style="opacity: ${isActive ? '1' : '0.5'}">
                <td class="cl-code-cell">${escapeHtml(link.id)}</td>
                <td>
                    <div class="cl-products-badges">${productsList}</div>
                    ${noteDisplay}
                </td>
                <td>${pricingDisplay}</td>
                <td>${redemptionsDisplay}</td>
                <td>${revenueDisplay}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="cl-copy-btn" onclick="copyCustomLinkUrl('${escapeAttr(link.id)}')">
                            <i class="fa-solid fa-copy"></i> Copy
                        </button>
                        <button class="table-btn" title="Edit Link" onclick="openEditCustomLink('${escapeAttr(link.id)}')" style="color:var(--accent-purple);">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="table-btn" title="Toggle Active" onclick="toggleCustomLink('${escapeAttr(link.id)}', ${isActive})">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteCustomLink('${escapeAttr(link.id)}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update count badge
    const badge = document.getElementById('customlinks-count-badge');
    if (badge) {
        badge.textContent = allCustomLinks.length;
    }
}

function updateCustomLinksStats() {
    let activeCount = 0;
    let totalRedemptions = 0;
    let totalRevenueINR = 0;
    let totalRevenueUSD = 0;
    let totalDiscountSum = 0;
    let discountLinkCount = 0;

    allCustomLinks.forEach(link => {
        if (link.active !== false) {
            activeCount++;
        }
        totalRedemptions += (link.currentRedemptions || 0);
        totalRevenueINR += (link.totalSalesINR || 0);
        totalRevenueUSD += (link.totalSalesUSD || 0);

        if (link.pricingMode !== 'fixed') {
            totalDiscountSum += (link.discountPercent || 0);
            discountLinkCount++;
        }
    });

    const avgDiscount = discountLinkCount > 0 ? Math.round(totalDiscountSum / discountLinkCount) : 0;

    const activeEl = document.getElementById('cl-stat-active');
    const redemptionsEl = document.getElementById('cl-stat-redemptions');
    const revenueEl = document.getElementById('cl-stat-revenue');
    const avgDiscountEl = document.getElementById('cl-stat-avg-discount');

    if (activeEl) activeEl.textContent = activeCount;
    if (redemptionsEl) redemptionsEl.textContent = totalRedemptions;
    if (avgDiscountEl) avgDiscountEl.textContent = `${avgDiscount}%`;

    const totalRevInrCombined = totalRevenueINR + (totalRevenueUSD * USD_TO_INR);
    if (revenueEl) revenueEl.textContent = `₹${Math.round(totalRevInrCombined).toLocaleString()}`;
}

// Create custom link handler
document.getElementById('cl-create-btn')?.addEventListener('click', async () => {
    const codeInput = document.getElementById('cl-code');
    const noteInput = document.getElementById('cl-note');
    const maxRedemptionsInput = document.getElementById('cl-max-redemptions');
    const expiryInput = document.getElementById('cl-expiry');

    const code = codeInput.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const note = noteInput.value.trim();
    const maxRedemptions = parseInt(maxRedemptionsInput.value) || 0;
    const expiryDateStr = expiryInput.value;

    if (!code) {
        showToast('Please enter a valid link code', 'error');
        return;
    }

    const products = [];
    const isAllProducts = document.getElementById('cl-prod-all').checked;
    if (!isAllProducts) {
        document.querySelectorAll('.cl-prod-item:checked').forEach(item => {
            products.push(item.value);
        });
        if (products.length === 0) {
            showToast('Please select at least one product or check "All Products"', 'error');
            return;
        }
    }

    const linkData = {
        active: true,
        pricingMode: window.selectedPricingMode || 'discount',
        products: products,
        maxRedemptions: maxRedemptions,
        currentRedemptions: 0,
        totalSalesINR: 0,
        totalSalesUSD: 0,
        note: note,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiryDateStr ? new Date(expiryDateStr) : null
    };

    if (window.selectedPricingMode === 'discount') {
        const slider = document.getElementById('cl-discount-slider');
        linkData.discountPercent = parseInt(slider.value) || 50;
        linkData.fixedPrices = {};
    } else {
        linkData.discountPercent = 0;
        linkData.fixedPrices = {
            pro_inr: parseInt(document.getElementById('cl-fp-pro-inr').value) || 0,
            pro_usd: parseInt(document.getElementById('cl-fp-pro-usd').value) || 0,
            autocaptions_inr: parseInt(document.getElementById('cl-fp-autocaptions-inr').value) || 0,
            autocaptions_usd: parseInt(document.getElementById('cl-fp-autocaptions-usd').value) || 0,
            projectmanager_inr: parseInt(document.getElementById('cl-fp-projectmanager-inr').value) || 0,
            projectmanager_usd: parseInt(document.getElementById('cl-fp-projectmanager-usd').value) || 0,
            basic_inr: parseInt(document.getElementById('cl-fp-basic-inr').value) || 0,
            basic_usd: parseInt(document.getElementById('cl-fp-basic-usd').value) || 0,
        };
    }

    const btn = document.getElementById('cl-create-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

    try {
        // Check if code already exists
        const docRef = db.collection('custom_links').doc(code);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            throw new Error(`Custom link with code "${code}" already exists!`);
        }

        await docRef.set(linkData);
        showToast(`Custom link /?ref=${code} created successfully!`, 'success');

        // Reset form
        codeInput.value = '';
        noteInput.value = '';
        maxRedemptionsInput.value = '0';
        expiryInput.value = '';
        document.getElementById('cl-code-preview').textContent = 'CODE';
        document.getElementById('cl-prod-all').checked = true;
        document.getElementById('cl-prod-all').dispatchEvent(new Event('change'));

        // Reset prices
        document.getElementById('cl-fp-pro-inr').value = '';
        document.getElementById('cl-fp-pro-usd').value = '';
        document.getElementById('cl-fp-autocaptions-inr').value = '';
        document.getElementById('cl-fp-autocaptions-usd').value = '';
        document.getElementById('cl-fp-projectmanager-inr').value = '';
        document.getElementById('cl-fp-projectmanager-usd').value = '';
        document.getElementById('cl-fp-basic-inr').value = '';
        document.getElementById('cl-fp-basic-usd').value = '';
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-link"></i> Create Custom Link';
    }
});

window.toggleCustomLink = async function (id, currentActive) {
    try {
        await db.collection('custom_links').doc(id).update({ active: !currentActive });
        showToast(`Link ${id} ${currentActive ? 'disabled' : 'enabled'}`, 'success');
    } catch (err) {
        showToast('Error toggling link: ' + err.message, 'error');
    }
};

window.deleteCustomLink = async function (id) {
    if (!confirm(`Delete custom link ${id}?`)) return;
    try {
        await db.collection('custom_links').doc(id).delete();
        showToast(`Link ${id} deleted`, 'success');
    } catch (err) {
        showToast('Error deleting link: ' + err.message, 'error');
    }
};

window.copyCustomLinkUrl = function (code) {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link URL copied!', 'success');
    }).catch(err => {
        showToast('Error copying link', 'error');
    });
};

// ═══════════════════════════════════════════════════════════════════
// EDIT CUSTOM LINK — Modal Logic
// ═══════════════════════════════════════════════════════════════════
let editingLinkId = null;
let editPricingMode = 'discount';

// Setup edit modal UI interactions
(function setupEditModalUI() {
    const modal = document.getElementById('cl-edit-modal');
    const closeBtn = document.getElementById('cl-edit-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Pricing mode toggle for edit modal
    const editModeDiscount = document.getElementById('cl-edit-mode-discount');
    const editModeFixed = document.getElementById('cl-edit-mode-fixed');
    const editDiscountFields = document.getElementById('cl-edit-discount-fields');
    const editFixedFields = document.getElementById('cl-edit-fixed-fields');

    if (editModeDiscount && editModeFixed) {
        editModeDiscount.addEventListener('click', () => {
            editPricingMode = 'discount';
            editModeDiscount.classList.add('active');
            editModeFixed.classList.remove('active');
            if (editDiscountFields) editDiscountFields.style.display = 'block';
            if (editFixedFields) editFixedFields.style.display = 'none';
        });
        editModeFixed.addEventListener('click', () => {
            editPricingMode = 'fixed';
            editModeFixed.classList.add('active');
            editModeDiscount.classList.remove('active');
            if (editDiscountFields) editDiscountFields.style.display = 'none';
            if (editFixedFields) editFixedFields.style.display = 'block';
        });
    }

    // Discount slider value display
    const editSlider = document.getElementById('cl-edit-discount-slider');
    const editSliderVal = document.getElementById('cl-edit-discount-value');
    if (editSlider && editSliderVal) {
        editSlider.addEventListener('input', (e) => {
            editSliderVal.textContent = e.target.value + '%';
        });
    }

    // "All Products" toggle logic for edit modal
    const editProdAll = document.getElementById('cl-edit-prod-all');
    const editProdItems = document.querySelectorAll('.cl-edit-prod-item');
    if (editProdAll) {
        editProdAll.addEventListener('change', (e) => {
            const checked = e.target.checked;
            editProdItems.forEach(item => {
                item.disabled = checked;
                if (checked) item.checked = false;
            });
        });
    }

    // Save button
    const saveBtn = document.getElementById('cl-edit-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEditCustomLink);
    }
})();

window.openEditCustomLink = function (linkId) {
    const link = allCustomLinks.find(l => l.id === linkId);
    if (!link) {
        showToast('Link not found', 'error');
        return;
    }

    editingLinkId = linkId;

    // Fill code (read-only)
    document.getElementById('cl-edit-code').value = linkId;

    // Fill products
    const prodAll = document.getElementById('cl-edit-prod-all');
    const prodItems = document.querySelectorAll('.cl-edit-prod-item');
    const hasProducts = link.products && link.products.length > 0;

    prodAll.checked = !hasProducts;
    prodItems.forEach(item => {
        item.disabled = !hasProducts;
        item.checked = hasProducts && link.products.includes(item.value);
    });

    // Fill pricing mode
    editPricingMode = link.pricingMode || 'discount';
    const editModeDiscount = document.getElementById('cl-edit-mode-discount');
    const editModeFixed = document.getElementById('cl-edit-mode-fixed');
    const editDiscountFields = document.getElementById('cl-edit-discount-fields');
    const editFixedFields = document.getElementById('cl-edit-fixed-fields');

    if (editPricingMode === 'fixed') {
        editModeFixed.classList.add('active');
        editModeDiscount.classList.remove('active');
        editDiscountFields.style.display = 'none';
        editFixedFields.style.display = 'block';
    } else {
        editModeDiscount.classList.add('active');
        editModeFixed.classList.remove('active');
        editDiscountFields.style.display = 'block';
        editFixedFields.style.display = 'none';
    }

    // Fill discount slider
    const slider = document.getElementById('cl-edit-discount-slider');
    const sliderVal = document.getElementById('cl-edit-discount-value');
    slider.value = link.discountPercent || 50;
    sliderVal.textContent = (link.discountPercent || 50) + '%';

    // Fill fixed prices
    const fp = link.fixedPrices || {};
    document.getElementById('cl-edit-fp-pro-inr').value = fp.pro_inr || '';
    document.getElementById('cl-edit-fp-pro-usd').value = fp.pro_usd || '';
    document.getElementById('cl-edit-fp-autocaptions-inr').value = fp.autocaptions_inr || '';
    document.getElementById('cl-edit-fp-autocaptions-usd').value = fp.autocaptions_usd || '';
    document.getElementById('cl-edit-fp-projectmanager-inr').value = fp.projectmanager_inr || '';
    document.getElementById('cl-edit-fp-projectmanager-usd').value = fp.projectmanager_usd || '';
    document.getElementById('cl-edit-fp-basic-inr').value = fp.basic_inr || '';
    document.getElementById('cl-edit-fp-basic-usd').value = fp.basic_usd || '';

    // Fill max redemptions
    document.getElementById('cl-edit-max-redemptions').value = link.maxRedemptions || 0;

    // Fill expiry
    const expiryInput = document.getElementById('cl-edit-expiry');
    if (link.expiresAt) {
        // Convert Firestore timestamp to datetime-local format
        let expiryDate;
        if (link.expiresAt.toDate) {
            expiryDate = link.expiresAt.toDate();
        } else if (link.expiresAt.seconds) {
            expiryDate = new Date(link.expiresAt.seconds * 1000);
        } else {
            expiryDate = new Date(link.expiresAt);
        }
        // Format as YYYY-MM-DDTHH:MM
        const pad = n => n.toString().padStart(2, '0');
        expiryInput.value = `${expiryDate.getFullYear()}-${pad(expiryDate.getMonth() + 1)}-${pad(expiryDate.getDate())}T${pad(expiryDate.getHours())}:${pad(expiryDate.getMinutes())}`;
    } else {
        expiryInput.value = '';
    }

    // Fill note
    document.getElementById('cl-edit-note').value = link.note || '';

    // Update modal title
    document.getElementById('cl-edit-modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square" style="margin-right:8px;color:var(--accent-purple);"></i> Edit: ${linkId}`;

    // Show modal
    document.getElementById('cl-edit-modal').style.display = 'flex';
};

async function saveEditCustomLink() {
    if (!editingLinkId) return;

    const btn = document.getElementById('cl-edit-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        // Gather products
        const products = [];
        const isAllProducts = document.getElementById('cl-edit-prod-all').checked;
        if (!isAllProducts) {
            document.querySelectorAll('.cl-edit-prod-item:checked').forEach(item => {
                products.push(item.value);
            });
        }

        // Build update object
        const updateData = {
            pricingMode: editPricingMode,
            products: products,
            maxRedemptions: parseInt(document.getElementById('cl-edit-max-redemptions').value) || 0,
            note: document.getElementById('cl-edit-note').value.trim()
        };

        // Expiry
        const expiryStr = document.getElementById('cl-edit-expiry').value;
        updateData.expiresAt = expiryStr ? new Date(expiryStr) : null;

        // Pricing
        if (editPricingMode === 'discount') {
            updateData.discountPercent = parseInt(document.getElementById('cl-edit-discount-slider').value) || 50;
            updateData.fixedPrices = {};
        } else {
            updateData.discountPercent = 0;
            updateData.fixedPrices = {
                pro_inr: parseInt(document.getElementById('cl-edit-fp-pro-inr').value) || 0,
                pro_usd: parseInt(document.getElementById('cl-edit-fp-pro-usd').value) || 0,
                autocaptions_inr: parseInt(document.getElementById('cl-edit-fp-autocaptions-inr').value) || 0,
                autocaptions_usd: parseInt(document.getElementById('cl-edit-fp-autocaptions-usd').value) || 0,
                projectmanager_inr: parseInt(document.getElementById('cl-edit-fp-projectmanager-inr').value) || 0,
                projectmanager_usd: parseInt(document.getElementById('cl-edit-fp-projectmanager-usd').value) || 0,
                basic_inr: parseInt(document.getElementById('cl-edit-fp-basic-inr').value) || 0,
                basic_usd: parseInt(document.getElementById('cl-edit-fp-basic-usd').value) || 0,
            };
        }

        await db.collection('custom_links').doc(editingLinkId).update(updateData);
        showToast(`Custom link ${editingLinkId} updated successfully!`, 'success');

        // Close modal
        document.getElementById('cl-edit-modal').style.display = 'none';
        editingLinkId = null;

    } catch (err) {
        showToast('Error saving changes: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
    }
}


/*
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  FIRESTORE SECURITY RULES                                        │
 * │                                                                   │
 * │  Copy this to Firebase Console → Firestore → Rules:              │
 * │                                                                   │
 * │  rules_version = '2';                                             │
 * │  service cloud.firestore {                                        │
 * │    match /databases/{database}/documents {                        │
 * │                                                                   │
 * │      // Config & Pricing — Anyone can read. Only admin can write. │
 * │      match /config/{doc} {                                        │
 * │        allow read: if true;                                       │
 * │        allow write: if request.auth != null;                      │
 * │      }                                                            │
 * │                                                                   │
 * │      // Coupons — Anyone can read to validate. Only admin writes. │
 * │      match /coupons/{code} {                                      │
 * │        allow read: if true;                                       │
 * │        allow write: if request.auth != null;                      │
 * │      }                                                            │
 * │                                                                   │
 * │      // Leads & Payments — Anyone can create on success. Admin manages. │
 * │      match /leads/{lead} {                                        │
 * │        allow create: if true;                                     │
 * │        allow read, update, delete: if request.auth != null;       │
 * │      }                                                            │
 * │      match /payments/{payment} {                                  │
 * │        allow create: if true;                                     │
 * │        allow read, update, delete: if request.auth != null;       │
 * │      }                                                            │
 * │                                                                   │
 * │      // 🔑 LICENSES — Secure Setup                                │
 * │      match /licenses/{licenseKey} {                               │
 * │        // Allows the Extension to "get" a specific key to verify it.│
 * │        // But prevents anyone from "listing" (seeing all) keys.   │
 * │        allow get: if true;                                        │
 * │        allow list, create, update, delete: if request.auth != null;│
 * │      }                                                            │
 * │                                                                   │
 * │      match /license_by_email/{email} {                            │
 * │        allow read: if true;                                       │
 * │        allow write: if request.auth != null;                      │
 * │      }                                                            │
 * │    }                                                              │
 * │  }                                                                │
 * │                                                                   │
 * └──────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// GENERATE MANUAL LICENSE
// ═══════════════════════════════════════════════════════════════════
const mlBtn = document.getElementById('generate-manual-license-btn');
const mlModal = document.getElementById('manual-license-modal');
const mlClose = document.getElementById('manual-license-close');
const mlSubmit = document.getElementById('ml-submit-btn');

if (mlBtn && mlModal) {
    mlBtn.addEventListener('click', () => {
        document.getElementById('ml-email').value = '';
        document.getElementById('ml-name').value = '';
        document.getElementById('ml-message').value = '';
        mlModal.style.display = 'flex';
    });

    mlClose.addEventListener('click', () => {
        mlModal.style.display = 'none';
    });

    mlModal.addEventListener('click', (e) => {
        if (e.target === mlModal) mlModal.style.display = 'none';
    });

    mlSubmit.addEventListener('click', async () => {
        const email = document.getElementById('ml-email').value.trim();
        const name = document.getElementById('ml-name').value.trim();
        const tier = document.getElementById('ml-tier').value;
        const message = document.getElementById('ml-message').value.trim();

        if (!email) {
            showToast('Email is required', 'error');
            return;
        }

        mlSubmit.disabled = true;
        mlSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        try {
            // 1. Generate 16-digit key
            function generateKey() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let res = '';
                for (let i = 0; i < 16; i++) {
                    res += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                // Add dashes (e.g. ABCD-1234-EFGH-5678)
                return res.match(/.{1,4}/g).join('-');
            }
            const newKey = generateKey();
            const cleanEmail = email.toLowerCase().trim();

            // 2. Save to /licenses/
            await db.collection('licenses').doc(newKey).set({
                licenseKey: newKey,
                email: cleanEmail,
                tier: tier,
                paymentId: 'manual_admin_gen',
                status: 'active',
                deviceFingerprint: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 3. Save to /license_by_email/
            await db.collection('license_by_email').doc(cleanEmail).set({
                licenseKeys: firebase.firestore.FieldValue.arrayUnion(newKey),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 4. Send Email via Backend
            const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/send-license'
                : '/api/send-license';

            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cleanEmail,
                    name: name || 'Creator',
                    tier: tier,
                    licenseKey: newKey,
                    message: message
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast('License generated and emailed successfully!', 'success');
                mlModal.style.display = 'none';
            } else {
                throw new Error(data.error || 'Email failed to send');
            }

        } catch (err) {
            console.error(err);
            showToast('Error generating license: ' + err.message, 'error');
        } finally {
            mlSubmit.disabled = false;
            mlSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Generate & Send Key';
        }
    });
}
