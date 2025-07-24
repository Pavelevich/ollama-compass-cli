# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-24

### Added
- Initial release of Ollama Compass CLI
- Comprehensive hardware detection using `systeminformation` package
- Real-time performance monitoring with WebSocket support
- Ollama status monitoring and model management
- REST API server for web application integration
- CLI commands for hardware analysis, model testing, and installation
- Cross-platform support (Windows, macOS, Linux)
- CPU, memory, GPU, and storage detection
- Temperature monitoring for CPU and GPU
- Real-time usage statistics
- Model installation and deletion capabilities
- Performance benchmarking and testing
- WebSocket connection for live data updates
- CORS configuration for web app integration
- Comprehensive error handling and logging
- Beautiful CLI interface with colors and progress indicators

### Features
- `ollama-compass start` - Start API server for web app integration
- `ollama-compass analyze` - Complete hardware analysis
- `ollama-compass ollama` - Check Ollama status and models
- `ollama-compass install <model>` - Install Ollama models
- `ollama-compass test <model>` - Test model performance
- REST API endpoints for hardware data and real-time stats
- WebSocket support for live performance monitoring
- Automatic detection of CPU, memory, GPU, and storage
- Temperature and utilization monitoring
- Cross-platform process detection
- Model management and testing capabilities