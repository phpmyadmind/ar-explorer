// Utilidades para autenticación JWT en el frontend

const JWT_SECRET = '476499bb-af5b-4dfd-a8b4-92c032c51e64'; // Debe coincidir con el backend

/**
 * Genera un token JWT en el frontend sin necesidad de usuario/contraseña
 * @returns Token JWT válido
 */
export function generateToken(): string {
  // Usar una librería de JWT en el frontend o generar el token en el backend
  // Por ahora, usaremos el endpoint del backend para generar el token
  // En producción, podrías usar una librería como 'jose' o 'jsonwebtoken' en el cliente
  
  // Por simplicidad, generamos un payload y lo enviamos al backend
  // O podemos usar el endpoint /api/auth/token
  return '';
}

/**
 * Obtiene o genera un token JWT
 * Si no existe en localStorage, lo genera llamando al backend
 * @returns Token JWT
 */
export async function getOrGenerateToken(): Promise<string> {
  if (typeof window === 'undefined') {
    console.warn('⚠️ getOrGenerateToken called on server side');
    return '';
  }

  // Verificar si ya existe un token válido en localStorage
  const existingToken = localStorage.getItem('ar_token');
  if (existingToken) {
    // Verificar si el token no ha expirado (opcional, validación básica)
    try {
      const payload = JSON.parse(atob(existingToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > now) {
        console.log('✅ Using existing valid token');
        return existingToken;
      } else {
        console.log('⚠️ Token expired, generating new one');
        localStorage.removeItem('ar_token');
      }
    } catch (e) {
      console.warn('⚠️ Invalid token format, generating new one:', e);
      localStorage.removeItem('ar_token');
    }
  }

  // Generar nuevo token desde el backend
  try {
    const { config } = await import('./config');
    const tokenUrl = `${config.apiUrl}/api/auth/token`;
    console.log('🔑 Generating new token from:', tokenUrl);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔑 Token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to generate token:', response.status, errorText);
      throw new Error(`Failed to generate token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const token = data.token;
    
    if (!token) {
      console.error('❌ No token in response:', data);
      throw new Error('No token received from server');
    }
    
    console.log('✅ Token generated successfully');
    
    // Guardar en localStorage
    localStorage.setItem('ar_token', token);
    
    return token;
  } catch (error) {
    console.error('❌ Error generating token:', error);
    throw error;
  }
}

/**
 * Obtiene los headers de autenticación con el token
 * @returns Headers con Authorization Bearer token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getOrGenerateToken();
    
    if (!token) {
      console.error('❌ No token available for headers');
      throw new Error('No token available');
    }
    
    console.log('🔐 Creating auth headers with token');
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
    throw error;
  }
}

