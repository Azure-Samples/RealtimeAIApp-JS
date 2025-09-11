export type Message = {
  id: string;
  type: string;
  action?: string;
  content: string;
}

export type WSMessage = {
  type: string;
  id?: string;
  text?: string;
  delta?: string;
  action?: string;
  functionCallParams?: string;
  error?: OpenAIError;
  rateLimits?: RateLimits;
}

export type OpenAIError = {
  type: string;
  code?: string;
  message: string;
  event_id?: string;
}

export type RateLimits = {
  name: string;
  limit: number;
  remaining: number;
  reset_seconds: number;
}

export type WebSocketMessage = {
  type: 'binary' | 'text' | 'init';
  data: ArrayBuffer | string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export enum PatientTab {
  Patient = 'patient',
  Symptoms = 'symptoms',
  Vitals = 'vitals'
}

export type Symptom = {
  id: number;
  description: string;
  duration: string;
  severity: number;
  notes: string;
}

export type Patient = {
  tab: PatientTab;
  information: { name: string; age: string; gender: string, historyPastMedical: string, historyOfPresentIllness: string };
  symptoms: Symptom[];
  vitals: { temperature: number; bloodPressure: string; heartRate: number };
}

export type SystemMessageType = 'language-coach' | 'medical-form';