import { Injectable } from '@angular/core';
import { SystemMessageType, WebSocketMessage } from '@shared/types';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements AsyncIterable<WebSocketMessage> {
  private socket: WebSocket | null = null;

  private _message = new Subject<WebSocketMessage>();
  messages$ = this._message.asObservable();

  private _isConnected = new BehaviorSubject<boolean>(false);
  isConnected$ = this._isConnected.asObservable();

  private _errors = new Subject<Error>();
  errors$ = this._errors.asObservable();

  get isConnected(): boolean {
    return this._isConnected.value;
  }

  private messageQueue: WebSocketMessage[] = [];
  private hasError = false;

  connect(url: string, systemMessageType: SystemMessageType) {
    if (this.socket) this.close();

    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      this._isConnected.next(true);
      this.send({
        type: 'text',
        data: JSON.stringify({ type: 'init', systemMessageType })
      });
    };
    this.socket.onclose = () => this._isConnected.next(false);
    this.socket.onerror = (event: Event) => {
      const error = (event as ErrorEvent).error || new Error('WebSocket error');
      this.handleError(error);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      const message: WebSocketMessage = {
        type: event.data instanceof ArrayBuffer ? 'binary' : 'text',
        data: event.data
      };
      this.messageQueue.push(message);
      this._message.next(message);
    };
  }

  private handleError(error: Error) {
    this.hasError = true;
    this._errors.next(error);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<WebSocketMessage> {
    while (true) {
      if (this.hasError) {
        throw this._errors;
      }
      if (this.messageQueue.length > 0) {
        yield this.messageQueue.shift()!;
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  send(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message.data);
    }
  }

  close() {
    this.socket?.close();
    this.socket = null;
    this.messageQueue = [];
    this.hasError = false;
    this._isConnected.next(false);

    // Instead of completing the subjects, recreate them
    this._errors = new Subject<Error>();
    this._message = new Subject<WebSocketMessage>();

    // Update the exposed observables to reference the new subjects
    this.errors$ = this._errors.asObservable();
    this.messages$ = this._message.asObservable();
  }
}