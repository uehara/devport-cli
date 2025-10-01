const fs = require('fs');
const path = require('path');
const os = require('os');

class PortManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.devport');
    this.configFile = path.join(this.configDir, 'ports.json');
    this.ensureConfigDir();

    // Port detection patterns for common frameworks and configurations
    this.portPatterns = [
      // package.json scripts: "dev": "next dev -p 3000"
      { regex: /(?:port|PORT|Port)\s*[=:]\s*(?:process\.env\.\w+\s*\|\|\s*)?(\d{4,5})/g, confidence: 'medium' },
      // Next.js, Vite, React: PORT=3000
      { regex: /PORT\s*=\s*(\d{4,5})/g, confidence: 'high' },
      // Express/Node: app.listen(3000)
      { regex: /\.listen\s*\(\s*(\d{4,5})/g, confidence: 'high' },
      // Vite config: server: { port: 3000 }
      { regex: /server\s*:\s*\{[^}]*port\s*:\s*(\d{4,5})/g, confidence: 'high' },
      // Next.js -p flag: next dev -p 3000
      { regex: /next\s+(?:dev|start)\s+(?:-p|--port)\s+(\d{4,5})/g, confidence: 'high' },
      // npm scripts with port: "start": "react-scripts start" (default 3000)
      { regex: /"(?:start|dev|serve)":\s*"[^"]*(?:--port|PORT=)\s*(\d{4,5})/g, confidence: 'high' },
      // Docker compose ports: "3000:3000"
      { regex: /(?:ports|expose):\s*-\s*"?(\d{4,5}):/gm, confidence: 'medium' },
      // Environment files: PORT=3000
      { regex: /^PORT\s*=\s*(\d{4,5})/gm, confidence: 'high' },
    ];

    // Files to scan for port configurations
    this.filesToScan = [
      'package.json',
      'vite.config.js',
      'vite.config.ts',
      'next.config.js',
      'next.config.ts',
      'docker-compose.yml',
      'docker-compose.yaml',
      '.env',
      '.env.local',
      '.env.development',
      'server.js',
      'index.js',
      'app.js',
      'main.js',
    ];
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadPorts() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading ports configuration:', error.message);
    }
    return {};
  }

  savePorts(ports) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(ports, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving ports configuration:', error.message);
      return false;
    }
  }

  addPort(port, projectName, description = '') {
    const ports = this.loadPorts();
    
    if (ports[port]) {
      return { success: false, message: `Port ${port} is already used by "${ports[port].project}"` };
    }

    ports[port] = {
      project: projectName,
      description: description,
      createdAt: new Date().toISOString()
    };

    if (this.savePorts(ports)) {
      return { success: true, message: `Port ${port} registered for "${projectName}"` };
    }
    
    return { success: false, message: 'Failed to save port configuration' };
  }

  removePort(port) {
    const ports = this.loadPorts();
    
    if (!ports[port]) {
      return { success: false, message: `Port ${port} is not registered` };
    }

    const projectName = ports[port].project;
    delete ports[port];

    if (this.savePorts(ports)) {
      return { success: true, message: `Port ${port} removed (was used by "${projectName}")` };
    }
    
    return { success: false, message: 'Failed to save port configuration' };
  }

  listPorts() {
    const ports = this.loadPorts();
    return Object.entries(ports).map(([port, info]) => ({
      port: parseInt(port),
      project: info.project,
      description: info.description || '',
      createdAt: info.createdAt
    })).sort((a, b) => a.port - b.port);
  }

  findPort(port) {
    const ports = this.loadPorts();
    return ports[port] || null;
  }

  suggestPort(startPort = 3000) {
    const ports = this.loadPorts();
    const usedPorts = Object.keys(ports).map(port => parseInt(port));
    
    let suggestedPort = startPort;
    while (usedPorts.includes(suggestedPort)) {
      suggestedPort++;
    }
    
    return suggestedPort;
  }

  clearAll() {
    if (this.savePorts({})) {
      return { success: true, message: 'All ports cleared' };
    }
    return { success: false, message: 'Failed to clear ports' };
  }

  killProcess(port) {
    const { execSync } = require('child_process');

    try {
      // Find process using the port
      let pid;
      if (process.platform === 'win32') {
        // Windows
        const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        if (lines.length > 0) {
          const match = lines[0].match(/\s+(\d+)$/);
          if (match) {
            pid = match[1];
          }
        }
      } else {
        // macOS/Linux
        const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
        pid = output.trim();
      }

      if (!pid) {
        return { success: false, message: `No process found using port ${port}` };
      }

      // Kill the process
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${pid} /F`);
      } else {
        execSync(`kill -9 ${pid}`);
      }

      return { success: true, message: `Process (PID: ${pid}) using port ${port} has been killed` };
    } catch (error) {
      if (error.message.includes('No such process') || error.status === 1) {
        return { success: false, message: `No process found using port ${port}` };
      }
      return { success: false, message: `Error killing process: ${error.message}` };
    }
  }

  killByProject(projectName) {
    const ports = this.loadPorts();
    const matchingPorts = [];

    // Find all ports for this project
    for (const [port, info] of Object.entries(ports)) {
      if (info.project === projectName) {
        matchingPorts.push(parseInt(port));
      }
    }

    if (matchingPorts.length === 0) {
      return { success: false, message: `No ports registered for project "${projectName}"` };
    }

    // Kill processes for all matching ports
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const port of matchingPorts) {
      const result = this.killProcess(port);
      results.push({ port, result });
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0 && failCount === 0) {
      return {
        success: true,
        message: `Killed ${successCount} process(es) for project "${projectName}"`,
        details: results
      };
    } else if (successCount > 0 && failCount > 0) {
      return {
        success: true,
        message: `Killed ${successCount} process(es), ${failCount} failed for project "${projectName}"`,
        details: results
      };
    } else {
      return {
        success: false,
        message: `Failed to kill processes for project "${projectName}"`,
        details: results
      };
    }
  }

  killAll() {
    const ports = this.loadPorts();
    const allPorts = Object.keys(ports).map(port => parseInt(port));

    if (allPorts.length === 0) {
      return { success: false, message: 'No ports registered' };
    }

    // Kill processes for all registered ports
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const port of allPorts) {
      const result = this.killProcess(port);
      results.push({ port, project: ports[port].project, result });
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0 && failCount === 0) {
      return {
        success: true,
        message: `Killed all ${successCount} registered process(es)`,
        details: results
      };
    } else if (successCount > 0 && failCount > 0) {
      return {
        success: true,
        message: `Killed ${successCount} process(es), ${failCount} not running`,
        details: results
      };
    } else {
      return {
        success: false,
        message: `No processes were running for the ${allPorts.length} registered port(s)`,
        details: results
      };
    }
  }

  scanDirectory(directory, maxDepth = 3) {
    const foundPorts = new Map(); // port -> { projects: Set, files: Set, confidence: string }
    const scannedDirs = new Set();

    const scanDir = (dir, currentDepth) => {
      if (currentDepth > maxDepth || scannedDirs.has(dir)) {
        return;
      }

      scannedDirs.add(dir);

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip common directories that shouldn't be scanned
          if (entry.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache'].includes(entry.name)) {
              continue;
            }
            scanDir(fullPath, currentDepth + 1);
          } else if (entry.isFile() && this.filesToScan.includes(entry.name)) {
            // Scan file for ports
            this.scanFile(fullPath, foundPorts);
          }
        }
      } catch (error) {
        // Skip directories we can't read (permission issues, etc.)
      }
    };

    scanDir(directory, 0);

    // Convert Map to array format
    const results = [];
    for (const [port, data] of foundPorts.entries()) {
      results.push({
        port: parseInt(port),
        projects: Array.from(data.projects),
        files: Array.from(data.files),
        confidence: data.confidence
      });
    }

    return results.sort((a, b) => a.port - b.port);
  }

  scanFile(filePath, foundPorts) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const projectDir = this.findProjectRoot(filePath);
      const projectName = path.basename(projectDir);

      // Apply all port patterns
      for (const pattern of this.portPatterns) {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        let match;

        while ((match = regex.exec(content)) !== null) {
          const port = match[1];

          // Validate port range
          const portNum = parseInt(port);
          if (portNum >= 1000 && portNum <= 65535) {
            if (!foundPorts.has(port)) {
              foundPorts.set(port, {
                projects: new Set(),
                files: new Set(),
                confidence: pattern.confidence
              });
            }

            const portData = foundPorts.get(port);
            portData.projects.add(projectName);
            portData.files.add(path.relative(projectDir, filePath));

            // Upgrade confidence if we find a high-confidence match
            if (pattern.confidence === 'high' && portData.confidence !== 'high') {
              portData.confidence = 'high';
            }
          }
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  findProjectRoot(filePath) {
    let dir = path.dirname(filePath);

    // Look for package.json or other project markers
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'package.json')) ||
          fs.existsSync(path.join(dir, '.git'))) {
        return dir;
      }
      dir = path.dirname(dir);
    }

    return path.dirname(filePath);
  }

  autoRegister(directory, maxDepth = 3, options = {}) {
    const scannedPorts = this.scanDirectory(directory, maxDepth);
    const existingPorts = this.loadPorts();
    const results = {
      added: [],
      skipped: [],
      failed: []
    };

    for (const portInfo of scannedPorts) {
      const port = portInfo.port;
      const projectName = portInfo.projects[0]; // Use first project name
      const description = `Auto-detected from ${portInfo.files[0]} (${portInfo.confidence} confidence)`;

      // Check if port is already registered
      if (existingPorts[port]) {
        results.skipped.push({
          port,
          projectName,
          reason: `Already registered to "${existingPorts[port].project}"`
        });
        continue;
      }

      // Skip low confidence matches if not forced
      if (!options.includeAll && portInfo.confidence !== 'high') {
        results.skipped.push({
          port,
          projectName,
          reason: 'Low confidence match (use --all to include)'
        });
        continue;
      }

      // Add the port
      const result = this.addPort(port, projectName, description);
      if (result.success) {
        results.added.push({
          port,
          projectName,
          files: portInfo.files,
          confidence: portInfo.confidence
        });
      } else {
        results.failed.push({
          port,
          projectName,
          reason: result.message
        });
      }
    }

    return results;
  }
}

module.exports = PortManager;