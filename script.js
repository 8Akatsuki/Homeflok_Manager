/* ==========================================================================
   HOMEFOLK MANAGER — Application Logic
   Vanilla JS, localStorage-backed, offline-first.
   ========================================================================== */

/* ---------------------------- UTILITIES ---------------------------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const ICON_EDIT = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_DELETE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>';
const ICON_TAG = '<svg class="pt-icon" viewBox="0 0 40 24"><polygon points="14,2 38,2 38,22 14,22 2,12" fill="var(--surface)" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="10.5" cy="12" r="1.8" fill="currentColor"/></svg>';

const formatINR = (n) => {
  n = Number(n) || 0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateShort = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const isSameDay = (iso, targetISO) => (iso || '').slice(0, 10) === targetISO;

const isSameMonth = (iso, refISO) => (iso || '').slice(0, 7) === (refISO || todayISO()).slice(0, 7);

const daysAgo = (iso) => {
  const then = new Date((iso || '').slice(0, 10));
  const now = new Date(todayISO());
  return Math.round((now - then) / 86400000);
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// Compress an uploaded image file to a small base64 JPEG for localStorage
function compressImage(file, maxSize = 480, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; }
        else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------- BRAND ASSET (embedded, deploy-proof) ---------------------------- */
const LOGO_URI = 'data:image/jpeg;base64,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';

/* ---------------------------- DATABASE ---------------------------- */
const DB_KEY = 'homefolk_db_v1';

function defaultDB() {
  return {
    products: [],
    sales: [],
    cashTx: [],       // {id,date,type:'in'|'out',category,description,amount,source,refId}
    expenses: [],      // {id,date,category,customLabel,description,amount,paymentMethod}
    payments: [],       // {id,customerName,phone,amount,dueDate,status:'pending'|'paid',note,saleId,createdAt}
    stockMoves: [],      // {id,date,productId,productName,type:'in'|'out'|'return',qty,note}
    manualInvestment: null   // number override for Total Investment, or null to use the automatic inventory-based figure
  };
}

let DB = loadDB();

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultDB(), parsed);
  } catch (e) {
    console.error('Failed to load DB, starting fresh', e);
    return defaultDB();
  }
}

function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  } catch (e) {
    console.error('Save failed', e);
    showToast('Storage full — try removing old photos');
  }
  pushToCloud();
}

function saveDBLocalOnly() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) { /* ignore */ }
}

/* ---------------------------- CLOUD SYNC (Supabase) ---------------------------- */
const SUPABASE_URL = 'https://njazxnkquxeldbxpvyeg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qYXp4bmtxdXhlbGRieHB2eWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjM4NTQsImV4cCI6MjA5OTA5OTg1NH0.2N2iZFgzfBDpOpn_uLqMdBFV3rnhNuVN6rcAqEgPZPk';
// Shared "room" both devices write to. Keep this the same string on every device that should sync together.
const ROOM_CODE = 'homefolk-joseph-thrift-main';

let sb = null;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase client failed to initialise — app will run offline-only.', e);
}

const DEVICE_ID = (() => {
  let id = localStorage.getItem('homefolk_device_id');
  if (!id) { id = uid() + uid(); localStorage.setItem('homefolk_device_id', id); }
  return id;
})();

let syncStatus = sb ? 'connecting' : 'unavailable'; // connecting | synced | offline | unavailable

function setSyncStatus(status) {
  syncStatus = status;
  const dot = document.getElementById('sync-dot');
  const label = document.getElementById('sync-label');
  if (!dot || !label) return;
  dot.className = 'sync-dot' + (status === 'offline' ? ' offline' : status === 'connecting' ? ' connecting' : '');
  label.textContent = { synced: 'Synced', connecting: 'Connecting…', offline: 'Offline', unavailable: 'Local only' }[status] || 'Synced';
}
let pushTimer = null;

function pushToCloud() {
  if (!sb) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const payload = Object.assign({}, DB, { _syncMeta: { deviceId: DEVICE_ID, ts: Date.now() } });
      const { error } = await sb.from('homefolk_sync').upsert({
        room_code: ROOM_CODE, data: payload, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setSyncStatus('synced');
      localStorage.setItem('homefolk_last_sync_at', new Date().toISOString());
    } catch (e) {
      console.warn('Cloud push failed', e);
      setSyncStatus('offline');
    }
    if (currentView === 'settings') refreshView();
  }, 600);
}

// Union-merge by id across every collection — safe by construction: it can
// only ever add records back in, never silently drop ones that exist locally.
// (Trade-off: a deliberate delete on one device can be "resurrected" if the
// other device still has it locally and hasn't synced that delete yet.)
function mergeDB(local, remote) {
  const merged = defaultDB();
  const collections = ['products', 'sales', 'expenses', 'cashTx', 'payments', 'stockMoves'];
  collections.forEach((key) => {
    const map = new Map();
    (remote[key] || []).forEach((item) => { if (item && item.id) map.set(item.id, item); });
    (local[key] || []).forEach((item) => { if (item && item.id) map.set(item.id, item); }); // local wins on same-id conflicts
    merged[key] = Array.from(map.values());
  });
  merged.manualInvestment = (local.manualInvestment !== null && local.manualInvestment !== undefined)
    ? local.manualInvestment
    : (remote.manualInvestment !== null && remote.manualInvestment !== undefined ? remote.manualInvestment : null);
  return merged;
}

function dbRecordCount(db) {
  return (db.products || []).length + (db.sales || []).length + (db.expenses || []).length + (db.cashTx || []).length;
}

async function pullFromCloud() {
  if (!sb) return;
  try {
    const { data, error } = await sb.from('homefolk_sync').select('data, updated_at').eq('room_code', ROOM_CODE).maybeSingle();
    if (error) throw error;
    if (data && data.data) {
      const remote = data.data;
      const localHasData = dbRecordCount(DB) > 0;
      const remoteHasData = dbRecordCount(remote) > 0;
      if (!localHasData) {
        // this device is empty (fresh install/reinstall) — safe to fully adopt the cloud copy
        DB = Object.assign(defaultDB(), remote);
      } else if (!remoteHasData) {
        // cloud is behind/empty — keep what's on this device and push it up
        pushToCloud();
      } else {
        // both sides have records — merge instead of picking a winner, then reconcile the cloud
        DB = mergeDB(DB, remote);
        pushToCloud();
      }
      saveDBLocalOnly();
      localStorage.setItem('homefolk_last_sync_at', new Date().toISOString());
    } else {
      // No shared record yet on this room — seed the cloud with whatever is on this device
      pushToCloud();
    }
    setSyncStatus('synced');
  } catch (e) {
    console.warn('Cloud pull failed — continuing with local data only.', e);
    setSyncStatus('offline');
  }
}

function subscribeRealtime() {
  if (!sb) return;
  sb.channel('homefolk-sync-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'homefolk_sync', filter: `room_code=eq.${ROOM_CODE}` }, (payload) => {
      const incoming = payload.new && payload.new.data;
      if (!incoming) return;
      if (incoming._syncMeta && incoming._syncMeta.deviceId === DEVICE_ID) return; // our own change echoing back
      DB = mergeDB(DB, incoming);
      saveDBLocalOnly();
      localStorage.setItem('homefolk_last_sync_at', new Date().toISOString());
      setSyncStatus('synced');
      if (isAuthed()) {
        refreshView();
        showToast('Updated by your teammate');
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { setSyncStatus('synced'); }
    });
}

if (sb) subscribeRealtime();
setSyncStatus(syncStatus);

/* ---------------------------- CATEGORY / CONST LISTS ---------------------------- */
const CATEGORIES = ['Saree','Kurti','Tops','Shirts','Jeans','Dresses','Jackets','Traditional Wear','Western Wear','Accessories','Others'];
const CONDITIONS = ['New','Excellent','Good','Used'];
const PAYMENT_METHODS = ['Cash','Bank Transfer','Online Payment','Pending'];
const EXPENSE_CATEGORIES = ['Stock Purchase','Packaging','Delivery','Marketing','Transport','Other'];

/* ---------------------------- CORE HELPERS ---------------------------- */
function getProduct(id) { return DB.products.find(p => p.id === id); }

function addCashTx({ date, type, category, description, amount, source, refId }) {
  DB.cashTx.push({ id: uid(), date: date || todayISO(), type, category, description, amount: Number(amount) || 0, source: source || 'manual', refId: refId || null });
}

function addStockMove({ date, productId, productName, type, qty, note }) {
  DB.stockMoves.push({ id: uid(), date: date || todayISO(), productId, productName, type, qty, note: note || '' });
}

function cashBalance() {
  return getTotalInvestment() + totalSalesAmount() - totalExpenses() - pendingFromSalesTotal();
}

function totalInventoryValue() {
  return DB.products.reduce((sum, p) => sum + (p.qty > 0 ? p.boughtPrice * p.qty : 0), 0);
}

function totalStockQty() {
  return DB.products.reduce((sum, p) => sum + Math.max(p.qty, 0), 0);
}

function totalSalesAmount() {
  return DB.sales.reduce((sum, s) => sum + s.totalAmount, 0);
}

function totalProfit() {
  return DB.sales.reduce((sum, s) => sum + s.profit, 0);
}

function totalExpenses() {
  return DB.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function totalInvestment() {
  return DB.products.reduce((sum, p) => sum + (p.investment || 0), 0);
}

function getTotalInvestment() {
  return (DB.manualInvestment !== null && DB.manualInvestment !== undefined) ? DB.manualInvestment : totalInvestment();
}

function salesOn(dateISO) { return DB.sales.filter(s => isSameDay(s.date, dateISO)); }

function pendingPaymentsTotal() {
  return DB.payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
}

// Only payments tied to an actual recorded sale should be subtracted from cash
// balance — that portion of totalSalesAmount() hasn't been received yet.
// Pending amounts added manually (not linked to a sale) were never counted in
// totalSalesAmount() in the first place, so they're excluded from this figure.
function pendingFromSalesTotal() {
  return DB.payments.filter(p => p.status === 'pending' && p.saleId).reduce((s, p) => s + p.amount, 0);
}

/* ---------------------------- ROUTER ---------------------------- */
const VIEW_ROOT = document.getElementById('view-root');
let currentView = 'home';

const VIEW_RENDERERS = {}; // populated below per view

function navigate(view, opts = {}) {
  const { fromBack = false, skipPush = false } = opts;

  if (!fromBack && currentView && currentView !== view) {
    viewHistoryStack.push(currentView);
  }

  currentView = view;
  closeMoreSheet();
  const isCoreNav = ['home','closet','inventory','sales'].includes(view);
  document.querySelectorAll('.pill-nav .nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const moreBtn = document.getElementById('more-btn');
  if (moreBtn) moreBtn.classList.toggle('active', !isCoreNav);
  positionPillIndicator(view);
  const renderer = VIEW_RENDERERS[view];
  VIEW_ROOT.innerHTML = renderer ? renderer() : '<div class="empty-state">Not found</div>';
  VIEW_ROOT.scrollTop = 0;
  window.scrollTo(0, 0);
  attachViewHandlers(view);

  // remember where we are so a real browser refresh resumes here, not the cover screen
  localStorage.setItem(LAST_VIEW_KEY, view);

  // keep the back button in sync with whether there's anywhere to go back to
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.classList.toggle('hidden', viewHistoryStack.length === 0);

  if (!skipPush) {
    history.pushState({ view }, '', '#' + view);
  }
}

function positionPillIndicator(view) {
  const indicator = document.getElementById('pill-indicator');
  const nav = document.querySelector('.pill-nav');
  if (!indicator || !nav) return;
  const coreViews = ['home', 'closet', 'inventory', 'sales'];
  const targetSelector = coreViews.includes(view) ? `.nav-btn[data-view="${view}"]` : '#more-btn';
  const btn = nav.querySelector(targetSelector);
  if (!btn) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  indicator.style.left = (btnRect.left - navRect.left + (btnRect.width - indicator.offsetWidth) / 2) + 'px';
}
window.addEventListener('resize', () => positionPillIndicator(currentView));

function refreshView() { navigate(currentView); }

function openMoreSheet() { document.getElementById('more-sheet').classList.remove('hidden'); }
function closeMoreSheet() { document.getElementById('more-sheet').classList.add('hidden'); }

document.getElementById('more-btn').addEventListener('click', openMoreSheet);
document.getElementById('more-sheet').addEventListener('click', (e) => {
  if (e.target.id === 'more-sheet') closeMoreSheet();
  const item = e.target.closest('.sheet-item');
  if (item) navigate(item.dataset.view);
});
document.querySelectorAll('.pill-nav .nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

/* ---------------------------- MODAL HELPERS ---------------------------- */
function openModal(innerHtml, { center = false } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay ${center ? 'center' : ''}" id="active-modal-overlay">
      <div class="modal-sheet">${innerHtml}</div>
    </div>`;
  root.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'active-modal-overlay') closeModal();
  });
}
function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

/* ============================================================
   HOME / DASHBOARD
   ============================================================ */
VIEW_RENDERERS.home = function renderHome() {
  const today = todayISO();
  const todaySales = salesOn(today);
  const todayRevenue = todaySales.reduce((s, x) => s + x.totalAmount, 0);
  const todayProfit = todaySales.reduce((s, x) => s + x.profit, 0);
  const todayItems = todaySales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0);
  const todayExpense = DB.expenses.filter(e => isSameDay(e.date, today)).reduce((s, e) => s + e.amount, 0);

  // recent sales (last 4)
  const recentSales = [...DB.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  // low stock: qty <= 1 and > 0 treated as low (one-of-a-kind model, so "low" = last piece)
  const lowStock = DB.products.filter(p => p.qty > 0 && p.qty <= 1).slice(0, 5);

  // monthly profit overview (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('en-IN', { month: 'short' });
    const profit = DB.sales.filter(s => (s.date || '').slice(0, 7) === key).reduce((sum, s) => sum + s.profit, 0);
    months.push({ label, profit });
  }
  const maxAbs = Math.max(1, ...months.map(m => Math.abs(m.profit)));

  // simple 7-point sparkline of the last 7 days' revenue for the hero card
  const sparkDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    sparkDays.push(DB.sales.filter(s => s.date === key).reduce((sum, s) => sum + s.totalAmount, 0));
  }
  const sparkMax = Math.max(1, ...sparkDays);
  const sparkPoints = sparkDays.map((v, i) => `${(i / 6 * 200).toFixed(1)},${(40 - (v / sparkMax * 34)).toFixed(1)}`).join(' ');

  return `
    <p class="view-eyebrow">· Timeless Finds ·</p>
    <h1 class="view-title">Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</h1>
    <div class="sprig"></div>

    <div class="bento section-block">
      <div class="bento-hero swing-once">
        <div class="bento-hero-tag">Today</div>
        <div class="bento-hero-row">
          <div>
            <div class="hero-label">Revenue</div>
            <div class="hero-value">${formatINR(todayRevenue)}</div>
          </div>
          <div>
            <div class="hero-label">Profit</div>
            <div class="hero-value accent">${formatINR(todayProfit)}</div>
          </div>
          <div>
            <div class="hero-label">Items Sold</div>
            <div class="hero-value">${todayItems}</div>
          </div>
        </div>
        <svg viewBox="0 0 200 44" preserveAspectRatio="none" style="width:100%;height:36px;margin-top:14px;color:#C9D6A8;opacity:0.85;">
          <polyline points="${sparkPoints}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="bento-tile">
        <div class="stat-label">Inventory Value</div>
        <div class="stat-value">${formatINR(totalInventoryValue())}</div>
        <div class="list-value small" style="text-align:left;margin-top:2px;">${DB.products.length} pieces</div>
      </div>
      <div class="bento-tile">
        <div class="stat-label">Cash Balance</div>
        <div class="stat-value">${formatINR(cashBalance())}</div>
        <div class="list-value small" style="text-align:left;margin-top:2px;">investment + sales − expenses</div>
      </div>
      <div class="bento-tile">
        <div class="stat-label">Total Stock Qty</div>
        <div class="stat-value">${totalStockQty()}</div>
      </div>
      <div class="bento-tile">
        <div class="stat-label">Total Profit</div>
        <div class="stat-value positive">${formatINR(totalProfit())}</div>
      </div>

      <div class="bento-tile wide">
        <div class="section-header-row" style="margin-bottom:10px;">
          <span class="stat-label mb-0">Monthly Profit</span>
        </div>
        <div class="bar-chart" style="height:88px;">
          ${months.map((m, i) => `
            <div class="bar-col">
              <div class="bar-val">${m.profit >= 1000 ? Math.round(m.profit/1000) + 'k' : m.profit}</div>
              <div class="bar ${m.profit < 0 ? 'neg' : ''} ${i === months.length - 1 ? 'active' : ''}" style="height:${Math.max(6, Math.abs(m.profit) / maxAbs * 60)}px"></div>
              <div class="bar-label">${m.label}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="section-block">
      <div class="section-header-row"><p class="view-eyebrow mb-0">Recent Sales</p><button class="link-btn" data-nav="sales">View all</button></div>
      <div class="card">
        ${recentSales.length ? recentSales.map(s => `
          <div class="list-row">
            <div class="list-thumb placeholder">₹</div>
            <div class="list-main">
              <div class="list-title">${escapeHtml(s.customerName || 'Walk-in customer')}</div>
              <div class="list-sub">${s.items.length} item(s) · ${formatDateShort(s.date)}</div>
            </div>
            <div class="list-value">${formatINR(s.totalAmount)}</div>
          </div>`).join('') : `<p class="field-hint">No sales recorded yet.</p>`}
      </div>
    </div>

    <div class="section-block">
      <div class="section-header-row"><p class="view-eyebrow mb-0">Low Stock — Last Piece</p>${lowStock.length ? `<span class="tag tag-rust">${lowStock.length}</span>` : ''}</div>
      <div class="card">
        ${lowStock.length ? lowStock.map(p => `
          <div class="list-row">
            ${p.image ? `<img class="list-thumb" src="${p.image}">` : `<div class="list-thumb placeholder">✧</div>`}
            <div class="list-main">
              <div class="list-title">${escapeHtml(p.name)}</div>
              <div class="list-sub">${escapeHtml(p.category)}</div>
            </div>
            <span class="tag tag-rust">${p.qty} left</span>
          </div>`).join('') : `<p class="field-hint">Nothing running low right now.</p>`}
      </div>
    </div>

  `;
};

/* ============================================================
   INVENTORY MANAGEMENT
   ============================================================ */
let invFilterCategory = 'All';
let invSearchTerm = '';
let invSort = 'newest';

VIEW_RENDERERS.inventory = function renderInventory() {
  let list = [...DB.products];
  if (invFilterCategory !== 'All') list = list.filter(p => p.category === invFilterCategory);
  if (invSearchTerm) {
    const q = invSearchTerm.toLowerCase();
    list = list.filter(p => (p.name + ' ' + p.brand + ' ' + p.color).toLowerCase().includes(q));
  }
  if (invSort === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (invSort === 'price-high') list.sort((a, b) => b.sellPrice - a.sellPrice);
  if (invSort === 'price-low') list.sort((a, b) => a.sellPrice - b.sellPrice);
  if (invSort === 'qty') list.sort((a, b) => b.qty - a.qty);

  return `
    <p class="view-eyebrow">· Inventory ·</p>
    <h1 class="view-title">Clothing Inventory</h1>
    <div class="sprig"></div>

    <div class="search-bar">
      <span class="icon">⌕</span>
      <input id="inv-search" placeholder="Search by name, brand, colour..." value="${escapeHtml(invSearchTerm)}">
    </div>

    <div class="filter-row">
      ${['All', ...CATEGORIES].map(c => `<button class="chip inv-cat-chip ${invFilterCategory === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
    </div>

    <div class="field-row" style="margin-bottom:16px;">
      <div class="field mb-0" style="flex:1;">
        <select id="inv-sort">
          <option value="newest" ${invSort==='newest'?'selected':''}>Newest first</option>
          <option value="price-high" ${invSort==='price-high'?'selected':''}>Price: high to low</option>
          <option value="price-low" ${invSort==='price-low'?'selected':''}>Price: low to high</option>
          <option value="qty" ${invSort==='qty'?'selected':''}>Quantity</option>
        </select>
      </div>
      <button class="btn btn-olive" id="inv-add-btn">+ Add Product</button>
    </div>

    ${list.length ? list.map(p => `
      <div class="card list-row ${p.qty <= 0 ? 'sold-out-row' : ''}" data-open-product="${p.id}" style="cursor:pointer;">
        ${p.image ? `<img class="list-thumb" src="${p.image}">` : `<div class="list-thumb placeholder">✧</div>`}
        <div class="list-main">
          <div class="list-title">${escapeHtml(p.name)}</div>
          <div class="list-sub">${escapeHtml(p.category)} · ${escapeHtml(p.size || '—')} · ${p.qty > 0 ? p.qty + ' in stock' : 'Sold out'}</div>
        </div>
        <div class="price-tag-chip ${p.qty <= 0 ? 'muted' : ''}">${ICON_TAG}<span>${formatINR(p.sellPrice)}</span></div>
        ${p.qty > 0
          ? `<button class="inv-edit-btn" data-edit-product="${p.id}" aria-label="Edit">${ICON_EDIT}</button>`
          : `<button class="inv-edit-btn inv-delete-btn" data-delete-product="${p.id}" aria-label="Delete">${ICON_DELETE}</button>`}
      </div>
    `).join('') : `
      <div class="empty-state">
        <span class="icon">✧</span>
        <div class="title">No pieces yet</div>
        <div class="sub">Add your first thrifted find to start building your inventory.</div>
      </div>
    `}
    <div style="height:70px"></div>
    <button class="fab" id="inv-fab">+</button>
  `;
};

function productFormModal(existing) {
  const p = existing || { id: null, image: '', name: '', category: CATEGORIES[0], brand: '', size: '', color: '', material: '', condition: 'Good', qty: 1, purchaseDate: todayISO(), source: '', boughtPrice: '', sellPrice: '' };
  openModal(`
    <div class="modal-header">
      <span class="modal-title">${existing ? 'Edit Product' : 'Add Product'}</span>
      <button class="modal-close" data-close>✕</button>
    </div>
    <form id="product-form">
      <div class="field">
        <label>Photo</label>
        <div class="img-upload" id="product-img-upload">
          ${p.image ? `<img src="${p.image}">` : `<div class="placeholder"><span class="icon">📷</span>Tap to add photo</div>`}
        </div>
        <input type="file" accept="image/*" id="product-img-input" style="display:none">
      </div>
      <div class="field">
        <label>Dress Name</label>
        <input type="text" id="p-name" value="${escapeHtml(p.name)}" placeholder="e.g. Rust Floral Wrap Dress" required>
      </div>
      <div class="field">
        <label>Category</label>
        <select id="p-category">${CATEGORIES.map(c => `<option ${c===p.category?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="field-row">
        <div class="field"><label>Brand</label><input type="text" id="p-brand" value="${escapeHtml(p.brand)}"></div>
        <div class="field"><label>Size</label><input type="text" id="p-size" value="${escapeHtml(p.size)}" placeholder="M / 32 / Free"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Colour</label><input type="text" id="p-color" value="${escapeHtml(p.color)}"></div>
        <div class="field"><label>Material</label><input type="text" id="p-material" value="${escapeHtml(p.material)}"></div>
      </div>
      <div class="field">
        <label>Condition</label>
        <div class="chip-group" id="p-condition-group">
          ${CONDITIONS.map(c => `<button type="button" class="chip cond-chip ${c===p.condition?'active':''}" data-val="${c}">${c}</button>`).join('')}
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Quantity</label><input type="number" id="p-qty" min="0" value="${p.qty}"></div>
        <div class="field"><label>Purchase Date</label><input type="date" id="p-date" value="${p.purchaseDate}"></div>
      </div>
      <div class="field"><label>Supplier / Source</label><input type="text" id="p-source" value="${escapeHtml(p.source)}" placeholder="e.g. Karol Bagh thrift lot"></div>
      <div class="field-row">
        <div class="field"><label>Bought Price (₹)</label><input type="number" id="p-bought" min="0" value="${p.boughtPrice}" required></div>
        <div class="field"><label>Selling Price (₹)</label><input type="number" id="p-sell" min="0" value="${p.sellPrice}" required></div>
      </div>
      <p class="field-hint" id="p-profit-preview"></p>
      <div class="modal-footer">
        ${existing ? `<button type="button" class="btn btn-danger" id="p-delete">Delete</button>` : ''}
        <button type="submit" class="btn btn-primary btn-block">${existing ? 'Save Changes' : 'Add Product'}</button>
      </div>
    </form>
  `);

  let selectedCondition = p.condition;
  let imageData = p.image;

  const form = document.getElementById('product-form');
  document.querySelector('[data-close]').addEventListener('click', closeModal);

  document.getElementById('product-img-upload').addEventListener('click', () => document.getElementById('product-img-input').click());
  document.getElementById('product-img-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    imageData = await compressImage(file);
    document.getElementById('product-img-upload').innerHTML = `<img src="${imageData}">`;
  });

  document.querySelectorAll('.cond-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedCondition = chip.dataset.val;
      document.querySelectorAll('.cond-chip').forEach(c => c.classList.toggle('active', c === chip));
    });
  });

  function updateProfitPreview() {
    const bought = Number(document.getElementById('p-bought').value) || 0;
    const sell = Number(document.getElementById('p-sell').value) || 0;
    const qty = Number(document.getElementById('p-qty').value) || 0;
    const profit = sell - bought;
    document.getElementById('p-profit-preview').textContent =
      `Profit per item: ${formatINR(profit)} · Total expected profit: ${formatINR(profit * qty)} · Inventory value: ${formatINR(bought * qty)}`;
  }
  ['p-bought', 'p-sell', 'p-qty'].forEach(id => document.getElementById(id).addEventListener('input', updateProfitPreview));
  updateProfitPreview();

  if (existing) {
    document.getElementById('p-delete').addEventListener('click', () => {
      if (confirm('Delete this product? This cannot be undone.')) {
        DB.products = DB.products.filter(x => x.id !== existing.id);
        saveDB();
        closeModal();
        refreshView();
        showToast('Product deleted');
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const boughtPrice = Number(document.getElementById('p-bought').value) || 0;
    const sellPrice = Number(document.getElementById('p-sell').value) || 0;
    const qty = Number(document.getElementById('p-qty').value) || 0;
    if (!name) { showToast('Please enter a dress name'); return; }

    if (existing) {
      Object.assign(existing, {
        name, image: imageData,
        category: document.getElementById('p-category').value,
        brand: document.getElementById('p-brand').value.trim(),
        size: document.getElementById('p-size').value.trim(),
        color: document.getElementById('p-color').value.trim(),
        material: document.getElementById('p-material').value.trim(),
        condition: selectedCondition,
        qty, purchaseDate: document.getElementById('p-date').value || todayISO(),
        source: document.getElementById('p-source').value.trim(),
        boughtPrice, sellPrice,
        investment: boughtPrice * qty
      });
      showToast('Product updated');
    } else {
      const newProduct = {
        id: uid(), image: imageData, name,
        category: document.getElementById('p-category').value,
        brand: document.getElementById('p-brand').value.trim(),
        size: document.getElementById('p-size').value.trim(),
        color: document.getElementById('p-color').value.trim(),
        material: document.getElementById('p-material').value.trim(),
        condition: selectedCondition,
        qty, purchaseDate: document.getElementById('p-date').value || todayISO(),
        source: document.getElementById('p-source').value.trim(),
        boughtPrice, sellPrice,
        investment: boughtPrice * qty,
        createdAt: new Date().toISOString()
      };
      DB.products.push(newProduct);
      addStockMove({ productId: newProduct.id, productName: newProduct.name, type: 'in', qty, note: 'Added to inventory' });
      showToast('Product added');
    }
    saveDB();
    closeModal();
    refreshView();
  });
}

function deleteProductWithConfirm(p) {
  if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
    DB.products = DB.products.filter(x => x.id !== p.id);
    saveDB();
    closeModal();
    refreshView();
    showToast('Product deleted');
  }
}

function productDetailModal(p) {
  const salesHistory = DB.sales.filter(s => s.items.some(i => i.productId === p.id));
  const soldOut = p.qty <= 0;
  openModal(`
    <div class="modal-header">
      <span class="modal-title">${escapeHtml(p.name)}</span>
      <button class="modal-close" data-close>✕</button>
    </div>
    ${p.image ? `<img src="${p.image}" style="width:100%;border-radius:14px;aspect-ratio:1;object-fit:cover;margin-bottom:14px;">` : ''}
    <div class="chip-group" style="margin-bottom:14px;">
      <span class="tag tag-neutral">${escapeHtml(p.category)}</span>
      <span class="tag tag-neutral">${escapeHtml(p.size || 'Free size')}</span>
      <span class="tag tag-gold">${escapeHtml(p.condition)}</span>
      <span class="tag ${p.qty > 0 ? 'tag-olive' : 'tag-rust'}">${p.qty > 0 ? p.qty + ' in stock' : 'Sold out'}</span>
    </div>
    <div class="stat-grid section-block">
      <div class="stat-card"><div class="stat-label">Selling Price</div><div class="stat-value">${formatINR(p.sellPrice)}</div></div>
      <div class="stat-card"><div class="stat-label">Purchase Cost</div><div class="stat-value">${formatINR(p.boughtPrice)}</div></div>
      <div class="stat-card"><div class="stat-label">Profit / item</div><div class="stat-value positive">${formatINR(p.sellPrice - p.boughtPrice)}</div></div>
      <div class="stat-card"><div class="stat-label">Brand</div><div class="stat-value" style="font-size:14px">${escapeHtml(p.brand || '—')}</div></div>
    </div>
    <p class="field-hint" style="margin-bottom:14px;">Colour: ${escapeHtml(p.color || '—')} · Material: ${escapeHtml(p.material || '—')} · Source: ${escapeHtml(p.source || '—')} · Purchased ${formatDate(p.purchaseDate)}</p>
    <p class="view-eyebrow">Sales History</p>
    <div class="card section-block">
      ${salesHistory.length ? salesHistory.map(s => `
        <div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(s.customerName || 'Walk-in customer')}</div><div class="list-sub">${formatDate(s.date)}</div></div><div class="list-value">${formatINR(s.items.find(i=>i.productId===p.id).unitPrice)}</div></div>
      `).join('') : `<p class="field-hint">Not sold yet.</p>`}
    </div>
    <div class="modal-footer">
      ${soldOut
        ? `<button class="btn btn-danger btn-block" id="detail-delete-btn">Delete Product</button>`
        : `<button class="btn btn-outline btn-block" id="detail-edit-btn">Edit Product</button>`}
    </div>
  `, { center: true });
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  if (soldOut) {
    document.getElementById('detail-delete-btn').addEventListener('click', () => deleteProductWithConfirm(p));
  } else {
    document.getElementById('detail-edit-btn').addEventListener('click', () => { closeModal(); productFormModal(p); });
  }
}

/* ============================================================
   CLOSET VIEW (visual gallery)
   ============================================================ */
let closetFilterCategory = 'All';

VIEW_RENDERERS.closet = function renderCloset() {
  let list = DB.products.filter(p => p.qty > 0);
  if (closetFilterCategory !== 'All') list = list.filter(p => p.category === closetFilterCategory);
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return `
    <p class="view-eyebrow">· The Closet ·</p>
    <h1 class="view-title">Browse the Collection</h1>
    <div class="sprig"></div>

    <div class="filter-row">
      ${['All', ...CATEGORIES].map(c => `<button class="chip closet-cat-chip ${closetFilterCategory === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
    </div>

    ${list.length ? `<div class="closet-grid">
      ${list.map(p => `
        <div class="closet-card" data-open-product="${p.id}">
          ${p.image ? `<img class="closet-img" src="${p.image}">` : `<div class="closet-img placeholder">✧</div>`}
          <div class="closet-tag-corner">
            <svg viewBox="0 0 40 24"><polygon points="14,2 38,2 38,22 14,22 2,12" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10.5" cy="12" r="1.8" fill="var(--surface)"/></svg>
            <span>${formatINR(p.sellPrice)}</span>
          </div>
          <div class="closet-body">
            <div class="closet-name">${escapeHtml(p.name)}</div>
            <div class="closet-meta">${p.qty} available · ${escapeHtml(p.category)}</div>
          </div>
        </div>
      `).join('')}
    </div>` : `
      <div class="empty-state">
        <span class="icon">✧</span>
        <div class="title">The closet is empty</div>
        <div class="sub">Pieces you add to Inventory will appear here like a little shop window.</div>
      </div>
    `}
    <div style="height:20px"></div>
  `;
};

/* ============================================================
   SALES MANAGEMENT (cart-based, single or multi-item)
   ============================================================ */
VIEW_RENDERERS.sales = function renderSales() {
  const list = [...DB.sales].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return `
    <p class="view-eyebrow">· Sales ·</p>
    <h1 class="view-title">Record &amp; Review Sales</h1>
    <div class="sprig"></div>

    <button class="btn btn-olive btn-block" id="new-sale-btn" style="margin-bottom:18px;">+ Record New Sale</button>

    ${list.length ? list.map(s => `
      <div class="card list-row" data-open-sale="${s.id}" style="cursor:pointer;">
        <div class="list-thumb placeholder">₹</div>
        <div class="list-main">
          <div class="list-title">${escapeHtml(s.customerName || 'Walk-in customer')}</div>
          <div class="list-sub">${s.items.length} item(s) · ${escapeHtml(s.paymentMethod)} · ${formatDateShort(s.date)}</div>
        </div>
        <div>
          <div class="list-value">${formatINR(s.totalAmount)}</div>
          <div class="list-value small">profit ${formatINR(s.profit)}</div>
        </div>
      </div>
    `).join('') : `
      <div class="empty-state">
        <span class="icon">₹</span>
        <div class="title">No sales yet</div>
        <div class="sub">Record your first sale to start tracking revenue and profit.</div>
      </div>
    `}
    <div style="height:20px"></div>
  `;
};

function saleDetailModal(s) {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Sale Receipt</span>
      <button class="modal-close" data-close>✕</button>
    </div>
    <p class="field-hint">${formatDate(s.date)} · ${escapeHtml(s.paymentMethod)}</p>
    <p style="font-weight:500;margin:10px 0 2px;">${escapeHtml(s.customerName || 'Walk-in customer')}</p>
    <p class="field-hint" style="margin-bottom:14px;">${escapeHtml(s.customerPhone || '')}</p>
    <div class="card">
      ${s.items.map(i => `
        <div class="list-row">
          <div class="list-main"><div class="list-title">${escapeHtml(i.name)}</div><div class="list-sub">Qty ${i.qty} × ${formatINR(i.unitPrice)}</div></div>
          <div class="list-value">${formatINR(i.qty * i.unitPrice)}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
    <div class="list-row"><div class="list-main">Discount</div><div class="list-value">− ${formatINR(s.discountTotal)}</div></div>
    <div class="list-row"><div class="list-main" style="font-weight:600;">Total Received</div><div class="list-value">${formatINR(s.totalAmount)}</div></div>
    <div class="list-row"><div class="list-main">Profit</div><div class="list-value positive">${formatINR(s.profit)}</div></div>
    <div class="modal-footer">
      <button class="btn btn-outline btn-block" onclick="window.print()">Print Receipt</button>
    </div>
  `, { center: true });
  document.querySelector('[data-close]').addEventListener('click', closeModal);
}

function newSaleModal() {
  let cart = []; // {productId, name, unitPrice, qty, maxQty}
  let discount = 0;

  function availableProducts() { return DB.products.filter(p => p.qty > 0); }

  function cartHtml() {
    if (!cart.length) return `<p class="field-hint">No items added yet. Search and add products below.</p>`;
    return cart.map((c, idx) => `
      <div class="cart-row">
        <div class="list-main">
          <div class="list-title">${escapeHtml(c.name)}</div>
          <div class="list-sub">${formatINR(c.unitPrice)} each</div>
        </div>
        <div class="qty-stepper">
          <button type="button" class="cart-qty-minus" data-idx="${idx}">−</button>
          <span>${c.qty}</span>
          <button type="button" class="cart-qty-plus" data-idx="${idx}">+</button>
        </div>
        <div class="list-value" style="min-width:64px;">${formatINR(c.unitPrice * c.qty)}</div>
        <button type="button" class="cart-remove" data-idx="${idx}" style="background:none;border:none;color:var(--rust);font-size:16px;cursor:pointer;">✕</button>
      </div>
    `).join('');
  }

  function totals() {
    const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.qty, 0);
    const cost = cart.reduce((s, c) => s + (getProduct(c.productId)?.boughtPrice || 0) * c.qty, 0);
    const total = Math.max(0, subtotal - discount);
    const profit = total - cost;
    return { subtotal, total, profit };
  }

  function render() {
    const t = totals();
    openModal(`
      <div class="modal-header">
        <span class="modal-title">Record New Sale</span>
        <button class="modal-close" data-close>✕</button>
      </div>
      <form id="sale-form">
        <div class="field">
          <label>Add Product</label>
          <select id="sale-product-select">
            <option value="">Select a piece to add...</option>
            ${availableProducts().map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${formatINR(p.sellPrice)} (${p.qty} left)</option>`).join('')}
          </select>
        </div>
        <p class="view-eyebrow">Cart</p>
        <div class="card" id="cart-list" style="margin-bottom:16px;">${cartHtml()}</div>

        <div class="field-row">
          <div class="field"><label>Customer Name</label><input type="text" id="s-customer" placeholder="Optional"></div>
          <div class="field"><label>Phone</label><input type="text" id="s-phone" placeholder="Optional"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Discount (₹)</label><input type="number" id="s-discount" min="0" value="${discount}"></div>
          <div class="field">
            <label>Payment Method</label>
            <select id="s-payment">${PAYMENT_METHODS.map(m => `<option>${m}</option>`).join('')}</select>
          </div>
        </div>
        <div class="field"><label>Date</label><input type="date" id="s-date" value="${todayISO()}"></div>

        <div class="divider"></div>
        <div class="list-row"><div class="list-main">Subtotal</div><div class="list-value">${formatINR(t.subtotal)}</div></div>
        <div class="list-row"><div class="list-main">Final Amount</div><div class="list-value" style="font-weight:700;">${formatINR(t.total)}</div></div>
        <div class="list-row"><div class="list-main">Expected Profit</div><div class="list-value positive">${formatINR(t.profit)}</div></div>

        <div class="modal-footer">
          <button type="submit" class="btn btn-primary btn-block">Complete Sale</button>
        </div>
      </form>
    `);
    wireUp();
  }

  function wireUp() {
    document.querySelector('[data-close]').addEventListener('click', closeModal);

    function persistFormThenRender() {
      const custEl = document.getElementById('s-customer');
      if (custEl) savedFields = { customer: custEl.value, phone: document.getElementById('s-phone').value, payment: document.getElementById('s-payment').value, date: document.getElementById('s-date').value };
      render();
      if (savedFields) {
        document.getElementById('s-customer').value = savedFields.customer;
        document.getElementById('s-phone').value = savedFields.phone;
        document.getElementById('s-payment').value = savedFields.payment;
        document.getElementById('s-date').value = savedFields.date;
      }
    }

    document.getElementById('sale-product-select').addEventListener('change', (e) => {
      const pid = e.target.value;
      if (!pid) return;
      const p = getProduct(pid);
      const existing = cart.find(c => c.productId === pid);
      if (existing) {
        if (existing.qty < p.qty) existing.qty++;
      } else {
        cart.push({ productId: p.id, name: p.name, unitPrice: p.sellPrice, qty: 1, maxQty: p.qty });
      }
      discount = Number(document.getElementById('s-discount').value) || discount;
      persistFormThenRender();
    });

    document.querySelectorAll('.cart-qty-plus').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const item = cart[idx];
      if (item.qty < item.maxQty) item.qty++;
      persistFormThenRender();
    }));
    document.querySelectorAll('.cart-qty-minus').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      cart[idx].qty--;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      persistFormThenRender();
    }));
    document.querySelectorAll('.cart-remove').forEach(btn => btn.addEventListener('click', () => {
      cart.splice(Number(btn.dataset.idx), 1);
      persistFormThenRender();
    }));
    document.getElementById('s-discount').addEventListener('input', (e) => {
      discount = Number(e.target.value) || 0;
      render();
    });

    document.getElementById('sale-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cart.length) { showToast('Add at least one item to the cart'); return; }
      const t = totals();
      const customerName = document.getElementById('s-customer').value.trim();
      const customerPhone = document.getElementById('s-phone').value.trim();
      const paymentMethod = document.getElementById('s-payment').value;
      const date = document.getElementById('s-date').value || todayISO();

      const sale = {
        id: uid(), date, customerName, customerPhone,
        items: cart.map(c => ({ productId: c.productId, name: c.name, qty: c.qty, unitPrice: c.unitPrice })),
        paymentMethod, discountTotal: discount, totalAmount: t.total, profit: t.profit
      };
      DB.sales.push(sale);

      cart.forEach(c => {
        const p = getProduct(c.productId);
        if (p) {
          p.qty -= c.qty;
          addStockMove({ productId: p.id, productName: p.name, type: 'out', qty: c.qty, note: 'Sold' });
        }
      });

      if (paymentMethod === 'Pending') {
        DB.payments.push({ id: uid(), customerName: customerName || 'Walk-in customer', phone: customerPhone, amount: t.total, dueDate: '', status: 'pending', note: 'From sale', saleId: sale.id, createdAt: new Date().toISOString() });
      } else {
        addCashTx({ date, type: 'in', category: 'Sale', description: `Sale to ${customerName || 'walk-in customer'}`, amount: t.total, source: 'sale', refId: sale.id });
      }

      saveDB();
      closeModal();
      refreshView();
      showToast('Sale recorded');
    });
  }

  let savedFields = null;
  render();
}

/* ============================================================
   CASH FLOW MANAGEMENT
   ============================================================ */
let cashDateFilter = 'all'; // all | month | today

VIEW_RENDERERS.cashflow = function renderCashflow() {
  let list = [...DB.cashTx];
  const today = todayISO();
  if (cashDateFilter === 'today') list = list.filter(t => isSameDay(t.date, today));
  if (cashDateFilter === 'month') list = list.filter(t => isSameMonth(t.date, today));
  list.sort((a, b) => b.date.localeCompare(a.date));

  const cashIn = list.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const cashOut = list.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);

  const invested = getTotalInvestment();
  const salesTotal = totalSalesAmount();
  const expensesTotal = totalExpenses();
  const pendingTotal = pendingFromSalesTotal();

  return `
    <p class="view-eyebrow">· Finances ·</p>
    <h1 class="view-title">Cash Flow</h1>
    <div class="sprig"></div>

    <div class="card section-block">
      <div class="list-row"><div class="list-main">Total Investment</div><div class="list-value">${formatINR(invested)}</div></div>
      <div class="list-row"><div class="list-main">+ Total Sales</div><div class="list-value positive">${formatINR(salesTotal)}</div></div>
      <div class="list-row"><div class="list-main">− Total Expenses</div><div class="list-value negative">${formatINR(expensesTotal)}</div></div>
      ${pendingTotal > 0 ? `<div class="list-row"><div class="list-main">− Pending From Sales</div><div class="list-value negative">${formatINR(pendingTotal)}</div></div>` : ''}
      <div class="list-row" style="border-top:1px solid var(--border-soft);margin-top:4px;padding-top:12px;"><div class="list-main" style="font-weight:600;">Cash Balance</div><div class="list-value" style="font-weight:700;font-size:16px;">${formatINR(cashBalance())}</div></div>
    </div>

    <div class="stat-grid section-block">
      <div class="stat-card"><div class="stat-label">Cash In ${cashDateFilter !== 'all' ? '(selected period)' : ''}</div><div class="stat-value positive">${formatINR(cashIn)}</div></div>
      <div class="stat-card"><div class="stat-label">Cash Out ${cashDateFilter !== 'all' ? '(selected period)' : ''}</div><div class="stat-value negative">${formatINR(cashOut)}</div></div>
    </div>

    <p class="field-hint section-block">The ledger below is a record of individual transactions — it no longer determines your Cash Balance above, which is now calculated from Investment, Sales and Expenses instead.</p>

    <div class="tab-bar">
      <button data-filter="all" class="${cashDateFilter==='all'?'active':''}">All Time</button>
      <button data-filter="month" class="${cashDateFilter==='month'?'active':''}">This Month</button>
      <button data-filter="today" class="${cashDateFilter==='today'?'active':''}">Today</button>
    </div>

    <div class="field-row" style="margin-bottom:16px;">
      <button class="btn btn-olive" id="cash-add-in" style="flex:1;">+ Add Income</button>
      <button class="btn btn-danger" id="cash-add-out" style="flex:1;">+ Add Expense</button>
    </div>

    ${list.length ? list.map(t => `
      <div class="card list-row">
        <div class="list-thumb placeholder" style="background:${t.type==='in'?'var(--olive-tint)':'var(--rust-tint)'};color:${t.type==='in'?'var(--olive-dark)':'var(--rust)'};">${t.type==='in'?'↓':'↑'}</div>
        <div class="list-main">
          <div class="list-title">${escapeHtml(t.description || t.category)}</div>
          <div class="list-sub">${escapeHtml(t.category)} · ${formatDateShort(t.date)}${t.source!=='manual' ? ' · auto' : ''}</div>
        </div>
        <div class="list-value ${t.type==='in'?'positive':'negative'}" style="color:${t.type==='in'?'var(--olive-dark)':'var(--rust)'}">${t.type==='in'?'+':'−'} ${formatINR(t.amount)}</div>
        ${t.source==='manual' ? `
          <button class="inv-edit-btn" data-edit-cash="${t.id}" aria-label="Edit">${ICON_EDIT}</button>
          <button class="inv-edit-btn inv-delete-btn" data-delete-cash="${t.id}" aria-label="Delete">${ICON_DELETE}</button>
        ` : ''}
      </div>
    `).join('') : `<div class="empty-state"><span class="icon">◈</span><div class="title">No transactions</div><div class="sub">Income and expenses will show up here as you go.</div></div>`}
    <div style="height:20px"></div>
  `;
};

function cashTxModal(type, existing) {
  const t = existing || { type, category: '', description: '', amount: '', date: todayISO() };
  const effectiveType = existing ? existing.type : type;
  openModal(`
    <div class="modal-header"><span class="modal-title">${existing ? 'Edit' : ''} ${effectiveType === 'in' ? 'Income' : 'Expense'}</span><button class="modal-close" data-close>✕</button></div>
    <form id="cash-form">
      <div class="field"><label>Description</label><input type="text" id="c-desc" value="${escapeHtml(t.description||'')}" placeholder="${effectiveType === 'in' ? 'e.g. Customer payment' : 'e.g. Packaging supplies'}" required></div>
      <div class="field"><label>Category</label><input type="text" id="c-cat" value="${escapeHtml(t.category||'')}" placeholder="${effectiveType === 'in' ? 'e.g. Dress Sale, Other Income' : 'e.g. Packaging, Advertising'}" required></div>
      <div class="field-row">
        <div class="field"><label>Amount (₹)</label><input type="number" id="c-amount" min="1" value="${t.amount}" required></div>
        <div class="field"><label>Date</label><input type="date" id="c-date" value="${t.date}"></div>
      </div>
      <div class="modal-footer">
        ${existing ? `<button type="button" class="btn btn-danger" id="c-delete">Delete</button>` : ''}
        <button type="submit" class="btn btn-primary btn-block">${existing ? 'Save Changes' : (effectiveType === 'in' ? 'Add Income' : 'Add Expense')}</button>
      </div>
    </form>
  `);
  document.querySelector('[data-close]').addEventListener('click', closeModal);

  if (existing) {
    document.getElementById('c-delete').addEventListener('click', () => {
      if (confirm('Remove this transaction?')) {
        DB.cashTx = DB.cashTx.filter(x => x.id !== existing.id);
        saveDB(); closeModal(); refreshView();
        showToast('Transaction removed');
      }
    });
  }

  document.getElementById('cash-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('c-date').value || todayISO();
    const category = document.getElementById('c-cat').value.trim();
    const description = document.getElementById('c-desc').value.trim();
    const amount = Number(document.getElementById('c-amount').value) || 0;

    if (existing) {
      Object.assign(existing, { date, category, description, amount });
      showToast('Transaction updated');
    } else {
      addCashTx({ date, type, category, description, amount, source: 'manual' });
      showToast(type === 'in' ? 'Income added' : 'Expense added');
    }
    saveDB(); closeModal(); refreshView();
  });
}

/* ============================================================
   PROFIT ANALYSIS
   ============================================================ */
VIEW_RENDERERS.profit = function renderProfit() {
  const gross = totalProfit();
  const opExpenses = totalExpenses();
  const net = gross - opExpenses;
  const invested = getTotalInvestment();
  const sales = totalSalesAmount();
  const profitPct = sales > 0 ? (net / sales * 100) : 0;

  const today = todayISO();
  const daily = DB.sales.filter(s => isSameDay(s.date, today)).reduce((a, s) => a + s.profit, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = DB.sales.filter(s => new Date(s.date) >= weekAgo).reduce((a, s) => a + s.profit, 0);
  const monthly = DB.sales.filter(s => isSameMonth(s.date, today)).reduce((a, s) => a + s.profit, 0);
  const yearly = DB.sales.filter(s => (s.date||'').slice(0,4) === today.slice(0,4)).reduce((a, s) => a + s.profit, 0);

  // profitability per product
  const perProduct = {};
  DB.sales.forEach(s => s.items.forEach(i => {
    const p = getProduct(i.productId);
    const cost = (p ? p.boughtPrice : 0) * i.qty;
    const rev = i.unitPrice * i.qty;
    if (!perProduct[i.productId]) perProduct[i.productId] = { name: i.name, profit: 0, qtySold: 0 };
    perProduct[i.productId].profit += rev - cost;
    perProduct[i.productId].qtySold += i.qty;
  }));
  const rankedByProfit = Object.values(perProduct).sort((a, b) => b.profit - a.profit).slice(0, 3);
  const rankedByQty = Object.values(perProduct).sort((a, b) => b.qtySold - a.qtySold).slice(0, 3);

  const slowMoving = DB.products.filter(p => p.qty > 0 && daysAgo(p.createdAt.slice(0,10)) > 30 && !perProduct[p.id]).slice(0, 5);

  return `
    <p class="view-eyebrow">· Analysis ·</p>
    <h1 class="view-title">Profit Analysis</h1>
    <div class="sprig"></div>

    <div class="stat-grid section-block">
      <div class="stat-card" id="investment-card" style="position:relative;">
        <div class="stat-label">Total Investment</div>
        <div class="stat-value">${formatINR(invested)}</div>
        <button class="stat-edit-btn" id="edit-investment-btn" aria-label="Edit investment">${ICON_EDIT}</button>
        ${DB.manualInvestment !== null && DB.manualInvestment !== undefined ? `<span class="tag tag-gold" style="margin-top:6px;display:inline-block;">Manual</span>` : ''}
      </div>
      <div class="stat-card"><div class="stat-label">Total Sales</div><div class="stat-value">${formatINR(sales)}</div></div>
      <div class="stat-card"><div class="stat-label">Gross Profit</div><div class="stat-value positive">${formatINR(gross)}</div></div>
      <div class="stat-card"><div class="stat-label">Net Profit</div><div class="stat-value ${net>=0?'positive':'negative'}">${formatINR(net)}</div></div>
      <div class="stat-card" style="grid-column:1/3;"><div class="stat-label">Profit Margin</div><div class="stat-value">${profitPct.toFixed(1)}%</div></div>
    </div>

    <div class="section-block">
      <p class="view-eyebrow">Profit Over Time</p>
      <div class="card">
        <div class="list-row"><div class="list-main">Today</div><div class="list-value">${formatINR(daily)}</div></div>
        <div class="list-row"><div class="list-main">Last 7 Days</div><div class="list-value">${formatINR(weekly)}</div></div>
        <div class="list-row"><div class="list-main">This Month</div><div class="list-value">${formatINR(monthly)}</div></div>
        <div class="list-row"><div class="list-main">This Year</div><div class="list-value">${formatINR(yearly)}</div></div>
      </div>
    </div>

    <div class="section-block">
      <p class="view-eyebrow">Most Profitable Pieces</p>
      <div class="card">
        ${rankedByProfit.length ? rankedByProfit.map(r => `
          <div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(r.name)}</div><div class="list-sub">${r.qtySold} sold</div></div><div class="list-value positive">${formatINR(r.profit)}</div></div>
        `).join('') : `<p class="field-hint">No sales yet.</p>`}
      </div>
    </div>

    <div class="section-block">
      <p class="view-eyebrow">Best-Selling Pieces</p>
      <div class="card">
        ${rankedByQty.length ? rankedByQty.map(r => `
          <div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(r.name)}</div></div><span class="tag tag-olive">${r.qtySold} sold</span></div>
        `).join('') : `<p class="field-hint">No sales yet.</p>`}
      </div>
    </div>

    <div class="section-block">
      <p class="view-eyebrow">Slow-Moving Stock <span style="text-transform:none;letter-spacing:0;">(30+ days, unsold)</span></p>
      <div class="card">
        ${slowMoving.length ? slowMoving.map(p => `
          <div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(p.name)}</div><div class="list-sub">Added ${formatDate(p.purchaseDate)}</div></div><span class="tag tag-neutral">${daysAgo(p.createdAt.slice(0,10))}d</span></div>
        `).join('') : `<p class="field-hint">Nothing sitting idle right now.</p>`}
      </div>
    </div>
  `;
};

function investmentModal() {
  const current = getTotalInvestment();
  const isManual = DB.manualInvestment !== null && DB.manualInvestment !== undefined;
  openModal(`
    <div class="modal-header"><span class="modal-title">Total Investment</span><button class="modal-close" data-close>✕</button></div>
    <p class="field-hint" style="margin-bottom:14px;">Enter the total capital you've put into the business — stock, equipment, or any other startup cost. This overrides the automatic inventory-based estimate.</p>
    <div class="field"><label>Total Investment (₹)</label><input type="number" id="inv-amount" min="0" value="${current}"></div>
    ${isManual ? `<p class="field-hint" style="margin-bottom:10px;">Currently set manually. You can switch back to the automatic figure any time.</p>` : ''}
    <div class="modal-footer">
      ${isManual ? `<button type="button" class="btn btn-outline" id="inv-reset-btn">Use Automatic</button>` : ''}
      <button type="button" class="btn btn-primary" id="inv-save-btn">Save</button>
    </div>
  `, { center: true });
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  document.getElementById('inv-save-btn').addEventListener('click', () => {
    const val = Number(document.getElementById('inv-amount').value) || 0;
    DB.manualInvestment = val;
    saveDB(); closeModal(); refreshView();
    showToast('Investment updated');
  });
  const resetBtn = document.getElementById('inv-reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    DB.manualInvestment = null;
    saveDB(); closeModal(); refreshView();
    showToast('Reset to automatic calculation');
  });
}

/* ============================================================
   STOCK MOVEMENT TRACKING
   ============================================================ */
VIEW_RENDERERS.stock = function renderStock() {
  const moves = [...DB.stockMoves].sort((a, b) => b.id.localeCompare(a.id));
  const inCount = DB.stockMoves.filter(m => m.type === 'in').reduce((s,m)=>s+m.qty,0);
  const outCount = DB.stockMoves.filter(m => m.type === 'out').reduce((s,m)=>s+m.qty,0);

  return `
    <p class="view-eyebrow">· Movement ·</p>
    <h1 class="view-title">Stock Movement</h1>
    <div class="sprig"></div>

    <div class="stat-grid section-block">
      <div class="stat-card"><div class="stat-label">Total Added</div><div class="stat-value positive">+${inCount}</div></div>
      <div class="stat-card"><div class="stat-label">Total Sold/Removed</div><div class="stat-value negative">−${outCount}</div></div>
    </div>

    <button class="btn btn-outline btn-block" id="stock-adjust-btn" style="margin-bottom:18px;">+ Record Return / Adjustment</button>

    <div class="card">
      ${moves.length ? `<div class="timeline">
        ${moves.map(m => `
          <div class="timeline-item">
            <div class="timeline-dot ${m.type === 'out' ? 'out' : ''}"></div>
            <div class="timeline-text"><b>${escapeHtml(m.productName)}</b> ${m.type === 'in' ? 'added' : m.type === 'return' ? 'returned' : 'sold'} ${m.type === 'in' ? '+' : m.type === 'return' ? '+' : '−'}${m.qty}${m.note ? ' · ' + escapeHtml(m.note) : ''}</div>
            <div class="timeline-date">${formatDate(m.date)}</div>
          </div>
        `).join('')}
      </div>` : `<p class="field-hint">No stock movement recorded yet.</p>`}
    </div>
    <div style="height:20px"></div>
  `;
};

function stockAdjustModal() {
  openModal(`
    <div class="modal-header"><span class="modal-title">Return / Adjustment</span><button class="modal-close" data-close>✕</button></div>
    <form id="stock-form">
      <div class="field">
        <label>Product</label>
        <select id="st-product">${DB.products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Movement Type</label>
        <select id="st-type"><option value="return">Item Returned (+ stock)</option><option value="out">Damaged / Removed (− stock)</option></select>
      </div>
      <div class="field-row">
        <div class="field"><label>Quantity</label><input type="number" id="st-qty" min="1" value="1"></div>
        <div class="field"><label>Date</label><input type="date" id="st-date" value="${todayISO()}"></div>
      </div>
      <div class="field"><label>Note</label><input type="text" id="st-note" placeholder="Optional"></div>
      <div class="modal-footer"><button type="submit" class="btn btn-primary btn-block">Save</button></div>
    </form>
  `);
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  document.getElementById('stock-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = document.getElementById('st-product').value;
    const p = getProduct(pid);
    if (!p) return;
    const type = document.getElementById('st-type').value;
    const qty = Number(document.getElementById('st-qty').value) || 1;
    p.qty += (type === 'return' ? qty : -qty);
    addStockMove({ date: document.getElementById('st-date').value, productId: p.id, productName: p.name, type, qty, note: document.getElementById('st-note').value.trim() });
    saveDB(); closeModal(); refreshView();
    showToast('Stock updated');
  });
}

/* ============================================================
   PAYMENT TRACKING (pending payments)
   ============================================================ */
VIEW_RENDERERS.payments = function renderPayments() {
  const pending = DB.payments.filter(p => p.status === 'pending').sort((a,b) => (a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  const paid = DB.payments.filter(p => p.status === 'paid');

  return `
    <p class="view-eyebrow">· Receivables ·</p>
    <h1 class="view-title">Payment Tracking</h1>
    <div class="sprig"></div>

    <div class="stat-card section-block">
      <div class="stat-label">Total Pending</div>
      <div class="stat-value negative">${formatINR(pendingPaymentsTotal())}</div>
    </div>

    <button class="btn btn-outline btn-block" id="payment-add-btn" style="margin-bottom:18px;">+ Add Pending Payment</button>

    <p class="view-eyebrow">Pending</p>
    <div class="card section-block">
      ${pending.length ? pending.map(p => `
        <div class="list-row">
          <div class="list-main">
            <div class="list-title">${escapeHtml(p.customerName)}</div>
            <div class="list-sub">${p.dueDate ? 'Due ' + formatDate(p.dueDate) : 'No due date'}${p.phone ? ' · ' + escapeHtml(p.phone) : ''}</div>
          </div>
          <div class="list-value negative" style="margin-right:8px;">${formatINR(p.amount)}</div>
          <button class="btn btn-sm btn-olive" data-mark-paid="${p.id}">Mark Paid</button>
        </div>
      `).join('') : `<p class="field-hint">No pending payments. Nicely clear!</p>`}
    </div>

    ${paid.length ? `
    <p class="view-eyebrow">Recently Settled</p>
    <div class="card">
      ${paid.slice(-5).reverse().map(p => `
        <div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(p.customerName)}</div></div><span class="tag tag-olive">${formatINR(p.amount)}</span></div>
      `).join('')}
    </div>` : ''}
    <div style="height:20px"></div>
  `;
};

function paymentAddModal() {
  openModal(`
    <div class="modal-header"><span class="modal-title">Add Pending Payment</span><button class="modal-close" data-close>✕</button></div>
    <form id="payment-form">
      <div class="field"><label>Customer Name</label><input type="text" id="pm-name" required></div>
      <div class="field"><label>Phone</label><input type="text" id="pm-phone"></div>
      <div class="field-row">
        <div class="field"><label>Amount (₹)</label><input type="number" id="pm-amount" min="1" required></div>
        <div class="field"><label>Due Date</label><input type="date" id="pm-due"></div>
      </div>
      <div class="field"><label>Note</label><input type="text" id="pm-note" placeholder="Optional"></div>
      <div class="modal-footer"><button type="submit" class="btn btn-primary btn-block">Add</button></div>
    </form>
  `);
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  document.getElementById('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    DB.payments.push({
      id: uid(), customerName: document.getElementById('pm-name').value.trim(),
      phone: document.getElementById('pm-phone').value.trim(),
      amount: Number(document.getElementById('pm-amount').value) || 0,
      dueDate: document.getElementById('pm-due').value, status: 'pending',
      note: document.getElementById('pm-note').value.trim(), saleId: null, createdAt: new Date().toISOString()
    });
    saveDB(); closeModal(); refreshView();
    showToast('Pending payment added');
  });
}

function markPaymentPaid(id) {
  const p = DB.payments.find(x => x.id === id);
  if (!p) return;
  p.status = 'paid';
  addCashTx({ type: 'in', category: 'Payment Received', description: `Payment from ${p.customerName}`, amount: p.amount, source: 'payment', refId: p.id });
  saveDB();
  refreshView();
  showToast('Marked as paid');
}

/* ============================================================
   EXPENSE MANAGEMENT
   ============================================================ */
VIEW_RENDERERS.expenses = function renderExpenses() {
  const today = todayISO();
  const monthExpenses = DB.expenses.filter(e => isSameMonth(e.date, today));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = {};
  monthExpenses.forEach(e => { const key = e.category === 'Other' && e.customLabel ? e.customLabel : e.category; byCategory[key] = (byCategory[key] || 0) + e.amount; });
  const catEntries = Object.entries(byCategory).sort((a,b) => b[1]-a[1]);
  const maxCat = Math.max(1, ...catEntries.map(c => c[1]));

  const list = [...DB.expenses].sort((a, b) => b.date.localeCompare(a.date));

  return `
    <p class="view-eyebrow">· Outgoings ·</p>
    <h1 class="view-title">Expense Management</h1>
    <div class="sprig"></div>

    <div class="stat-card section-block">
      <div class="stat-label">This Month's Expenses</div>
      <div class="stat-value negative">${formatINR(monthTotal)}</div>
    </div>

    ${catEntries.length ? `
    <div class="section-block">
      <p class="view-eyebrow">By Category (this month)</p>
      <div class="card">
        ${catEntries.map(([cat, amt]) => `
          <div style="margin-bottom:10px;">
            <div class="list-row" style="border:none;padding:0 0 4px;"><div class="list-main">${escapeHtml(cat)}</div><div class="list-value">${formatINR(amt)}</div></div>
            <div style="background:var(--border-soft);border-radius:6px;height:6px;overflow:hidden;"><div style="width:${(amt/maxCat*100)}%;background:var(--olive);height:100%;"></div></div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <button class="btn btn-danger btn-block" id="expense-add-btn" style="margin-bottom:18px;">+ Add Expense</button>

    <p class="view-eyebrow">All Expenses</p>
    <div class="card">
      ${list.length ? list.map(e => `
        <div class="list-row">
          <div class="list-main">
            <div class="list-title">${escapeHtml(e.description || e.category)}</div>
            <div class="list-sub">${escapeHtml(e.category === 'Other' && e.customLabel ? e.customLabel : e.category)} · ${escapeHtml(e.paymentMethod)} · ${formatDateShort(e.date)}</div>
          </div>
          <div class="list-value negative" style="margin-right:2px;">− ${formatINR(e.amount)}</div>
          <button class="inv-edit-btn" data-edit-expense="${e.id}" aria-label="Edit">${ICON_EDIT}</button>
          <button class="inv-edit-btn inv-delete-btn" data-delete-expense="${e.id}" aria-label="Delete">${ICON_DELETE}</button>
        </div>
      `).join('') : `<p class="field-hint">No expenses logged yet.</p>`}
    </div>
    <div style="height:20px"></div>
  `;
};

function expenseFormModal(existing) {
  const e = existing || { category: EXPENSE_CATEGORIES[0], customLabel: '', description: '', amount: '', date: todayISO(), paymentMethod: 'Cash' };
  openModal(`
    <div class="modal-header"><span class="modal-title">${existing ? 'Edit Expense' : 'Add Expense'}</span><button class="modal-close" data-close>✕</button></div>
    <form id="expense-form">
      <div class="field">
        <label>Category</label>
        <select id="ex-cat">${EXPENSE_CATEGORIES.map(c => `<option ${c===e.category?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="field" id="ex-custom-wrap" style="display:${e.category==='Other'?'block':'none'};">
        <label>Custom Label</label>
        <input type="text" id="ex-custom" value="${escapeHtml(e.customLabel||'')}" placeholder="e.g. Tailoring, Platform fees">
      </div>
      <div class="field"><label>Description</label><input type="text" id="ex-desc" value="${escapeHtml(e.description||'')}" placeholder="Optional detail"></div>
      <div class="field-row">
        <div class="field"><label>Amount (₹)</label><input type="number" id="ex-amount" min="1" value="${e.amount}" required></div>
        <div class="field"><label>Date</label><input type="date" id="ex-date" value="${e.date}"></div>
      </div>
      <div class="field">
        <label>Payment Method</label>
        <select id="ex-payment">
          <option ${e.paymentMethod==='Cash'?'selected':''}>Cash</option>
          <option ${e.paymentMethod==='Card'?'selected':''}>Card</option>
          <option ${e.paymentMethod==='Bank Transfer'?'selected':''}>Bank Transfer</option>
        </select>
      </div>
      <div class="modal-footer">
        ${existing ? `<button type="button" class="btn btn-danger" id="ex-delete">Delete</button>` : ''}
        <button type="submit" class="btn btn-primary btn-block">${existing ? 'Save Changes' : 'Add Expense'}</button>
      </div>
    </form>
  `);
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  const catSelect = document.getElementById('ex-cat');
  const customWrap = document.getElementById('ex-custom-wrap');
  catSelect.addEventListener('change', () => { customWrap.style.display = catSelect.value === 'Other' ? 'block' : 'none'; });

  if (existing) {
    document.getElementById('ex-delete').addEventListener('click', () => deleteExpenseWithConfirm(existing.id));
  }

  document.getElementById('expense-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const category = catSelect.value;
    const customLabel = document.getElementById('ex-custom').value.trim();
    const amount = Number(document.getElementById('ex-amount').value) || 0;
    const date = document.getElementById('ex-date').value || todayISO();
    const description = document.getElementById('ex-desc').value.trim();
    const paymentMethod = document.getElementById('ex-payment').value;

    if (existing) {
      Object.assign(existing, { category, customLabel, amount, date, description, paymentMethod });
      const linkedTx = DB.cashTx.find(t => t.source === 'expense' && t.refId === existing.id);
      if (linkedTx) Object.assign(linkedTx, { date, category: category === 'Other' && customLabel ? customLabel : category, description: description || category, amount });
      showToast('Expense updated');
    } else {
      const expense = { id: uid(), date, category, customLabel, description, amount, paymentMethod };
      DB.expenses.push(expense);
      addCashTx({ date, type: 'out', category: category === 'Other' && customLabel ? customLabel : category, description: description || category, amount, source: 'expense', refId: expense.id });
      showToast('Expense added');
    }
    saveDB(); closeModal(); refreshView();
  });
}

function expenseAddModal() { expenseFormModal(null); }

function deleteExpenseWithConfirm(id) {
  if (confirm('Delete this expense? This cannot be undone.')) {
    DB.expenses = DB.expenses.filter(x => x.id !== id);
    DB.cashTx = DB.cashTx.filter(t => !(t.source === 'expense' && t.refId === id));
    saveDB();
    closeModal();
    refreshView();
    showToast('Expense deleted');
  }
}

/* ============================================================
   SETTINGS & BACKUP
   ============================================================ */
VIEW_RENDERERS.settings = function renderSettings() {
  const lastSync = localStorage.getItem('homefolk_last_sync_at');
  const statusLabel = { synced: 'Synced', connecting: 'Connecting…', offline: 'Offline — showing local data', unavailable: 'Not set up' }[syncStatus] || 'Unknown';
  const statusTag = { synced: 'tag-olive', connecting: 'tag-gold', offline: 'tag-rust', unavailable: 'tag-neutral' }[syncStatus] || 'tag-neutral';

  return `
    <p class="view-eyebrow">· Settings ·</p>
    <h1 class="view-title">Settings &amp; Backup</h1>
    <div class="sprig"></div>

    <div class="card section-block">
      <p style="font-weight:500;margin-bottom:4px;">Homefolk Manager</p>
      <p class="field-hint">Runs offline in this browser, with changes synced to your teammate when online.</p>
    </div>

    <p class="view-eyebrow">Cloud Sync</p>
    <div class="card section-block">
      <div class="list-row" style="border:none;padding-bottom:6px;">
        <div class="list-main">Status</div>
        <span class="tag ${statusTag}">${statusLabel}</span>
      </div>
      <p class="field-hint">${lastSync ? 'Last synced ' + formatDate(lastSync) : 'Not yet synced with your teammate.'}</p>
    </div>

    <p class="view-eyebrow">Backup Your Data</p>
    <div class="card section-block">
      <p class="field-hint" style="margin-bottom:12px;">Download a backup file regularly, especially before clearing your browser data or switching devices.</p>
      <button class="btn btn-olive btn-block" id="export-btn">Download Backup</button>
    </div>

    <p class="view-eyebrow">Restore From Backup</p>
    <div class="card section-block">
      <p class="field-hint" style="margin-bottom:12px;">Restoring will replace all current data with the contents of the backup file.</p>
      <input type="file" id="import-input" accept=".json" style="display:none;">
      <button class="btn btn-outline btn-block" id="import-btn">Restore Backup</button>
    </div>

    <p class="view-eyebrow">Danger Zone</p>
    <div class="card section-block">
      <p class="field-hint" style="margin-bottom:12px;">Permanently erase all products, sales, and records from this device.</p>
      <button class="btn btn-danger btn-block" id="clear-btn">Clear All Data</button>
    </div>

    <button class="btn btn-outline btn-block" id="logout-btn">Log Out</button>
    <div style="height:20px"></div>
  `;
};

/* ============================================================
   DOWNLOAD MY DATA — dedicated, glanceable export interface
   ============================================================ */
VIEW_RENDERERS.mydata = function renderMyData() {
  const lastBackup = localStorage.getItem('homefolk_last_backup_at');
  return `
    <p class="view-eyebrow">· Your Records ·</p>
    <h1 class="view-title">Download My Data</h1>
    <div class="sprig"></div>

    <p class="field-hint section-block">Save a copy of everything to this device — useful before clearing your browser, switching phones, or simply as a safety net.</p>

    <div class="stat-grid section-block">
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">${DB.products.length}</div></div>
      <div class="stat-card"><div class="stat-label">Sales</div><div class="stat-value">${DB.sales.length}</div></div>
      <div class="stat-card"><div class="stat-label">Expenses</div><div class="stat-value">${DB.expenses.length}</div></div>
      <div class="stat-card"><div class="stat-label">Cash Entries</div><div class="stat-value">${DB.cashTx.length}</div></div>
    </div>

    <div class="card section-block">
      <p class="field-hint">${lastBackup ? 'Last downloaded ' + formatDate(lastBackup) : "You haven't downloaded a backup yet."}</p>
    </div>

    <button class="btn btn-olive btn-block" id="mydata-download-btn" style="margin-bottom:12px;">Download Full Backup (.json)</button>
    <p class="field-hint text-center" style="margin-bottom:22px;">Saves to your device's normal Downloads folder — open it on the other person's phone via Settings → Restore Backup to bring records across.</p>

    <button class="btn btn-outline btn-block" id="mydata-restore-btn">Restore From a Backup File</button>
    <input type="file" id="mydata-import-input" accept=".json" style="display:none;">
    <div style="height:20px"></div>
  `;
};

function handleExport() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `homefolk-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  localStorage.setItem('homefolk_last_backup_at', new Date().toISOString());
  showToast('Backup downloaded');
}

function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad file');
      DB = Object.assign(defaultDB(), parsed);
      saveDB();
      refreshView();
      showToast('Backup restored');
    } catch (err) {
      showToast('Could not read that backup file');
    }
  };
  reader.readAsText(file);
}

/* ============================================================
   VIEW-SPECIFIC EVENT WIRING
   ============================================================ */
function attachViewHandlers(view) {
  // Global: open product detail / sale detail / nav links (delegated per render, safe to rebind)
  VIEW_ROOT.querySelectorAll('[data-open-product]').forEach(el => {
    el.addEventListener('click', () => {
      const p = getProduct(el.dataset.openProduct);
      if (p) productDetailModal(p);
    });
  });
  VIEW_ROOT.querySelectorAll('[data-edit-product]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = getProduct(el.dataset.editProduct);
      if (p) productFormModal(p);
    });
  });
  VIEW_ROOT.querySelectorAll('[data-delete-product]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = getProduct(el.dataset.deleteProduct);
      if (p) deleteProductWithConfirm(p);
    });
  });
  VIEW_ROOT.querySelectorAll('[data-open-sale]').forEach(el => {
    el.addEventListener('click', () => {
      const s = DB.sales.find(x => x.id === el.dataset.openSale);
      if (s) saleDetailModal(s);
    });
  });
  VIEW_ROOT.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  if (view === 'inventory') {
    document.getElementById('inv-search').addEventListener('input', (e) => { invSearchTerm = e.target.value; refreshView(); });
    document.getElementById('inv-sort').addEventListener('change', (e) => { invSort = e.target.value; refreshView(); });
    document.querySelectorAll('.inv-cat-chip').forEach(chip => chip.addEventListener('click', () => { invFilterCategory = chip.dataset.cat; refreshView(); }));
    document.getElementById('inv-add-btn').addEventListener('click', () => productFormModal(null));
    document.getElementById('inv-fab').addEventListener('click', () => productFormModal(null));
  }

  if (view === 'closet') {
    document.querySelectorAll('.closet-cat-chip').forEach(chip => chip.addEventListener('click', () => { closetFilterCategory = chip.dataset.cat; refreshView(); }));
  }

  if (view === 'sales') {
    document.getElementById('new-sale-btn').addEventListener('click', () => newSaleModal());
  }

  if (view === 'cashflow') {
    document.querySelectorAll('.tab-bar button[data-filter]').forEach(b => b.addEventListener('click', () => { cashDateFilter = b.dataset.filter; refreshView(); }));
    document.getElementById('cash-add-in').addEventListener('click', () => cashTxModal('in'));
    document.getElementById('cash-add-out').addEventListener('click', () => cashTxModal('out'));
    document.querySelectorAll('[data-edit-cash]').forEach(b => b.addEventListener('click', () => {
      const t = DB.cashTx.find(x => x.id === b.dataset.editCash);
      if (t) cashTxModal(t.type, t);
    }));
    document.querySelectorAll('[data-delete-cash]').forEach(b => b.addEventListener('click', () => {
      if (confirm('Remove this transaction?')) {
        DB.cashTx = DB.cashTx.filter(t => t.id !== b.dataset.deleteCash);
        saveDB(); refreshView();
        showToast('Transaction removed');
      }
    }));
  }

  if (view === 'profit') {
    document.getElementById('edit-investment-btn').addEventListener('click', () => investmentModal());
  }

  if (view === 'stock') {
    document.getElementById('stock-adjust-btn').addEventListener('click', () => stockAdjustModal());
  }

  if (view === 'payments') {
    document.getElementById('payment-add-btn').addEventListener('click', () => paymentAddModal());
    document.querySelectorAll('[data-mark-paid]').forEach(b => b.addEventListener('click', () => markPaymentPaid(b.dataset.markPaid)));
  }

  if (view === 'expenses') {
    document.getElementById('expense-add-btn').addEventListener('click', () => expenseAddModal());
    document.querySelectorAll('[data-edit-expense]').forEach(b => b.addEventListener('click', () => {
      const ex = DB.expenses.find(x => x.id === b.dataset.editExpense);
      if (ex) expenseFormModal(ex);
    }));
    document.querySelectorAll('[data-delete-expense]').forEach(b => b.addEventListener('click', () => deleteExpenseWithConfirm(b.dataset.deleteExpense)));
  }

  if (view === 'settings') {
    document.getElementById('export-btn').addEventListener('click', handleExport);
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-input').click());
    document.getElementById('import-input').addEventListener('change', (e) => { if (e.target.files[0]) handleImportFile(e.target.files[0]); });
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (confirm('This will permanently delete all data on this device. Continue?')) {
        if (confirm('Are you absolutely sure? This cannot be undone.')) {
          DB = defaultDB();
          saveDB();
          navigate('home');
          showToast('All data cleared');
        }
      }
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('Log out of Homefolk Manager?')) logout();
    });
  }

  if (view === 'mydata') {
    document.getElementById('mydata-download-btn').addEventListener('click', handleExport);
    document.getElementById('mydata-restore-btn').addEventListener('click', () => document.getElementById('mydata-import-input').click());
    document.getElementById('mydata-import-input').addEventListener('change', (e) => { if (e.target.files[0]) handleImportFile(e.target.files[0]); });
  }
}

/* ============================================================
   AUTH: COVER SCREEN + PIN LOGIN
   ============================================================ */
const AUTH_KEY = 'homefolk_auth_v1';
const LAST_VIEW_KEY = 'homefolk_last_view_v1';
const APP_PIN = '2526';

const authRoot = document.getElementById('auth-root');

function isAuthed() { return localStorage.getItem(AUTH_KEY) === 'yes'; }

function showAuthOverlay() {
  document.body.classList.add('auth-mode');
  authRoot.classList.remove('hidden');
}
function hideAuthOverlay() {
  document.body.classList.remove('auth-mode');
  authRoot.classList.add('hidden');
  authRoot.innerHTML = '';
}

function renderCoverScreen() {
  showAuthOverlay();
  authRoot.innerHTML = `
    <div class="auth-screen">
      <img src="${LOGO_URI}" class="auth-logo" alt="Homefolk">
      <p class="auth-eyebrow">· Timeless Finds ·</p>
      <h1 class="auth-title">Homefolk</h1>
      <p class="auth-tagline">Curated Thrift &amp; Vintage Pieces</p>
      <button class="btn btn-primary auth-cta" id="cover-continue-btn">Enter Manager</button>
    </div>
  `;
  document.getElementById('cover-continue-btn').addEventListener('click', renderLoginScreen);
}

function renderLoginScreen() {
  showAuthOverlay();
  let entered = '';
  authRoot.innerHTML = `
    <div class="auth-screen">
      <img src="${LOGO_URI}" class="auth-logo" alt="Homefolk">
      <p class="auth-eyebrow">· Enter PIN ·</p>
      <h1 class="auth-title" style="font-size:22px;">Welcome Back</h1>
      <div class="pin-dots" id="pin-dots">
        ${[0,1,2,3].map(() => `<div class="pin-dot"></div>`).join('')}
      </div>
      <div class="pin-pad" id="pin-pad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" class="pin-key" data-key="${n}">${n}</button>`).join('')}
        <button type="button" class="pin-key pin-clear" data-key="clear">Clear</button>
        <button type="button" class="pin-key" data-key="0">0</button>
        <button type="button" class="pin-key pin-clear" data-key="back">⌫</button>
      </div>
      <p class="pin-error-msg" id="pin-error"></p>
    </div>
  `;

  const dotsEl = document.getElementById('pin-dots');
  const errorEl = document.getElementById('pin-error');

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < entered.length));
  }

  function tryLogin() {
    if (entered === APP_PIN) {
      localStorage.setItem(AUTH_KEY, 'yes');
      hideAuthOverlay();
      enterApp();
    } else {
      errorEl.textContent = 'Incorrect PIN — try again';
      dotsEl.classList.add('shake');
      dotsEl.querySelectorAll('.pin-dot').forEach(d => d.classList.add('error'));
      setTimeout(() => {
        entered = '';
        updateDots();
        dotsEl.classList.remove('shake');
        dotsEl.querySelectorAll('.pin-dot').forEach(d => d.classList.remove('error'));
      }, 450);
    }
  }

  document.getElementById('pin-pad').addEventListener('click', (e) => {
    const btn = e.target.closest('.pin-key');
    if (!btn) return;
    const key = btn.dataset.key;
    errorEl.textContent = '';
    if (key === 'clear') { entered = ''; }
    else if (key === 'back') { entered = entered.slice(0, -1); }
    else if (entered.length < 4) { entered += key; }
    updateDots();
    if (entered.length === 4) setTimeout(tryLogin, 120);
  });
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LAST_VIEW_KEY);
  closeMoreSheet();
  closeModal();
  renderCoverScreen();
}

/* ============================================================
   VIEW HISTORY (in-app back button + hardware/gesture back trap)
   ============================================================ */
let viewHistoryStack = [];

function goBack() {
  if (viewHistoryStack.length > 0) {
    const prev = viewHistoryStack.pop();
    navigate(prev, { fromBack: true });
  }
}

document.getElementById('back-btn').addEventListener('click', goBack);
document.getElementById('refresh-btn').addEventListener('click', () => {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spin');
  setTimeout(() => btn.classList.remove('spin'), 500);
  refreshView();
  showToast('Refreshed');
});

let allowExitOnce = false;

function handlePopState(e) {
  if (!isAuthed()) return;
  if (viewHistoryStack.length > 0) {
    const prev = viewHistoryStack.pop();
    navigate(prev, { fromBack: true, skipPush: true });
    history.pushState({ view: prev }, '', '#' + prev);
    return;
  }
  if (allowExitOnce) { allowExitOnce = false; return; }
  // Nothing left to go back to within the app — confirm before actually exiting.
  history.pushState({ view: currentView }, '', '#' + currentView);
  if (confirm('Exit Homefolk Manager? Your data is already saved on this device.')) {
    allowExitOnce = true;
    history.back();
  }
}
window.addEventListener('popstate', handlePopState);

/* ============================================================
   INIT
   ============================================================ */
async function enterApp() {
  const lastView = localStorage.getItem(LAST_VIEW_KEY) || 'home';
  history.replaceState({ view: lastView }, '', '#' + lastView);
  navigate(lastView, { skipPush: true });
  await pullFromCloud();
  refreshView();
}

// Deploy-proof brand assets: set from embedded base64 so a missing/misnamed
// assets folder on the host never results in a broken logo.
document.getElementById('header-logo-img').src = LOGO_URI;
document.getElementById('favicon-link').href = LOGO_URI;
document.getElementById('touch-icon-link').href = LOGO_URI;

if (isAuthed()) {
  enterApp();
} else {
  renderCoverScreen();
  history.replaceState({ view: 'cover' }, '', '#cover');
}

// Register service worker for offline use (best-effort; ignore failures e.g. file:// scheme)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
