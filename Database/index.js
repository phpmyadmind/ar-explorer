
const express = require('express');
const multer = require('multer');
const qr = require('qr-image');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool, initializeDatabase } = require('./config/config');
const { normalizeForDB, validateResourceData, normalizeParams } = require('./utils/validation');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || '476499bb-af5b-4dfd-a8b4-92c032c51e64';
const SERVICE_USER_USERNAME = 'service_user';
const SERVICE_USER_PASSWORD = 'default_password_for_service_account'; // Use a more secure password in a real env

// Middleware
// Configurar CORS para permitir cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/qrcodes', express.static('qrcodes'));

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = 'uploads/';
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 3072 * 1024 * 1024 }, // 3GB límite
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'image': /jpeg|jpg|png|gif|webp|glb/,
      'video': /mp4|webm|ogg|mov|avi/,
      '3d-model': /gltf|glb/
    };
    
    const fileType = Object.keys(allowedTypes).find(type => 
      allowedTypes[type].test(path.extname(file.originalname).toLowerCase())
    );
    
    if (fileType) {
      req.fileType = fileType;
      return cb(null, true);
    }
    
    cb(new Error('Tipo de archivo no permitido'));
  }
});

const generateQrCode = (uuid, type) => {
  // Asegurar que existe el directorio
  const qrDir = 'qrcodes';
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const qrData = `ar://${type}/${uuid}`; // e.g. ar://resource/uuid or ar://route/uuid
  const qrCode = qr.image(qrData, { type: 'png' });
  const qrFilename = `${uuid}.png`;
  const qrPath = path.join(qrDir, qrFilename);
  qrCode.pipe(fs.createWriteStream(qrPath));

  return `/qrcodes/${qrFilename}`;
};


// 📊 API Routes Actualizadas para MySQL

// Función para obtener el MIME type según la extensión
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Función para convertir archivo a base64
const fileToBase64 = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
};

// --- Rutas de autenticación ---
// Endpoint para generar token sin autenticación de usuario
// El frontend puede generar tokens directamente sin necesidad de usuario/contraseña
app.post('/api/auth/token', async (req, res) => {
    try {
        console.log('🔑 Token generation request received');
        
        // Generar token simple sin necesidad de usuario en la base de datos
        // El payload puede ser cualquier información necesaria
        const payload = {
            id: 'service',
            username: 'frontend',
            type: 'service_token',
            iat: Math.floor(Date.now() / 1000)
        };
        
        console.log('🔑 Generating token with payload:', payload);
        console.log('🔑 Using JWT_SECRET:', JWT_SECRET ? '***' : 'NOT SET');
        
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
        
        console.log('✅ Token generated successfully');
        res.json({ token });

    } catch (error) {
        console.error('❌ Error getting service token:', error);
        res.status(500).json({ error: 'Failed to generate service token' });
    }
});


app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO ar_users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    res.status(201).json({ id: result.insertId, username });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM ar_users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});


// Crear nuevo recurso AR
app.post('/api/resources', authMiddleware, upload.single('content'), async (req, res) => {
  let connection;
  try {
    // Validar datos de entrada
    const { name, type, markerType, markerData } = req.body;
    
    const validation = validateResourceData({
      name,
      type,
      markerType: markerType || 'qrcode'
    });
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Datos inválidos',
        details: validation.errors
      });
    }
    
    // Validar que haya archivo si es necesario
    if (!req.file) {
      return res.status(400).json({ error: 'El archivo es requerido' });
    }
    
    const uuid = uuidv4();
    let contentUrl = null;
    let contentBase64 = null;
    
    // Si hay archivo, convertir a base64 para imágenes y videos
    if (req.file) {
      const filePath = req.file.path;
      
      // Para imágenes y videos, convertir a base64
      if (type === 'image' || type === 'video') {
        contentBase64 = fileToBase64(filePath);
        if (!contentBase64) {
          return res.status(500).json({ error: 'Error al convertir el archivo a base64' });
        }
        // Mantener content_url para compatibilidad
        contentUrl = `/uploads/${req.file.filename}`;
      } else {
        // Para modelos 3D, mantener la URL (son archivos grandes)
        contentUrl = `/uploads/${req.file.filename}`;
      }
    }
    
    const qrCodeUrl = generateQrCode(uuid, 'resource');
    
    connection = await pool.getConnection();
    
    // Asegurar que todos los valores estén definidos y normalizados ANTES de la consulta
    // name ya fue validado, pero asegurémonos de que sea string válido
    const normalizedName = (name && typeof name === 'string') ? name.trim() : null;
    if (!normalizedName) {
      throw new Error('El nombre es requerido y debe ser un string válido');
    }
    
    // type ya fue validado, debe ser uno de: 'image', 'video', '3d-model'
    const normalizedType = (type && typeof type === 'string') ? type.toLowerCase() : null;
    if (!normalizedType || !['image', 'video', '3d-model'].includes(normalizedType)) {
      throw new Error('El tipo debe ser: image, video o 3d-model');
    }
    
    // markerType tiene default 'qrcode'
    const normalizedMarkerType = (markerType && typeof markerType === 'string') 
      ? markerType.toLowerCase() 
      : 'qrcode';
    
    // markerData puede ser undefined, null, o string - normalizar a null si es undefined
    const normalizedMarkerData = normalizeForDB(markerData);
    
    // URLs pueden ser null si no hay archivo - pero ya validamos que hay archivo
    const normalizedContentUrl = normalizeForDB(contentUrl);
    
    // base64 puede ser null para modelos 3D
    const normalizedContentBase64 = normalizeForDB(contentBase64);
    
    // QR code siempre se genera
    const normalizedQrCodeUrl = normalizeForDB(qrCodeUrl);
    
    // Construir array de parámetros asegurando que NINGUNO sea undefined
    const params = [
      uuid,                                    // string, siempre definido
      normalizedName,                          // string, validado arriba
      normalizedType,                          // string, validado arriba
      normalizedMarkerType,                   // string, siempre tiene default
      normalizedMarkerData ?? null,           // null si era undefined
      normalizedContentUrl ?? null,            // null si era undefined
      normalizedContentBase64 ?? null,        // null si era undefined
      normalizedQrCodeUrl ?? null              // null si era undefined
    ];
    
    // Validación final: asegurar que ningún parámetro sea undefined
    const undefinedParams = params
      .map((p, i) => ({ index: i, value: p, type: typeof p }))
      .filter(p => p.value === undefined);
    
    if (undefinedParams.length > 0) {
      console.error('❌ Error: Parámetros undefined detectados:', undefinedParams);
      console.error('📋 Todos los parámetros:', params.map((p, i) => `[${i}]: ${typeof p} = ${JSON.stringify(p)}`));
      throw new Error(`Parámetros inválidos: ${undefinedParams.length} valor(es) undefined detectado(s)`);
    }
    
    // Insertar recurso con base64 para imágenes y videos
    const [result] = await connection.execute(
      `INSERT INTO ar_resources (uuid, name, type, marker_type, marker_data, content_url, content_base64, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    // Inicializar estadísticas de uso
    await connection.execute(
      `INSERT INTO ar_usage_stats (resource_uuid, access_count) VALUES (?, ?)`,
      [uuid, 0]
    );

    const resource = {
      id: result.insertId,
      uuid,
      name: name?.trim(),
      type,
      markerType: markerType || 'qrcode',
      markerData: normalizeForDB(markerData),
      contentUrl: normalizeForDB(contentUrl),
      contentBase64: contentBase64 ? contentBase64.substring(0, 100) + '...' : null,
      qrCodeUrl: normalizeForDB(qrCodeUrl),
      arUrl: `http://localhost:3000/ar-viewer/${uuid}`
    };

    res.status(201).json(resource);

  } catch (error) {
    console.error('❌ Error creando recurso:', error);
    console.error('Stack:', error.stack);
    
    // Log detallado de los parámetros recibidos para debugging
    console.error('📋 Datos recibidos en req.body:', {
      name: req.body?.name,
      type: req.body?.type,
      markerType: req.body?.markerType,
      markerData: req.body?.markerData,
      hasFile: !!req.file,
      fileName: req.file?.filename
    });
    
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener todos los recursos con estadísticas
app.get('/api/resources', authMiddleware, async (req, res) => {
  try {
    // No incluir content_base64 en la lista (es muy grande)
    const [rows] = await pool.execute(`
      SELECT 
        r.id,
        r.uuid,
        r.name,
        r.type,
        r.marker_type,
        r.marker_data,
        r.content_url,
        CASE 
          WHEN r.content_base64 IS NOT NULL AND r.content_base64 != '' THEN 1 
          ELSE 0 
        END as has_base64,
        r.qr_code_url,
        r.created_at,
        r.updated_at,
        s.access_count, 
        s.last_accessed 
      FROM ar_resources r 
      LEFT JOIN ar_usage_stats s ON r.uuid = s.resource_uuid 
      ORDER BY r.created_at DESC
    `);
    
    // Formatear filas sin incluir content_base64 (es muy grande)
    const formattedRows = rows.map(row => {
      return {
        id: row.id,
        uuid: row.uuid,
        name: row.name,
        type: row.type,
        marker_type: row.marker_type,
        marker_data: row.marker_data,
        content_url: row.content_url,
        has_base64: row.has_base64 === 1, // Convertir a boolean
        qr_code_url: row.qr_code_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        access_count: row.access_count || 0,
        last_accessed: row.last_accessed
      };
    });
    
    res.json(formattedRows);
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtener recurso específico y registrar acceso
app.get('/api/resources/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT r.*, s.access_count, s.last_accessed 
       FROM ar_resources r 
       LEFT JOIN ar_usage_stats s ON r.uuid = s.resource_uuid 
       WHERE r.uuid = ?`,
      [uuid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Actualizar estadísticas de acceso
    await pool.execute(
      `UPDATE ar_usage_stats 
       SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP 
       WHERE resource_uuid = ?`,
      [uuid]
    );

    const resource = { ...rows[0] };
    // Si es imagen o video y tiene base64, usar base64 en content_url
    if ((resource.type === 'image' || resource.type === 'video') && resource.content_base64) {
      resource.content_url = resource.content_base64;
    }
    // No enviar content_base64 por separado para evitar duplicación
    delete resource.content_base64;

    res.json(resource);
  } catch (error) {
    console.error('Error obteniendo recurso:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de uso
app.get('/api/resources/:uuid/stats', authMiddleware, async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT access_count, last_accessed, created_at 
       FROM ar_usage_stats 
       WHERE resource_uuid = ?`,
      [uuid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estadísticas no encontradas' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar recurso
app.put('/api/resources/:uuid', authMiddleware, upload.single('content'), async (req, res) => {
  let connection;
  try {
    const { uuid } = req.params;
    const { name, markerData, type } = req.body;
    
    // Validar que el recurso existe
    connection = await pool.getConnection();
    const [existing] = await connection.execute(
      `SELECT * FROM ar_resources WHERE uuid = ?`,
      [uuid]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    
    const currentResource = existing[0];
    
    // Preparar valores para actualización
    let updateFields = [];
    let params = [];
    
    // Actualizar nombre si se proporciona
    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (trimmedName && trimmedName.length > 0) {
        updateFields.push('name = ?');
        params.push(trimmedName);
      }
    }
    
    // Actualizar marker_data
    if (markerData !== undefined) {
      updateFields.push('marker_data = ?');
      params.push(normalizeForDB(markerData));
    }
    
    // Si hay archivo nuevo, procesarlo
    if (req.file) {
      const filePath = req.file.path;
      const resourceType = type || currentResource.type;
      
      if (resourceType === 'image' || resourceType === 'video') {
        const base64 = fileToBase64(filePath);
        if (base64) {
          updateFields.push('content_base64 = ?');
          params.push(base64);
        }
        updateFields.push('content_url = ?');
        params.push(`/uploads/${req.file.filename}`);
      } else {
        updateFields.push('content_url = ?');
        params.push(`/uploads/${req.file.filename}`);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    // Agregar uuid al final para el WHERE
    params.push(uuid);
    
    const query = `UPDATE ar_resources SET ${updateFields.join(', ')} WHERE uuid = ?`;
    const [result] = await connection.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Obtener recurso actualizado
    const [rows] = await connection.execute(
      `SELECT r.*, s.access_count, s.last_accessed 
       FROM ar_resources r 
       LEFT JOIN ar_usage_stats s ON r.uuid = s.resource_uuid 
       WHERE r.uuid = ?`,
      [uuid]
    );

    const resource = { ...rows[0] };
    // Si es imagen o video y tiene base64, usar base64 en content_url
    if ((resource.type === 'image' || resource.type === 'video') && resource.content_base64) {
      resource.content_url = resource.content_base64;
    }
    delete resource.content_base64;

    res.json(resource);
  } catch (error) {
    console.error('Error actualizando recurso:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Eliminar recurso
app.delete('/api/resources/:uuid', authMiddleware, async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM ar_resources WHERE uuid = ?',
      [uuid]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    res.json({ 
      message: 'Recurso eliminado', 
      affectedRows: result.affectedRows 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas para AR Routes ---

// Crear una nueva ruta
app.post('/api/routes', authMiddleware, async (req, res) => {
    let connection;
    try {
        const { name, description, steps } = req.body; // steps: [{ resource_uuid, step_order }]
        
        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ error: 'Name and steps are required.' });
        }

        const routeUuid = uuidv4();
        const qrCodeUrl = generateQrCode(routeUuid, 'route');

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Insertar la ruta con parámetros normalizados
        await connection.execute(
            `INSERT INTO ar_routes (uuid, name, description, qr_code_url) VALUES (?, ?, ?, ?)`,
            normalizeParams([routeUuid, name?.trim(), normalizeForDB(description), normalizeForDB(qrCodeUrl)])
        );

        // Insertar los pasos con validación
        for (const step of steps) {
            if (!step.resource_uuid || step.step_order === undefined) {
                throw new Error('Cada paso debe tener resource_uuid y step_order');
            }
            await connection.execute(
                `INSERT INTO ar_route_steps (route_uuid, resource_uuid, step_order) VALUES (?, ?, ?)`,
                [routeUuid, step.resource_uuid, parseInt(step.step_order)]
            );
        }

        await connection.commit();

        res.status(201).json({
            uuid: routeUuid,
            name: name?.trim(),
            description: normalizeForDB(description),
            qrCodeUrl: normalizeForDB(qrCodeUrl),
            steps
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error creating route:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: error.message || 'Failed to create route',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (connection) connection.release();
    }
});


// Obtener todas las rutas
app.get('/api/routes', authMiddleware, async (req, res) => {
    try {
        const [routes] = await pool.execute(`
            SELECT r.uuid, r.name, r.description, r.qr_code_url, r.created_at, COUNT(rs.id) as step_count
            FROM ar_routes r
            LEFT JOIN ar_route_steps rs ON r.uuid = rs.route_uuid
            GROUP BY r.uuid
            ORDER BY r.created_at DESC
        `);
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener una ruta específica con sus pasos
app.get('/api/routes/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;

        const [routeRows] = await pool.execute(
            `SELECT * FROM ar_routes WHERE uuid = ?`,
            [uuid]
        );

        if (routeRows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const [stepRows] = await pool.execute(`
            SELECT rs.step_order, res.*
            FROM ar_route_steps rs
            JOIN ar_resources res ON rs.resource_uuid = res.uuid
            WHERE rs.route_uuid = ?
            ORDER BY rs.step_order ASC
        `, [uuid]);
        
        const route = routeRows[0];
        route.steps = stepRows;

        res.json(route);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar una ruta
app.delete('/api/routes/:uuid', authMiddleware, async (req, res) => {
    try {
        const { uuid } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM ar_routes WHERE uuid = ?',
            [uuid]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Endpoint para obtener métricas generales
app.get('/api/metrics', authMiddleware, async (req, res) => {
  try {
    const [totalResources] = await pool.execute(
      'SELECT COUNT(*) as total FROM ar_resources'
    );
    
    const [totalAccess] = await pool.execute(
      'SELECT SUM(access_count) as total_access FROM ar_usage_stats'
    );
    
    const [popularResources] = await pool.execute(`
      SELECT r.name, r.type, s.access_count 
      FROM ar_resources r 
      JOIN ar_usage_stats s ON r.uuid = s.resource_uuid 
      ORDER BY s.access_count DESC 
      LIMIT 5
    `);

    res.json({
      totalResources: totalResources[0].total,
      totalAccess: totalAccess[0].total_access || 0,
      popularResources
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor AR con MySQL corriendo en http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
        console.error(`   Por favor, detén el proceso que está usando el puerto ${PORT} o cambia el puerto en la configuración.`);
        console.error(`   Para detener el proceso, ejecuta: taskkill /PID <PID> /F`);
        console.error(`   O encuentra el PID con: netstat -ano | findstr :${PORT}`);
        process.exit(1);
      } else {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
};

startServer();


