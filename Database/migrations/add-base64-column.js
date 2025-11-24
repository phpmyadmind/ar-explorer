const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '179.50.79.19',
  user: process.env.DB_USER || 'app_connector',
  password: process.env.DB_PASSWORD || 'Pcn123456!',
  database: process.env.DB_NAME || 'ar_platform',
  port: process.env.DB_PORT || 3306
};

async function addBase64Column() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔌 Conectado a la base de datos');
    
    // Verificar si la columna ya existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'ar_resources' 
      AND COLUMN_NAME = 'content_base64'
    `, [dbConfig.database]);
    
    if (columns.length > 0) {
      console.log('✅ La columna content_base64 ya existe');
      return;
    }
    
    // Agregar la columna
    await connection.execute(`
      ALTER TABLE ar_resources 
      ADD COLUMN content_base64 LONGTEXT NULL 
      AFTER content_url
    `);
    
    console.log('✅ Columna content_base64 agregada exitosamente');
    
  } catch (error) {
    console.error('❌ Error agregando columna:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar migración
addBase64Column()
  .then(() => {
    console.log('✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  });

