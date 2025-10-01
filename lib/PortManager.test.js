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

  describe('killByProject', () => {
    test('should return error when project has no registered ports', () => {
      const result = portManager.killByProject('non-existent-project');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No ports registered');
    });

    test('should attempt to kill processes for all ports of a project', () => {
      // Register multiple ports for the same project
      portManager.addPort(3000, 'test-app');
      portManager.addPort(3001, 'test-app');
      portManager.addPort(4000, 'other-app');

      const result = portManager.killByProject('test-app');

      // Since no actual processes are running, it should report no processes found
      expect(result.success).toBe(false);
      expect(result.details).toBeDefined();
      expect(result.details).toHaveLength(2);
      expect(result.details[0].port).toBe(3000);
      expect(result.details[1].port).toBe(3001);
    });

    test('should only target specified project', () => {
      portManager.addPort(3000, 'project-a');
      portManager.addPort(3001, 'project-b');

      const result = portManager.killByProject('project-a');

      expect(result.details).toHaveLength(1);
      expect(result.details[0].port).toBe(3000);
    });
  });

  describe('killAll', () => {
    test('should return error when no ports are registered', () => {
      const result = portManager.killAll();

      expect(result.success).toBe(false);
      expect(result.message).toContain('No ports registered');
    });

    test('should attempt to kill processes for all registered ports', () => {
      portManager.addPort(3000, 'project-a');
      portManager.addPort(3001, 'project-b');
      portManager.addPort(4000, 'project-c');

      const result = portManager.killAll();

      // Since no actual processes are running, it should report no processes found
      expect(result.details).toBeDefined();
      expect(result.details).toHaveLength(3);
      expect(result.details[0].port).toBe(3000);
      expect(result.details[1].port).toBe(3001);
      expect(result.details[2].port).toBe(4000);
    });

    test('should include project names in results', () => {
      portManager.addPort(3000, 'my-app');

      const result = portManager.killAll();

      expect(result.details[0].project).toBe('my-app');
    });
  });

  describe('scanDirectory', () => {
    let testProjectDir;

    beforeEach(() => {
      // Create a test project structure
      testProjectDir = path.join(os.tmpdir(), 'devport-test-project-' + Date.now());
      fs.mkdirSync(testProjectDir, { recursive: true });
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
    });

    test('should find ports in package.json', () => {
      const packageJson = {
        name: 'test-app',
        scripts: {
          dev: 'next dev -p 3000',
          start: 'node server.js'
        }
      };
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const results = portManager.scanDirectory(testProjectDir, 1);

      expect(results.length).toBeGreaterThan(0);
      const port3000 = results.find(r => r.port === 3000);
      expect(port3000).toBeDefined();
      expect(port3000.confidence).toBe('high');
    });

    test('should find ports in .env files', () => {
      const envContent = 'PORT=4000\nDATABASE_URL=postgres://localhost:5432';
      fs.writeFileSync(path.join(testProjectDir, '.env'), envContent);
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test"}');

      const results = portManager.scanDirectory(testProjectDir, 1);

      expect(results.length).toBeGreaterThan(0);
      const port4000 = results.find(r => r.port === 4000);
      expect(port4000).toBeDefined();
      expect(port4000.confidence).toBe('high');
    });

    test('should respect max depth limit', () => {
      // Create nested structure
      const level1 = path.join(testProjectDir, 'level1');
      const level2 = path.join(level1, 'level2');
      const level3 = path.join(level2, 'level3');
      const level4 = path.join(level3, 'level4');

      fs.mkdirSync(level4, { recursive: true });
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"root"}');
      fs.writeFileSync(path.join(level3, '.env'), 'PORT=3000');
      fs.writeFileSync(path.join(level4, '.env'), 'PORT=4000');

      // Scan with depth 3 - should find level3 but not level4
      const results = portManager.scanDirectory(testProjectDir, 3);

      const hasPort3000 = results.some(r => r.port === 3000);
      const hasPort4000 = results.some(r => r.port === 4000);

      expect(hasPort3000).toBe(true);
      expect(hasPort4000).toBe(false);
    });

    test('should skip node_modules and other excluded directories', () => {
      const nodeModules = path.join(testProjectDir, 'node_modules');
      fs.mkdirSync(nodeModules);
      fs.writeFileSync(path.join(nodeModules, '.env'), 'PORT=9999');
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test"}');

      const results = portManager.scanDirectory(testProjectDir, 5);

      const hasPort9999 = results.some(r => r.port === 9999);
      expect(hasPort9999).toBe(false);
    });
  });

  describe('autoRegister', () => {
    let testProjectDir;

    beforeEach(() => {
      testProjectDir = path.join(os.tmpdir(), 'devport-test-autoreg-' + Date.now());
      fs.mkdirSync(testProjectDir, { recursive: true });

      // Reset portManager to use test config
      portManager.configDir = path.join(os.tmpdir(), '.devport-test-' + Date.now());
      portManager.configFile = path.join(portManager.configDir, 'ports.json');
      portManager.ensureConfigDir();
    });

    afterEach(() => {
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
      if (fs.existsSync(portManager.configDir)) {
        fs.rmSync(portManager.configDir, { recursive: true, force: true });
      }
    });

    test('should auto-register high-confidence ports', () => {
      fs.writeFileSync(path.join(testProjectDir, '.env'), 'PORT=3000');
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test-app"}');

      const results = portManager.autoRegister(testProjectDir, 1);

      expect(results.added.length).toBeGreaterThan(0);
      expect(results.added[0].port).toBe(3000);
      // Project name will be the directory name since it finds package.json in the parent directory
      expect(results.added[0].projectName).toBeDefined();

      // Verify it was actually registered
      const registeredPorts = portManager.loadPorts();
      expect(registeredPorts['3000']).toBeDefined();
    });

    test('should skip already registered ports', () => {
      fs.writeFileSync(path.join(testProjectDir, '.env'), 'PORT=3000');
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test-app"}');

      // Register manually first
      portManager.addPort(3000, 'existing-project');

      const results = portManager.autoRegister(testProjectDir, 1);

      expect(results.skipped.length).toBeGreaterThan(0);
      expect(results.skipped[0].port).toBe(3000);
      expect(results.skipped[0].reason).toContain('Already registered');
    });

    test('should skip low-confidence matches by default', () => {
      // Create a file with a medium confidence pattern
      fs.writeFileSync(path.join(testProjectDir, 'server.js'), 'const port = 5000;');
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test"}');

      const results = portManager.autoRegister(testProjectDir, 1, { includeAll: false });

      const port5000Added = results.added.some(r => r.port === 5000);
      expect(port5000Added).toBe(false);
    });

    test('should include low-confidence matches with includeAll option', () => {
      fs.writeFileSync(path.join(testProjectDir, 'server.js'), 'const port = 5000;');
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name":"test"}');

      const results = portManager.autoRegister(testProjectDir, 1, { includeAll: true });

      const port5000 = results.added.find(r => r.port === 5000) || results.skipped.find(r => r.port === 5000);
      expect(port5000).toBeDefined();
    });
  });
});
