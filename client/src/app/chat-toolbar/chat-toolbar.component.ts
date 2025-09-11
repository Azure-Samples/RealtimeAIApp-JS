import { Component, OnInit, OnDestroy, inject, EventEmitter, Output, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RealTimeManagerService } from '@core/realtime-manager.service';
import { SystemMessageType, Message } from '@shared/types';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-toolbar',
  templateUrl: './chat-toolbar.component.html',
  styleUrls: ['./chat-toolbar.component.css'],
  imports: [AsyncPipe, MatIconModule, MatButtonModule, MatSelectModule, MatMenuModule, MatProgressSpinnerModule ]
})
export class ChatToolbarComponent implements OnInit, OnDestroy {
  currentMessage = '';
  @Input() showMessageInput = true;
  @Input() systemMessageType!: SystemMessageType;
  @Output() messagesChanged = new EventEmitter<Message[]>();
  realtimeManagerService = inject(RealTimeManagerService);
  subscription = new Subscription();

  // Add microphone-related properties
  availableMicrophones: MediaDeviceInfo[] = [];
  selectedMicrophoneId: string = '';
  showMicrophoneSelector = false;

  async ngOnInit() {
    await this.setupRealTimeManager();
    await this.getAvailableMicrophones();
  }

  private async setupRealTimeManager() {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    this.subscription.add(
      this.realtimeManagerService.messages$.subscribe((messages) => {
        this.messagesChanged.emit(messages);
      })
    );
  }

  async getAvailableMicrophones() {
    try {
      // Check if we have permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Filter for audio input devices
      this.availableMicrophones = devices.filter(device => device.kind === 'audioinput');

      // Set the default microphone if available
      if (this.availableMicrophones.length > 0) {
        // Use the default device if one is marked as such
        const defaultMic = this.availableMicrophones.find(mic => mic.deviceId === 'default' || mic.label.toLowerCase().includes('default'));
        this.selectedMicrophoneId = defaultMic ? defaultMic.deviceId : this.availableMicrophones[0].deviceId;
      }

      // Only show selector if we have multiple microphones
      this.showMicrophoneSelector = this.availableMicrophones.length > 1;

      // console.log('Available microphones:', this.availableMicrophones);
    } catch (error) {
      console.error('Error getting microphones:', error);
    }
  }

  selectMicrophone(deviceId: string) {
    this.selectedMicrophoneId = deviceId;
    console.log('Selected microphone:', this.selectedMicrophoneId);
  
    // If already recording, restart with the new device
    if (this.realtimeManagerService.isRecording) {
      this.realtimeManagerService.stopRecording().then(() => {
        // Short timeout to ensure state updates properly
        setTimeout(() => {
          this.startRecordingWithSelectedMicrophone();
        }, 100);
      });
    }
    // If we're not currently recording, no need to toggle anything
  }

  async startRecordingWithSelectedMicrophone() {
    try {
      const constraints = {
        audio: {
          deviceId: { exact: this.selectedMicrophoneId }
        }
      };
      await this.realtimeManagerService.startRecording(constraints);
    } catch (error) {
      console.error('Error starting recording with selected device:', error);
    }
  }

  async connect() {
    if (this.realtimeManagerService.isConnected) {
      await this.realtimeManagerService.disconnect();
    }
    else {
      const connectionSubscription = this.realtimeManagerService.isConnected$.subscribe({
        next: (isConnected) => {
          if (isConnected) {
            console.log('Client session established. Setting up real-time manager.');
            this.setupRealTimeManager();
            connectionSubscription.unsubscribe();
          }
        }
      });

      this.subscription.add(connectionSubscription);
      await this.realtimeManagerService.connect(this.systemMessageType);
    }
  }

  async sendMessage() {
    await this.realtimeManagerService.sendMessage(this.currentMessage);
    this.currentMessage = '';
  }

  // Modify toggleRecording to use the selected microphone
  async toggleRecording() {
    if (this.realtimeManagerService.isRecording) {
      await this.realtimeManagerService.stopRecording();
    } else {
      await this.startRecordingWithSelectedMicrophone();
    }
  }

  toggleAudio() {
    this.realtimeManagerService.toggleAudio();
  }

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentMessage = input.value || '';
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.realtimeManagerService.disconnect();
  }
}