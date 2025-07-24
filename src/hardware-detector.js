const si = require('systeminformation');
const os = require('os');

class HardwareDetector {
  constructor() {
    this.lastAnalysis = null;
    this.analysisTimestamp = null;
  }

  async detectHardware() {
    console.log('🔍 Starting comprehensive hardware analysis...');
    
    try {
      const [
        cpu,
        memory,
        graphics,
        osInfo,
        system,
        diskLayout,
        networkInterfaces,
        battery
      ] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.osInfo(),
        si.system(),
        si.diskLayout(),
        si.networkInterfaces(),
        si.battery()
      ]);

      // Get real-time CPU usage
      const currentLoad = await si.currentLoad();
      const cpuTemp = await si.cpuTemperature();
      
      // Process CPU information
      const cpuInfo = {
        brand: cpu.brand || 'Unknown',
        model: cpu.model || cpu.brand || 'Unknown',
        physicalCores: cpu.physicalCores || cpu.cores,
        logicalCores: cpu.cores,
        baseFrequencyGHz: cpu.speed || 0,
        maxFrequencyGHz: cpu.speedMax || 0,
        architecture: cpu.family || process.arch,
        cacheSizeMB: Math.round((cpu.cache?.l1d + cpu.cache?.l1i + cpu.cache?.l2 + cpu.cache?.l3) / (1024 * 1024)) || 0,
        currentUsage: Math.round(currentLoad.currentLoad) || 0,
        temperature: cpuTemp.main || 0
      };

      // Get memory layout for better detection
      const memLayout = await si.memLayout();
      
      // Process Memory information
      const memoryInfo = {
        totalMemoryGB: Math.round(memory.total / (1024 * 1024 * 1024)),
        availableMemoryGB: Math.round(memory.available / (1024 * 1024 * 1024)),
        usedMemoryGB: Math.round(memory.used / (1024 * 1024 * 1024)),
        memoryType: this.detectMemoryType(memLayout),
        memorySpeedMHz: this.detectMemorySpeed(memLayout),
        usagePercentage: Math.round((memory.used / memory.total) * 100),
        modules: memLayout.length
      };

      // Process GPU information - prioritize dedicated GPUs
      const allGPUs = graphics.controllers.map(gpu => ({
        brand: this.extractGPUBrand(gpu.vendor || gpu.model),
        model: gpu.model || 'Unknown GPU',
        vramGB: this.getGPUVRAM(gpu),
        type: this.determineGPUType(gpu.model, gpu.vendor),
        driver: gpu.driverVersion || 'Unknown',
        temperature: gpu.temperatureGpu || 0,
        vendor: gpu.vendor,
        rawModel: gpu.model
      }));
      
      // Sort GPUs: dedicated first, then by VRAM
      const gpuInfo = allGPUs.sort((a, b) => {
        if (a.type === 'dedicated' && b.type !== 'dedicated') return -1;
        if (b.type === 'dedicated' && a.type !== 'dedicated') return 1;
        return b.vramGB - a.vramGB;
      });

      // Process Storage information
      const storageInfo = diskLayout.map(disk => ({
        type: disk.type === 'SSD' ? 'SSD' : 'HDD',
        sizeGB: Math.round(disk.size / (1024 * 1024 * 1024)),
        model: disk.name,
        interface: disk.interfaceType
      }));

      // System information
      const systemInfo = {
        os: osInfo.platform,
        osVersion: osInfo.release,
        platform: osInfo.arch,
        hostname: os.hostname(),
        uptime: Math.round(os.uptime() / 3600), // Hours
        manufacturer: system.manufacturer,
        model: system.model
      };

      // Calculate performance scores
      const performanceScores = this.calculatePerformanceScores(
        cpuInfo, 
        memoryInfo, 
        gpuInfo[0] || {}, 
        storageInfo[0] || {}
      );

      // Determine hardware tier
      const hardwareTier = this.calculateHardwareTier(performanceScores.overallScore);

      // Generate hardware fingerprint
      const fingerprintData = `${cpuInfo.logicalCores}-${memoryInfo.totalMemoryGB}-${gpuInfo[0]?.model || 'integrated'}-${systemInfo.os}`;
      const hardwareFingerprint = Buffer.from(fingerprintData).toString('base64').substring(0, 16);

      const analysis = {
        hardwareFingerprint,
        hardwareSpecs: {
          cpu: cpuInfo,
          memory: memoryInfo,
          gpu: gpuInfo[0] || {
            brand: 'Unknown',
            model: 'Integrated Graphics',
            vramGB: 0,
            type: 'integrated'
          },
          storage: {
            totalSpaceGB: storageInfo.reduce((sum, disk) => sum + disk.sizeGB, 0),
            availableSpaceGB: await this.getAvailableStorage(),
            storageType: storageInfo[0]?.type || 'SSD',
            drives: storageInfo
          },
          system: systemInfo
        },
        performanceScores,
        hardwareTier,
        analysisTimestamp: new Date().toISOString(),
        networkInterfaces: networkInterfaces.filter(iface => !iface.internal).map(iface => ({
          name: iface.iface,
          type: iface.type,
          speed: iface.speed
        })),
        battery: battery ? {
          hasBattery: battery.hasBattery,
          percent: battery.percent,
          isCharging: battery.isCharging
        } : null
      };

      this.lastAnalysis = analysis;
      this.analysisTimestamp = new Date().toISOString();

      console.log('✅ Hardware analysis completed successfully');
      return analysis;

    } catch (error) {
      console.error('❌ Error during hardware detection:', error);
      throw new Error(`Hardware detection failed: ${error.message}`);
    }
  }

  extractGPUBrand(vendor) {
    if (!vendor) return 'Unknown';
    const vendorLower = vendor.toLowerCase();
    if (vendorLower.includes('nvidia') || vendorLower.includes('geforce')) return 'NVIDIA';
    if (vendorLower.includes('amd') || vendorLower.includes('ati') || vendorLower.includes('radeon')) return 'AMD';
    if (vendorLower.includes('intel') && !vendorLower.includes('nvidia')) return 'Intel';
    if (vendorLower.includes('apple')) return 'Apple';
    return vendor;
  }

  getGPUVRAM(gpu) {
    // systeminformation often reports incorrect VRAM, especially for dedicated GPUs
    // Use model-based detection first for accuracy
    const model = (gpu.model || '').toLowerCase();
    const vendor = (gpu.vendor || '').toLowerCase();
    
    // NVIDIA RTX series - prioritize model detection
    if (model.includes('ga107m') || model.includes('3050 ti')) return 4;
    if (model.includes('3060')) return 6;
    if (model.includes('3070')) return 8;
    if (model.includes('3080')) return 10;
    if (model.includes('4060')) return 8;
    if (model.includes('4070')) return 12;
    if (model.includes('4080')) return 16;
    
    // AMD estimates
    if (model.includes('rx 6600')) return 8;
    if (model.includes('rx 6700')) return 12;
    if (model.includes('rx 6800')) return 16;
    
    // Intel Arc
    if (model.includes('arc')) return 6;
    
    // More NVIDIA patterns
    if (vendor.includes('nvidia') && model.includes('mobile')) return 4;
    if (vendor.includes('nvidia') && model.includes('geforce')) return 4; // Default for unknown GeForce
    
    // Try system reported VRAM only if reasonable (> 512 MB)
    if (gpu.vram && gpu.vram > 512) {
      return Math.round(gpu.vram / 1024); // Convert MB to GB
    }
    
    // Try memory field
    if (gpu.memoryTotal && gpu.memoryTotal > 512) {
      return Math.round(gpu.memoryTotal / 1024); // Convert MB to GB
    }
    
    // Intel integrated fallback
    if (vendor.includes('intel')) return 0; // Shared memory
    
    return 0;
  }

  detectMemoryType(memLayout) {
    if (!memLayout || memLayout.length === 0) return 'Unknown';
    
    const firstModule = memLayout[0];
    if (firstModule.type) {
      return firstModule.type.toUpperCase();
    }
    
    // Fallback based on speed
    const speed = firstModule.clockSpeed || 0;
    if (speed >= 4800) return 'DDR5';
    if (speed >= 2133) return 'DDR4';
    if (speed >= 800) return 'DDR3';
    
    return 'DDR4'; // Most common default
  }

  detectMemorySpeed(memLayout) {
    if (!memLayout || memLayout.length === 0) return 0;
    
    const firstModule = memLayout[0];
    return firstModule.clockSpeed || 0;
  }

  determineGPUType(model, vendor) {
    if (!model) return 'integrated';
    const modelLower = model.toLowerCase();
    const vendorLower = (vendor || '').toLowerCase();
    
    // NVIDIA dedicated GPUs
    if (modelLower.includes('geforce') || modelLower.includes('rtx') || modelLower.includes('gtx') || modelLower.includes('quadro')) return 'dedicated';
    if (vendorLower.includes('nvidia') && !modelLower.includes('integrated')) return 'dedicated';
    
    // AMD dedicated GPUs
    if (modelLower.includes('radeon') && !modelLower.includes('graphics')) return 'dedicated';
    if (modelLower.includes('rx ') || modelLower.includes('vega')) return 'dedicated';
    if (vendorLower.includes('amd') && !modelLower.includes('integrated')) return 'dedicated';
    
    // Intel dedicated GPUs
    if (modelLower.includes('arc')) return 'dedicated';
    
    // Apple Silicon
    if (modelLower.includes('apple') || modelLower.includes('m1') || modelLower.includes('m2') || modelLower.includes('m3')) {
      return 'apple_unified';
    }
    
    return 'integrated';
  }

  calculatePerformanceScores(cpu, memory, gpu, storage) {
    // CPU Score (0-100)
    const cpuScore = Math.min(100, 
      (cpu.logicalCores * 5) + 
      (cpu.baseFrequencyGHz * 10) + 
      (cpu.cacheSizeMB * 0.5)
    );

    // Memory Score (0-100)
    const memoryScore = Math.min(100, 
      (memory.totalMemoryGB * 4) + 
      (memory.memorySpeedMHz / 100)
    );

    // GPU Score (0-100)
    let gpuScore = 30; // Base integrated score
    if (gpu.type === 'dedicated') {
      gpuScore = 60 + (gpu.vramGB * 4);
    } else if (gpu.type === 'apple_unified') {
      gpuScore = 50 + (gpu.vramGB * 3);
    }
    gpuScore = Math.min(100, gpuScore);

    // Storage Score (0-100)
    const storageScore = storage.type === 'SSD' ? 85 : 60;

    // Overall Score (weighted average)
    const overallScore = Math.round(
      (cpuScore * 0.35) + 
      (memoryScore * 0.25) + 
      (gpuScore * 0.30) + 
      (storageScore * 0.10)
    );

    return {
      overallScore,
      cpuScore: Math.round(cpuScore),
      memoryScore: Math.round(memoryScore),
      gpuScore: Math.round(gpuScore),
      storageScore: Math.round(storageScore)
    };
  }

  calculateHardwareTier(overallScore) {
    if (overallScore >= 80) return 'HIGH';
    if (overallScore >= 60) return 'MEDIUM';
    if (overallScore >= 40) return 'LOW';
    return 'VERY_LOW';
  }

  async getAvailableStorage() {
    try {
      const fsSize = await si.fsSize();
      if (fsSize && fsSize.length > 0) {
        const totalAvailable = fsSize.reduce((sum, fs) => sum + fs.available, 0);
        return Math.round(totalAvailable / (1024 * 1024 * 1024));
      }
      return 0;
    } catch (error) {
      console.error('Error getting storage info:', error);
      return 0;
    }
  }

  async getRealtimeStats() {
    try {
      const [currentLoad, memory, cpuTemp, gpu] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.cpuTemperature(),
        si.graphics()
      ]);

      return {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: Math.round(currentLoad.currentLoad) || 0,
          temperature: cpuTemp.main || 0,
          cores: currentLoad.cpus?.map(core => Math.round(core.load)) || []
        },
        memory: {
          usagePercentage: Math.round((memory.used / memory.total) * 100),
          usedGB: Math.round(memory.used / (1024 * 1024 * 1024)),
          availableGB: Math.round(memory.available / (1024 * 1024 * 1024))
        },
        gpu: gpu.controllers.map(controller => ({
          model: controller.model,
          temperature: controller.temperatureGpu || 0,
          utilizationGpu: controller.utilizationGpu || 0,
          utilizationMemory: controller.utilizationMemory || 0
        }))
      };
    } catch (error) {
      console.error('Error getting realtime stats:', error);
      return null;
    }
  }
}

module.exports = HardwareDetector;