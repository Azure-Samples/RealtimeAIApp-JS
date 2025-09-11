
export type WSMessage =
    | { id: string; type: 'text_delta'; delta: string }
    | { id?: string; type: 'transcription'; text: string }
    | { id: string; type: 'user_message'; text: string }
    | { type: 'control'; action: 'speech_started' | 'connected' | 'text_done' | 'function_call_output'; functionCallParams?: string; id?: string }
    | { type: 'control'; action: 'session_created'; id?: string }
    | { type: 'control'; action: 'error'; error: OpenAIError; id?: string }
    | { type: 'control'; action: 'rate_limits_updated'; rateLimits: RateLimits; id?: string };

export type FunctionCallResponse = {
    type: 'function_call_output';
    call_id: string;
    output: string;
}

export type SystemMessageTool = {
    type?: string,
    name?: string,
    description?: string,
    parameters?: any
}

export type SystemMessage = {
    type: 'language-coach' | 'medical-form' | 'medical-question-answer';
    initialInstructions: string;
    message: string;
    tools?: SystemMessageTool[];
}

export type AudioMetrics = {
    totalBytesSent: number;
    totalBatchesSent: number;
    maxBatchSize: number;
    lastSendTime: number;
    droppedChunks: number;
    avgLatency: number;
    lastResponseTime: number;
    sessionStartTime: number;
    totalResponses: number;
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
  