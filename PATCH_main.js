// ─── PATCH main.js ───────────────────────────────────────────────────────────
// Función renderEmblCards — reemplazar COMPLETA en main.js

function renderEmblCards() {
  const cats = ['entretenimiento', 'campings', 'estudiantil', 'museos', 'parques', 'peloteros'];
  const catLabels = {
    entretenimiento:  'Entretenimiento',
    campings:         'Camping Agroecológico',
    estudiantil:      'Turismo Estudiantil',
    museos:           'Museo',
    parques:          'Parque Provincial',
    peloteros:        'Pelotero · Salón Infantil'
  };
  cats.forEach(cat => {
    const grid = document.getElementById('grid-' + cat);
    if (!grid) return;
    const items = LUGARES_EMBLEMATICOS.filter(l => l.cat === cat);
    grid.innerHTML = items.map(l => `
      <div class="embl-card" data-cat="${l.cat}"
           onclick="openMunicipioFromMap('${l.municipio.replace(/'/g, "\\'")}')"
           role="article" tabindex="0"
           aria-label="${l.name} en ${l.municipio}"
           onkeydown="if(event.key==='Enter')openMunicipioFromMap('${l.municipio.replace(/'/g, "\\'")}')">
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
