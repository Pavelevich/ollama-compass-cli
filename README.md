# Ollama Compass CLI

Local hardware detection and Ollama monitoring CLI for [Ollama Model Compass](https://ollamalyzer.com).

## 🚀 Quick Start

### Installation

```bash
npm install -g ollama-compass-cli
```

### Usage

Start the CLI server to enable hardware detection in the web app:

```bash
ollama-compass start
```

The CLI will run a local server on port 7171 that the web application can connect to for accurate hardware detection and Ollama monitoring.

## 📋 Commands

### `start`
Start the API server for hardware detection and Ollama monitoring.

```bash
ollama-compass start [options]

Options:
  -p, --port <port>  Port to run the server on (default: 7171)
  -q, --quiet        Run in quiet mode
```

### `analyze`
Perform a complete hardware analysis.

```bash
ollama-compass analyze [options]

Options:
  -j, --json  Output in JSON format
```

### `ollama`
Check Ollama status and installed models.

```bash
ollama-compass ollama [options]

Options:
  -j, --json  Output in JSON format
```

### `install <model>`
Install an Ollama model.

```bash
ollama-compass install llama2
```

### `test <model>`
Test an Ollama model with a simple prompt.

```bash
ollama-compass test llama2 [options]

Options:
  -p, --prompt <prompt>  Custom prompt to test (default: "Hello, how are you?")
```

## 🌐 Web App Integration

The CLI provides a local API server that the Ollama Model Compass web application connects to for:

- **Accurate Hardware Detection**: Real system specifications instead of browser-limited detection
- **Ollama Status Monitoring**: Check if Ollama is running and which models are installed
- **Real-time Performance Monitoring**: Live CPU, memory, and GPU usage statistics
- **Model Management**: Install, delete, and test Ollama models directly from the web interface

### API Endpoints

- `GET /health` - Health check
- `GET /api/hardware/analyze` - Full hardware analysis
- `GET /api/hardware/info` - Cached hardware info
- `GET /api/hardware/realtime` - Real-time performance stats
- `GET /api/ollama/status` - Ollama status and installed models
- `POST /api/ollama/install` - Install a model
- `DELETE /api/ollama/models/:name` - Delete a model
- `POST /api/ollama/test` - Test model generation
- `WebSocket /ws` - Real-time updates

### CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000` (development)
- `http://localhost:5173` (Vite dev server)
- `https://ollamalyzer.com` (production)
- `https://www.ollamalyzer.com` (production)

## 🛠️ Development

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### Setup

```bash
git clone <repository-url>
cd ollama-compass-cli
npm install
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
# Test hardware analysis
node src/cli.js analyze

# Test Ollama status
node src/cli.js ollama

# Start development server
node src/cli.js start
```

## 📊 Hardware Detection Features

The CLI provides comprehensive hardware detection including:

### CPU Detection
- Brand, model, and architecture
- Physical and logical core count
- Base and maximum frequency
- Cache size and current usage
- Real-time temperature monitoring

### Memory Detection
- Total, available, and used memory
- Memory type and speed estimation
- Real-time usage percentage

### GPU Detection
- Graphics card model and brand
- VRAM amount and type (dedicated/integrated)
- Driver version and temperature
- Real-time utilization monitoring

### Storage Detection
- Drive type (SSD/HDD)
- Total capacity and available space
- Drive model and interface

### System Information
- Operating system and version
- System manufacturer and model
- Hostname and uptime
- Network interfaces and battery status

## 🦙 Ollama Integration

### Status Monitoring
- Check if Ollama is running
- Verify API connectivity
- List installed models with sizes
- Process information

### Model Management
- Install models from Ollama library
- Delete installed models
- Test model generation performance
- Monitor installation progress

### Performance Testing
- Test model response times
- Measure tokens per second
- Validate model functionality

## 🔧 Configuration

### Environment Variables

- `OLLAMA_HOST` - Ollama server URL (default: http://localhost:11434)
- `CLI_PORT` - CLI server port (default: 7171)

### Port Configuration

The CLI runs on port 7171 by default. You can change this with:

```bash
ollama-compass start --port 8080
```

## 🚨 Troubleshooting

### CLI Not Starting
- Check if port 7171 is available
- Ensure Node.js is installed and up to date
- Try running with `--quiet` flag for minimal output

### Hardware Detection Issues
- Run as administrator/sudo for better hardware access
- Some features require elevated permissions
- Check system compatibility with `systeminformation` package

### Ollama Connection Issues
- Ensure Ollama is installed and running
- Check `OLLAMA_HOST` environment variable
- Verify firewall settings

### Web App Not Connecting
- Ensure CLI server is running on port 7171
- Check browser console for CORS errors
- Verify the web app is accessing the correct CLI URL

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Web App: [ollamalyzer.com](https://ollamalyzer.com)
- Documentation: [Full documentation]

---

Made with ❤️ for the Ollama community