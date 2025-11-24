const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '179.50.79.19',
  user: process.env.DB_USER || 'app_connector',
  password: process.env.DB_PASSWORD || 'Pcn123456!',
  database: process.env.DB_NAME || 'ar_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: process.env.DB_PORT || 3306
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Inicializar base de datos
const initializeDatabase = async () => {
  let connection;
  try {
    // Primero intentar crear la base de datos (puede fallar por permisos)
    try {
      connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password
      });

      console.log(`🔌 Conectado al servidor MySQL: ${dbConfig.host}:${dbConfig.port}`);

      // Intentar crear base de datos si no existe
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      console.log(`✅ Base de datos '${dbConfig.database}' verificada/creada`);
      
      await connection.end();
    } catch (createError) {
      // Si falla por permisos de creación, intentar conectarse directamente a la BD
      if (createError.code === 'ER_DBACCESS_DENIED_ERROR' || createError.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`⚠️  No se pueden crear bases de datos con este usuario. Intentando conectar a '${dbConfig.database}'...`);
        
        if (connection) await connection.end();
        
        // Intentar conectarse directamente a la base de datos existente
        try {
          connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
          });
          
          // Probar la conexión
          await connection.execute('SELECT 1');
          console.log(`✅ Conectado a la base de datos existente '${dbConfig.database}'`);
          await connection.end();
        } catch (connectError) {
          if (connectError.code === 'ER_BAD_DB_ERROR') {
            throw new Error(`La base de datos '${dbConfig.database}' no existe. Por favor, créala manualmente o contacta al administrador para que te otorgue permisos de creación.`);
          } else {
            throw connectError;
          }
        }
      } else {
        // Otro tipo de error, re-lanzarlo
        throw createError;
      }
    }

    // Ahora crear las tablas usando el pool que ya tiene la base de datos configurada
    await createTables();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error(`   Verifica que el servidor MySQL esté corriendo en ${dbConfig.host}:${dbConfig.port}`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.error(`   Verifica las credenciales de usuario: ${dbConfig.user}`);
      console.error(`   O que la base de datos '${dbConfig.database}' exista y el usuario tenga permisos sobre ella`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`   No se pudo resolver el host: ${dbConfig.host}`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`   La base de datos '${dbConfig.database}' no existe.`);
      console.error(`   Por favor, créala manualmente o solicita permisos de creación al administrador.`);
    }
    throw error; // Re-lanzar el error para que el servidor no inicie si hay problemas
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
      content_base64 LONGTEXT,
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

  const createRoutesTable = `
    CREATE TABLE IF NOT EXISTS ar_routes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      qr_code_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createRouteStepsTable = `
    CREATE TABLE IF NOT EXISTS ar_route_steps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      route_uuid VARCHAR(36) NOT NULL,
      resource_uuid VARCHAR(36) NOT NULL,
      step_order INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_uuid) REFERENCES ar_routes(uuid) ON DELETE CASCADE,
      FOREIGN KEY (resource_uuid) REFERENCES ar_resources(uuid) ON DELETE CASCADE,
      UNIQUE KEY (route_uuid, step_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.execute(createResourcesTable);
    await pool.execute(createMarkersTable);
    await pool.execute(createUsageTable);
    await pool.execute(createRoutesTable);
    await pool.execute(createRouteStepsTable);
    console.log('✅ Tablas creadas/verificadas');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
  }
};

module.exports = { pool, initializeDatabase };
