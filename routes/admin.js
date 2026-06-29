/**
 * routes/admin.js
 * Rutas del panel de administración.
 * Protegido por contraseña definida en .env.
 * Verifica autenticación via header Authorization.
 */

const express = require('express');
const router = express.Router();

// Contraseña del admin desde variables de entorno
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Middleware de autenticación.
 * Verifica que el header Authorization contenga la contraseña correcta.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Contraseña incorrecta.'
    });
  }

  next();
}

/**
 * POST /api/admin/login
 * Verifica las credenciales del administrador.
 * Recibe { password: "..." } en el body.
 */
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Autenticación exitosa' });
  } else {
    res.status(401).json({
      success: false,
      message: 'Contraseña incorrecta'
    });
  }
});

// Todas las rutas siguientes requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/admin/visits
 * Proxy a /api/visits con autenticación.
 * Redirige al endpoint de visitas.
 */
router.get('/visits', (req, res, next) => {
  // Reenviar como si fuera una petición a /api/visits
  req.url = '/';
  req.query.limit = req.query.limit || 100;
  req.query.offset = req.query.offset || 0;

  // Llamar directamente al router de visitas
  const visitsRouter = require('./visits');
  visitsRouter(req, res, next);
});

module.exports = router;
