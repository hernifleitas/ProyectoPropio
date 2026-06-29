/**
 * server.js
 * Servidor principal de la aplicación.
 * Configura Express, sirve archivos estáticos y monta las rutas de la API.
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Parsear JSON en el body de las peticiones
app.use(express.json());

// Parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS DE LA API ====================

// Ruta para registrar y obtener visitas
const visitsRouter = require('./routes/visits');
app.use('/api/visits', visitsRouter);

// Ruta del panel de administración
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// ==================== RUTAS DE PÁGINAS ====================

// Ruta principal: servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta del panel de administración: servir admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  console.log(`Panel de administración: http://localhost:${PORT}/admin`);
  console.log('Presiona Ctrl+C para detener el servidor.\n');
});
