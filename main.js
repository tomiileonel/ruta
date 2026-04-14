// ═══════════════════════════════════════════════════════════════
//  RNA MISIONES — MAIN APPLICATION
//  Ruta de la Niñez y la Adolescencia de Misiones
//  Refactored: Modular, async data loading, a11y, clustering
// ═══════════════════════════════════════════════════════════════

// ─── GLOBAL STATE ────────────────────────────────────────────
let traducciones = {};
let MUNICIPIOS_COORDS = [];
let CAMPINGS_DATA = [];
let LUGARES_EMBLEMATICOS = [];
let MUNICIPIOS = [];
let ALL_MUNICIPIOS_NAMES = [];
let mapaMisiones = null;
let mapaPreview = null;
let mapaPreviewInitialized = false;
let clusterGroupExplorer = null;
let clusterGroupPreview = null;
let currentLang = 'es';
let activeFilter = 'todos';
let searchDebounceTimer = null;

// ─── DATA LOADING ────────────────────────────────────────────
async function loadAppData() {
  try {
    const [municipiosData, campingsData, lugaresData, traduccionesData] = await Promise.all([
      fetch('data/municipios.json').then(r => { if (!r.ok) throw new Error('municipios.json'); return r.json(); }),
      fetch('data/campings.json').then(r => { if (!r.ok) throw new Error('campings.json'); return r.json(); }),
      fetch('data/lugares-emblematicos.json').then(r => { if (!r.ok) throw new Error('lugares-emblematicos.json'); return r.json(); }),
      fetch('data/traducciones.json').then(r => { if (!r.ok) throw new Error('traducciones.json'); return r.json(); })
    ]);

    MUNICIPIOS_COORDS = municipiosData;
    CAMPINGS_DATA = campingsData;
    LUGARES_EMBLEMATICOS = lugaresData;
    traducciones = traduccionesData;
    ALL_MUNICIPIOS_NAMES = MUNICIPIOS_COORDS.map(m => m.name);

    MUNICIPIOS = MUNICIPIOS_COORDS.map(coord => ({
      name: coord.name,
      region: coord.region || 'Misiones, Argentina',
      count: Math.floor(2 + Math.random() * 15),
      icon: '📍',
      emprendimientos: [],
      lat: coord.lat,
      lng: coord.lng
    }));

    console.log('✅ RNA Data loaded:', {
      municipios: MUNICIPIOS.length,
      campings: CAMPINGS_DATA.length,
      lugares: LUGARES_EMBLEMATICOS.length,
      idiomas: Object.keys(traducciones).length
    });

    return true;
  } catch (error) {
    console.error('❌ Error loading data:', error);
    return false;
  }
}

// ─── APP INITIALIZATION ──────────────────────────────────────
async function initApp() {
  const dataLoaded = await loadAppData();
  if (!dataLoaded) {
    console.error('App initialization aborted: data load failed');
    return;
  }

  // Populate municipality selects
  populateMuniSelects();

  // Initialize language
  const savedLang = localStorage.getItem('rna_idioma') || 'es';
  setLang(null, savedLang);

  // Initialize preview map with lazy loading (IntersectionObserver)
  setupLazyMap();

  // Render emblematic cards
  renderEmblCards();

  // Setup scroll reveal
  setupScrollReveal();

  // Setup counter animation
  setupCounterAnimation();

  // Spawn leaves
  spawnLeaves();

  // Nav scroll behavior
  setupNavScroll();
}

// ─── NAV SCROLL ──────────────────────────────────────────────
function setupNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── MOBILE MENU ─────────────────────────────────────────────
function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.nav-hamburger');
  const isOpen = links.style.display === 'flex';

  links.style.display = isOpen ? 'none' : 'flex';
  if (hamburger) hamburger.setAttribute('aria-expanded', String(!isOpen));

  if (!isOpen) {
    Object.assign(links.style, {
      flexDirection: 'column', position: 'fixed',
      top: '72px', left: '0', right: '0',
      background: 'rgba(13,43,26,0.98)', padding: '24px 5vw',
      gap: '16px', zIndex: '999'
    });
  }
}

// ─── LEAF ANIMATION ──────────────────────────────────────────
const LEAF_SVGS = [
  `<svg width="22" height="28" viewBox="0 0 22 28"><path d="M11,2 Q18,5 20,14 Q18,22 11,26 Q4,22 2,14 Q4,5 11,2Z" fill="rgba(116,198,157,0.35)"/></svg>`,
  `<svg width="18" height="24" viewBox="0 0 18 24"><path d="M9,1 Q16,6 16,12 Q13,20 9,23 Q5,20 2,12 Q2,6 9,1Z" fill="rgba(74,198,157,0.25)"/></svg>`,
  `<svg width="28" height="16" viewBox="0 0 28 16"><ellipse cx="14" cy="8" rx="13" ry="7" fill="rgba(116,198,157,0.2)"/></svg>`,
];

function spawnLeaves() {
  const container = document.getElementById('hero-leaves');
  if (!container) return;
  for (let i = 0; i < 14; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.setAttribute('aria-hidden', 'true');
    leaf.innerHTML = LEAF_SVGS[i % LEAF_SVGS.length];
    leaf.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${12 + Math.random() * 18}s;
      animation-delay: ${Math.random() * 20}s;
    `;
    container.appendChild(leaf);
  }
}

// ─── SCROLL REVEAL ───────────────────────────────────────────
function setupScrollReveal() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ─── TOOLTIP (MAP PREVIEW) ──────────────────────────────────
function showTooltip(e, text) {
  const tt = document.getElementById('mapa-tooltip');
  if (!tt) return;
  const svg = e.target.closest('svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const cx = parseFloat(e.target.getAttribute('cx'));
  const cy = parseFloat(e.target.getAttribute('cy'));
  const vb = svg.viewBox.baseVal;
  const scaleX = rect.width / vb.width;
  const scaleY = rect.height / vb.height;
  tt.style.left = (cx * scaleX) + 'px';
  tt.style.top = (cy * scaleY) + 'px';
  tt.textContent = text;
  tt.style.opacity = '1';
}

function hideTooltip() {
  const tt = document.getElementById('mapa-tooltip');
  if (tt) tt.style.opacity = '0';
}

// ─── MAP FILTERS ─────────────────────────────────────────────
function filterMap(btn, type) {
  btn.closest('.mapa-filters').querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
}

function setExpFilter(btn, type) {
  btn.closest('.exp-filter-pills').querySelectorAll('.exp-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = type;

  // Sync map markers with filter
  syncMapWithFilters();

  // Update active filter badges
  updateFilterBadges();
}

function syncMapWithFilters() {
  if (!mapaMisiones || !clusterGroupExplorer) return;
  // Currently all municipios are shown; in future, filter by category of emprendimientos
  // For now, update the sidebar list visibility
  const searchInput = document.getElementById('muni-search');
  const query = searchInput ? searchInput.value.toLowerCase() : '';
  filterMunicipiosList(query);
}

function updateFilterBadges() {
  const container = document.getElementById('active-filters-container');
  if (!container) return;
  if (activeFilter === 'todos') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  const labels = {
    alojamiento: '🏡 Alojamientos', gastronomia: '🍽️ Gastronomía',
    cultura: '🎭 Cultura', naturaleza: '🌲 Naturaleza', servicios: '⚙️ Servicios'
  };
  container.style.display = 'flex';
  container.innerHTML = `
    <span class="active-filter-chip">
      ${labels[activeFilter] || activeFilter}
      <button onclick="clearFilters()" aria-label="Quitar filtro">&times;</button>
    </span>
  `;
}

function clearFilters() {
  activeFilter = 'todos';
  document.querySelectorAll('.exp-filter-pill').forEach(p => p.classList.remove('active'));
  const allBtn = document.querySelector('.exp-filter-pill');
  if (allBtn) allBtn.classList.add('active');
  updateFilterBadges();
  syncMapWithFilters();
}

// ─── LANGUAGE SWITCHER ───────────────────────────────────────
function toggleLangDropdown(event, el) {
  event.stopPropagation();
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.lang-switcher').forEach(switcher => {
    if (switcher !== el) switcher.classList.remove('open');
  });
  el.classList.toggle('open');

  // ARIA
  const toggle = el.querySelector('.lang-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(!isOpen));
}

document.addEventListener('click', () => {
  document.querySelectorAll('.lang-switcher').forEach(s => {
    s.classList.remove('open');
    const toggle = s.querySelector('.lang-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
});

function setLang(event, lang) {
  if (event) event.stopPropagation();
  currentLang = lang;
  const targetText = lang.toUpperCase();

  // 1. Update dropdown visual state
  document.querySelectorAll('.lang-switcher').forEach(switcher => {
    switcher.classList.remove('open');
    switcher.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.remove('active');
      if (opt.textContent.trim() === targetText) opt.classList.add('active');
    });
    const currentSpan = switcher.querySelector('.lang-current');
    if (currentSpan) currentSpan.textContent = targetText;
    const toggle = switcher.querySelector('.lang-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });

  // 2. Apply translations to DOM (using textContent for safety, innerHTML only when needed)
  if (traducciones[lang]) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const keys = el.getAttribute('data-i18n').split('.');
      let translation = traducciones[lang];

      keys.forEach(k => {
        if (translation) translation = translation[k];
      });

      if (translation) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else if (el.hasAttribute('data-i18n-html')) {
          // Explicitly marked elements can use innerHTML
          el.innerHTML = translation;
        } else {
          // Safe: use textContent to prevent XSS
          el.textContent = translation;
        }
      }
    });

    // 3. Translate meta tags
    const meta = traducciones[lang].meta;
    if (meta) {
      if (meta.title) document.title = meta.title;
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta && meta.description) descMeta.setAttribute('content', meta.description);
    }
  }

  // 4. Save preference and update lang attribute
  localStorage.setItem('rna_idioma', lang);
  document.documentElement.lang = lang;
}

// ─── LAZY MAP LOADING ────────────────────────────────────────
function setupLazyMap() {
  const previewSection = document.getElementById('mapa-preview');
  if (!previewSection) return;

  // Show placeholder
  const mapContainer = document.getElementById('mapa-interactivo-preview');
  if (mapContainer && !mapaPreviewInitialized) {
    mapContainer.innerHTML = `
      <div class="map-loading-placeholder" aria-label="Cargando mapa interactivo">
        <div class="map-skeleton-pulse"></div>
        <div class="map-loading-text">
          <span class="map-loading-icon" aria-hidden="true">🗺️</span>
          <span>Cargando mapa interactivo...</span>
        </div>
      </div>
    `;
  }

  const mapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !mapaPreviewInitialized) {
        mapaPreviewInitialized = true;
        // Small delay to ensure smooth scrolling first
        setTimeout(() => initMapaPreview(), 200);
        mapObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '200px' });

  mapObserver.observe(previewSection);
}

// ─── LEAFLET MAP — PREVIEW ───────────────────────────────────
function initMapaPreview() {
  const container = document.getElementById('mapa-interactivo-preview');
  if (!container || mapaPreview) return;

  // Clear placeholder
  container.innerHTML = '';

  mapaPreview = L.map('mapa-interactivo-preview', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false
  }).setView([-26.9, -54.9], 6);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(mapaPreview);

  // Use MarkerClusterGroup if available
  const useCluster = typeof L.markerClusterGroup === 'function';
  clusterGroupPreview = useCluster ? L.markerClusterGroup({
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size = 'small';
      if (count > 20) size = 'large';
      else if (count > 10) size = 'medium';
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size} rna-cluster`,
        iconSize: L.point(40, 40)
      });
    }
  }) : null;

  MUNICIPIOS.forEach(muni => {
    const isCap = muni.name === 'Posadas';
    const marker = L.circleMarker([muni.lat, muni.lng], {
      color: '#1A3D28', weight: 1.5,
      fillColor: isCap ? '#F4803C' : '#74C69D',
      fillOpacity: 0.9, radius: isCap ? 6 : 4
    });

    marker.bindTooltip(`<strong>${muni.name}</strong>`, { direction: 'top', offset: [0, -10], className: 'mapa-tooltip-rna' });
    marker.on('click', () => { openMunicipioFromMap(muni.name); });

    if (clusterGroupPreview) clusterGroupPreview.addLayer(marker);
    else marker.addTo(mapaPreview);
  });

  // Camping markers
  CAMPINGS_DATA.forEach(camping => {
    const m = L.circleMarker([camping.lat, camping.lng], {
      color: '#8B4513', weight: 1.5, fillColor: '#E8832A', fillOpacity: 0.9, radius: 5
    });
    m.bindTooltip(`🏕️ <strong>${camping.name}</strong>`, { direction: 'top', offset: [0, -10], className: 'mapa-tooltip-rna' });
    if (clusterGroupPreview) clusterGroupPreview.addLayer(m);
    else m.addTo(mapaPreview);
  });

  // Emblematic places
  const emblColors = { entretenimiento: '#7B5EA7', campings: '#2D6B4A', estudiantil: '#2D94C4', museos: '#DAA520' };
  LUGARES_EMBLEMATICOS.forEach(lugar => {
    const m = L.circleMarker([lugar.lat, lugar.lng], {
      color: '#333', weight: 1, fillColor: emblColors[lugar.cat], fillOpacity: 0.85, radius: 4
    });
    m.bindTooltip(`${lugar.icon} <strong>${lugar.name}</strong>`, { direction: 'top', offset: [0, -8], className: 'mapa-tooltip-rna' });
    if (clusterGroupPreview) clusterGroupPreview.addLayer(m);
    else m.addTo(mapaPreview);
  });

  if (clusterGroupPreview) mapaPreview.addLayer(clusterGroupPreview);
}

// ─── LEAFLET MAP — EXPLORER ──────────────────────────────────
function initMapaExplorer() {
  const container = document.getElementById('mapa-interactivo-misiones');
  if (!container || mapaMisiones) return;

  mapaMisiones = L.map('mapa-interactivo-misiones', { scrollWheelZoom: false }).setView([-26.9, -54.9], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18, minZoom: 6,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(mapaMisiones);

  // Use MarkerClusterGroup if available
  const useCluster = typeof L.markerClusterGroup === 'function';
  clusterGroupExplorer = useCluster ? L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size = 'small';
      if (count > 20) size = 'large';
      else if (count > 10) size = 'medium';
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size} rna-cluster`,
        iconSize: L.point(44, 44)
      });
    }
  }) : null;

  MUNICIPIOS.forEach(muni => {
    const isCap = muni.name === 'Posadas';
    const marker = L.circleMarker([muni.lat, muni.lng], {
      color: '#1A3D28', weight: 1.5,
      fillColor: isCap ? '#F4803C' : '#74C69D',
      fillOpacity: 0.9, radius: isCap ? 8 : 5
    });

    marker.bindTooltip(`<strong>${muni.name}</strong>`, { direction: 'top', offset: [0, -10], className: 'mapa-tooltip-rna' });
    marker.on('click', () => { openMunicipioDetail(muni.name); });
    muni.markerMisiones = marker;

    if (clusterGroupExplorer) clusterGroupExplorer.addLayer(marker);
    else marker.addTo(mapaMisiones);
  });

  // Camping markers
  CAMPINGS_DATA.forEach(camping => {
    const cMarker = L.circleMarker([camping.lat, camping.lng], {
      color: '#8B4513', weight: 1.5, fillColor: '#E8832A', fillOpacity: 0.9, radius: 7
    });
    cMarker.bindTooltip(`🏕️ <strong>${camping.name}</strong><br><span style="font-size:0.75rem;opacity:0.7">${camping.municipio}</span>`, { direction: 'top', offset: [0, -10], className: 'mapa-tooltip-rna' });
    cMarker.on('click', () => { openMunicipioDetail(camping.municipio); });

    if (clusterGroupExplorer) clusterGroupExplorer.addLayer(cMarker);
    else cMarker.addTo(mapaMisiones);
  });

  // Emblematic places markers
  const emblColors = { entretenimiento: '#7B5EA7', campings: '#2D6B4A', estudiantil: '#2D94C4', museos: '#DAA520' };
  LUGARES_EMBLEMATICOS.forEach(lugar => {
    const eMarker = L.circleMarker([lugar.lat, lugar.lng], {
      color: '#333', weight: 1, fillColor: emblColors[lugar.cat], fillOpacity: 0.85, radius: 6
    });
    eMarker.bindTooltip(`${lugar.icon} <strong>${lugar.name}</strong><br><span style="font-size:0.75rem;opacity:0.7">${lugar.municipio}</span>`, { direction: 'top', offset: [0, -10], className: 'mapa-tooltip-rna' });
    eMarker.on('click', () => { openMunicipioDetail(lugar.municipio); });

    if (clusterGroupExplorer) clusterGroupExplorer.addLayer(eMarker);
    else eMarker.addTo(mapaMisiones);
  });

  if (clusterGroupExplorer) mapaMisiones.addLayer(clusterGroupExplorer);
}

// ─── POPULATE SELECTS ────────────────────────────────────────
function populateMuniSelects() {
  const selects = document.querySelectorAll('.form-select-muni');
  const optionsHtml = ALL_MUNICIPIOS_NAMES.map(m => `<option value="${m}">${m}</option>`).join('');
  selects.forEach(sel => {
    sel.innerHTML += optionsHtml;
  });
}

// ─── LANDING SWITCHING ───────────────────────────────────────
function openExplorador() {
  document.getElementById('landing-home').classList.remove('active');
  document.getElementById('landing-explorador').classList.add('active');
  window.scrollTo(0, 0);
  renderMunicipiosList();

  setTimeout(() => {
    initMapaExplorer();
    if (mapaMisiones) {
      mapaMisiones.invalidateSize();
    }
  }, 150);
}

function closeExplorador() {
  document.getElementById('landing-explorador').classList.remove('active');
  document.getElementById('landing-home').classList.add('active');
  window.scrollTo(0, 0);
}

// ─── MUNICIPALITY LIST ───────────────────────────────────────
function renderMunicipiosList() {
  const container = document.getElementById('municipios-list-container');
  if (!container) return;
  container.innerHTML = MUNICIPIOS.map(m => `
    <button class="exp-municipio-btn" onclick="openMunicipioDetail('${m.name.replace(/'/g, "\\'")}')"
            aria-label="Ver detalles de ${m.name}">
      <span class="exp-muni-dot" aria-hidden="true"></span>
      <span style="flex:1">${m.name}</span>
      <span class="exp-muni-count" aria-label="${m.count} emprendimientos">${m.count}</span>
    </button>
  `).join('');
}

function openMunicipioFromMap(name) {
  openExplorador();
  setTimeout(() => openMunicipioDetail(name), 100);
}

function openMunicipioDetail(name) {
  const muni = MUNICIPIOS.find(m => m.name === name) ||
    { name, region: 'Misiones, Argentina', count: Math.floor(5 + Math.random() * 20), icon: '🏘️', emprendimientos: [] };

  document.getElementById('exp-map-view').style.display = 'none';
  const detail = document.getElementById('exp-municipio-detail');
  detail.classList.add('visible');
  detail.setAttribute('aria-live', 'polite');

  document.getElementById('muni-detail-name').textContent = muni.name;
  document.getElementById('muni-detail-region').textContent = muni.region;
  document.getElementById('muni-stat-1').textContent = muni.count;
  document.getElementById('muni-stat-2').textContent = Math.min(8, Math.ceil(muni.count / 3));
  document.getElementById('muni-stat-3').textContent = '★ ' + (4.4 + Math.random() * 0.6).toFixed(1);

  // Pre-fill modal municipio
  const sel = document.getElementById('modal-municipio-select');
  if (sel) { for (let opt of sel.options) { if (opt.value === name) { sel.value = name; break; } } }

  const grid = document.getElementById('muni-emprendimientos-grid');
  const emprs = muni.emprendimientos.length ? muni.emprendimientos : [
    { cat: 'Por confirmar', name: 'Emprendimiento Local', desc: 'Próximamente disponible en el directorio.', icon: muni.icon || '🏘️' }
  ];
  grid.innerHTML = emprs.map(e => `
    <div class="empr-card">
      <div class="empr-img"><span aria-hidden="true">${e.icon}</span></div>
      <div class="empr-body">
        <div class="empr-cat">${e.cat}</div>
        <div class="empr-name">${e.name}</div>
        <div class="empr-desc">${e.desc}</div>
      </div>
    </div>
  `).join('');

  // Campings
  const muniCampings = CAMPINGS_DATA.filter(c => c.municipio === name);
  const campingsSection = document.getElementById('muni-campings-section');
  const campingsGrid = document.getElementById('muni-campings-grid');

  if (muniCampings.length > 0) {
    campingsSection.style.display = 'block';
    campingsGrid.innerHTML = muniCampings.map(c => `
      <div class="camping-card">
        <div class="camping-card-body">
          <div class="camping-card-name"><span aria-hidden="true">🏕️</span> ${c.name}</div>
          <div class="camping-card-desc">${c.desc}</div>
          <div class="camping-card-badge"><span aria-hidden="true">📍</span> ${c.municipio} · Misiones</div>
        </div>
      </div>
    `).join('');
  } else {
    campingsSection.style.display = 'none';
    campingsGrid.innerHTML = '';
  }

  document.querySelectorAll('.exp-municipio-btn').forEach(btn =>
    btn.classList.toggle('active', btn.textContent.includes(name))
  );
}

function backToMap() {
  document.getElementById('exp-map-view').style.display = '';
  document.getElementById('exp-municipio-detail').classList.remove('visible');
  document.querySelectorAll('.exp-municipio-btn').forEach(b => b.classList.remove('active'));
  if (mapaMisiones) mapaMisiones.invalidateSize();
}

// ─── SEARCH WITH DEBOUNCE ────────────────────────────────────
function searchMunicipios(query) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    filterMunicipiosList(query.toLowerCase());
  }, 300); // 300ms debounce
}

function filterMunicipiosList(q) {
  document.querySelectorAll('.exp-municipio-btn').forEach(btn => {
    btn.style.display = btn.textContent.toLowerCase().includes(q) ? '' : 'none';
  });

  // Sync with map markers
  if (mapaMisiones && clusterGroupExplorer) {
    // When using clusters, we can't easily hide/show individual markers
    // Instead, zoom to matching results
    if (q.length >= 2) {
      const matching = MUNICIPIOS.filter(m => m.name.toLowerCase().includes(q));
      if (matching.length === 1) {
        mapaMisiones.setView([matching[0].lat, matching[0].lng], 12, { animate: true });
      } else if (matching.length > 1 && matching.length < MUNICIPIOS.length) {
        const bounds = L.latLngBounds(matching.map(m => [m.lat, m.lng]));
        mapaMisiones.fitBounds(bounds, { padding: [30, 30], animate: true });
      }
    } else if (q.length === 0) {
      mapaMisiones.setView([-26.9, -54.9], 7, { animate: true });
    }
  } else if (mapaMisiones) {
    // Fallback without clusters
    MUNICIPIOS.forEach(muni => {
      if (muni.markerMisiones) {
        if (muni.name.toLowerCase().includes(q)) {
          if (!mapaMisiones.hasLayer(muni.markerMisiones)) {
            muni.markerMisiones.addTo(mapaMisiones);
          }
        } else {
          if (mapaMisiones.hasLayer(muni.markerMisiones)) {
            muni.markerMisiones.remove();
          }
        }
      }
    });
  }
}

// ─── MODAL ───────────────────────────────────────────────────
function openAdhesionModal() {
  const modal = document.getElementById('adhesion-modal');
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus trap - focus first input
  setTimeout(() => {
    const firstInput = modal.querySelector('input:not([type="checkbox"]), select');
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeAdhesionModal() {
  const modal = document.getElementById('adhesion-modal');
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('adhesion-modal')) closeAdhesionModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdhesionModal(); });

function handleModalSubmit(e) {
  e.preventDefault();
  document.getElementById('modal-form-content').style.display = 'none';
  const success = document.getElementById('modal-success');
  success.classList.add('visible');
  success.setAttribute('aria-live', 'assertive');
}

function handleContactSubmit(e) {
  e.preventDefault();
  document.getElementById('contact-form-content').style.display = 'none';
  const success = document.getElementById('contact-success');
  success.style.display = 'block';
  success.setAttribute('aria-live', 'assertive');
}

// ─── COUNTER ANIMATION ──────────────────────────────────────
function setupCounterAnimation() {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => {
          const raw = el.getAttribute('data-count');
          const num = parseInt(raw);
          const suffix = raw.includes('+') ? '+' : '';
          animateCounter(el, num, suffix);
        });
        statsObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.hero-stats').forEach(el => statsObserver.observe(el));
}

function animateCounter(el, target, suffix = '') {
  const start = performance.now();
  const duration = 1800;
  const isPlus = suffix.includes('+');
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + (isPlus && progress > 0.5 ? '+' : '');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + (isPlus ? '+' : '');
  }
  requestAnimationFrame(step);
}

// ─── EMBLEMATIC PLACES ───────────────────────────────────────
function renderEmblCards() {
  const cats = ['entretenimiento', 'campings', 'estudiantil', 'museos'];
  const catLabels = { entretenimiento: 'Entretenimiento', campings: 'Camping Agroecológico', estudiantil: 'Turismo Estudiantil', museos: 'Museo' };
  cats.forEach(cat => {
    const grid = document.getElementById('grid-' + cat);
    if (!grid) return;
    const items = LUGARES_EMBLEMATICOS.filter(l => l.cat === cat);
    grid.innerHTML = items.map(l => `
      <div class="embl-card" data-cat="${l.cat}" onclick="openMunicipioFromMap('${l.municipio.replace(/'/g, "\\'")}')"
           role="article" tabindex="0" aria-label="${l.name} en ${l.municipio}">
        <div class="embl-card-img"><span aria-hidden="true">${l.icon}</span></div>
        <div class="embl-card-body">
          <div class="embl-card-cat">${catLabels[l.cat]}</div>
          <div class="embl-card-name">${l.name}</div>
          <div class="embl-card-location"><span aria-hidden="true">📍</span> ${l.municipio}, Misiones</div>
          <div class="embl-card-desc">${l.desc}</div>
          <div class="embl-card-link">Explorar <span aria-hidden="true">→</span></div>
        </div>
      </div>
    `).join('');
  });
}

function switchEmblTab(btn, cat) {
  document.querySelectorAll('.embl-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.embl-panel').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  const panel = document.getElementById('panel-' + cat);
  if (panel) {
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
  }
}

// ─── INIT ON DOM READY ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);