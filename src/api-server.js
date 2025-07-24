const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const HardwareDetector = require('./hardware-detector');
const OllamaMonitor = require('./ollama-monitor');

class ApiServer {
  constructor(port = 7171) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.hardwareDetector = new HardwareDetector();
    this.ollamaMonitor = new OllamaMonitor();
    
    this.clients = new Set();
    this.realtimeInterval = null;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // CORS configuration to allow the web app to connect
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://ollamalyzer.com',
        'https://www.ollamalyzer.com'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
      });
    });

    // Hardware analysis
    this.app.get('/api/hardware/analyze', async (req, res) => {
      try {
        console.log('🔍 Hardware analysis requested');
        const analysis = await this.hardwareDetector.detectHardware();
        res.json({
          success: true,
          data: analysis
        });
      } catch (error) {
        console.error('❌ Hardware analysis failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get cached hardware info
    this.app.get('/api/hardware/info', (req, res) => {
      if (this.hardwareDetector.lastAnalysis) {
        res.json({
          success: true,
          data: this.hardwareDetector.lastAnalysis
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'No hardware analysis available. Run /api/hardware/analyze first.'
        });
      }
    });

    // Realtime hardware stats
    this.app.get('/api/hardware/realtime', async (req, res) => {
      try {
        const stats = await this.hardwareDetector.getRealtimeStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('❌ Realtime stats failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Ollama status
    this.app.get('/api/ollama/status', async (req, res) => {
      try {
        console.log('🦙 Ollama status requested');
        const status = await this.ollamaMonitor.checkOllamaStatus();
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        console.error('❌ Ollama status check failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Install Ollama model
    this.app.post('/api/ollama/install', async (req, res) => {
      try {
        const { modelName } = req.body;
        if (!modelName) {
          return res.status(400).json({
            success: false,
            error: 'Model name is required'
          });
        }

        console.log(`📥 Model installation requested: ${modelName}`);
        const result = await this.ollamaMonitor.installModel(modelName);
        
        if (result.success) {
          res.json({
            success: true,
            data: result
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('❌ Model installation failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Delete Ollama model
    this.app.delete('/api/ollama/models/:modelName', async (req, res) => {
      try {
        const { modelName } = req.params;
        console.log(`🗑️ Model deletion requested: ${modelName}`);
        
        const result = await this.ollamaMonitor.deleteModel(modelName);
        
        if (result.success) {
          res.json({
            success: true,
            data: result
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('❌ Model deletion failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Test model generation
    this.app.post('/api/ollama/test', async (req, res) => {
      try {
        const { modelName, prompt } = req.body;
        if (!modelName) {
          return res.status(400).json({
            success: false,
            error: 'Model name is required'
          });
        }

        console.log(`🧪 Model test requested: ${modelName}`);
        const result = await this.ollamaMonitor.testModelGeneration(modelName, prompt);
        
        res.json({
          success: result.success,
          data: result
        });
      } catch (error) {
        console.error('❌ Model test failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // CLI info endpoint
    this.app.get('/api/cli/info', (req, res) => {
      res.json({
        success: true,
        data: {
          version: '1.0.0',
          isRunning: true,
          startTime: new Date().toISOString(),
          connectedClients: this.clients.size,
          endpoints: {
            hardware: '/api/hardware/*',
            ollama: '/api/ollama/*',
            websocket: 'ws://localhost:7171/ws'
          }
        }
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 WebSocket client connected');
      this.clients.add(ws);

      // Send initial data
      this.sendInitialData(ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
        
        // Stop realtime updates if no clients
        if (this.clients.size === 0 && this.realtimeInterval) {
          clearInterval(this.realtimeInterval);
          this.realtimeInterval = null;
        }
      });
    });
  }

  async sendInitialData(ws) {
    try {
      // Send hardware info if available
      if (this.hardwareDetector.lastAnalysis) {
        ws.send(JSON.stringify({
          type: 'hardware_info',
          data: this.hardwareDetector.lastAnalysis
        }));
      }

      // Send Ollama status
      const ollamaStatus = await this.ollamaMonitor.checkOllamaStatus();
      ws.send(JSON.stringify({
        type: 'ollama_status',
        data: ollamaStatus
      }));
    } catch (error) {
      console.error('❌ Error sending initial data:', error);
    }
  }

  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'start_realtime':
        this.startRealtimeUpdates();
        break;
      
      case 'stop_realtime':
        this.stopRealtimeUpdates();
        break;
      
      case 'get_hardware':
        const hardware = await this.hardwareDetector.detectHardware();
        ws.send(JSON.stringify({
          type: 'hardware_info',
          data: hardware
        }));
        break;
      
      case 'get_ollama_status':
        const status = await this.ollamaMonitor.checkOllamaStatus();
        ws.send(JSON.stringify({
          type: 'ollama_status',
          data: status
        }));
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  startRealtimeUpdates() {
    if (this.realtimeInterval) return;

    console.log('📊 Starting realtime updates');
    this.realtimeInterval = setInterval(async () => {
      try {
        const stats = await this.hardwareDetector.getRealtimeStats();
        if (stats) {
          this.broadcast({
            type: 'realtime_stats',
            data: stats
          });
        }
      } catch (error) {
        console.error('❌ Realtime update error:', error);
      }
    }, 2000); // Update every 2 seconds
  }

  stopRealtimeUpdates() {
    if (this.realtimeInterval) {
      console.log('📊 Stopping realtime updates');
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 Ollama Compass CLI Server running on port ${this.port}`);
          console.log(`   API: http://localhost:${this.port}`);
          console.log(`   WebSocket: ws://localhost:${this.port}/ws`);
          resolve();
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.stopRealtimeUpdates();
      this.server.close(() => {
        console.log('🛑 Server stopped');
        resolve();
      });
    });
  }
}

module.exports = ApiServer;