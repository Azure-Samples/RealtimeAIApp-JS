import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private audioContext: AudioContext | null = null;
  private playbackNode: AudioWorkletNode | null = null;
  initialized = false;

  async init(sampleRate: number) {
    if (this.playbackNode === null) {
      this.audioContext = new AudioContext({ sampleRate });
      // await audioContext.audioWorklet.addModule('/playback-worklet.js');
      const playbackWorkletBlobUrl = URL.createObjectURL(new Blob([`
        registerProcessor('playback-worklet', class PlaybackProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.port.onmessage = this.handleMessage.bind(this);
                this.buffer = [];
              }

              handleMessage(event) {
                if (event.data === null) {
                  this.buffer = [];
                  return;
                }
                this.buffer.push(...event.data);
              }

              process(inputs, outputs, parameters) {
                const output = outputs[0];
                const channel = output[0];

                if (this.buffer.length > channel.length) {
                  const toProcess = this.buffer.splice(0, channel.length);
                  channel.set(toProcess.map((v) => v / 32768));
                } else {
                  channel.set(this.buffer.map((v) => v / 32768));
                  this.buffer = [];
                }

                return true;
              }
          });
        `],
        { type: 'application/javascript' }));
      await this.audioContext.audioWorklet.addModule(playbackWorkletBlobUrl);
      // Give the browser some time to initialize the module
      setTimeout(() => {
        if (this.audioContext  && !this.initialized) {
          this.playbackNode = new AudioWorkletNode(this.audioContext, 'playback-worklet');
          this.playbackNode.connect(this.audioContext.destination);
          console.log(`audioContext.destination = ${this.audioContext.destination.channelInterpretation}`);
          this.initialized = true;
        }
      }, 100);

    }
  }

  async play(buffer: Int16Array) {
    if (!this.playbackNode || !this.audioContext) {
      console.warn('Audio not initialized');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (buffer && buffer.length > 0) {
      try {
        this.playbackNode.port.postMessage(buffer);
      } 
      catch (error) {
        console.error('Failed to play audio:', error);
      }
    } 
    else {
      console.warn('Empty or invalid audio buffer received so unable to play the audio');
    }
  }

  clear() {
    if (this.playbackNode) {
      try {
        this.playbackNode.port.postMessage(null);
      } 
      catch (error) {
        console.error('Failed to clear audio:', error);
      }
    }
  }
}