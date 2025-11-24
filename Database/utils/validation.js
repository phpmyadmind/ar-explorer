// Utilidades para validación y normalización de datos

/**
 * Convierte undefined a null para compatibilidad con MySQL
 */
function normalizeForDB(value) {
  // Manejar undefined explícitamente
  if (value === undefined) return null;
  // Manejar null (ya es correcto)
  if (value === null) return null;
  // Manejar strings vacíos
  if (typeof value === 'string' && value.trim() === '') return null;
  // Retornar el valor tal cual si es válido
  return value;
}

/**
 * Valida los datos de un recurso AR
 */
function validateResourceData(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (!data.type || !['image', 'video', '3d-model'].includes(data.type)) {
    errors.push('El tipo debe ser: image, video o 3d-model');
  }
  
  if (!data.markerType || !['pattern', 'qrcode', 'aruco'].includes(data.markerType)) {
    errors.push('El tipo de marcador debe ser: pattern, qrcode o aruco');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Normaliza los parámetros para una consulta SQL
 */
function normalizeParams(params) {
  return params.map(param => normalizeForDB(param));
}

module.exports = {
  normalizeForDB,
  validateResourceData,
  normalizeParams
};

