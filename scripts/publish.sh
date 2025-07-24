#!/bin/bash

# Ollama Compass CLI Publication Script
# This script helps with the publication process

set -e  # Exit on any error

echo "🚀 Ollama Compass CLI Publication Helper"
echo "======================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Make sure you're in the CLI root directory."
    exit 1
fi

# Check if git is initialized
if [[ ! -d ".git" ]]; then
    echo "❌ Error: Not a git repository. Initialize git first."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists git; then
    echo "❌ Git is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ NPM is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 14 ]]; then
    echo "❌ Node.js version 14+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node --version)"

# Test CLI locally
echo "🧪 Testing CLI locally..."

# Make CLI executable
chmod +x src/cli.js

# Test help command
if node src/cli.js --help > /dev/null; then
    echo "✅ CLI help command works"
else
    echo "❌ CLI help command failed"
    exit 1
fi

# Test analyze command (quick test)
echo "🔍 Testing hardware analysis..."
if timeout 10s node src/cli.js analyze --json > /dev/null 2>&1; then
    echo "✅ Hardware analysis works"
else
    echo "⚠️  Hardware analysis test had issues (this may be normal in some environments)"
fi

# Check package.json
echo "📦 Validating package.json..."

# Check required fields
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_DESCRIPTION=$(node -p "require('./package.json').description")

if [[ -z "$PACKAGE_NAME" || -z "$PACKAGE_VERSION" || -z "$PACKAGE_DESCRIPTION" ]]; then
    echo "❌ package.json is missing required fields"
    exit 1
fi

echo "✅ Package validation passed"
echo "   Name: $PACKAGE_NAME"
echo "   Version: $PACKAGE_VERSION"
echo "   Description: $PACKAGE_DESCRIPTION"

# Check if already published
echo "🔍 Checking NPM registry..."
if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" > /dev/null 2>&1; then
    echo "❌ Version $PACKAGE_VERSION already published to NPM"
    echo "   Please update the version in package.json"
    exit 1
else
    echo "✅ Version $PACKAGE_VERSION is available for publication"
fi

# Git status check
echo "📝 Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Publication cancelled"
        exit 1
    fi
fi

# Check if GitHub remote is set
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -z "$REMOTE_URL" ]]; then
    echo "⚠️  No GitHub remote configured"
    echo "   You'll need to create a GitHub repository and push the code"
else
    echo "✅ GitHub remote configured: $REMOTE_URL"
fi

# NPM login check
echo "🔐 Checking NPM authentication..."
if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo "✅ Logged in to NPM as: $NPM_USER"
else
    echo "❌ Not logged in to NPM"
    echo "   Run 'npm login' before publishing"
    exit 1
fi

# Final confirmation
echo ""
echo "🎯 Ready to publish!"
echo "==================="
echo "Package: $PACKAGE_NAME@$PACKAGE_VERSION"
echo "NPM User: $NPM_USER"
echo "Git Remote: $REMOTE_URL"
echo ""

read -p "Are you sure you want to publish to NPM? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

# Publish to NPM
echo "📤 Publishing to NPM..."
if npm publish; then
    echo "✅ Successfully published to NPM!"
    echo ""
    echo "🎉 Publication completed!"
    echo "========================"
    echo "Your package is now available at:"
    echo "📦 NPM: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo "📚 Install: npm install -g $PACKAGE_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Create a GitHub release with tag v$PACKAGE_VERSION"
    echo "2. Update your web application to use the published package"
    echo "3. Share the news! 🎊"
else
    echo "❌ NPM publication failed"
    exit 1
fi