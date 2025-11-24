const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function stopServer() {
  try {
    // Encontrar el proceso que usa el puerto 5000
    const { stdout } = await execPromise('netstat -ano | findstr :5000');
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
    
    if (lines.length === 0) {
      console.log('✅ No hay procesos usando el puerto 5000');
      return;
    }
    
    // Extraer el PID
    const pid = lines[0].trim().split(/\s+/).pop();
    console.log(`🔍 Proceso encontrado en puerto 5000: PID ${pid}`);
    
    // Detener el proceso
    try {
      await execPromise(`taskkill /PID ${pid} /F`);
      console.log(`✅ Proceso ${pid} detenido exitosamente`);
    } catch (error) {
      console.error(`❌ Error deteniendo proceso ${pid}:`, error.message);
      console.log('   Intenta ejecutar manualmente: taskkill /PID ' + pid + ' /F');
    }
  } catch (error) {
    if (error.message.includes('findstr')) {
      console.log('✅ No hay procesos usando el puerto 5000');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

stopServer();

