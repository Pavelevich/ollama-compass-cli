#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const ApiServer = require('./api-server');
const HardwareDetector = require('./hardware-detector');
const OllamaMonitor = require('./ollama-monitor');

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                   ${chalk.bold.green('OLLAMA MODEL COMPASS CLI')}                   ${chalk.cyan('║')}
${chalk.cyan('║')}              ${chalk.gray('Local Hardware Detection & Monitoring')}            ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════╝')}
`;

program
  .name('ollama-compass')
  .description('Local hardware detection and Ollama monitoring for Ollama Model Compass')
  .version('1.0.2');

// Start server command
program
  .command('start')
  .description('Start the API server for hardware detection and Ollama monitoring')
  .option('-p, --port <port>', 'Port to run the server on', '7171')
  .option('-q, --quiet', 'Run in quiet mode')
  .action(async (options) => {
    if (!options.quiet) {
      console.log(banner);
    }
    
    const spinner = ora('Starting Ollama Compass CLI Server...').start();
    
    try {
      const server = new ApiServer(parseInt(options.port));
      await server.start();
      
      spinner.succeed(chalk.green('Server started successfully!'));
      
      console.log(chalk.yellow('\n📋 Available endpoints:'));
      console.log(`   ${chalk.blue('GET')}  /health                    - Health check`);
      console.log(`   ${chalk.blue('GET')}  /api/hardware/analyze      - Full hardware analysis`);
      console.log(`   ${chalk.blue('GET')}  /api/hardware/info         - Cached hardware info`);
      console.log(`   ${chalk.blue('GET')}  /api/hardware/realtime     - Realtime stats`);
      console.log(`   ${chalk.blue('GET')}  /api/ollama/status         - Ollama status`);
      console.log(`   ${chalk.blue('POST')} /api/ollama/install        - Install model`);
      console.log(`   ${chalk.blue('DEL')}  /api/ollama/models/:name   - Delete model`);
      console.log(`   ${chalk.blue('POST')} /api/ollama/test           - Test model`);
      console.log(`   ${chalk.blue('WS')}   /ws                        - WebSocket connection`);
      
      console.log(chalk.yellow('\n🌐 Web app integration:'));
      console.log(`   Visit ${chalk.underline('https://ollamalyzer.com')} to use with this CLI`);
      
      console.log(chalk.gray('\n💡 The server will run until you press Ctrl+C'));
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n🛑 Shutting down server...'));
        await server.stop();
        process.exit(0);
      });
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to start server'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Analyze hardware command
program
  .command('analyze')
  .description('Perform a complete hardware analysis')
  .option('-j, --json', 'Output in JSON format')
  .action(async (options) => {
    if (!options.json) {
      console.log(banner);
    }
    
    const spinner = ora('Analyzing hardware...').start();
    
    try {
      const detector = new HardwareDetector();
      const analysis = await detector.detectHardware();
      
      spinner.succeed(chalk.green('Hardware analysis completed!'));
      
      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        displayHardwareAnalysis(analysis);
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Hardware analysis failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Check Ollama status command
program
  .command('ollama')
  .description('Check Ollama status and installed models')
  .option('-j, --json', 'Output in JSON format')
  .action(async (options) => {
    if (!options.json) {
      console.log(banner);
    }
    
    const spinner = ora('Checking Ollama status...').start();
    
    try {
      const monitor = new OllamaMonitor();
      const status = await monitor.checkOllamaStatus();
      
      if (status.isRunning) {
        spinner.succeed(chalk.green('Ollama is running!'));
      } else {
        spinner.warn(chalk.yellow('Ollama is not running'));
      }
      
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        displayOllamaStatus(status);
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to check Ollama status'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Install model command
program
  .command('install <model>')
  .description('Install an Ollama model')
  .action(async (model) => {
    console.log(banner);
    
    const spinner = ora(`Installing model: ${model}...`).start();
    
    try {
      const monitor = new OllamaMonitor();
      const result = await monitor.installModel(model);
      
      if (result.success) {
        spinner.succeed(chalk.green(`Model ${model} installation started!`));
      } else {
        spinner.fail(chalk.red(`Failed to install model ${model}`));
        console.error(chalk.red('Error:'), result.error);
        process.exit(1);
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Installation failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Test model command
program
  .command('test <model>')
  .description('Test an Ollama model with a simple prompt')
  .option('-p, --prompt <prompt>', 'Custom prompt to test', 'Hello, how are you?')
  .action(async (model, options) => {
    console.log(banner);
    
    const spinner = ora(`Testing model: ${model}...`).start();
    
    try {
      const monitor = new OllamaMonitor();
      const result = await monitor.testModelGeneration(model, options.prompt);
      
      if (result.success) {
        spinner.succeed(chalk.green(`Model ${model} test completed!`));
        console.log(chalk.yellow('\n📊 Test Results:'));
        console.log(`   Response Time: ${chalk.cyan(result.responseTime + 'ms')}`);
        console.log(`   Tokens/Second: ${chalk.cyan(result.tokensPerSecond)}`);
        console.log(chalk.yellow('\n💬 Response:'));
        console.log(chalk.gray(result.response));
      } else {
        spinner.fail(chalk.red(`Model ${model} test failed`));
        console.error(chalk.red('Error:'), result.error);
        process.exit(1);
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Test failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Display functions
function displayHardwareAnalysis(analysis) {
  console.log(chalk.yellow('\n🖥️  Hardware Analysis Results:'));
  console.log(chalk.gray('═'.repeat(70)));
  
  const { hardwareSpecs, performanceScores, hardwareTier } = analysis;
  
  // System Information
  console.log(chalk.blue('\n🖥️  System:'));
  console.log(`   Manufacturer: ${chalk.white(hardwareSpecs.system.manufacturer)}`);
  console.log(`   Model: ${chalk.white(hardwareSpecs.system.model)}`);
  console.log(`   OS: ${chalk.white(hardwareSpecs.system.os + ' ' + hardwareSpecs.system.osVersion)}`);
  console.log(`   Hostname: ${chalk.white(hardwareSpecs.system.hostname)}`);
  console.log(`   Uptime: ${chalk.white(hardwareSpecs.system.uptime + ' hours')}`);
  
  // CPU Info
  console.log(chalk.cyan('\n💻 CPU:'));
  console.log(`   Model: ${chalk.white(hardwareSpecs.cpu.model)}`);
  console.log(`   Brand: ${chalk.white(hardwareSpecs.cpu.brand)}`);
  console.log(`   Cores: ${chalk.white(hardwareSpecs.cpu.physicalCores)} physical, ${chalk.white(hardwareSpecs.cpu.logicalCores)} logical`);
  console.log(`   Base Frequency: ${chalk.white(hardwareSpecs.cpu.baseFrequencyGHz.toFixed(2) + ' GHz')}`);
  if (hardwareSpecs.cpu.maxFrequencyGHz > 0) {
    console.log(`   Max Frequency: ${chalk.white(hardwareSpecs.cpu.maxFrequencyGHz.toFixed(2) + ' GHz')}`);
  }
  console.log(`   Cache: ${chalk.white(hardwareSpecs.cpu.cacheSizeMB + ' MB')}`);
  console.log(`   Architecture: ${chalk.white(hardwareSpecs.cpu.architecture)}`);
  console.log(`   Current Usage: ${chalk.white(hardwareSpecs.cpu.currentUsage + '%')}`);
  if (hardwareSpecs.cpu.temperature > 0) {
    console.log(`   Temperature: ${chalk.white(hardwareSpecs.cpu.temperature + '°C')}`);
  }
  
  // Memory Info
  console.log(chalk.green('\n🧠 Memory:'));
  console.log(`   Total: ${chalk.white(hardwareSpecs.memory.totalMemoryGB + ' GB')}`);
  console.log(`   Available: ${chalk.white(hardwareSpecs.memory.availableMemoryGB + ' GB')}`);
  console.log(`   Used: ${chalk.white(hardwareSpecs.memory.usedMemoryGB + ' GB')}`);
  console.log(`   Type: ${chalk.white(hardwareSpecs.memory.memoryType)}`);
  console.log(`   Speed: ${chalk.white(hardwareSpecs.memory.memorySpeedMHz + ' MHz')}`);
  if (hardwareSpecs.memory.modules) {
    console.log(`   Modules: ${chalk.white(hardwareSpecs.memory.modules)}`);
  }
  console.log(`   Usage: ${chalk.white(hardwareSpecs.memory.usagePercentage + '%')}`);
  
  // GPU Info
  console.log(chalk.magenta('\n🎮 Graphics:'));
  console.log(`   Model: ${chalk.white(hardwareSpecs.gpu.model)}`);
  console.log(`   Brand: ${chalk.white(hardwareSpecs.gpu.brand)}`);
  console.log(`   Type: ${chalk.white(hardwareSpecs.gpu.type)}`);
  console.log(`   VRAM: ${chalk.white(hardwareSpecs.gpu.vramGB + ' GB')}`);
  if (hardwareSpecs.gpu.driver && hardwareSpecs.gpu.driver !== 'Unknown') {
    console.log(`   Driver: ${chalk.white(hardwareSpecs.gpu.driver)}`);
  }
  if (hardwareSpecs.gpu.temperature > 0) {
    console.log(`   Temperature: ${chalk.white(hardwareSpecs.gpu.temperature + '°C')}`);
  }
  
  // Storage Info
  console.log(chalk.yellow('\n💾 Storage:'));
  console.log(`   Total Space: ${chalk.white(hardwareSpecs.storage.totalSpaceGB + ' GB')}`);
  console.log(`   Available Space: ${chalk.white(hardwareSpecs.storage.availableSpaceGB + ' GB')}`);
  console.log(`   Primary Type: ${chalk.white(hardwareSpecs.storage.storageType)}`);
  if (hardwareSpecs.storage.drives && hardwareSpecs.storage.drives.length > 0) {
    console.log('   Drives:');
    hardwareSpecs.storage.drives.forEach((drive, index) => {
      console.log(`     ${index + 1}. ${chalk.white(drive.model)} (${chalk.gray(drive.sizeGB + ' GB ' + drive.type + ', ' + drive.interface)})`);
    });
  }
  
  // Network Information
  if (analysis.networkInterfaces && analysis.networkInterfaces.length > 0) {
    console.log(chalk.gray('\n🌐 Network:'));
    analysis.networkInterfaces.forEach(iface => {
      const speed = iface.speed ? ` (${iface.speed} Mbps)` : '';
      console.log(`   ${chalk.white(iface.name)}: ${chalk.gray(iface.type + speed)}`);
    });
  }
  
  // Battery Information
  if (analysis.battery && analysis.battery.hasBattery) {
    console.log(chalk.green('\n🔋 Battery:'));
    console.log(`   Level: ${chalk.white(analysis.battery.percent + '%')}`);
    console.log(`   Status: ${chalk.white(analysis.battery.isCharging ? 'Charging' : 'Not Charging')}`);
  }
  
  // Performance Scores
  console.log(chalk.blue('\n📊 Performance Scores:'));
  console.log(`   Overall: ${chalk.white(performanceScores.overallScore + '/100')} (${chalk.white(hardwareTier)})`);
  console.log(`   CPU: ${chalk.white(performanceScores.cpuScore + '/100')}`);
  console.log(`   Memory: ${chalk.white(performanceScores.memoryScore + '/100')}`);
  console.log(`   GPU: ${chalk.white(performanceScores.gpuScore + '/100')}`);
  console.log(`   Storage: ${chalk.white(performanceScores.storageScore + '/100')}`);
  
  console.log(chalk.green(`\n✅ Hardware fingerprint: ${analysis.hardwareFingerprint}`));
  console.log(chalk.gray(`🕒 Analysis completed at: ${new Date(analysis.analysisTimestamp).toLocaleString()}`));
}

function displayOllamaStatus(status) {
  console.log(chalk.yellow('\n🦙 Ollama Status:'));
  console.log(chalk.gray('═'.repeat(60)));
  
  if (status.isRunning && status.isReachable) {
    console.log(`   Status: ${chalk.green('✅ Running and reachable')}`);
    console.log(`   Host: ${chalk.white(status.host)}`);
    if (status.version !== 'Unknown') {
      console.log(`   Version: ${chalk.white(status.version)}`);
    }
    console.log(`   Models: ${chalk.white(status.modelsCount)} installed`);
    
    if (status.installedModels.length > 0) {
      console.log(chalk.cyan('\n📦 Installed Models:'));
      status.installedModels.forEach(model => {
        const size = model.size ? (model.size / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : 'Unknown size';
        console.log(`   • ${chalk.white(model.name)} (${chalk.gray(size)})`);
      });
    }
  } else if (status.processInfo?.isRunning) {
    console.log(`   Status: ${chalk.yellow('⚠️ Process running but API not reachable')}`);
    console.log(`   Details: ${chalk.gray(status.processInfo.details)}`);
  } else {
    console.log(`   Status: ${chalk.red('❌ Not running')}`);
    if (status.error) {
      console.log(`   Error: ${chalk.red(status.error.message)}`);
      console.log(`   Suggestion: ${chalk.gray(status.error.suggestion)}`);
    }
  }
}

// Show banner and help if no command provided
if (process.argv.length === 2) {
  console.log(banner);
  program.help();
}

program.parse();