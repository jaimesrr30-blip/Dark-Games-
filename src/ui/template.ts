export const UI_TEMPLATE = `
<div id="loading-screen">
  <div class="spinner"></div>
  <h2>Cargando...</h2>
  <div id="loading-detail">Generando etapas</div>
</div>

<div id="main-menu">
  <h1>PILOTO CÚBICO</h1>
  <p>Viaja por etapas llenas de misiones, jefes y partidos de fútbol con coches.
  Recoge mascotas de todas las rarezas para desbloquear poderes especiales en el campo.</p>
  <div id="main-menu-buttons">
    <button class="btn-arrow primary interactive" id="btn-new-game">Nueva Partida <span class="arrow-icon">➤</span></button>
    <button class="btn-arrow interactive" id="btn-continue-game">Continuar <span class="arrow-icon">➤</span></button>
  </div>
</div>

<div id="hud-top-left">
  <div id="minimap-wrap" class="panel">
    <canvas id="minimap-canvas" width="300" height="300"></canvas>
    <div id="minimap-region-label">Plaza Central</div>
  </div>
</div>

<div id="hud-top-right">
  <div class="currency-row">
    <div class="currency-pill panel"><span class="icon icon-coin"></span><span id="hud-coins">0</span></div>
    <div class="currency-pill panel"><span class="icon icon-diamond"></span><span id="hud-diamonds">0</span></div>
  </div>
  <div id="level-panel" class="panel">
    <div id="level-row"><span id="hud-level">Nivel 1</span><span id="hud-xp-label">0 / 100 XP</span></div>
    <div id="xp-bar-track"><div id="xp-bar-fill"></div></div>
  </div>
  <div id="hud-menu-buttons">
    <button class="btn-arrow small interactive" id="btn-open-map">Mapa</button>
    <button class="btn-arrow small interactive" id="btn-open-missions">Misiones</button>
    <button class="btn-arrow small interactive" id="btn-open-inventory">Inventario</button>
    <button class="btn-arrow small interactive" id="btn-open-garage">Garaje</button>
  </div>
</div>

<div id="hud-bottom-left" class="panel">
  <div id="mission-title">Sin misión activa</div>
  <div id="mission-desc">Explora la etapa para encontrar personajes con misiones.</div>
  <div id="mission-objectives"></div>
</div>

<div id="hud-bottom-right">
  <div id="interact-prompt" class="panel"><span class="key-badge">E</span><span id="interact-label">Interactuar</span></div>
</div>

<div id="control-hint">WASD / Flechas para moverte · Espacio para turbo · E para interactuar</div>

<div id="toast-container"></div>

<div id="dialogue-box" class="panel">
  <div id="dialogue-name">NPC</div>
  <div id="dialogue-text"></div>
  <div id="dialogue-footer">
    <button class="btn-arrow interactive" id="btn-dialogue-next">Continuar <span class="arrow-icon">➤</span></button>
  </div>
</div>

<!-- Mapa de etapas -->
<div class="modal-backdrop interactive" id="modal-map">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title">Mapa de Etapas</div>
      <button class="modal-close interactive" data-close="modal-map">✕</button>
    </div>
    <div class="modal-body">
      <div class="pick-grid" id="map-grid" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="select-arrow" id="arrow-map"><svg viewBox="0 0 22 20"><polygon points="11,20 0,0 22,0" fill="#ff3b3b" stroke="#fff" stroke-width="1.5"/></svg></div>
      </div>
    </div>
  </div>
</div>

<!-- Misiones -->
<div class="modal-backdrop interactive" id="modal-missions">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title">Registro de Misiones</div>
      <button class="modal-close interactive" data-close="modal-missions">✕</button>
    </div>
    <div class="modal-tabs">
      <button class="tab-btn active interactive" data-mtab="principal">Principales</button>
      <button class="tab-btn interactive" data-mtab="secundaria">Secundarias</button>
      <button class="tab-btn interactive" data-mtab="especial">Especiales</button>
    </div>
    <select id="mission-stage-filter" class="interactive"></select>
    <div class="modal-body" id="mission-list"></div>
  </div>
</div>

<!-- Negociación con guardián -->
<div class="modal-backdrop interactive" id="modal-guardian">
  <div class="modal-window panel" style="max-width:460px;">
    <div class="modal-header">
      <div class="modal-title" id="guardian-title">Guardián</div>
      <button class="modal-close interactive" data-close="modal-guardian">✕</button>
    </div>
    <div class="modal-body">
      <p id="guardian-text" style="color:var(--text-dim);line-height:1.5;margin-bottom:18px;"></p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn-arrow gold interactive" id="btn-guardian-pay"><span id="guardian-pay-label">Pagar</span> <span class="arrow-icon">➤</span></button>
        <button class="btn-arrow interactive" id="btn-guardian-leave">Ahora no, volveré <span class="arrow-icon">➤</span></button>
      </div>
    </div>
  </div>
</div>

<!-- Comprador de mascotas -->
<div class="modal-backdrop interactive" id="modal-sellpet">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title" id="sellpet-title">Comprador de Mascotas</div>
      <button class="modal-close interactive" data-close="modal-sellpet">✕</button>
    </div>
    <div class="modal-body" id="sellpet-list"></div>
  </div>
</div>

<!-- Inventario -->
<div class="modal-backdrop interactive" id="modal-inventory">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title">Inventario</div>
      <button class="modal-close interactive" data-close="modal-inventory">✕</button>
    </div>
    <div class="modal-tabs">
      <button class="tab-btn active interactive" data-itab="cosmeticos">Cosméticos</button>
      <button class="tab-btn interactive" data-itab="mascotas">Mascotas</button>
      <button class="tab-btn interactive" data-itab="titulos">Títulos</button>
      <button class="tab-btn interactive" data-itab="llaves">🗝️ Llaves</button>
    </div>
    <div class="modal-body" id="inventory-list"></div>
  </div>
</div>

<!-- Garaje -->
<div class="modal-backdrop interactive" id="modal-garage">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title">Garaje</div>
      <button class="modal-close interactive" data-close="modal-garage">✕</button>
    </div>
    <div id="garage-canvas-wrap">
      <canvas id="garage-canvas"></canvas>
    </div>
    <div class="modal-tabs" id="garage-tabs"></div>
    <div class="modal-body" style="position:relative;" id="garage-slot-wrap">
      <div class="pick-grid" id="garage-slot-list">
        <div class="select-arrow" id="arrow-garage"><svg viewBox="0 0 22 20"><polygon points="11,20 0,0 22,0" fill="#ff3b3b" stroke="#fff" stroke-width="1.5"/></svg></div>
      </div>
      <div id="garage-item-detail"></div>
    </div>
  </div>
</div>

<!-- Tienda -->
<div class="modal-backdrop interactive" id="modal-shop">
  <div class="modal-window panel">
    <div class="modal-header">
      <div class="modal-title" id="shop-title">Tienda</div>
      <button class="modal-close interactive" data-close="modal-shop">✕</button>
    </div>
    <div class="modal-body" id="shop-list"></div>
  </div>
</div>

<!-- HUD de partido -->
<div id="match-hud">
  <div id="match-scoreboard" class="panel">
    <span class="team-score a" id="score-a">0</span>
    <span id="match-timer">2:30</span>
    <span class="team-score b" id="score-b">0</span>
  </div>
  <div id="match-stats-bar" class="panel">
    <span>Toques: <b id="match-touches">0</b></span>
    <span class="divider"></span>
    <span>Turbo: <b id="match-turbo-pct">100%</b> <span id="match-turbo-spark" class="hidden">⚡</span></span>
  </div>
  <div id="boost-bar-wrap"><div id="boost-bar-fill"></div></div>
  <div id="match-pet-badge" class="panel hidden">
    <span id="match-pet-icon">🐾</span>
    <span class="match-pet-info">
      <span id="match-pet-name">Mascota</span>
      <span id="match-pet-power">Poder</span>
    </span>
  </div>
  <div id="match-control-hint">WASD / Flechas para moverte · Espacio para turbo</div>
</div>

<div id="match-end-screen">
  <div class="end-card panel">
    <div class="end-title" id="end-title">¡VICTORIA!</div>
    <div class="end-score" id="end-score">3 - 1</div>
    <div class="end-rewards" id="end-rewards"></div>
    <button class="btn-arrow primary interactive" id="btn-end-continue">Continuar <span class="arrow-icon">➤</span></button>
  </div>
</div>

<div id="boss-intro">
  <div id="boss-intro-avatar"></div>
  <div class="boss-name" id="boss-intro-name">JEFE</div>
  <div class="boss-title" id="boss-intro-title">Título del jefe</div>
  <div id="boss-intro-requirements"></div>
  <button class="btn-arrow gold interactive" id="btn-boss-start">Comenzar Duelo <span class="arrow-icon">➤</span></button>
</div>

<div id="intro-story">
  <div id="intro-story-text"></div>
  <button class="btn-arrow primary interactive" id="btn-intro-skip">Comenzar la aventura <span class="arrow-icon">➤</span></button>
</div>

<div id="ending-screen">
  <div id="ending-rocket"></div>
  <div id="ending-text"></div>
  <button class="btn-arrow gold interactive" id="btn-ending-close">Seguir explorando <span class="arrow-icon">➤</span></button>
</div>
`;
