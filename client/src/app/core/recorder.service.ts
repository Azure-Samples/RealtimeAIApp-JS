import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RecorderService {
  onDataAvailable: (buffer: ArrayBuffer) => void = (buffer) => {
    // Default callback in case it isn't set
    console.warn(
      'onDataAvailable default called. No callback set in component.'
    );
  };
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletBlobUrl: string | null = null;
  private isRecording = false; //track if recording has started

  public constructor() { }

  setOnDataAvailableCallback(callback: (buffer: ArrayBuffer) => void) {
    this.onDataAvailable = callback;
  }

  async start(stream: MediaStream) {
    //Check if already recording
    if (this.isRecording) {
      console.warn('Recording already in progress. Ignoring new start call.');
      return;
    }
    this.isRecording = true;
    try {
      this.mediaStream = stream;
      // Recreate AudioContext if it was closed
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContext({
          latencyHint: 'interactive',
          sampleRate: 24000,
        });
      }

      this.mediaStreamSource =
        this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create the worklet blob URL only once
      if (!this.workletBlobUrl) {
        this.workletBlobUrl = URL.createObjectURL(
          new Blob(
            [
              `
                registerProcessor('recorder-worklet', class RecorderPCMProcessor extends AudioWorkletProcessor {
                    constructor() {
                      super();
                    }
                      
                    process(inputs) {
                        const input = inputs[0];
                        if (input.length > 0) {
                            const float32Buffer = input[0];
                            const int16Buffer = this.convertFloat32ToInt16(float32Buffer);
                            this.port.postMessage(int16Buffer);
                        }
                        return true;
                    }

                    convertFloat32ToInt16(float32Array) {
                        const int16Array = new Int16Array(float32Array.length);
                        for (let i = 0; i < float32Array.length; i++) {
                            let val = Math.floor(float32Array[i] * 0x7fff);
                            val = Math.max(-0x8000, Math.min(0x7fff, val));
                            int16Array[i] = val;
                        }
                        return int16Array;
                    }
                });
              `,
            ],
            { type: 'application/javascript' }
          )
        );
      }

      if (!this.workletNode) {
        await this.audioContext.audioWorklet.addModule(this.workletBlobUrl);
      }

      // Create new worklet node and make sure there are no old connections.
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'recorder-worklet',
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
          processorOptions: {
            sampleRate: this.audioContext.sampleRate,
          },
        }
      );
      
      this.workletNode.port.onmessage = (event) => {
        if (this.onDataAvailable) {
          this.onDataAvailable(event.data);
        }
      };

      this.mediaStreamSource.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error starting recorder:', error);
      this.stop();
    }
  }

  async stop() {
    console.log("Recorder Stop called");
    this.isRecording = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.workletNode) {
      this.workletNode.port.close();
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // Do not close here, keep it for re-use
      // await this.audioContext.close();
    }
  }

  async reset() {
    console.log("Recorder Reset called")
    await this.stop();
    this.onDataAvailable = (buffer) => {
      // Default callback in case it isn't set
      console.warn(
        'onDataAvailable default called. No callback set in component.'
      );
    };
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
