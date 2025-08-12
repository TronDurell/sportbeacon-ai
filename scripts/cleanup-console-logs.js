#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const SCAN_DIRECTORIES = ['./lib', './frontend/src', './backend', './functions/src', './scripts', './jobs', './features', './townRec'];
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**'
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

class ConsoleLogCleaner {
  constructor() {
    this.consoleLogs = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Check if file should be excluded from scanning
   */
  shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      return new RegExp(regexPattern).test(filePath);
    });
  }

  /**
   * Check if file has valid extension
   */
  hasValidExtension(filePath) {
    return FILE_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }

  /**
   */
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.shouldExcludeFile(fullPath)) {
            this.scanDirectory(fullPath);
          }
        } else if (stat.isFile() && this.hasValidExtension(fullPath)) {
          this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  /**
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
          this.consoleLogs.push({
            file: filePath,
            line: index + 1,
            content: trimmedLine,
            fullLine: line
          });
        }
      });
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  /**
   */
  displayResults() {

    if (this.consoleLogs.length === 0) {
      return;
    }


    // Group by file
    const groupedByFile = this.consoleLogs.reduce((acc, log) => {
      if (!acc[log.file]) {
        acc[log.file] = [];
      }
      acc[log.file].push(log);
      return acc;
    }, {});

    Object.entries(groupedByFile).forEach(([filePath, logs]) => {
      logs.forEach(log => {
      });
    });

  }

  /**
   * Ask user for cleanup action
   */
  async askForCleanupAction() {
    if (this.consoleLogs.length === 0) {
      return;
    }


    return new Promise((resolve) => {
      this.rl.question('\nChoose an option (1-4): ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   */
  commentOutConsoleLogs() {
    
    const processedFiles = new Set();
    
    this.consoleLogs.forEach(log => {
      if (!processedFiles.has(log.file)) {
        this.processFile(log.file, 'comment');
        processedFiles.add(log.file);
      }
    });

  }

  /**
   */
  removeConsoleLogs() {
    
    const processedFiles = new Set();
    
    this.consoleLogs.forEach(log => {
      if (!processedFiles.has(log.file)) {
        this.processFile(log.file, 'remove');
        processedFiles.add(log.file);
      }
    });

  }

  /**
   * Process file for cleanup
   */
  processFile(filePath, action) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      const newLines = lines.map(line => {
        const trimmedLine = line.trim();
          modified = true;
          if (action === 'comment') {
            // Add comment prefix
            const indent = line.match(/^\s*/)[0];
          } else if (action === 'remove') {
            // Remove the line entirely
            return '';
          }
        }
        return line;
      });

      if (modified) {
        // Remove empty lines if removing
        const finalLines = action === 'remove' 
          ? newLines.filter(line => line !== '')
          : newLines;
        
        fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Interactive cleanup mode
   */
  async interactiveCleanup() {

    for (const log of this.consoleLogs) {
      
      const action = await this.askForLogAction();
      
      if (action === 'comment') {
        this.commentOutSingleLog(log);
      } else if (action === 'remove') {
        this.removeSingleLog(log);
      } else if (action === 'skip') {
      }
    }
  }

  /**
   * Ask user for action on single log
   */
  askForLogAction() {
    return new Promise((resolve) => {
      this.rl.question('Action (comment/remove/skip): ', (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  /**
   */
  commentOutSingleLog(log) {
    try {
      const content = fs.readFileSync(log.file, 'utf8');
      const lines = content.split('\n');
      
      const indent = lines[log.line - 1].match(/^\s*/)[0];
      
      fs.writeFileSync(log.file, lines.join('\n'), 'utf8');
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }

  /**
   */
  removeSingleLog(log) {
    try {
      const content = fs.readFileSync(log.file, 'utf8');
      const lines = content.split('\n');
      
      lines.splice(log.line - 1, 1);
      
      fs.writeFileSync(log.file, lines.join('\n'), 'utf8');
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }

  /**
   * Close readline interface
   */
  close() {
    this.rl.close();
  }

  /**
   * Main execution method
   */
  async run() {

    
    SCAN_DIRECTORIES.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      } else {
      }
    });

    this.displayResults();

    const action = await this.askForCleanupAction();
    
    switch (action) {
      case '1':
        this.commentOutConsoleLogs();
        break;
      case '2':
        this.removeConsoleLogs();
        break;
      case '3':
        await this.interactiveCleanup();
        break;
      case '4':
        break;
      default:
    }

    this.close();
  }
}

// Run the cleaner
if (require.main === module) {
  const cleaner = new ConsoleLogCleaner();
  cleaner.run().catch(error => {
    process.exit(1);
  });
}

module.exports = ConsoleLogCleaner; 