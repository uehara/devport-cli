const fs = require('fs');
const path = require('path');
const os = require('os');

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
}

module.exports = PortManager;