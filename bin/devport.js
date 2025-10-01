#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const PortManager = require('../lib/PortManager');

const program = new Command();
const portManager = new PortManager();

program
  .name('devport')
  .description('CLI tool for managing development server ports')
  .version('1.3.0');

program
  .command('add <port> <project>')
  .description('Register a port for a project')
  .option('-d, --description <desc>', 'Project description')
  .action((port, project, options) => {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.error(chalk.red('Error: Port must be a number between 1 and 65535'));
      process.exit(1);
    }

    const result = portManager.addPort(portNum, project, options.description || '');
    
    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
    } else {
      console.error(chalk.red('✗ ' + result.message));
      process.exit(1);
    }
  });

program
  .command('remove <port>')
  .alias('rm')
  .description('Remove a port registration')
  .action((port) => {
    const portNum = parseInt(port);
    if (isNaN(portNum)) {
      console.error(chalk.red('Error: Port must be a number'));
      process.exit(1);
    }

    const result = portManager.removePort(portNum);
    
    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
    } else {
      console.error(chalk.red('✗ ' + result.message));
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List all registered ports')
  .action(() => {
    const ports = portManager.listPorts();
    
    if (ports.length === 0) {
      console.log(chalk.yellow('No ports registered yet.'));
      console.log(chalk.dim('Use "devport add <port> <project>" to register a port.'));
      return;
    }

    console.log(chalk.bold('\nRegistered Development Ports:\n'));
    console.log(chalk.dim('Port  | Project Name        | Description'));
    console.log(chalk.dim('------|--------------------|-----------------'));
    
    ports.forEach(({ port, project, description }) => {
      const portStr = chalk.cyan(port.toString().padEnd(5));
      const projectStr = chalk.white(project.padEnd(19));
      const descStr = chalk.dim(description || '');
      console.log(`${portStr} | ${projectStr} | ${descStr}`);
    });
    
    console.log(chalk.dim(`\nTotal: ${ports.length} port(s) registered\n`));
  });

program
  .command('find <port>')
  .description('Find information about a specific port')
  .action((port) => {
    const portNum = parseInt(port);
    if (isNaN(portNum)) {
      console.error(chalk.red('Error: Port must be a number'));
      process.exit(1);
    }

    const info = portManager.findPort(portNum);
    
    if (info) {
      console.log(chalk.green(`Port ${portNum} is registered:`));
      console.log(chalk.white(`  Project: ${info.project}`));
      if (info.description) {
        console.log(chalk.dim(`  Description: ${info.description}`));
      }
      console.log(chalk.dim(`  Registered: ${new Date(info.createdAt).toLocaleString()}`));
    } else {
      console.log(chalk.yellow(`Port ${portNum} is not registered.`));
    }
  });

program
  .command('suggest')
  .description('Suggest an available port')
  .option('-s, --start <port>', 'Starting port number', '3000')
  .action((options) => {
    const startPort = parseInt(options.start);
    if (isNaN(startPort)) {
      console.error(chalk.red('Error: Start port must be a number'));
      process.exit(1);
    }

    const suggestedPort = portManager.suggestPort(startPort);
    console.log(chalk.green(`Suggested available port: ${suggestedPort}`));
  });

program
  .command('clear')
  .description('Clear all port registrations')
  .action(() => {
    const result = portManager.clearAll();

    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
    } else {
      console.error(chalk.red('✗ ' + result.message));
    }
  });

program
  .command('kill <port>')
  .description('Kill the process using the specified port')
  .action((port) => {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.error(chalk.red('Error: Port must be a number between 1 and 65535'));
      process.exit(1);
    }

    const result = portManager.killProcess(portNum);

    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
    } else {
      console.error(chalk.red('✗ ' + result.message));
      process.exit(1);
    }
  });

program
  .command('kill-project <project>')
  .description('Kill all processes for the specified project')
  .action((project) => {
    const result = portManager.killByProject(project);

    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
      if (result.details) {
        result.details.forEach(({ port, result: portResult }) => {
          if (portResult.success) {
            console.log(chalk.dim(`  Port ${port}: ${portResult.message}`));
          } else {
            console.log(chalk.yellow(`  Port ${port}: ${portResult.message}`));
          }
        });
      }
    } else {
      console.error(chalk.red('✗ ' + result.message));
      process.exit(1);
    }
  });

program
  .command('kill-all')
  .description('Kill all processes for all registered ports')
  .action(() => {
    const result = portManager.killAll();

    if (result.success) {
      console.log(chalk.green('✓ ' + result.message));
      if (result.details) {
        result.details.forEach(({ port, project, result: portResult }) => {
          if (portResult.success) {
            console.log(chalk.dim(`  Port ${port} (${project}): ${portResult.message}`));
          } else {
            console.log(chalk.yellow(`  Port ${port} (${project}): ${portResult.message}`));
          }
        });
      }
    } else {
      console.error(chalk.red('✗ ' + result.message));
      if (result.details) {
        result.details.forEach(({ port, project, result: portResult }) => {
          console.log(chalk.yellow(`  Port ${port} (${project}): ${portResult.message}`));
        });
      }
      process.exit(1);
    }
  });

program
  .command('scan [directory]')
  .description('Scan directory for projects and auto-detect ports')
  .option('-d, --depth <levels>', 'Maximum directory depth to scan', '3')
  .option('--all', 'Include low-confidence matches')
  .option('--dry-run', 'Show what would be registered without actually registering')
  .action((directory, options) => {
    const scanDir = directory || process.cwd();
    const maxDepth = parseInt(options.depth);

    if (isNaN(maxDepth) || maxDepth < 1) {
      console.error(chalk.red('Error: Depth must be a positive number'));
      process.exit(1);
    }

    console.log(chalk.dim(`Scanning ${scanDir} (max depth: ${maxDepth})...\n`));

    if (options.dryRun) {
      // Dry run - just show what would be found
      const scannedPorts = portManager.scanDirectory(scanDir, maxDepth);

      if (scannedPorts.length === 0) {
        console.log(chalk.yellow('No ports found in the specified directory.'));
        return;
      }

      console.log(chalk.bold('Found ports:\n'));
      console.log(chalk.dim('Port  | Project              | Confidence | Files'));
      console.log(chalk.dim('------|----------------------|------------|------------------'));

      scannedPorts.forEach(({ port, projects, files, confidence }) => {
        const portStr = chalk.cyan(port.toString().padEnd(5));
        const projectStr = chalk.white(projects[0].padEnd(20));
        const confStr = confidence === 'high' ? chalk.green(confidence.padEnd(10)) : chalk.yellow(confidence.padEnd(10));
        const fileStr = chalk.dim(files[0]);
        console.log(`${portStr} | ${projectStr} | ${confStr} | ${fileStr}`);
      });

      console.log(chalk.dim(`\nTotal: ${scannedPorts.length} port(s) found`));
      console.log(chalk.dim('Run without --dry-run to register these ports'));
    } else {
      // Actually register the ports
      const results = portManager.autoRegister(scanDir, maxDepth, {
        includeAll: options.all
      });

      // Show added ports
      if (results.added.length > 0) {
        console.log(chalk.green(`✓ Added ${results.added.length} port(s):\n`));
        results.added.forEach(({ port, projectName, files, confidence }) => {
          console.log(chalk.green(`  Port ${port}: ${projectName}`));
          console.log(chalk.dim(`    From: ${files[0]} (${confidence} confidence)`));
        });
        console.log();
      }

      // Show skipped ports
      if (results.skipped.length > 0) {
        console.log(chalk.yellow(`⊘ Skipped ${results.skipped.length} port(s):\n`));
        results.skipped.forEach(({ port, projectName, reason }) => {
          console.log(chalk.yellow(`  Port ${port}: ${projectName}`));
          console.log(chalk.dim(`    Reason: ${reason}`));
        });
        console.log();
      }

      // Show failed ports
      if (results.failed.length > 0) {
        console.log(chalk.red(`✗ Failed ${results.failed.length} port(s):\n`));
        results.failed.forEach(({ port, projectName, reason }) => {
          console.log(chalk.red(`  Port ${port}: ${projectName}`));
          console.log(chalk.dim(`    Reason: ${reason}`));
        });
        console.log();
      }

      if (results.added.length === 0 && results.skipped.length === 0 && results.failed.length === 0) {
        console.log(chalk.yellow('No ports found in the specified directory.'));
      }
    }
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}