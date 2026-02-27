export type AppView = 'landing' | 'assessment' | 'results';

export type MomentStage = 'ambition' | 'reality' | 'friction' | 'human_element' | 'measurement_gap' | 'vision' | 'close' | 'results';

export interface AppConfig {
    modelName: string;
    initialGreeting: string;
    systemInstruction: string;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
    isStreaming?: boolean;
}

export interface AnalysisResult {
    heres_what_im_hearing: string;
    pattern_worth_examining: string;
    question_to_sit_with: string;
    the_close: {
        sit_with_it: string;
        keep_thinking: string;
        real_conversation: string;
    };
    template_recommendation?: {
        tier: string;
        name: string;
        reason: string;
    };
}

// --- Telemetry Types ---

export interface SessionData {
    session_id: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    max_moment_reached?: MomentStage;
    completion_status: 'started' | 'in_progress' | 'completed' | 'abandoned';
    message_count: number;
    friction_theme?: string;
    clicked_lifeline: boolean;
    clicked_share: boolean;
    booked_call: boolean;
    downloaded_pdf: boolean;
    duration_seconds?: number;
}

export interface AssessmentEvent {
    session_id: string;
    event_type: string;
    event_data?: Record<string, unknown>;
}
