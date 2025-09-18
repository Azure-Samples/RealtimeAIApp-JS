# AGENTS.md

## Project Overview

Realtime AI App is a TypeScript-based application demonstrating real-time AI interactions using Azure OpenAI Realtime API or OpenAI API. The project features two main use cases:

1. **Language Coach**: Interactive language learning with voice feedback and pronunciation assistance
2. **Medical Form Assistant**: Voice-powered medical form completion and conversational assistance

**Architecture**: Monorepo with separate Angular frontend (`client/`) and Node.js backend (`server/`) communicating via WebSockets for real-time audio and text processing.

**Key Technologies**: Angular 20+, Node.js, Express, WebSockets, TypeScript, Azure OpenAI, Material Design

## Setup Commands

### Prerequisites
- Node.js (latest LTS version)
- Azure OpenAI service deployment with `gpt-realtime` model OR OpenAI account
- Azure CLI (for keyless authentication approach)

### Initial Setup
1. Clone the repository and navigate to the project root
2. Copy environment configuration: `cp .env.example .env`
3. Configure your Azure OpenAI or OpenAI credentials in `.env`:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-realtime
   OPENAI_ENDPOINT=your_azure_endpoint_here
   OPENAI_API_VERSION=2025-04-01-preview
   BACKEND=azure
   ```
4. Install dependencies for both client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

### Alternative: Keyless Azure Authentication
For enhanced security with Azure OpenAI, use Azure CLI authentication:
```bash
# Login to Azure
az login

# Get your subscription ID
az account list --query "[?isDefault].id" -o tsv

# Get your user principal ID
az ad signed-in-user show --query objectId -o tsv

# Add OpenAI Contributor role
az role assignment create \
  --role "Cognitive Services OpenAI Contributor" \
  --assignee-object-id "<USER_PRINCIPAL_ID>" \
  --scope "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>" \
  --assignee-principal-type User
```
Then remove `OPENAI_API_KEY` from your `.env` file.

## Development Workflow

### Start Development Servers
1. **Server** (Terminal 1): `cd server && npm run dev`
   - Builds TypeScript and starts server with hot-reload on port 8080
   - Watches for changes and auto-rebuilds

2. **Client** (Terminal 2): `cd client && npm start`
   - Starts Angular development server on port 4200
   - Opens browser automatically
   - Hot-reload enabled for development

### Development Features
- **WebSocket endpoint**: `ws://localhost:8080/realtime`
- **Client URL**: `http://localhost:4200`
- **Hot-reload**: Both client and server support live code changes
- **Debugging**: Use browser DevTools for client, Node.js inspector for server

### Environment Configuration
- **Development**: Uses `.env` file for API keys and endpoints
- **Performance tuning**: Adjust `VAD_THRESHOLD`, `SILENCE_DURATION_MS`, `MAX_OUTPUT_TOKENS` in `.env`
- **Backend switching**: Set `BACKEND=azure` for Azure OpenAI or remove for OpenAI

## Build and Deployment

### Build Commands
```bash
# Build server (TypeScript compilation)
cd server && npm run build

# Build client (Angular production build)
cd client && npm run build
```

### Build Outputs
- **Server**: Compiled JavaScript in `server/dist/`
- **Client**: Production assets in `client/dist/realtime-aiapp/`

### Production Deployment
```bash
# Start production server
cd server && npm start

# Serve client build (requires web server like nginx or serve)
# The client build needs to be served from a web server
```

### Environment-Specific Builds
- **Development**: `npm run dev` (server) / `npm start` (client)
- **Production**: `npm run build` then `npm start` (server)

## Code Style Guidelines

### TypeScript Conventions
- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Quotes**: Single quotes for TypeScript files
- **Line endings**: LF (Unix-style)
- **Trailing whitespace**: Trimmed automatically

### File Organization
```
client/src/
├── app/
│   ├── language-coach/     # Language coach feature module
│   ├── medical-form/       # Medical form feature module
│   └── shared/             # Shared components and services
server/src/
├── session.ts              # WebSocket session management
├── server.ts               # Express server setup
├── types.ts                # TypeScript type definitions
└── systemMessages.ts       # AI system prompts
```

### Naming Conventions
- **Components**: PascalCase (`LanguageCoachComponent`)
- **Services**: PascalCase with Service suffix (`WebSocketService`)
- **Files**: kebab-case (`language-coach.component.ts`)
- **Variables**: camelCase (`realtimeSession`)
- **Constants**: SCREAMING_SNAKE_CASE (`OPENAI_API_KEY`)

### Import Patterns
- **Angular**: Use Angular barrel exports (`@angular/core`)
- **Relative imports**: Use for local modules (`./session.js`)
- **Node modules**: Direct imports (`express`, `ws`)

## Testing Instructions

**Note**: This project currently does not have test infrastructure set up.

### Future Testing Setup Recommendations
- **Client**: Angular Testing Framework with Jasmine/Karma
  ```bash
  cd client && npm run test
  ```
- **Server**: Node.js testing with Jest or Mocha
  ```bash
  cd server && npm test
  ```

### Test Patterns to Implement
- **Unit tests**: Component logic, service methods, utility functions
- **Integration tests**: WebSocket communication, API interactions
- **E2E tests**: Complete user workflows for language coach and medical form

## Pull Request Guidelines

### Title Format
`[component] Brief description`

Examples:
- `[client] Add language selection dropdown`
- `[server] Improve WebSocket error handling`
- `[docs] Update setup instructions`

### Required Checks Before Submission
```bash
# Build both client and server
cd server && npm run build
cd ../client && npm run build

# Ensure TypeScript compilation passes
cd server && npx tsc --noEmit
cd ../client && npx ng build --configuration development
```

### Code Review Requirements
- TypeScript compilation must pass without errors
- Follow established file organization patterns
- Maintain consistency with existing code style
- Update documentation for significant changes

## Security Considerations

### API Key Management
- **Never commit API keys** to version control
- Use `.env` files for local development
- Prefer Azure managed identity/keyless authentication for production
- Rotate API keys regularly

### WebSocket Security
- Validate all incoming WebSocket messages
- Implement proper session management
- Handle connection cleanup on errors
- Rate limiting implemented server-side

### Authentication Patterns
- Azure identity integration for OpenAI access
- DefaultAzureCredential for keyless authentication
- Proper token caching and refresh handling

## Additional Notes

### Common Issues and Solutions
- **Font loading errors**: Client build may fail if Google Fonts are blocked; this is expected in restricted environments
- **WebSocket connection failures**: Check that server is running on port 8080 and `.env` is configured
- **Audio permissions**: Browser requires HTTPS for microphone access in production
- **CORS issues**: Server includes CORS middleware for cross-origin requests

### Performance Considerations
- **Audio streaming**: Uses PCM16 format for optimal real-time processing
- **Voice Activity Detection**: Configurable threshold via `VAD_THRESHOLD`
- **Token limits**: Configurable via `MAX_OUTPUT_TOKENS` environment variable
- **Connection pooling**: Server manages WebSocket connections efficiently

### Development Tips
- Use browser DevTools Network tab to monitor WebSocket traffic
- Check server logs for OpenAI API responses and errors
- Audio quality depends on microphone settings and background noise
- Test with different languages for language coach feature
- Medical form supports structured data extraction from voice input

### Project Structure Notes
- This is a demonstration/sample project for learning real-time AI applications
- Suitable for hackathons, prototypes, and educational purposes
- Production deployment requires additional security and scaling considerations
- Extensible architecture supports adding new AI-powered features