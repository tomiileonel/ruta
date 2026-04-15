# PATCH rut.html — Sección #emblematicos

## 1. Reemplazar bloque `.embl-tabs` (agregar 2 tabs nuevos)

### BUSCAR:
```html
      <div class="embl-tabs">
        <button class="embl-tab active" data-cat="entretenimiento" onclick="switchEmblTab(this, 'entretenimiento')">
          <span class="embl-tab-icon">🎪</span> Entretenimiento
        </button>
        <button class="embl-tab" data-cat="campings" onclick="switchEmblTab(this, 'campings')">
          <span class="embl-tab-icon">🌱</span> Campings Agroecológicos
        </button>
        <button class="embl-tab" data-cat="estudiantil" onclick="switchEmblTab(this, 'estudiantil')">
          <span class="embl-tab-icon">🎓</span> Turismo Estudiantil
        </button>
        <button class="embl-tab" data-cat="museos" onclick="switchEmblTab(this, 'museos')">
          <span class="embl-tab-icon">🏛️</span> Museos
        </button>
      </div>
```

### REEMPLAZAR CON:
```html
      <div class="embl-tabs">
        <button class="embl-tab active" data-cat="entretenimiento" onclick="switchEmblTab(this, 'entretenimiento')"
                role="tab" aria-selected="true" aria-controls="panel-entretenimiento">
          <span class="embl-tab-icon">🎪</span> Entretenimiento
        </button>
        <button class="embl-tab" data-cat="campings" onclick="switchEmblTab(this, 'campings')"
                role="tab" aria-selected="false" aria-controls="panel-campings">
          <span class="embl-tab-icon">🌱</span> Campings Agroecológicos
        </button>
        <button class="embl-tab" data-cat="estudiantil" onclick="switchEmblTab(this, 'estudiantil')"
                role="tab" aria-selected="false" aria-controls="panel-estudiantil">
          <span class="embl-tab-icon">🎓</span> Turismo Estudiantil
        </button>
        <button class="embl-tab" data-cat="museos" onclick="switchEmblTab(this, 'museos')"
                role="tab" aria-selected="false" aria-controls="panel-museos">
          <span class="embl-tab-icon">🏛️</span> Museos
        </button>
        <button class="embl-tab" data-cat="parques" onclick="switchEmblTab(this, 'parques')"
                role="tab" aria-selected="false" aria-controls="panel-parques">
          <span class="embl-tab-icon">🌲</span> Parques Provinciales
        </button>
        <button class="embl-tab" data-cat="peloteros" onclick="switchEmblTab(this, 'peloteros')"
                role="tab" aria-selected="false" aria-controls="panel-peloteros">
          <span class="embl-tab-icon">🎈</span> Peloteros &amp; Salones
        </button>
      </div>
```

---

## 2. Agregar 2 paneles nuevos DESPUÉS del bloque `<div class="embl-panel" id="panel-museos">`

### AGREGAR INMEDIATAMENTE DESPUÉS DE:
```html
      <div class="embl-panel" id="panel-museos">
        <div class="embl-grid" id="grid-museos"></div>
      </div>
```

### INSERTAR:
```html
      <div class="embl-panel" id="panel-parques" role="tabpanel" aria-hidden="true">
        <div class="embl-grid" id="grid-parques"></div>
      </div>
      <div class="embl-panel" id="panel-peloteros" role="tabpanel" aria-hidden="true">
        <div class="embl-grid" id="grid-peloteros"></div>
      </div>
```

---

## 3. Actualizar stats bar (optional — actualizar números)

### BUSCAR y REEMPLAZAR valores en `.embl-stats-bar`:
- `24+` → `41+` (lugares emblemáticos totales)
- `4` → `6` (categorías turísticas)
- `15+` → `20+` (municipios representados)
