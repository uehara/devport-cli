#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const PortManager = require('../lib/PortManager');

const program = new Command();
const portManager = new PortManager();

program
  .name('devport')
  .description('CLI tool for managing development server ports')
  .version('1.0.0');

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

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}