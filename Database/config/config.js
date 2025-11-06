const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ar_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Inicializar base de datos
const initializeDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // Crear base de datos si no existe
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log('✅ Base de datos verificada/creada');
    
    await connection.end();

    // Crear tablas
    await createTables();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
};

const createTables = async () => {
  const createResourcesTable = `
    CREATE TABLE IF NOT EXISTS ar_resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('image', 'video', '3d-model') NOT NULL,
      marker_type ENUM('pattern', 'qrcode', 'aruco') NOT NULL,
      marker_data TEXT,
      content_url VARCHAR(500),
      qr_code_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_uuid (uuid),
      INDEX idx_type (type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createMarkersTable = `
    CREATE TABLE IF NOT EXISTS ar_markers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resource_uuid VARCHAR(36) NOT NULL,
      marker_type ENUM('pattern', 'qrcode', 'aruco') NOT NULL,
      marker_data TEXT,
      pattern_file VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_uuid) REFERENCES ar_resources(uuid) ON DELETE CASCADE,
      INDEX idx_resource_uuid (resource_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createUsageTable = `
    CREATE TABLE IF NOT EXISTS ar_usage_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resource_uuid VARCHAR(36) NOT NULL,
      access_count INT DEFAULT 0,
      last_accessed TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_uuid) REFERENCES ar_resources(uuid) ON DELETE CASCADE,
      INDEX idx_resource_uuid (resource_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.execute(createResourcesTable);
    await pool.execute(createMarkersTable);
    await pool.execute(createUsageTable);
    console.log('✅ Tablas creadas/verificadas');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
  }
};

module.exports = { pool, initializeDatabase };