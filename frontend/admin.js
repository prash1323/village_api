/* ============================================================
   GeoIndia API — Admin Dashboard JavaScript
   All pages: Dashboard, Analytics, Clients, API Keys,
              Data Manager, Request Logs, Settings
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const PLANS = {
  Free:      { color: '#7a7e8e', limit: 1000,    mrr: 0 },
  Premium:   { color: '#ff6b1a', limit: 50000,   mrr: 2999 },
  Pro:       { color: '#6c7fff', limit: 500000,  mrr: 9999 },
  Unlimited: { color: '#00c97a', limit: Infinity, mrr: 49999 },
};

const CLIENTS = (() => {
  const names = [
    ['Flipkart Logistics','logistics@flipkart.com','Rajesh Kumar'],
    ['Swiggy India','api@swiggy.in','Priya Sharma'],
    ['Dunzo Delivery','tech@dunzo.com','Amit Verma'],
    ['PolicyBazaar','data@policybazaar.com','Neha Gupta'],
    ['BigBasket','integration@bigbasket.com','Sanjay Patel'],
    ['Meesho Tech','api@meesho.com','Anita Singh'],
    ['Urban Company','tech@urbanclap.com','Ravi Mehta'],
    ['PhonePe Infra','platform@phonepe.com','Deepa Nair'],
    ['Ola Electric','data@olaelectric.com','Vikram Rao'],
    ['Zomato India','api@zomato.com','Sunita Bose'],
    ['Rapido Bikes','tech@rapido.bike','Karthik Iyer'],
    ['Nykaa Fashion','api@nykaa.com','Preethi Menon'],
    ['JioMart','integration@jiomart.com','Aarav Shah'],
    ['Lenskart','data@lenskart.com','Kavita Reddy'],
    ['Mamaearth','api@mamaearth.in','Rohit Joshi'],
    ['Boat Lifestyle','tech@boat-lifestyle.com','Arjun Kumar'],
    ['Delhivery','platform@delhivery.com','Sneha Patil'],
    ['Shiprocket','api@shiprocket.in','Manish Tiwari'],
    ['EaseMyTrip','data@easemytrip.com','Pooja Yadav'],
    ['MakeMyTrip','api@makemytrip.com','Nikhil Chawla'],
  ];
  const planKeys = ['Free','Premium','Pro','Unlimited'];
  const statuses = ['Active','Active','Active','Suspended','Pending'];

  return names.map(([company, email, contact], i) => {
    const plan = planKeys[i % 4];
    const limit = PLANS[plan].limit === Infinity ? 1000000 : PLANS[plan].limit;
    const calls = Math.floor(Math.random() * limit * 0.9);
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `C${String(i+1).padStart(3,'0')}`,
      company, email, contact,
      plan,
      calls,
      limit,
      status: statuses[i % statuses.length],
      mrr: PLANS[plan].mrr,
      joined: date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      avatarColor: ['#ff6b1a','#6c7fff','#00c97a','#f5a623','#ff4d6d','#00d4e0','#b06dff'][i % 7],
    };
  });
})();

const STATES_DATA = [
  { state:'Uttar Pradesh',    districts:75,  subDistricts:822,  villages:97941 },
  { state:'Maharashtra',      districts:36,  subDistricts:355,  villages:43665 },
  { state:'Madhya Pradesh',   districts:52,  subDistricts:341,  villages:55393 },
  { state:'Bihar',            districts:38,  subDistricts:534,  villages:45099 },
  { state:'Rajasthan',        districts:33,  subDistricts:244,  villages:44981 },
  { state:'Karnataka',        districts:31,  subDistricts:227,  villages:29736 },
  { state:'Gujarat',          districts:33,  subDistricts:248,  villages:18584 },
  { state:'West Bengal',      districts:23,  subDistricts:341,  villages:40782 },
  { state:'Andhra Pradesh',   districts:26,  subDistricts:671,  villages:28293 },
  { state:'Tamil Nadu',       districts:38,  subDistricts:261,  villages:16317 },
  { state:'Odisha',           districts:30,  subDistricts:314,  villages:47543 },
  { state:'Telangana',        districts:31,  subDistricts:584,  villages:10430 },
  { state:'Jharkhand',        districts:24,  subDistricts:259,  villages:32620 },
  { state:'Chhattisgarh',     districts:33,  subDistricts:146,  villages:20334 },
  { state:'Haryana',          districts:22,  subDistricts:140,  villages:7007  },
  { state:'Punjab',           districts:23,  subDistricts:150,  villages:12855 },
];

const ENDPOINTS = [
  { path:'/api/v1/villages',         calls:1842300, method:'GET' },
  { path:'/api/v1/states',           calls:920100,  method:'GET' },
  { path:'/api/v1/districts',        calls:780400,  method:'GET' },
  { path:'/api/v1/search',           calls:643800,  method:'GET' },
  { path:'/api/v1/subdistricts',     calls:510200,  method:'GET' },
  { path:'/api/v1/autocomplete',     calls:398700,  method:'GET' },
];

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const fmt = n => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
const fmtINR = n => '₹'+n.toLocaleString('en-IN');
const randomBetween = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

function showToast(msg, type='success') {
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  const toast = $('#toast');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ'}</span><span class="toast-msg">${msg}</span>`;
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 3200);
}

function animateCounter(el, target, duration=1200) {
  const start = performance.now();
  const step = ts => {
    const p = Math.min((ts-start)/duration, 1);
    const ease = 1 - Math.pow(1-p, 3);
    const val = Math.floor(ease * target);
    el.textContent = val >= 1000 ? val.toLocaleString('en-IN') : val;
    if(p < 1) requestAnimationFrame(step);
    else el.textContent = target >= 1000 ? target.toLocaleString('en-IN') : target;
  };
  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────
// ROUTING / NAVIGATION
// ─────────────────────────────────────────────
let currentPage = 'dashboard';

function showPage(name) {
  $$('.page-body').forEach(p => p.classList.add('hidden'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  const page = $(`#page-${name}`);
  if(page) page.classList.remove('hidden');

  const navItem = $(`.nav-item[data-page="${name}"]`);
  if(navItem) navItem.classList.add('active');

  const titles = {
    dashboard: ['Dashboard','Welcome back, Admin — here\'s what\'s happening'],
    analytics:  ['Analytics','Deep-dive into API usage and performance'],
    clients:    ['B2B Clients','Manage all registered client accounts'],
    apikeys:    ['API Keys','Manage and monitor client credentials'],
    data:       ['Data Manager','Monitor and update geographical datasets'],
    logs:       ['Request Logs','Real-time API access and error monitoring'],
    settings:   ['Settings','Configure platform behaviour and limits'],
  };
  if(titles[name]) {
    $('#pageTitle').textContent = titles[name][0];
    $('#pageSubtitle').textContent = titles[name][1];
  }

  currentPage = name;
  closeSidebar();

  // Lazy init pages
  const inits = {
    dashboard: initDashboard,
    analytics:  initAnalytics,
    clients:    initClients,
    apikeys:    initApiKeys,
    data:       initDataManager,
    logs:       initLogs,
    settings:   initSettings,
  };
  if(inits[name]) inits[name]();
}

// ─────────────────────────────────────────────
// SIDEBAR MOBILE
// ─────────────────────────────────────────────
function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#sidebarOverlay').classList.remove('show');
}

// ─────────────────────────────────────────────
// CANVAS CHART HELPERS (no external deps)
// ─────────────────────────────────────────────
function drawLineChart(canvasId, labels, datasets, opts={}) {
  const canvas = $(`#${canvasId}`);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.offsetWidth  || 600;
  const H = canvas.height = canvas.offsetHeight || 200;
  ctx.clearRect(0,0,W,H);

  const pad = { top:20, right:20, bottom:36, left:52 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top  - pad.bottom;

  const allVals = datasets.flatMap(d=>d.data);
  const maxV = Math.max(...allVals) * 1.15 || 1;
  const minV = 0;

  // Grid
  const gridLines = 5;
  for(let i=0; i<=gridLines; i++) {
    const y = pad.top + cH - (i/gridLines)*cH;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left+cW, y);
    ctx.stroke();
    ctx.fillStyle = '#4a4e60';
    ctx.font = '10px DM Sans, sans-serif';
    ctx.textAlign = 'right';
    const val = minV + (maxV - minV) * (i/gridLines);
    ctx.fillText(fmt(Math.round(val)), pad.left-8, y+4);
  }

  // X labels
  const step = Math.max(1, Math.floor(labels.length/7));
  labels.forEach((lbl, i) => {
    if(i % step !== 0 && i !== labels.length-1) return;
    const x = pad.left + (i/(labels.length-1))*cW;
    ctx.fillStyle = '#4a4e60';
    ctx.font = '10px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, x, H - 8);
  });

  // Lines & fills
  datasets.forEach(ds => {
    const pts = ds.data.map((v,i) => ({
      x: pad.left + (i/(ds.data.length-1))*cW,
      y: pad.top  + cH - ((v-minV)/(maxV-minV))*cH,
    }));

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length-1].x, pad.top+cH);
    ctx.lineTo(pts[0].x, pad.top+cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top+cH);
    grad.addColorStop(0,   ds.color+'44');
    grad.addColorStop(1,   ds.color+'00');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots at ends
    [pts[0], pts[pts.length-1]].forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fillStyle = ds.color;
      ctx.fill();
    });
  });
}

function drawDonutChart(canvasId, segments) {
  const canvas = $(`#${canvasId}`);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const S = Math.min(canvas.offsetWidth||220, 180);
  canvas.width = canvas.height = S;
  const cx = S/2, cy = S/2, R = S/2 - 12, r = R*0.6;
  const total = segments.reduce((s,x)=>s+x.value,0);
  let angle = -Math.PI/2;

  segments.forEach(seg => {
    const arc = (seg.value/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,angle,angle+arc);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    angle += arc;
  });

  // Hole
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle = '#111318';
  ctx.fill();

  // Centre text
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `bold ${Math.floor(S/8)}px Syne, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmt(total), cx, cy-6);
  ctx.fillStyle = '#7a7e8e';
  ctx.font = `${Math.floor(S/12)}px DM Sans, sans-serif`;
  ctx.fillText('clients', cx, cy+12);
}

function drawBarChart(canvasId, labels, values, color='#ff6b1a') {
  const canvas = $(`#${canvasId}`);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.offsetWidth  || 400;
  const H = canvas.height = canvas.offsetHeight || 180;
  ctx.clearRect(0,0,W,H);
  const pad = {top:14, right:16, bottom:32, left:44};
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top  - pad.bottom;
  const maxV = Math.max(...values)*1.1||1;
  const n = values.length;
  const bW = cW/n * 0.55;
  const gap = cW/n;

  for(let i=0;i<=4;i++){
    const y = pad.top + cH*(1-i/4);
    ctx.beginPath();
    ctx.strokeStyle='rgba(255,255,255,0.05)';
    ctx.lineWidth=1;
    ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cW,y); ctx.stroke();
    ctx.fillStyle='#4a4e60'; ctx.font='9px DM Sans'; ctx.textAlign='right';
    ctx.fillText(fmt(Math.round(maxV*i/4)), pad.left-6, y+3);
  }

  values.forEach((v,i) => {
    const x = pad.left + gap*i + (gap-bW)/2;
    const bH = (v/maxV)*cH;
    const y  = pad.top + cH - bH;
    const g  = ctx.createLinearGradient(0,y,0,y+bH);
    g.addColorStop(0, color);
    g.addColorStop(1, color+'55');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, bW, bH, [3,3,0,0]);
    ctx.fill();
    ctx.fillStyle='#4a4e60'; ctx.font='9px DM Sans'; ctx.textAlign='center';
    ctx.fillText(labels[i], x+bW/2, H-10);
  });
}

function drawCacheChart(canvasId, hits, misses) {
  const canvas = $(`#${canvasId}`);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.offsetWidth  || 400;
  const H = canvas.height = canvas.offsetHeight || 180;
  ctx.clearRect(0,0,W,H);

  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const pad = {top:14, right:16, bottom:28, left:44};
  const cW = W-pad.left-pad.right, cH = H-pad.top-pad.bottom;
  const maxV = Math.max(...hits, ...misses)*1.2||1;
  const n = labels.length;
  const bW = cW/n*0.2;
  const gW = cW/n;

  hits.forEach((v,i)=>{
    const x = pad.left+gW*i+(gW-bW*2.4)/2;
    const bH = (v/maxV)*cH;
    const g = ctx.createLinearGradient(0,pad.top+cH-bH,0,pad.top+cH);
    g.addColorStop(0,'#00c97a'); g.addColorStop(1,'#00c97a33');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.roundRect(x,pad.top+cH-bH,bW,bH,[2,2,0,0]); ctx.fill();
  });
  misses.forEach((v,i)=>{
    const x = pad.left+gW*i+(gW-bW*2.4)/2+bW+2;
    const bH = (v/maxV)*cH;
    const g = ctx.createLinearGradient(0,pad.top+cH-bH,0,pad.top+cH);
    g.addColorStop(0,'#ff4d6d'); g.addColorStop(1,'#ff4d6d33');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.roundRect(x,pad.top+cH-bH,bW,bH,[2,2,0,0]); ctx.fill();
  });

  labels.forEach((l,i)=>{
    ctx.fillStyle='#4a4e60'; ctx.font='9px DM Sans'; ctx.textAlign='center';
    ctx.fillText(l, pad.left+gW*i+gW/2, H-8);
  });
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
let dashboardInited = false;
function initDashboard() {
  if(dashboardInited) return; dashboardInited = true;

  // Metrics
  const metrics = [
    { label:'Total API Calls Today', value:'4.28M', raw:4280000, delta:'+12.4% vs yesterday', dir:'up', icon:'⚡', color:'c-saffron', sub:'Across all clients' },
    { label:'Active Clients',        value:'183',   raw:183,    delta:'+7 this week',          dir:'up', icon:'◉', color:'c-emerald', sub:'48 on Premium+' },
    { label:'Avg Latency (p95)',      value:'68ms',  raw:null,   delta:'-4ms vs last week',     dir:'up', icon:'◈', color:'c-indigo',  sub:'Target: <100ms ✓' },
    { label:'Monthly Revenue',        value:'₹18.4L',raw:null,   delta:'+₹2.1L vs last month',  dir:'up', icon:'₹', color:'c-amber',  sub:'MRR growing' },
    { label:'Error Rate',            value:'0.08%', raw:null,   delta:'-0.02% improvement',    dir:'up', icon:'⚠', color:'c-rose',   sub:'3,424 errors/day' },
    { label:'Cache Hit Rate',        value:'94.2%', raw:null,   delta:'+1.3% this week',       dir:'up', icon:'⬡', color:'c-teal',   sub:'Redis performing well' },
  ];

  $('#metricsGrid').innerHTML = metrics.map((m,i) => `
    <div class="metric-card ${m.color}" style="animation-delay:${i*0.07}s">
      <span class="metric-icon">${m.icon}</span>
      <div class="metric-label">${m.label}</div>
      <div class="metric-value" ${m.raw?`data-raw="${m.raw}"`:''}>${m.value}</div>
      <div class="metric-delta ${m.dir}">${m.dir==='up'?'↑':'↓'} ${m.delta}</div>
      <div class="metric-sub">${m.sub}</div>
    </div>
  `).join('');

  // Animate counters
  $$('[data-raw]').forEach(el => {
    const raw = parseInt(el.dataset.raw);
    if(!isNaN(raw)) animateCounter(el, raw);
  });

  // Request volume chart
  const days = Array.from({length:30},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-29+i);
    return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
  });
  const reqData = days.map(()=> randomBetween(2800000,5400000));
  const errData = days.map(()=> randomBetween(1000,8000));
  const latData = days.map(()=> randomBetween(45,95));

  let activeMetric = 'requests';
  const allDatasets = {
    requests: [{ data:reqData, color:'#ff6b1a' }],
    errors:   [{ data:errData, color:'#ff4d6d' }],
    latency:  [{ data:latData, color:'#6c7fff' }],
  };

  function renderVolumeChart() {
    setTimeout(()=> drawLineChart('requestVolumeChart', days, allDatasets[activeMetric]), 50);
  }
  renderVolumeChart();

  $$('.chart-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.chart-filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      activeMetric = btn.dataset.metric;
      renderVolumeChart();
    });
  });

  // Plan donut
  const planCounts = Object.keys(PLANS).map(p => ({
    label: p,
    value: CLIENTS.filter(c=>c.plan===p).length,
    color: PLANS[p].color,
  }));
  setTimeout(()=> drawDonutChart('planDonutChart', planCounts), 80);

  $('#donutLegend').innerHTML = planCounts.map(p=>`
    <div class="legend-item">
      <span class="legend-dot" style="background:${p.color}"></span>
      <span class="legend-label">${p.label}</span>
      <span class="legend-value">${p.value}</span>
      <span class="legend-pct">${Math.round(p.value/CLIENTS.length*100)}%</span>
    </div>
  `).join('');

  // Endpoint bars
  const maxCalls = Math.max(...ENDPOINTS.map(e=>e.calls));
  $('#endpointBars').innerHTML = ENDPOINTS.map(e=>`
    <div class="ep-bar-row">
      <div class="ep-bar-label">
        <span class="ep-bar-name">${e.path}</span>
        <span class="ep-bar-count">${fmt(e.calls)}</span>
      </div>
      <div class="ep-bar-track">
        <div class="ep-bar-fill" style="width:0%" data-w="${Math.round(e.calls/maxCalls*100)}"></div>
      </div>
    </div>
  `).join('');
  setTimeout(()=>{
    $$('#endpointBars .ep-bar-fill').forEach(el=> el.style.width=el.dataset.w+'%');
  }, 200);

  // Latency chart
  const latLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const p50 = latLabels.map(()=>randomBetween(30,55));
  const p95 = latLabels.map(()=>randomBetween(55,85));
  const p99 = latLabels.map(()=>randomBetween(80,140));
  setTimeout(()=> drawLineChart('latencyChart', latLabels, [
    {data:p50,color:'#00c97a'},
    {data:p95,color:'#ff6b1a'},
    {data:p99,color:'#ff4d6d'},
  ]), 100);

  // Revenue breakdown
  const rev = Object.entries(PLANS).map(([tier,p])=>({
    tier, count: CLIENTS.filter(c=>c.plan===tier).length, mrr: p.mrr,
  })).filter(r=>r.mrr>0);
  const totalRev = rev.reduce((s,r)=>s+r.count*r.mrr,0);
  $('#revenueBreakdown').innerHTML = `
    ${rev.map(r=>`
      <div class="rev-row">
        <div>
          <div class="rev-tier">${r.tier}</div>
          <div class="rev-clients">${r.count} clients</div>
        </div>
        <div class="rev-amount">${fmtINR(r.count*r.mrr)}</div>
      </div>
    `).join('')}
    <div class="rev-row" style="border-color:rgba(255,107,26,0.3);background:rgba(255,107,26,0.04)">
      <div><div class="rev-tier" style="color:#ff6b1a">Total MRR</div></div>
      <div class="rev-amount">${fmtINR(totalRev)}</div>
    </div>
  `;

  // Recent clients table
  const recent = [...CLIENTS].sort((a,b)=>a.joined<b.joined?1:-1).slice(0,10);
  $('#recentClientsTable').innerHTML = recent.map(c=>`
    <tr>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${c.avatarColor}">${c.company[0]}</div>
          <div>
            <div class="client-name">${c.company}</div>
            <div class="client-email">${c.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${planBadge(c.plan)}">${c.plan}</span></td>
      <td>
        <div class="usage-mini">
          <div class="usage-mini-bar">
            <div class="usage-mini-fill" style="width:${Math.round(c.calls/c.limit*100)}%;background:${usageColor(c.calls/c.limit)}"></div>
          </div>
          <div class="usage-mini-text">${fmt(c.calls)} / ${fmt(c.limit)}</div>
        </div>
      </td>
      <td><span class="badge badge-${statusBadge(c.status)}">${c.status}</span></td>
      <td style="color:var(--text-muted);font-size:0.82rem">${c.joined}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openClientModal('${c.id}')">👁 View</button>
          <button class="btn-icon" onclick="showToast('Email sent to ${c.contact}','info')">✉</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Last updated ticker
  setInterval(()=> $('#lastUpdated').textContent = 'just now', 30000);
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
let analyticsInited = false;
function initAnalytics() {
  if(analyticsInited) return; analyticsInited = true;

  $('#analyticsKPI').innerHTML = [
    { label:'Total Requests (30d)', value:'128.4M', color:'c-saffron', delta:'↑ 18%' },
    { label:'Unique Client IPs',    value:'4,821',  color:'c-indigo',  delta:'↑ 234' },
    { label:'Cache Hit Rate',       value:'94.2%',  color:'c-emerald', delta:'↑ 1.3%' },
    { label:'Avg Response Time',    value:'42ms',   color:'c-amber',   delta:'↓ 6ms' },
  ].map((k,i)=>`
    <div class="metric-card ${k.color}" style="animation-delay:${i*0.07}s">
      <div class="metric-label">${k.label}</div>
      <div class="metric-value">${k.value}</div>
      <div class="metric-delta up">↑ ${k.delta}</div>
    </div>
  `).join('');

  // Geo bars
  const geoMax = Math.max(...STATES_DATA.map(s=>s.villages));
  $('#geoBars').innerHTML = [...STATES_DATA]
    .sort((a,b)=>b.villages-a.villages)
    .slice(0,12)
    .map(s=>{
      const queriesFraction = s.villages/geoMax;
      const queries = Math.floor(queriesFraction * 5000000);
      return `
        <div class="geo-bar-row">
          <div class="geo-state">${s.state}</div>
          <div class="geo-track">
            <div class="geo-fill" style="width:0%" data-w="${Math.round(queriesFraction*100)}"></div>
          </div>
          <div class="geo-count">${fmt(queries)}</div>
        </div>
      `;
    }).join('');
  setTimeout(()=> $$('#geoBars .geo-fill').forEach(el=> el.style.width=el.dataset.w+'%'), 200);

  // Cache chart
  const hits  = [820,890,930,880,910,940,960].map(v=>v*1000);
  const misses= [140,110,90,130,100,85,70].map(v=>v*1000);
  setTimeout(()=> drawCacheChart('cacheChart', hits, misses), 100);

  $('#cacheStats').innerHTML = `
    <div class="cache-stat"><div class="cache-stat-val" style="color:var(--emerald)">94.2%</div><div class="cache-stat-label">Hit Rate</div></div>
    <div class="cache-stat"><div class="cache-stat-val" style="color:var(--rose)">5.8%</div><div class="cache-stat-label">Miss Rate</div></div>
    <div class="cache-stat"><div class="cache-stat-val" style="color:var(--teal)">2.1ms</div><div class="cache-stat-label">Avg Cache Latency</div></div>
    <div class="cache-stat"><div class="cache-stat-val" style="color:var(--amber)">38ms</div><div class="cache-stat-label">Avg DB Latency</div></div>
  `;

  // Error table
  $('#errorTable').innerHTML = ENDPOINTS.map(e=>{
    const e4xx = Math.floor(e.calls * 0.0015);
    const e5xx = Math.floor(e.calls * 0.0003);
    const rate = ((e4xx+e5xx)/e.calls*100).toFixed(3);
    return `
      <tr>
        <td class="mono">${e.path}</td>
        <td>${fmt(e.calls)}</td>
        <td style="color:var(--amber)">${fmt(e4xx)}</td>
        <td style="color:var(--rose)">${fmt(e5xx)}</td>
        <td><span class="badge badge-${parseFloat(rate)>0.1?'amber':'green'}">${rate}%</span></td>
        <td style="color:var(--emerald);font-size:0.9rem">↓</td>
      </tr>
    `;
  }).join('');

  // Heatmap
  const hours = Array.from({length:24},(_,i)=> i%3===0?`${i}h`:'');
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const heatContainer = $('#heatmap');

  const headerRow = document.createElement('div');
  headerRow.className = 'heatmap-header';
  hours.forEach(h=> {
    const el = document.createElement('div');
    el.className = 'heatmap-hour';
    el.textContent = h;
    headerRow.appendChild(el);
  });
  heatContainer.appendChild(headerRow);

  dayNames.forEach(day => {
    const row = document.createElement('div');
    row.className = 'heatmap-row';
    const label = document.createElement('div');
    label.className = 'heatmap-label';
    label.textContent = day;
    row.appendChild(label);
    for(let h=0; h<24; h++){
      const isNight = h<6||h>22;
      const isPeak  = h>=9&&h<=18&&day!=='Sun'&&day!=='Sat';
      const v = isNight ? randomBetween(2,18) : isPeak ? randomBetween(60,100) : randomBetween(20,60);
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.title = `${day} ${h}:00 — ${v}% load`;
      cell.style.background = heatColor(v);
      row.appendChild(cell);
    }
    heatContainer.appendChild(row);
  });
}

function heatColor(v) {
  if(v < 20)  return 'rgba(108,127,255,0.12)';
  if(v < 40)  return 'rgba(108,127,255,0.3)';
  if(v < 60)  return 'rgba(255,107,26,0.35)';
  if(v < 80)  return 'rgba(255,107,26,0.6)';
  return 'rgba(255,77,109,0.75)';
}

// ─────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────
let clientsInited = false;
let filteredClients = [...CLIENTS];

function initClients() {
  if(clientsInited) return; clientsInited = true;
  renderClientsTable();

  $('#clientSearch').addEventListener('input', filterClients);
  $('#planFilter').addEventListener('change', filterClients);
  $('#statusFilter').addEventListener('change', filterClients);
  $('#selectAll').addEventListener('change', e => {
    $$('.row-checkbox').forEach(cb=> cb.checked = e.target.checked);
  });
  $('#exportClientsBtn').addEventListener('click', ()=> showToast('CSV export started — check your downloads','info'));
  $('#addClientBtn').addEventListener('click', ()=> openAddClientModal());
}

function filterClients() {
  const q    = $('#clientSearch').value.toLowerCase();
  const plan = $('#planFilter').value;
  const stat = $('#statusFilter').value;
  filteredClients = CLIENTS.filter(c=>
    (!q    || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
    (!plan || c.plan === plan) &&
    (!stat || c.status === stat)
  );
  renderClientsTable();
}

function renderClientsTable() {
  $('#clientCount').textContent = `${filteredClients.length} clients found`;
  $('#clientsTable').innerHTML = filteredClients.map(c=>`
    <tr>
      <td><input type="checkbox" class="row-checkbox checkbox" /></td>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${c.avatarColor}">${c.company[0]}</div>
          <div>
            <div class="client-name">${c.company}</div>
            <div class="client-email">${c.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${planBadge(c.plan)}">${c.plan}</span></td>
      <td>
        <div class="usage-mini">
          <div class="usage-mini-bar">
            <div class="usage-mini-fill" style="width:${Math.min(100,Math.round(c.calls/c.limit*100))}%;background:${usageColor(c.calls/c.limit)}"></div>
          </div>
          <div class="usage-mini-text">${fmt(c.calls)}</div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem">${fmt(c.limit)}/day</td>
      <td><span class="badge badge-${statusBadge(c.status)}">${c.status}</span></td>
      <td class="mrr-val" style="color:var(--emerald)">${c.mrr ? fmtINR(c.mrr) : '—'}</td>
      <td style="color:var(--text-muted);font-size:0.82rem">${c.joined}</td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn-icon" onclick="openClientModal('${c.id}')">👁</button>
          <button class="btn-icon" onclick="showToast('Plan upgrade email sent','info')">↑</button>
          <button class="btn-icon danger" onclick="suspendClient('${c.id}')">⊗</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function suspendClient(id) {
  const c = CLIENTS.find(x=>x.id===id);
  if(c) { c.status = c.status==='Suspended'?'Active':'Suspended'; renderClientsTable(); showToast(`${c.company} ${c.status.toLowerCase()}`,c.status==='Active'?'success':'error'); }
}

// ─────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────
let apiKeysInited = false;
let API_KEYS = CLIENTS.map(c=>({
  id: 'KEY-'+Math.random().toString(36).slice(2,8).toUpperCase(),
  clientId: c.id,
  company: c.company,
  preview: 'gi_live_'+Math.random().toString(36).slice(2,14)+'...',
  plan: c.plan,
  calls: c.calls,
  limit: c.limit,
  status: c.status==='Active'?'Active':'Revoked',
  created: c.joined,
}));

function initApiKeys() {
  if(apiKeysInited) return; apiKeysInited = true;

  const km = [
    { label:'Total API Keys', value:API_KEYS.length, icon:'⬡', color:'c-saffron' },
    { label:'Active Keys',    value:API_KEYS.filter(k=>k.status==='Active').length, icon:'✓', color:'c-emerald' },
    { label:'Revoked Keys',   value:API_KEYS.filter(k=>k.status==='Revoked').length, icon:'⊗', color:'c-rose' },
    { label:'Keys Near Limit',value:API_KEYS.filter(k=>k.calls/k.limit>0.9).length, icon:'⚠', color:'c-amber' },
  ];
  $('#keyMetrics').innerHTML = km.map(m=>`
    <div class="metric-card ${m.color}">
      <span class="metric-icon">${m.icon}</span>
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}</div>
    </div>
  `).join('');

  renderApiKeysTable(API_KEYS);

  $('#keySearch').addEventListener('input', e=>{
    const q = e.target.value.toLowerCase();
    renderApiKeysTable(API_KEYS.filter(k=> k.company.toLowerCase().includes(q) || k.preview.includes(q)));
  });

  $('#genKeyBtn').addEventListener('click', ()=>{
    showToast('New API key generated for demo client','success');
  });
}

function renderApiKeysTable(keys) {
  $('#apiKeysTable').innerHTML = keys.map(k=>`
    <tr>
      <td class="mono" style="color:var(--indigo)">${k.id}</td>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:#ff6b1a;font-size:0.7rem">${k.company[0]}</div>
          <span style="font-size:0.85rem">${k.company}</span>
        </div>
      </td>
      <td class="mono" style="font-size:0.78rem;color:var(--text-muted)">${k.preview}</td>
      <td><span class="badge badge-${planBadge(k.plan)}">${k.plan}</span></td>
      <td>
        <div class="usage-mini">
          <div class="usage-mini-bar">
            <div class="usage-mini-fill" style="width:${Math.min(100,Math.round(k.calls/k.limit*100))}%;background:${usageColor(k.calls/k.limit)}"></div>
          </div>
          <div class="usage-mini-text">${fmt(k.calls)} / ${fmt(k.limit)}</div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem">${fmt(k.limit)}/day</td>
      <td><span class="badge badge-${k.status==='Active'?'green':'rose'}">${k.status}</span></td>
      <td style="color:var(--text-muted);font-size:0.82rem">${k.created}</td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn-icon" onclick="showToast('Key copied to clipboard','success')">⎘</button>
          <button class="btn-icon danger" onclick="showToast('Key revoked','error')">⊗</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─────────────────────────────────────────────
// DATA MANAGER
// ─────────────────────────────────────────────
let dataInited = false;
function initDataManager() {
  if(dataInited) return; dataInited = true;

  const totalD = STATES_DATA.reduce((s,x)=>s+x.districts,0);
  const totalS = STATES_DATA.reduce((s,x)=>s+x.subDistricts,0);
  const totalV = STATES_DATA.reduce((s,x)=>s+x.villages,0);
  $('#dataCoverageOverview').innerHTML = [
    { label:'States & UTs Covered', value:36,    icon:'🗺',  color:'c-saffron' },
    { label:'Total Districts',      value:totalD, icon:'🏛',  color:'c-indigo'  },
    { label:'Total Sub-Districts',  value:totalS, icon:'🏘',  color:'c-amber'   },
    { label:'Total Villages',       value:totalV, icon:'🌾',  color:'c-emerald' },
  ].map(m=>`
    <div class="metric-card ${m.color}">
      <span class="metric-icon">${m.icon}</span>
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value.toLocaleString('en-IN')}</div>
    </div>
  `).join('');

  const synced = ['Synced','Synced','Synced','Pending','Synced','Synced'];
  $('#dataCoverageTable').innerHTML = STATES_DATA.map((s,i)=>`
    <tr>
      <td style="font-weight:600">${s.state}</td>
      <td>${s.districts}</td>
      <td>${s.subDistricts.toLocaleString('en-IN')}</td>
      <td>${s.villages.toLocaleString('en-IN')}</td>
      <td style="color:var(--text-muted);font-size:0.8rem">${i<3?'Today':i<8?'Yesterday':'3 days ago'}</td>
      <td><span class="badge badge-${synced[i%synced.length]==='Synced'?'green':'amber'}">${synced[i%synced.length]}</span></td>
    </tr>
  `).join('');

  // Import log
  const logs = [
    { time:'14:32', msg:'Imported Rajasthan sub-district data — 244 records', ok:true },
    { time:'11:15', msg:'Gujarat village sync completed — 18,584 villages indexed', ok:true },
    { time:'09:02', msg:'Bihar validation passed — no duplicates found', ok:true },
  ];
  $('#importLog').innerHTML = logs.map(l=>`
    <div class="import-log-item">
      <span class="log-time">${l.time}</span>
      <span class="log-msg ${l.ok?'log-ok':''}">${l.ok?'✓ ':''} ${l.msg}</span>
    </div>
  `).join('');

  $('#refreshDataBtn').addEventListener('click', ()=> showToast('Data refreshed successfully','success'));

  const zone = $('#importZone');
  zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.style.borderColor='var(--saffron)'; });
  zone.addEventListener('dragleave', ()=> zone.style.borderColor='');
  zone.addEventListener('drop', e=>{ e.preventDefault(); zone.style.borderColor=''; showToast('File received — processing...','info'); });
}

// ─────────────────────────────────────────────
// REQUEST LOGS
// ─────────────────────────────────────────────
let logsInited = false;
let liveMode = false;
let liveInterval;

function initLogs() {
  if(logsInited) return; logsInited = true;

  $('#logStatusRow').innerHTML = `
    <div class="log-indicator"><span class="log-dot live-dot" style="background:var(--emerald)"></span>Live</div>
    <div class="log-indicator"><span class="log-dot" style="background:var(--emerald)"></span>2xx: 98.1%</div>
    <div class="log-indicator"><span class="log-dot" style="background:var(--amber)"></span>4xx: 1.6%</div>
    <div class="log-indicator"><span class="log-dot" style="background:var(--rose)"></span>5xx: 0.3%</div>
  `;

  generateLogs();

  $('#liveToggle').addEventListener('click', ()=>{
    liveMode = !liveMode;
    $('#liveToggle').style.color = liveMode ? 'var(--emerald)' : '';
    if(liveMode) {
      liveInterval = setInterval(()=> {
        prependLog();
        const rows = $$('#logsTable tr');
        if(rows.length > 80) rows[rows.length-1].remove();
      }, 1200);
    } else {
      clearInterval(liveInterval);
    }
  });

  $('#logSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#logsTable tr').forEach(tr=> {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  $('#logStatusFilter').addEventListener('change', e=> {
    const code = e.target.value;
    $$('#logsTable tr').forEach(tr=> {
      tr.style.display = !code || tr.dataset.status===code ? '' : 'none';
    });
  });
}

const LOG_METHODS = ['GET'];
const LOG_IPS = ['103.24.182.11','59.178.22.4','49.36.91.200','157.45.110.82','106.51.74.3','122.161.52.90'];
const LOG_CLIENTS_SAMPLE = CLIENTS.slice(0,8).map(c=>c.company);

function makeLogEntry() {
  const ep   = ENDPOINTS[Math.floor(Math.random()*ENDPOINTS.length)];
  const code = Math.random()<0.981 ? 200 : Math.random()<0.85 ? [400,401,404,429][Math.floor(Math.random()*4)] : 500;
  const lat  = code===200 ? randomBetween(12,95) : randomBetween(5,30);
  const cached = code===200 && Math.random()<0.942;
  const client = LOG_CLIENTS_SAMPLE[Math.floor(Math.random()*LOG_CLIENTS_SAMPLE.length)];
  const ip     = LOG_IPS[Math.floor(Math.random()*LOG_IPS.length)];
  const now  = new Date();
  const time  = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  return { ep, code, lat, cached, client, ip, time };
}

function logRowHtml(l) {
  const statusCls = l.code===200?'status-200':l.code>=500?'status-5xx':'status-4xx';
  const latCls    = l.lat<50?'latency-fast':l.lat<80?'latency-mid':'latency-slow';
  return `<tr data-status="${l.code}">
    <td style="color:var(--text-dim)">${l.time}</td>
    <td style="font-family:inherit;font-size:0.78rem">${l.client}</td>
    <td class="${statusCls==='status-200'?'':''}"><span style="color:var(--teal)">${l.ep.path}</span></td>
    <td><span class="badge badge-teal">${l.ep.method}</span></td>
    <td class="${statusCls}" style="font-weight:700">${l.code}</td>
    <td class="${latCls}">${l.lat}ms</td>
    <td style="color:var(--text-dim)">${l.ip}</td>
    <td class="${l.cached?'cache-hit':'cache-miss'}">${l.cached?'HIT':'MISS'}</td>
  </tr>`;
}

function generateLogs() {
  $('#logsTable').innerHTML = Array.from({length:50},()=> logRowHtml(makeLogEntry())).join('');
}

function prependLog() {
  const l = makeLogEntry();
  const tr = document.createElement('tbody');
  tr.innerHTML = logRowHtml(l);
  const newRow = tr.firstChild;
  newRow.style.background='rgba(255,107,26,0.04)';
  $('#logsTable').prepend(newRow);
  setTimeout(()=> newRow.style.background='', 600);
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
let settingsInited = false;
function initSettings() {
  if(settingsInited) return; settingsInited = true;
  renderSettingsTab('general');

  $$('.settings-nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.settings-nav-item').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderSettingsTab(btn.dataset.tab);
    });
  });
}

function renderSettingsTab(tab) {
  const sc = $('#settingsContent');
  if(tab==='general') {
    sc.innerHTML = `
      <div class="settings-section-title">General Settings</div>
      <div class="settings-section-sub">Configure basic platform information and defaults</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Platform Name</label><input class="form-input" value="GeoIndia API" /></div>
        <div class="form-group"><label class="form-label">Support Email</label><input class="form-input" value="support@geoindia.api" /></div>
      </div>
      <div class="form-group"><label class="form-label">API Base URL</label><input class="form-input" value="https://api.geoindia.io/v1" /></div>
      <div class="form-group"><label class="form-label">Default Rate Limit (Free)</label><input class="form-input" value="1000" /><span class="form-hint">Requests per day for free tier accounts</span></div>
      <div class="settings-divider"></div>
      <div class="settings-section-title">Feature Flags</div>
      <div class="settings-section-sub">Toggle platform features on or off globally</div>
      ${[
        ['Fuzzy Search','Enable transliteration-aware search across village names', true],
        ['Autocomplete API','Allow clients to use the autocomplete endpoint', true],
        ['Bulk Export','Allow Pro/Unlimited clients to export full datasets', false],
        ['Self-Registration','Allow new B2B clients to register without admin approval', true],
        ['API Analytics','Enable per-client analytics dashboard', true],
      ].map(([name,desc,on])=>`
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-name">${name}</div>
            <div class="toggle-desc">${desc}</div>
          </div>
          <label class="form-toggle">
            <input type="checkbox" ${on?'checked':''} onchange="showToast('${name} ${on?'disabled':'enabled'}','info')">
            <span class="form-toggle-slider"></span>
          </label>
        </div>
      `).join('')}
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn-sm-primary" onclick="showToast('Settings saved successfully','success')">Save Changes</button>
        <button class="btn-sm-secondary">Reset to Defaults</button>
      </div>
    `;
  } else if(tab==='rate-limits') {
    sc.innerHTML = `
      <div class="settings-section-title">Rate Limit Configuration</div>
      <div class="settings-section-sub">Set daily API call limits per subscription tier</div>
      <div class="rate-limit-grid">
        ${Object.entries({Free:1000,Premium:50000,Pro:500000,Unlimited:9999999}).map(([tier,limit])=>`
          <div class="rate-card">
            <div class="rate-tier">${tier}</div>
            <div class="form-group">
              <label class="form-label">Daily Limit</label>
              <input class="form-input" value="${limit.toLocaleString('en-IN')}" type="number" />
            </div>
            <div class="form-group">
              <label class="form-label">Burst Limit (per minute)</label>
              <input class="form-input" value="${Math.round(limit/1440*5)}" type="number" />
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn-sm-primary" onclick="showToast('Rate limits updated','success')">Save Changes</button>
      </div>
    `;
  } else if(tab==='security') {
    sc.innerHTML = `
      <div class="settings-section-title">Security Settings</div>
      <div class="settings-section-sub">Manage authentication and access control</div>
      <div class="form-group"><label class="form-label">JWT Secret (last rotated: 14 days ago)</label><input class="form-input" type="password" value="••••••••••••••••••••••••••••••••" /></div>
      <div class="form-group"><label class="form-label">API Key Length</label><input class="form-input" value="32" type="number" /></div>
      <div class="form-group"><label class="form-label">JWT Expiry (hours)</label><input class="form-input" value="24" type="number" /></div>
      <div class="settings-divider"></div>
      ${[
        ['Require HTTPS','Reject all HTTP API requests', true],
        ['IP Whitelist Mode','Restrict API access to whitelisted IPs', false],
        ['Auto-revoke on Abuse','Automatically revoke keys exceeding 150% of limit', true],
        ['2FA for Admin Login','Require 2FA for admin panel access', false],
      ].map(([name,desc,on])=>`
        <div class="toggle-row">
          <div class="toggle-info"><div class="toggle-name">${name}</div><div class="toggle-desc">${desc}</div></div>
          <label class="form-toggle">
            <input type="checkbox" ${on?'checked':''} onchange="showToast('${name} updated','info')">
            <span class="form-toggle-slider"></span>
          </label>
        </div>
      `).join('')}
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn-sm-primary" onclick="showToast('Security settings saved','success')">Save Changes</button>
        <button class="btn-sm-secondary" onclick="showToast('JWT secret rotated','success')">Rotate JWT Secret</button>
      </div>
    `;
  } else if(tab==='notifications') {
    sc.innerHTML = `
      <div class="settings-section-title">Notification Settings</div>
      <div class="settings-section-sub">Configure alerting and email notifications</div>
      <div class="form-group"><label class="form-label">Admin Alert Email</label><input class="form-input" value="admin@geoindia.api" /></div>
      <div class="form-group"><label class="form-label">Alert Threshold — Error Rate (%)</label><input class="form-input" value="0.5" type="number" step="0.1" /></div>
      <div class="settings-divider"></div>
      ${[
        ['New Client Registration','Email when a new B2B client registers', true],
        ['Plan Upgrade','Alert when a client upgrades subscription', true],
        ['High Error Rate','Alert when error rate exceeds threshold', true],
        ['Rate Limit Breach','Alert when a client hits 100% of daily limit', true],
        ['Low Disk Space','Alert when NeonDB storage exceeds 80%', false],
        ['Weekly Digest','Send weekly platform summary every Monday', true],
      ].map(([name,desc,on])=>`
        <div class="toggle-row">
          <div class="toggle-info"><div class="toggle-name">${name}</div><div class="toggle-desc">${desc}</div></div>
          <label class="form-toggle">
            <input type="checkbox" ${on?'checked':''} onchange="showToast('${name} preference saved','info')">
            <span class="form-toggle-slider"></span>
          </label>
        </div>
      `).join('')}
      <div style="margin-top:24px">
        <button class="btn-sm-primary" onclick="showToast('Notification settings saved','success')">Save Changes</button>
      </div>
    `;
  } else if(tab==='billing') {
    sc.innerHTML = `
      <div class="settings-section-title">Billing Overview</div>
      <div class="settings-section-sub">Revenue metrics and subscription management</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
        ${[
          { label:'MRR', value:'₹18,42,301', color:'var(--emerald)' },
          { label:'ARR (projected)', value:'₹2.2 Cr', color:'var(--saffron)' },
          { label:'Active Subscriptions', value:'${CLIENTS.filter(c=>c.plan!=="Free"&&c.status==="Active").length}', color:'var(--indigo)' },
        ].map(b=>`
          <div class="rate-card" style="text-align:center">
            <div class="rate-tier">${b.label}</div>
            <div style="font-family:var(--font-head);font-size:1.6rem;font-weight:800;color:${b.color};margin-top:8px">${b.value}</div>
          </div>
        `).join('')}
      </div>
      <div class="form-group"><label class="form-label">Razorpay Key ID</label><input class="form-input" type="password" value="rzp_live_••••••••••••" /></div>
      <div class="form-group"><label class="form-label">Webhook Secret</label><input class="form-input" type="password" value="whsec_••••••••••••" /></div>
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn-sm-primary" onclick="showToast('Billing settings saved','success')">Save Changes</button>
        <button class="btn-sm-secondary" onclick="showToast('Webhook tested — 200 OK','success')">Test Webhook</button>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
function openClientModal(id) {
  const c = CLIENTS.find(x=>x.id===id);
  if(!c) return;
  $('#modalTitle').textContent = c.company;
  $('#modalBody').innerHTML = `
    <div class="client-detail-header">
      <div class="client-detail-avatar" style="background:${c.avatarColor}">${c.company[0]}</div>
      <div>
        <div style="font-family:var(--font-head);font-size:1.15rem;font-weight:800">${c.company}</div>
        <div style="color:var(--text-muted);font-size:0.84rem;margin-top:2px">${c.email}</div>
        <div style="margin-top:6px;display:flex;gap:8px">
          <span class="badge badge-${planBadge(c.plan)}">${c.plan}</span>
          <span class="badge badge-${statusBadge(c.status)}">${c.status}</span>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-key">Client ID</div><div class="detail-val mono" style="font-size:0.82rem">${c.id}</div></div>
      <div class="detail-item"><div class="detail-key">Contact</div><div class="detail-val">${c.contact}</div></div>
      <div class="detail-item"><div class="detail-key">API Calls Today</div><div class="detail-val" style="color:var(--saffron)">${fmt(c.calls)}</div></div>
      <div class="detail-item"><div class="detail-key">Daily Limit</div><div class="detail-val">${c.limit===Infinity?'Unlimited':fmt(c.limit)}</div></div>
      <div class="detail-item"><div class="detail-key">MRR</div><div class="detail-val" style="color:var(--emerald)">${c.mrr ? fmtINR(c.mrr) : '—'}</div></div>
      <div class="detail-item"><div class="detail-key">Joined</div><div class="detail-val">${c.joined}</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;font-weight:700">Usage Today</div>
      <div style="height:8px;background:var(--bg-3);border-radius:8px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100,Math.round(c.calls/c.limit*100))}%;background:${usageColor(c.calls/c.limit)};border-radius:8px;transition:width 0.8s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-muted);margin-top:6px">
        <span>${fmt(c.calls)} used</span>
        <span>${Math.min(100,Math.round(c.calls/c.limit*100))}%</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm-secondary" onclick="closeModal()">Close</button>
      <button class="btn-sm-secondary" onclick="showToast('Upgrade email sent to ${c.contact}','info');closeModal()">Send Upgrade Email</button>
      <button class="btn-sm-primary" onclick="showToast('${c.company} plan updated','success');closeModal()">Edit Plan</button>
    </div>
  `;
  $('#clientModal').classList.remove('hidden');
}

function openAddClientModal() {
  $('#modalTitle').textContent = 'Add New Client';
  $('#modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Company Name</label><input class="form-input" placeholder="e.g. Acme Logistics" /></div>
      <div class="form-group"><label class="form-label">Contact Name</label><input class="form-input" placeholder="e.g. Rahul Sharma" /></div>
    </div>
    <div class="form-group"><label class="form-label">Email Address</label><input class="form-input" placeholder="api@company.com" type="email" /></div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Subscription Plan</label>
        <select class="form-input select-sm" style="padding:10px 14px">
          <option>Free</option><option>Premium</option><option>Pro</option><option>Unlimited</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Account Status</label>
        <select class="form-input select-sm" style="padding:10px 14px">
          <option>Active</option><option>Pending</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Notes (optional)</label><input class="form-input" placeholder="Internal notes about this client..." /></div>
    <div class="modal-actions">
      <button class="btn-sm-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-sm-primary" onclick="showToast('New client created and API key generated','success');closeModal()">Create Client + Generate Key</button>
    </div>
  `;
  $('#clientModal').classList.remove('hidden');
}

function closeModal() {
  $('#clientModal').classList.add('hidden');
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function planBadge(plan) {
  return { Free:'muted', Premium:'indigo', Pro:'teal', Unlimited:'green' }[plan] || 'muted';
}
function statusBadge(status) {
  return { Active:'green', Suspended:'rose', Pending:'amber' }[status] || 'muted';
}
function usageColor(ratio) {
  if(ratio < 0.6) return 'var(--emerald)';
  if(ratio < 0.85) return 'var(--amber)';
  return 'var(--rose)';
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=> {

  // Nav items
  $$('.nav-item[data-page]').forEach(item=>{
    item.addEventListener('click', ()=> showPage(item.dataset.page));
  });

  // Hamburger
  $('#hamburgerBtn').addEventListener('click', ()=>{
    if($('#sidebar').classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  $('#sidebarOverlay').addEventListener('click', closeSidebar);

  // Modal close
  $('#modalClose').addEventListener('click', closeModal);
  $('#clientModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(); });

  // Time filter buttons
  $$('.time-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.time-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`Showing data for ${btn.dataset.range}`,'info');
    });
  });

  // Global search
  $('#globalSearch').addEventListener('input', e=>{
    const q = e.target.value.trim();
    if(q.length > 2) {
      const matched = CLIENTS.find(c=> c.company.toLowerCase().includes(q.toLowerCase()));
      if(matched) showToast(`Found: ${matched.company}`,'info');
    }
  });

  // Resize: redraw charts on window resize
  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>{
      if(currentPage==='dashboard') dashboardInited=false, initDashboard();
      if(currentPage==='analytics')  analyticsInited=false, initAnalytics();
    }, 300);
  });

  // Init first page
  showPage('dashboard');
});