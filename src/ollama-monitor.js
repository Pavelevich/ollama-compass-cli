const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class OllamaMonitor {
  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.lastStatus = null;
  }

  async checkOllamaStatus() {
    console.log('🦙 Checking Ollama status...');
    
    try {
      // Try to connect to Ollama API
      const response = await axios.get(`${this.ollamaHost}/api/tags`, {
        timeout: 5000
      });

      const models = response.data.models || [];
      
      // Get system info from Ollama
      let systemInfo = null;
      try {
        const infoResponse = await axios.get(`${this.ollamaHost}/api/version`, {
          timeout: 3000
        });
        systemInfo = infoResponse.data;
      } catch (infoError) {
        console.warn('Could not get Ollama version info');
      }

      // Check if Ollama process is running
      const processInfo = await this.getOllamaProcessInfo();

      const status = {
        isRunning: true,
        isReachable: true,
        host: this.ollamaHost,
        version: systemInfo?.version || 'Unknown',
        modelsCount: models.length,
        installedModels: models.map(model => ({
          name: model.name,
          size: model.size,
          modifiedAt: model.modified_at,
          digest: model.digest
        })),
        processInfo,
        lastChecked: new Date().toISOString()
      };

      this.lastStatus = status;
      console.log(`✅ Ollama is running with ${models.length} models installed`);
      return status;

    } catch (error) {
      console.log('❌ Ollama is not reachable');
      
      // Check if process exists even if API is not reachable
      const processInfo = await this.getOllamaProcessInfo();
      
      const status = {
        isRunning: processInfo.isRunning,
        isReachable: false,
        host: this.ollamaHost,
        error: this.categorizeError(error),
        processInfo,
        lastChecked: new Date().toISOString()
      };

      this.lastStatus = status;
      return status;
    }
  }

  async getOllamaProcessInfo() {
    try {
      let command;
      if (process.platform === 'win32') {
        command = 'tasklist /FI "IMAGENAME eq ollama.exe" /FO CSV';
      } else {
        command = 'ps aux | grep -i ollama | grep -v grep';
      }

      const { stdout } = await execAsync(command);
      
      if (process.platform === 'win32') {
        const isRunning = stdout.toLowerCase().includes('ollama.exe');
        return {
          isRunning,
          details: isRunning ? 'Ollama process found in Windows task list' : 'No Ollama process found'
        };
      } else {
        const processes = stdout.trim().split('\n').filter(line => line.includes('ollama'));
        const isRunning = processes.length > 0;
        
        return {
          isRunning,
          processCount: processes.length,
          details: isRunning ? `Found ${processes.length} Ollama process(es)` : 'No Ollama processes found'
        };
      }
    } catch (error) {
      return {
        isRunning: false,
        error: 'Could not check process status',
        details: error.message
      };
    }
  }

  categorizeError(error) {
    if (error.code === 'ECONNREFUSED') {
      return {
        type: 'CONNECTION_REFUSED',
        message: 'Ollama is not running or not accepting connections',
        suggestion: 'Try starting Ollama with: ollama serve'
      };
    }
    
    if (error.code === 'ENOTFOUND') {
      return {
        type: 'HOST_NOT_FOUND',
        message: 'Cannot resolve Ollama host',
        suggestion: 'Check your OLLAMA_HOST environment variable'
      };
    }
    
    if (error.code === 'ETIMEDOUT') {
      return {
        type: 'TIMEOUT',
        message: 'Connection to Ollama timed out',
        suggestion: 'Ollama may be starting up or overloaded'
      };
    }

    return {
      type: 'UNKNOWN',
      message: error.message || 'Unknown error occurred',
      suggestion: 'Check Ollama installation and try restarting'
    };
  }

  async installModel(modelName) {
    console.log(`📥 Installing model: ${modelName}`);
    
    try {
      const response = await axios.post(`${this.ollamaHost}/api/pull`, {
        name: modelName
      }, {
        timeout: 300000 // 5 minutes timeout for model installation
      });

      return {
        success: true,
        model: modelName,
        message: 'Model installation started'
      };
    } catch (error) {
      console.error(`❌ Failed to install model ${modelName}:`, error.message);
      return {
        success: false,
        model: modelName,
        error: error.message
      };
    }
  }

  async deleteModel(modelName) {
    console.log(`🗑️ Deleting model: ${modelName}`);
    
    try {
      const response = await axios.delete(`${this.ollamaHost}/api/delete`, {
        data: { name: modelName }
      });

      return {
        success: true,
        model: modelName,
        message: 'Model deleted successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to delete model ${modelName}:`, error.message);
      return {
        success: false,
        model: modelName,
        error: error.message
      };
    }
  }

  async getModelInfo(modelName) {
    try {
      const response = await axios.post(`${this.ollamaHost}/api/show`, {
        name: modelName
      });

      return {
        success: true,
        model: modelName,
        info: response.data
      };
    } catch (error) {
      return {
        success: false,
        model: modelName,
        error: error.message
      };
    }
  }

  async testModelGeneration(modelName, prompt = "Hello, how are you?") {
    console.log(`🧪 Testing model generation: ${modelName}`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${this.ollamaHost}/api/generate`, {
        model: modelName,
        prompt: prompt,
        stream: false
      }, {
        timeout: 30000
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        success: true,
        model: modelName,
        responseTime,
        response: response.data.response,
        tokensGenerated: response.data.response?.length || 0,
        tokensPerSecond: response.data.response ? 
          (response.data.response.length / (responseTime / 1000)).toFixed(2) : 0
      };
    } catch (error) {
      console.error(`❌ Model generation test failed for ${modelName}:`, error.message);
      return {
        success: false,
        model: modelName,
        error: error.message
      };
    }
  }
}

module.exports = OllamaMonitor;