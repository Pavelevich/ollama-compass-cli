# Publication Guide for ollama-compass-cli

This guide will help you publish the Ollama Compass CLI to both GitHub and NPM.

## Prerequisites

1. **GitHub Account**: Make sure you have a GitHub account with appropriate permissions
2. **NPM Account**: Create an NPM account at https://www.npmjs.com if you don't have one
3. **Node.js**: Ensure Node.js 14+ is installed
4. **Git**: Make sure Git is configured with your credentials

## Step 1: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click "New Repository" or go to https://github.com/new
3. Set the repository details:
   - **Repository name**: `ollama-compass-cli`
   - **Organization/Owner**: Choose your organization or personal account
   - **Description**: `Local hardware detection and Ollama monitoring CLI for Ollama Model Compass`
   - **Visibility**: Public
   - **Initialize**: Don't initialize with README (we already have files)

4. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, run these commands:

```bash
# Make sure you're in the CLI directory
cd /home/pavel/Documents/ollama-compass-cli

# Update the remote URL with your actual GitHub username/org
git remote set-url origin https://github.com/YOUR_USERNAME/ollama-compass-cli.git

# Push to GitHub
git push -u origin master
```

## Step 3: Verify CLI Works

Before publishing to NPM, test the CLI locally:

```bash
# Test CLI commands
node src/cli.js --help
node src/cli.js analyze
node src/cli.js start

# Test global installation locally
npm install -g .
ollama-compass --help
ollama-compass analyze
```

## Step 4: Login to NPM

```bash
# Login to NPM (you'll be prompted for credentials)
npm login
```

## Step 5: Publish to NPM

```bash
# Verify package.json is correct
npm run prepublishOnly

# Publish to NPM (this will create the package publicly)
npm publish

# If you need to publish a scoped package or pre-release:
# npm publish --access public
# npm publish --tag beta
```

## Step 6: Verify NPM Publication

1. Check your package page: https://www.npmjs.com/package/ollama-compass-cli
2. Test installation: `npm install -g ollama-compass-cli`
3. Test CLI: `ollama-compass --help`

## Step 7: Update Frontend URLs

After successful publication, update the frontend to use the real GitHub repository:

1. Update `CLIStatusModal.tsx`:
   - Change GitHub URL from placeholder to real repository
   - Update NPM package URL to real package

2. Update any documentation or links in the web application

## Post-Publication Tasks

1. **Create GitHub Release**: Create a release on GitHub with version tag `v1.0.0`
2. **Update Documentation**: Ensure README.md is comprehensive
3. **Add GitHub Topics**: Add relevant topics to your GitHub repository
4. **Monitor Issues**: Set up issue templates and monitoring
5. **CI/CD**: Consider setting up GitHub Actions for automated testing

## Version Updates

For future updates:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with new changes
3. Commit changes: `git commit -am "Release v1.x.x"`
4. Create git tag: `git tag v1.x.x`
5. Push with tags: `git push origin master --tags`
6. Publish to NPM: `npm publish`
7. Create GitHub release

## Troubleshooting

### NPM Publish Errors

- **Name already taken**: Change package name in `package.json`
- **Authentication failed**: Run `npm login` again
- **Permission denied**: Check if you have publish rights to the package name

### GitHub Push Errors

- **Authentication failed**: Check your GitHub credentials
- **Repository not found**: Ensure the repository exists and URL is correct
- **Permission denied**: Check repository permissions

### CLI Testing Issues

- **Command not found**: Make sure `src/cli.js` is executable: `chmod +x src/cli.js`
- **Module not found**: Run `npm install` to install dependencies
- **Permission errors**: On Unix systems, you might need elevated permissions for system info

## Security Notes

- **Never commit sensitive data**: Ensure no API keys or secrets are in the code
- **Review dependencies**: All dependencies are from trusted sources
- **Audit packages**: Run `npm audit` before publishing
- **Keep dependencies updated**: Regularly update to patch security vulnerabilities

---

## Current Package Status

- **Version**: 1.0.0
- **License**: MIT
- **Node.js**: >=14.0.0
- **Dependencies**: Production-ready, no dev dependencies in final package
- **Testing**: Manual testing completed, ready for publication

Good luck with the publication! 🚀