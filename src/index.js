const ApiServer = require('./api-server');

async function main() {
  console.log('🚀 Starting Ollama Compass CLI Server...');
  
  const server = new ApiServer(7171);
  
  try {
    await server.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();