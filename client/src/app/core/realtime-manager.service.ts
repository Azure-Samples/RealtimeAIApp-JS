import { Injectable, OnDestroy, inject } from '@angular/core';
import { WebSocketService } from '@core/web-socket.service';
import { PlayerService } from '@core/player.service';
import { RecorderService } from '@core/recorder.service';
import { ConnectionState, Message, SystemMessageType, WSMessage, WebSocketMessage } from '@shared/types';
import { BehaviorSubject, Subscription, filter, map } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class RealTimeManagerService implements OnDestroy {
  private endpoint = 'ws://localhost:8080/realtime';
  private messageMap = new Map<string, Message>();
  private currentUserMessageId: string | null = null;

  private _connectionState = new BehaviorSubject<ConnectionState>('disconnected');
  connectionState$ = this._connectionState.asObservable();
  isConnected$ = this._connectionState.pipe(map(state => state === 'connected'));
  isConnecting$ = this._connectionState.pipe(map(state => state === 'connecting'));

  private _isSessionCreated = new BehaviorSubject<boolean>(false);
  sessionCreated$ = this._isSessionCreated.asObservable();

  private _isAudioOn = new BehaviorSubject<boolean>(true);
  isAudioOn$ = this._isAudioOn.asObservable();

  private _messages = new BehaviorSubject<Message[]>([]);
  messages$ = this._messages.asObservable();

  private _isRecording = new BehaviorSubject<boolean>(false);
  isRecording$ = this._isRecording.asObservable();

  private _error = new BehaviorSubject<string | null>(null);
  error$ = this._error.asObservable();

  playerService = inject(PlayerService);
  recorderService = inject(RecorderService);
  webSocketService = inject(WebSocketService);

  subscription = new Subscription();

  get connectionState() {
    return this._connectionState.value;
  }

  get isConnecting(): boolean {
    return this._connectionState.value === 'connecting';
  }

  get isConnected(): boolean {
    return this._connectionState.value === 'connected';
  }

  get isRecording(): boolean {
    return this._isRecording.value;
  }

  async connect(systemMessageType: SystemMessageType) {
    if (this._connectionState.value === 'connected') {
      await this.disconnect();
      return;
    }

    if (!this.playerService.initialized) {
      this.playerService.init(24000);
    }

    this._connectionState.next('connecting');
    try {
      this.initializeSubscriptions();
      await this.webSocketService.connect(this.endpoint, systemMessageType);
      // Session creation will trigger 'connected' state via subscription
    } catch (error) {
      this.logError('Connection failed:', error);
      this._connectionState.next('disconnected');
    }
  }

  private initializeSubscriptions() {
    this.subscription.add(
      this.webSocketService.isConnected$.subscribe(this.handleConnectionChange)
    );

    this.subscription.add(
      this.sessionCreated$
        .pipe(filter(isSessionCreated => isSessionCreated && this._connectionState.value === 'connecting'))
        .subscribe(() => {
          console.log('Session created');
          this._connectionState.next('connected');
          this.toggleRecording();
        })
    );

    this.subscription.add(
      this.webSocketService.messages$.subscribe(this.handleWebSocketMessage)
    );
  }

  private handleConnectionChange = (connected: boolean) => {
    console.log('Connected:', connected);
    if (!connected) {
      this._messages.next([]);
      this.messageMap.clear();
    }
  };

  private handleWebSocketMessage = async (message: WebSocketMessage) => {
    try {
      if (message.type === 'text' && typeof message.data === 'string') {
        const data = JSON.parse(message.data) as WSMessage;
        await this.handleWSMessage(data);
      } else if (
        message.type === 'binary' &&
        message.data instanceof ArrayBuffer &&
        this.playerService.initialized &&
        this._isAudioOn.value
      ) {
        this.playerService.play(new Int16Array(message.data));
      }
    } catch (error) {
      this.logError('Error handling WebSocket message:', error);
    }
  };

  private logError(message: string, error: any) {
    const errorMessage = `${message} ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    this._error.next(errorMessage);
  }

  async toggleRecording(constraints?: MediaStreamConstraints) { 
    try {
      const newRecordingState = await this.handleAudioRecord(this._isRecording.value, constraints);
      this._isRecording.next(newRecordingState);
      return newRecordingState;
    } catch (error) {
      this.logError('Recording error:', error);
      this._isRecording.next(false);
      return false;
    }
  }

  async startRecording(constraints?: MediaStreamConstraints): Promise<boolean> {
    if (!this._isRecording.value && this._connectionState.value === 'connected') {
      return this.toggleRecording(constraints);
    }
    return this._isRecording.value;
  }

  async stopRecording(): Promise<boolean> {
    if (this._isRecording.value) {
      return this.toggleRecording();
    }
    return false;
  }

  toggleAudio() {
    const newState = !this._isAudioOn.value;
    this._isAudioOn.next(newState);
    return newState;
  }

  /** Handles starting or stopping audio recording based on current state */
  async handleAudioRecord(isRecording: boolean, constraints?: MediaStreamConstraints): Promise<boolean> {
    if (!isRecording && this._connectionState.value === 'connected') {
      try {
        this.recorderService.setOnDataAvailableCallback(async (buffer) => {
          await this.webSocketService.send({ type: 'binary', data: buffer });
        });
        const streamConstraints = constraints || {
          audio: { echoCancellation: true, sampleRate: 24000 },
        };
        const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
        await this.recorderService.start(stream);
        return true;
      } catch (error) {
        this.logError('Failed to start recording:', error);
        await this.recorderService.reset();
        return false;
      }
    } else {
      await this.recorderService.stop();
      return false;
    }
  }

  private async handleWSMessage(message: WSMessage) {
    switch (message.type) {
      case 'transcription':
        if (message.id && this.currentUserMessageId === message.id) {
          const msg = this.messageMap.get(message.id);
          if (msg) {
            msg.content = message.text!;
            this._messages.next(Array.from(this.messageMap.values()));
          }
        }
        break;
      case 'text_delta':
        if (message.id) {
          const existingMessage = this.messageMap.get(message.id);
          if (existingMessage) {
            existingMessage.content += message.delta!;
          } else {
            const newMessage: Message = {
              id: message.id,
              type: 'assistant',
              content: message.delta!,
            };
            this.messageMap.set(message.id, newMessage);
          }
          this._messages.next(Array.from(this.messageMap.values()));
        }
        break;
      case 'control':
        let userMessage: Message | null = null;
        switch (message.action) {
          case 'function_call_output':
            if (!message.id || !message.functionCallParams) break;
            this._messages.next([]);
            this.messageMap.clear();
            userMessage = {
              id: message.id,
              type: message.type,
              action: message.action,
              content: message.functionCallParams,
            };
            console.log('function_call_output:', userMessage);
            if (userMessage) {
              this.messageMap.set(userMessage.id, userMessage);
              this._messages.next([userMessage]);
            }
            break;
          case 'speech_started':
            this.playerService.clear();
            const id = uuidv4();
            userMessage = {
              id,
              type: 'user',
              content: '...',
            };
            if (userMessage) {
              this.messageMap.set(id, userMessage);
              this.currentUserMessageId = id;
              this._messages.next(Array.from(this.messageMap.values()));
            }
            break;
          case 'session_created':
            this._isSessionCreated.next(true);
            console.log('Session created notification received:', message.id);
            break;
          case 'error':
            if (message.error) {
              const errorMessage = `OpenAI Error (${message.error.type}): ${message.error.message}`;
              console.error('OpenAI API Error:', message.error);
              this._error.next(errorMessage);
            }
            break;
          case 'rate_limits_updated':
            if (message.rateLimits) {
              console.log('Rate limits updated:', message.rateLimits);
              // You could emit this to a rate limits observable if needed for UI display
            }
            break;
        }
        break;
    }
  }

  async sendMessage(content: string) {
    if (content && this._connectionState.value === 'connected') {
      const messageId = `user-${Date.now()}`;
      const newMessage: Message = {
        id: messageId,
        type: 'user',
        content: content,
      };
      this._messages.next([...this._messages.value, newMessage]);
      await this.webSocketService.send({
        type: 'text',
        data: JSON.stringify({
          type: 'user_message',
          text: newMessage.content,
        }),
      });
    }
  }

  async disconnect() {
    console.log('Disconnecting...');
    await this.recorderService.reset();
    await this.playerService.clear();
    // Check WebSocket state before closing to avoid errors
    if (this.webSocketService.isConnected) {
      this.webSocketService.close();
    }
    this.messageMap.clear();
    this._connectionState.next('disconnected');
    this._isSessionCreated.next(false);
    this._messages.next([]);
    this._isAudioOn.next(true);
    this._isRecording.next(false);
  }

  async destroy() {
    this.subscription.unsubscribe();
    await this.disconnect();
  }

  ngOnDestroy() {
    this.destroy();
  }
}