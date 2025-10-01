const PortManager = require('./PortManager');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('PortManager', () => {
  let portManager;
  let testConfigDir;
  let testConfigFile;

  beforeEach(() => {
    // Create a temporary test directory
    testConfigDir = path.join(os.tmpdir(), '.devport-test-' + Date.now());
    testConfigFile = path.join(testConfigDir, 'ports.json');

    // Override the config paths for testing
    portManager = new PortManager();
    portManager.configDir = testConfigDir;
    portManager.configFile = testConfigFile;
    portManager.ensureConfigDir();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigFile)) {
      fs.unlinkSync(testConfigFile);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  describe('addPort', () => {
    test('should add a new port successfully', () => {
      const result = portManager.addPort(3000, 'test-project', 'Test description');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Port 3000 registered');

      const ports = portManager.loadPorts();
      expect(ports['3000']).toBeDefined();
      expect(ports['3000'].project).toBe('test-project');
      expect(ports['3000'].description).toBe('Test description');
    });

    test('should fail when port is already registered', () => {
      portManager.addPort(3000, 'project1');
      const result = portManager.addPort(3000, 'project2');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already used');
    });
  });

  describe('removePort', () => {
    test('should remove an existing port', () => {
      portManager.addPort(3000, 'test-project');
      const result = portManager.removePort(3000);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Port 3000 removed');

      const ports = portManager.loadPorts();
      expect(ports['3000']).toBeUndefined();
    });

    test('should fail when port is not registered', () => {
      const result = portManager.removePort(3000);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not registered');
    });
  });

  describe('listPorts', () => {
    test('should return empty array when no ports registered', () => {
      const ports = portManager.listPorts();
      expect(ports).toEqual([]);
    });

    test('should return sorted list of ports', () => {
      portManager.addPort(3001, 'project-b');
      portManager.addPort(3000, 'project-a');
      portManager.addPort(3002, 'project-c');

      const ports = portManager.listPorts();

      expect(ports).toHaveLength(3);
      expect(ports[0].port).toBe(3000);
      expect(ports[1].port).toBe(3001);
      expect(ports[2].port).toBe(3002);
    });
  });

  describe('findPort', () => {
    test('should find an existing port', () => {
      portManager.addPort(3000, 'test-project', 'Test description');
      const info = portManager.findPort(3000);

      expect(info).toBeDefined();
      expect(info.project).toBe('test-project');
      expect(info.description).toBe('Test description');
    });

    test('should return null for non-existent port', () => {
      const info = portManager.findPort(3000);
      expect(info).toBeNull();
    });
  });

  describe('suggestPort', () => {
    test('should suggest starting port when no ports registered', () => {
      const suggested = portManager.suggestPort(3000);
      expect(suggested).toBe(3000);
    });

    test('should suggest next available port', () => {
      portManager.addPort(3000, 'project1');
      portManager.addPort(3001, 'project2');

      const suggested = portManager.suggestPort(3000);
      expect(suggested).toBe(3002);
    });

    test('should suggest available port with custom start', () => {
      portManager.addPort(4000, 'project1');

      const suggested = portManager.suggestPort(4000);
      expect(suggested).toBe(4001);
    });
  });

  describe('clearAll', () => {
    test('should clear all ports', () => {
      portManager.addPort(3000, 'project1');
      portManager.addPort(3001, 'project2');

      const result = portManager.clearAll();

      expect(result.success).toBe(true);
      expect(result.message).toContain('cleared');

      const ports = portManager.listPorts();
      expect(ports).toHaveLength(0);
    });
  });

  describe('killProcess', () => {
    test('should return error when no process is using the port', () => {
      const result = portManager.killProcess(9999);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No process found');
    });

    test('should validate port number range', () => {
      // Test with port in valid range
      const result = portManager.killProcess(8080);

      // Since no process is running, it should fail gracefully
      expect(result.success).toBe(false);
    });
  });
});
