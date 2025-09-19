# Node.js Version Requirements

## Current Configuration
- **Required Version**: Node.js 18.20.4 LTS (specified in `.nvmrc`)
- **Current System**: Node.js 22.14.0 (needs to be downgraded)
- **Package Manager**: npm (comes with Node.js)

## Version Management

### Using nvm (Recommended)
```bash
# Install Node.js 18.20.4
nvm install 18.20.4
nvm use 18.20.4

# Verify version
node --version  # Should show v18.20.4
```

### Using .nvmrc
```bash
# Navigate to project directory
cd sportbeacon-ai

# Use the version specified in .nvmrc
nvm use

# Verify version
node --version  # Should show v18.20.4
```

## Why Node.js 18.20.4?
- **LTS Version**: Long Term Support for stability
- **Test Compatibility**: All Jest and Vitest configurations tested with this version
- **Firebase Compatibility**: Firebase Functions and Admin SDK optimized for Node 18
- **CI/CD Consistency**: GitHub Actions uses Node 18.x in matrix

## Troubleshooting

### Version Mismatch Issues
If you see errors like:
```
Error: Jest: Failed to parse the TypeScript config file
SyntaxError: Cannot use import statement outside a module
```

**Solution**: Switch to Node.js 18.20.4 using nvm:
```bash
nvm install 18.20.4
nvm use 18.20.4
npm install  # Reinstall dependencies for correct Node version
```

### CI/CD Notes
- GitHub Actions workflow uses `node-version: [18.x]`
- Docker containers should use Node 18.20.4 base image
- Production deployments must use Node 18.20.4

## Verification
```bash
# Check current version
node --version

# Should output: v18.20.4
# If not, run: nvm use
```
