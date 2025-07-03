const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class PortManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.devport');
    this.configFile = path.join(this.configDir, 'ports.json');
    this.ensureConfigDir();
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

  getActivePorts() {
    try {
      const output = execSync('lsof -i -P -n', { encoding: 'utf8' });
      const lines = output.split('\n');
      const activePorts = [];
      
      for (const line of lines) {
        if (line.includes('LISTEN')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 9) {
            const processName = parts[0];
            const pid = parts[1];
            const portMatch = parts[8].match(/:(\d+)$/);
            
            if (portMatch) {
              const port = parseInt(portMatch[1]);
              const command = parts.slice(8).join(' ');
              
              activePorts.push({
                port: port,
                pid: parseInt(pid),
                processName: processName,
                command: command
              });
            }
          }
        }
      }
      
      return activePorts.sort((a, b) => a.port - b.port);
    } catch (error) {
      console.error('Error getting active ports:', error.message);
      return [];
    }
  }

  killProcess(port) {
    try {
      const output = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' });
      const pids = output.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        return { success: false, message: `No process found using port ${port}` };
      }
      
      for (const pid of pids) {
        execSync(`kill -9 ${pid}`);
      }
      
      return { success: true, message: `Process(es) using port ${port} killed (PID: ${pids.join(', ')})` };
    } catch (error) {
      if (error.status === 1) {
        return { success: false, message: `No process found using port ${port}` };
      }
      return { success: false, message: `Error killing process: ${error.message}` };
    }
  }
}

module.exports = PortManager;