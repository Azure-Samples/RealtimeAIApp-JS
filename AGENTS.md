# AGENTS.md

## Project Overview

RealtimeAIApp-JS is a real-time AI application demonstrating the Azure OpenAI Realtime API capabilities. The project features two main use cases: a Language Coach for pronunciation practice and a Medical Form Assistant for voice-driven form completion. The application consists of an Angular 20 client and a Node.js/TypeScript server that communicates with Azure OpenAI's real-time API via WebSockets.

**Architecture:**
- Client: Angular 20 with WebSocket client for real-time communication
- Server: Node.js/Express/TypeScript with WebSocket server
- Integration: Azure OpenAI Realtime API with audio/text processing
- Communication: Real-time bidirectional WebSocket connections

## Setup Commands

**Environment Setup:**
1. Copy environment configuration: `cp .env.example .env`
2. Configure your Azure OpenAI credentials in `.env`:
   - Add your `OPENAI_API_KEY` and `OPENAI_ENDPOINT`
   - Set `OPENAI_MODEL=gpt-realtime`
   - Configure `BACKEND=azure` for Azure OpenAI

**Install Dependencies:**
- Server: `cd server && npm install`
- Client: `cd client && npm install`

**Start Development:**
- Server: `cd server && npm run dev` (starts with hot reload)
- Client: `cd client && npm start` (opens browser automatically)

## Development Workflow

**Server Development:**
- Start development server: `npm run dev` (TypeScript watch + nodemon)
- Build only: `npm run build` (compiles TypeScript to dist/)
- Production start: `npm start` (build + run)

**Client Development:**
- Development server: `npm start` or `ng serve -o`
- Watch mode: `npm run watch`
- Generate components: `ng generate component component-name`

**Key Development Notes:**
- Server runs on port 8080 by default
- Client development server opens browser automatically
- WebSocket endpoint: `ws://localhost:8080/realtime`
- Real-time audio requires microphone permissions

## Testing Instructions

**Client Testing:**
- Unit tests: `npm test` (Karma + Jasmine)
- E2E tests: `npm run e2e` (framework not configured by default)

**Manual Testing:**
1. Start both server and client
2. Click "Connect" button to establish WebSocket connection
3. Allow microphone access when prompted
4. Test Language Coach: Select language and practice pronunciation
5. Test Medical Form: Fill patient information using voice commands
6. Click "Disconnect" to end session

**Testing Voice Features:**
- Language Coach: Say phrases in different languages for pronunciation feedback
- Medical Form: Use voice commands like "patient", "symptoms", "vitals" to navigate tabs

## Code Style

**TypeScript/Angular Conventions:**
- Use TypeScript strict mode
- Follow Angular style guide conventions
- Service injection pattern with `@Injectable({ providedIn: 'root' })`
- Component-based architecture with clear separation of concerns

**File Organization:**
- Client: `src/app/` with feature-based modules (language-coach, medical-form, core, shared)
- Server: `src/` with clear separation (server.ts, session.ts, systemMessages.ts, types.ts)
- Shared types in `server/src/types.ts`

**WebSocket Message Patterns:**
- Use typed message interfaces from `types.ts`
- Handle control messages vs data messages separately
- Implement proper error handling for WebSocket connections

## Build and Deployment

**Production Builds:**
- Server: `npm run build` → outputs to `dist/`
- Client: `npm run build` → outputs to `dist/`

**Environment Variables:**
- Required: `OPENAI_API_KEY`, `OPENAI_ENDPOINT`, `OPENAI_MODEL`
- Optional: `PORT` (default 8080), `VAD_THRESHOLD`, `SILENCE_DURATION_MS`

**Deployment Notes:**
- Server requires Node.js environment
- Client builds to static files for web server deployment
- WebSocket connections require proper server configuration
- Azure OpenAI endpoint and credentials must be configured

## Pull Request Guidelines

- Title format: `[component] Brief description` (e.g., `[client] Add new language support`, `[server] Fix WebSocket reconnection`)
- Run both client and server builds before submitting
- Test WebSocket functionality manually
- Update environment variable documentation if adding new config options

## Security and Safety

**Environment Security:**
- Never commit `.env` files or API keys to repository
- Use Azure keyless authentication when possible (see README.md)
- Rotate API keys regularly
- Use least-privilege Azure role assignments

**WebSocket Security:**
- Validate all incoming WebSocket messages
- Implement proper error handling for malformed audio data
- Consider rate limiting for production deployments

**Audio Data Handling:**
- Audio data is processed in real-time and not stored
- Microphone permissions are required for voice features
- Audio processing happens client-side before transmission

## Additional Notes

**Azure OpenAI Integration:**
- Uses `gpt-realtime` model deployment
- Supports both Azure OpenAI and OpenAI endpoints
- Real-time audio processing with 24kHz sample rate
- Function calling for structured data extraction (medical forms)

**Performance Considerations:**
- Audio worklet processing for real-time performance
- WebSocket connection management with reconnection logic
- TypeScript compilation in watch mode for development efficiency

**Troubleshooting:**
- Check network connectivity for WebSocket connections
- Verify microphone permissions in browser
- Ensure Azure OpenAI endpoint and model deployment are correct
- Monitor browser console for WebSocket connection errors