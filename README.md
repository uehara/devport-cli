# DevPort CLI

A command-line tool for managing development server ports across multiple projects.

## Overview

When working on multiple development projects, port conflicts are a common issue. DevPort CLI helps you track and manage which ports are being used by which projects, making it easy to avoid conflicts and organize your development environment.

## Features

- 🚀 **Simple port registration**: Register ports with project names and descriptions
- 📋 **List all registered ports**: View all ports in use across your projects
- 🔍 **Find port information**: Quickly check what's using a specific port
- 💡 **Smart port suggestions**: Get suggestions for available ports
- 🗑️ **Easy removal**: Remove port registrations when projects are no longer active
- 🏠 **Local storage**: All data stored locally in your home directory
- 🔍 **Active port monitoring**: View all currently active ports and their processes
- ⚡ **Process management**: Kill processes using specific ports

## Installation

### Global installation via npm

```bash
npm install -g devport-cli
```

### Local development

```bash
git clone https://github.com/uehara/devport-cli.git
cd devport-cli
npm install
npm link
```

## Usage

### Add a port registration

```bash
devport add 3000 my-react-app
devport add 3001 my-api-server --description "Express.js API server"
```

### List all registered ports

```bash
devport list
# or
devport ls
```

### Find information about a specific port

```bash
devport find 3000
```

### Get a suggestion for an available port

```bash
devport suggest
devport suggest --start 4000
```

### Remove a port registration

```bash
devport remove 3000
# or
devport rm 3000
```

### Clear all registrations

```bash
devport clear
```

### View active ports and processes

```bash
devport active
```

### Kill process using a specific port

```bash
devport kill 3000
```

### View help

```bash
devport --help
devport <command> --help
```

## Commands

| Command                | Alias | Description                            |
| ---------------------- | ----- | -------------------------------------- |
| `add <port> <project>` | -     | Register a port for a project          |
| `remove <port>`        | `rm`  | Remove a port registration             |
| `list`                 | `ls`  | List all registered ports              |
| `find <port>`          | -     | Find information about a specific port |
| `suggest`              | -     | Suggest an available port              |
| `clear`                | -     | Clear all port registrations           |
| `active`               | -     | Show all active ports and processes    |
| `kill <port>`          | -     | Kill process using the specified port  |

## Options

### add command

- `-d, --description <desc>`: Add a description for the project

### suggest command

- `-s, --start <port>`: Starting port number for suggestions (default: 3000)

## Data Storage

DevPort CLI stores all port registrations locally in:

- **macOS/Linux**: `~/.devport/ports.json`
- **Windows**: `%USERPROFILE%\.devport\ports.json`

## Use Cases

### Daily Development

```bash
# Starting a new React project
devport add 3000 my-new-app --description "React development server"

# Need a port for API server
devport suggest --start 3001
# Returns: Suggested available port: 3001
devport add 3001 my-api

# Check what's using port 3000
devport find 3000

# View all active projects
devport list
```

### AI Integration

```bash
# Get an available port for AI to use
AVAILABLE_PORT=$(devport suggest)
devport add $AVAILABLE_PORT "ai-generated-project" --description "Auto-generated by AI"
```

### Project Cleanup

```bash
# Remove port when project is done
devport remove 3000

# Clean slate
devport clear
```

### Process Management

```bash
# Check what processes are using ports
devport active

# Kill stuck development server
devport kill 3000

# Check if port is now free
devport find 3000
```

## Requirements

- Node.js 14.0.0 or higher
- npm or yarn

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## AI Assistant Instructions

**For AI Assistants (Claude, ChatGPT, etc.):**

When users are developing projects and need port management, use the `devport` CLI tool:

### Essential Commands:

- `devport suggest` - Get available port suggestion before starting new projects
- `devport add <port> <project-name> --description "<desc>"` - Register port usage
- `devport list` - Show all registered ports to avoid conflicts
- `devport find <port>` - Check what's using a specific port
- `devport remove <port>` - Clean up when project ends
- `devport active` - Show all active ports and running processes
- `devport kill <port>` - Kill process using a specific port

### AI Workflow Integration:

1. **Before starting any development server**: Run `devport suggest` to get available port
2. **When creating projects**: Always register the port with `devport add`
3. **When port conflicts occur**: Use `devport list` and `devport find` to troubleshoot
4. **In automation scripts**: Use `AVAILABLE_PORT=$(devport suggest)` for dynamic port allocation

### Best Practices for AI:

- Always check port availability before suggesting specific ports to users
- Register ports immediately when setting up development environments
- Include port cleanup in project completion instructions
- Use descriptive project names and descriptions for better port management

## Support

If you encounter any problems or have suggestions, please [open an issue](https://github.com/uehara/devport-cli/issues) on GitHub.
