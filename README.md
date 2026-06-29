# Device Info Viewer

Aplicacion web moderna que muestra informacion tecnica del dispositivo del visitante. Backend en Node.js con Express y base de datos SQLite.

## Caracteristicas

- Direccion IP publica y geolocalizacion aproximada por IP
- Navegador y version (incluyendo User-Agent Client Hints)
- Sistema operativo y version
- Tipo de dispositivo (movil, tablet, PC)
- Marca y modelo (via Client Hints cuando esta disponible)
- Resolucion de pantalla
- Idioma y zona horaria
- Tipo de conexion de red
- Ubicacion GPS con permiso del usuario
- Panel de administracion protegido por contrasena
- Base de datos SQLite con historial de visitas
- Interfaz responsive para moviles

## Requisitos

- [Node.js](https://nodejs.org/) v14 o superior
- npm (incluido con Node.js)

## Instalacion

```bash
# Clonar o copiar el proyecto
cd device-info-viewer

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
# Editar el archivo .env para cambiar la contrasena del admin
```

## Ejecucion

```bash
# Iniciar el servidor
npm start
```

El servidor estara disponible en: `http://localhost:3000`

## Estructura del Proyecto

```
device-info-viewer/
├── server.js              # Servidor principal Express
├── database.js            # Configuracion y conexion SQLite
├── package.json           # Dependencias del proyecto
├── .env                   # Variables de entorno (contrasena admin)
├── data/
│   └── visits.db          # Base de datos SQLite (se crea automaticamente)
├── routes/
│   ├── visits.js          # API REST para visitas (CRUD)
│   └── admin.js           # API del panel de administracion
└── public/
    ├── index.html         # Pagina principal
    ├── admin.html         # Panel de administracion
    ├── css/
    │   ├── style.css      # Estilos principales
    │   └── admin.css      # Estilos del admin
    └── js/
        ├── app.js         # Logica de recoleccion de datos
        └── admin.js       # Logica del panel admin
```

## Endpoints de la API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/visits` | Registrar una visita |
| GET | `/api/visits` | Obtener visitas (con filtros) |
| GET | `/api/visits/count` | Contar total de visitas |
| POST | `/api/admin/login` | Autenticar administrador |
| GET | `/api/admin/visits` | Obtener visitas (requiere auth) |

### Parametros de filtro (GET /api/visits)

- `from` - Fecha de inicio (YYYY-MM-DD)
- `to` - Fecha de fin (YYYY-MM-DD)
- `ip` - Filtrar por direccion IP
- `limit` - Maximo de resultados (default: 100)
- `offset` - Desplazamiento para paginacion

## Panel de Administracion

1. Ir a `http://localhost:3000/admin`
2. Ingresar la contrasena (por defecto: `admin123`)
3. Consultar visitas con filtros por fecha e IP

## Configuracion

Editar el archivo `.env`:

```
PORT=3000
ADMIN_PASSWORD=admin123
```

> **Importante:** Cambiar la contrasena por defecto en produccion.

## Privacidad

Esta aplicacion solo recopila informacion que el navegador expone legitimamente. No se accede a:
- Numeros de telefono
- IMEI o identificadores del dispositivo
- Contactos, fotos, mensajes
- Ningun dato privado del usuario

La API de GPS solicita permiso explicito y funciona solo si el usuario acepta.

## Licencia

ISC
