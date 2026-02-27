export type AppView = 'landing' | 'assessment' | 'results';

export interface AppConfig {
    modelName: string;
    initialGreeting: string;
    systemInstruction: string;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
}

export interface AnalysisResult {
    summary: string;
    pattern: string;
    strategicQuestion: string;
    recommendation: string;
}
