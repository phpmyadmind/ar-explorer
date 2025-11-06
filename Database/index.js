const express = require('express');
const multer = require('multer');
const qr = require('qr-image');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { pool, initializeDatabase } = require('./config/config');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
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
      'video': /mp4|webm|ogg|mov/,
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

// 📊 API Routes Actualizadas para MySQL

// Crear nuevo recurso AR
app.post('/api/resources', upload.single('content'), async (req, res) => {
  let connection;
  try {
    const { name, type, markerType, markerData } = req.body;
    const uuid = uuidv4();
    const contentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Generar QR Code
    const qrCode = qr.image(`ar://resource/${uuid}`, { type: 'png' });
    const qrFilename = `${uuid}.png`;
    const qrPath = path.join('qrcodes', qrFilename);
    
    // Asegurar que existe el directorio
    if (!fs.existsSync('qrcodes')) fs.mkdirSync('qrcodes', { recursive: true });
    
    qrCode.pipe(fs.createWriteStream(qrPath));

    const qrCodeUrl = `/qrcodes/${qrFilename}`;

    connection = await pool.getConnection();
    
    // Insertar recurso
    const [result] = await connection.execute(
      `INSERT INTO ar_resources (uuid, name, type, marker_type, marker_data, content_url, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid, name, type, markerType, markerData, contentUrl, qrCodeUrl]
    );

    // Inicializar estadísticas de uso
    await connection.execute(
      `INSERT INTO ar_usage_stats (resource_uuid, access_count) VALUES (?, ?)`,
      [uuid, 0]
    );

    const resource = {
      id: result.insertId,
      uuid,
      name,
      type,
      markerType,
      markerData,
      contentUrl,
      qrCodeUrl,
      arUrl: `http://localhost:3000/ar-viewer/${uuid}`
    };

    res.json(resource);

  } catch (error) {
    console.error('Error creando recurso:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener todos los recursos con estadísticas
app.get('/api/resources', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.*, s.access_count, s.last_accessed 
      FROM ar_resources r 
      LEFT JOIN ar_usage_stats s ON r.uuid = s.resource_uuid 
      ORDER BY r.created_at DESC
    `);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de uso
app.get('/api/resources/:uuid/stats', async (req, res) => {
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
app.put('/api/resources/:uuid', upload.single('content'), async (req, res) => {
  let connection;
  try {
    const { uuid } = req.params;
    const { name, markerData } = req.body;
    const contentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    connection = await pool.getConnection();

    let query = `UPDATE ar_resources SET name = ?, marker_data = ?`;
    let params = [name, markerData];

    if (contentUrl) {
      query += `, content_url = ?`;
      params.push(contentUrl);
    }

    query += ` WHERE uuid = ?`;
    params.push(uuid);

    const [result] = await connection.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Obtener recurso actualizado
    const [rows] = await connection.execute(
      `SELECT * FROM ar_resources WHERE uuid = ?`,
      [uuid]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Eliminar recurso
app.delete('/api/resources/:uuid', async (req, res) => {
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

// Endpoint para obtener métricas generales
app.get('/api/metrics', async (req, res) => {
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
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor AR con MySQL corriendo en http://localhost:${PORT}`);
  });
};

startServer();