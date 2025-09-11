import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormatBracketsPipe } from '@shared/format-brackets.pipe';
import { Message } from '@shared/types';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css'],
  providers: [FormatBracketsPipe] // Add the pipe as a provider
})
export class ChatMessagesComponent {
  showMessages: boolean = true;
  isConnected = true;

  private _messages: Message[] = [];
  formattedMessages: { formattedContent: SafeHtml; }[] = [];
  
  constructor(
    private formatBracketsPipe: FormatBracketsPipe
  ) {}
  
  @Input()
  get messages(): Message[] {
    return this._messages;
  }
  set messages(value: Message[]) {
    this._messages = value;
    this.preFormatMessages();
    this.scrollToBottom();
  }

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  private preFormatMessages(): void {
    this.formattedMessages = this._messages.map(message => {
      const formattedContent = message.content ? this.formatBracketsPipe.transform(message.content) : '';
      
      return {
        formattedContent
      };
    });
  }

  private scrollToBottom(): void {
    if (this.messagesEnd) {
      setTimeout(() => {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }
}