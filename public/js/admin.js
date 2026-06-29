/**
 * admin.js
 * Script del panel de administracion.
 * Maneja autenticacion, consulta de visitas, filtros y vista detallada.
 */

// ==================== VARIABLES GLOBALES ====================

let authToken = null;
let currentPage = 0;
const PAGE_SIZE = 50;

// ==================== FUNCIONES DE AUTENTICACION ====================

/**
 * Maneja el formulario de login.
 */
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('passwordInput').value;
    loginError.style.display = 'none';

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        authToken = password;
        localStorage.setItem('admin_token', authToken);
        showDashboard();
        loadVisits();
      } else {
        loginError.textContent = result.message || 'Contrasena incorrecta.';
        loginError.style.display = 'block';
      }
    } catch (error) {
      loginError.textContent = 'Error de conexion con el servidor.';
      loginError.style.display = 'block';
    }
  });
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  authToken = null;
  localStorage.removeItem('admin_token');
}

// ==================== CARGA DE VISITAS ====================

/**
 * Carga las visitas desde la API con los filtros actuales.
 */
async function loadVisits() {
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  const ip = document.getElementById('filterIP').value;

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (ip) params.set('ip', ip);
  params.set('limit', PAGE_SIZE);
  params.set('offset', currentPage * PAGE_SIZE);

  try {
    const response = await fetch(`/api/visits?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 401) {
      showLogin();
      return;
    }

    const result = await response.json();

    if (result.success) {
      renderVisits(result.visits, result.total);
      updatePagination(result.total);
    }
  } catch (error) {
    console.error('Error al cargar visitas:', error);
  }
}

/**
 * Renderiza las visitas en la tabla.
 */
function renderVisits(visits, total) {
  const tbody = document.getElementById('visitsBody');
  const totalCount = document.getElementById('totalCount');

  totalCount.textContent = `Total: ${total} visita(s)`;

  if (visits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">No se encontraron visitas.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visits.map((visit, index) => {
    // Construir texto de ubicacion: GPS si hay, si no IP aproximada
    let ubicacion = '-';
    if (visit.gps_latitude && visit.gps_longitude) {
      ubicacion = `GPS: ${visit.gps_latitude.toFixed(4)}, ${visit.gps_longitude.toFixed(4)}`;
    } else if (visit.city || visit.country) {
      const parts = [visit.city, visit.region, visit.country].filter(Boolean);
      ubicacion = `~ ${parts.join(', ')}`;
    }

    // Dispositivo: marca y modelo
    let dispositivo = visit.device_type || '-';
    if (visit.device_brand && visit.device_model) {
      dispositivo = `${visit.device_brand} ${visit.device_model}`;
    } else if (visit.device_brand) {
      dispositivo = visit.device_brand;
    }

    return `
      <tr class="visits-table__row" data-index="${index}" data-visit='${JSON.stringify(visit).replace(/'/g, "&#39;")}'>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${escapeHtml(visit.ip_address || '-')}</td>
        <td>${escapeHtml(ubicacion)}</td>
        <td>${escapeHtml(dispositivo)}</td>
        <td>${escapeHtml(visit.browser || '-')} ${escapeHtml(visit.browser_version || '')}</td>
        <td>${escapeHtml(visit.os || '-')} ${escapeHtml(visit.os_version || '')}</td>
        <td><button class="btn btn--detail" data-index="${index}">Ver</button></td>
      </tr>
    `;
  }).join('');

  // Agregar event listeners a los botones de detalle
  tbody.querySelectorAll('.btn--detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      const row = tbody.querySelector(`[data-index="${index}"]`);
      const visitData = JSON.parse(row.getAttribute('data-visit'));
      openVisitModal(visitData);
    });
  });
}

// ==================== MODAL DE DETALLE ====================

/**
 * Abre el modal con el detalle completo de una visita.
 * Muestra GPS si hay, si no muestra ubicacion aproximada por IP.
 */
function openVisitModal(visit) {
  const modal = document.getElementById('visitModal');
  const modalBody = document.getElementById('modalBody');

  // Determinar tipo de ubicacion
  const hasGPS = visit.gps_latitude && visit.gps_longitude;
  const hasIPLocation = visit.city || visit.country || visit.region;

  let ubicacionHTML = '';
  if (hasGPS) {
    ubicacionHTML = `
      <div class="detail-section">
        <h3 class="detail-section__title">Ubicacion GPS (precisa)</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Latitud</span>
            <span class="detail-value">${visit.gps_latitude.toFixed(6)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Longitud</span>
            <span class="detail-value">${visit.gps_longitude.toFixed(6)}</span>
          </div>
        </div>
      </div>
    `;
  } else if (hasIPLocation) {
    ubicacionHTML = `
      <div class="detail-section">
        <h3 class="detail-section__title">Ubicacion Aproximada (por IP)</h3>
        <p class="detail-note">El usuario no concedio acceso a la ubicacion GPS. Se muestra la ubicacion aproximada obtenida por la direccion IP.</p>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Pais</span>
            <span class="detail-value">${escapeHtml(visit.country || '-')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Provincia / Estado</span>
            <span class="detail-value">${escapeHtml(visit.region || '-')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Ciudad</span>
            <span class="detail-value">${escapeHtml(visit.city || '-')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Proveedor (ISP)</span>
            <span class="detail-value">${escapeHtml(visit.isp || '-')}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    ubicacionHTML = `
      <div class="detail-section">
        <h3 class="detail-section__title">Ubicacion</h3>
        <p class="detail-note">No se pudo obtener informacion de ubicacion.</p>
      </div>
    `;
  }

  // Dispositivo
  const dispositivo = [visit.device_brand, visit.device_model].filter(Boolean).join(' ') || '-';

  modalBody.innerHTML = `
    <!-- Red e IP -->
    <div class="detail-section">
      <h3 class="detail-section__title">Red e IP</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Direccion IP</span>
          <span class="detail-value">${escapeHtml(visit.ip_address || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Proveedor (ISP)</span>
          <span class="detail-value">${escapeHtml(visit.isp || '-')}</span>
        </div>
      </div>
    </div>

    <!-- Ubicacion -->
    ${ubicacionHTML}

    <!-- Dispositivo -->
    <div class="detail-section">
      <h3 class="detail-section__title">Dispositivo</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Tipo</span>
          <span class="detail-value">${escapeHtml(visit.device_type || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Marca y Modelo</span>
          <span class="detail-value">${escapeHtml(dispositivo)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Resolucion</span>
          <span class="detail-value">${escapeHtml(visit.screen_resolution || '-')}</span>
        </div>
      </div>
    </div>

    <!-- Navegador y SO -->
    <div class="detail-section">
      <h3 class="detail-section__title">Navegador y Sistema Operativo</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Navegador</span>
          <span class="detail-value">${escapeHtml(visit.browser || '-')} ${escapeHtml(visit.browser_version || '')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sistema Operativo</span>
          <span class="detail-value">${escapeHtml(visit.os || '-')} ${escapeHtml(visit.os_version || '')}</span>
        </div>
      </div>
    </div>

    <!-- Configuracion -->
    <div class="detail-section">
      <h3 class="detail-section__title">Configuracion</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Idioma</span>
          <span class="detail-value">${escapeHtml(visit.language || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Zona Horaria</span>
          <span class="detail-value">${escapeHtml(visit.timezone || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tipo de Conexion</span>
          <span class="detail-value">${escapeHtml(visit.connection_type || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha y Hora</span>
          <span class="detail-value">${formatDate(visit.visit_date)}</span>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de detalle.
 */
function closeVisitModal() {
  const modal = document.getElementById('visitModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ==================== UTILIDADES ====================

/**
 * Formatea una fecha ISO a formato legible.
 */
function formatDate(isoDate) {
  if (!isoDate) return '-';
  try {
    const date = new Date(isoDate + 'Z');
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDate;
  }
}

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== PAGINACION ====================

function updatePagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  pageInfo.textContent = `Pagina ${currentPage + 1} de ${totalPages || 1}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= totalPages - 1 || totalPages === 0;
}

// ==================== FILTROS ====================

function setupFilters() {
  document.getElementById('filterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 0;
    loadVisits();
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    document.getElementById('filterIP').value = '';
    currentPage = 0;
    loadVisits();
  });

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      loadVisits();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    loadVisits();
  });
}

// ==================== LOGOUT ====================

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    showLogin();
  });
}

// ==================== MODAL EVENTS ====================

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeVisitModal);
  document.getElementById('modalOverlay').addEventListener('click', closeVisitModal);

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVisitModal();
    }
  });
}

// ==================== INICIALIZACION ====================

function initAdmin() {
  const savedToken = localStorage.getItem('admin_token');
  if (savedToken) {
    authToken = savedToken;
    showDashboard();
    loadVisits();
  }

  setupLoginForm();
  setupFilters();
  setupLogout();
  setupModal();
}

document.addEventListener('DOMContentLoaded', initAdmin);
