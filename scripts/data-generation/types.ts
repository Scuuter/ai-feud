export interface Persona {
  id: string;
  name: string;
  description: string;
  toneOfVoice: string;
  demographics: string[];
}

export interface Topic {
  id: string;
  "prompt-ai": string;
  "text-ui": string;
  score: number;
  tags: string[];
}

export interface RawResponse {
  personaId: string;
  personaName: string;
  toneOfVoice: string;
  text: string;
}

export interface RawSurveyData {
  topicId: string;
  demographicName: string;
  rawResponses: RawResponse[];
}

export interface FlavorQuote {
  personaName: string;
  text: string;
}

export interface AnswerCluster {
  text: string;
  score: number;
  synonyms: string[];
  flavorQuotes: FlavorQuote[];
}

export interface WildCard {
  synonyms: string[];
  flavorQuote: FlavorQuote;
}

export interface SurveyResultDocument {
  id: string;
  topicText: string;
  demographicName: string;
  clusters: AnswerCluster[];
  wildcards: WildCard[];
  tags?: string[];
}

export interface LLMResponse {
  answer: string;
}

export interface QuoteResponse {
  quote: string;
}

export interface ClusterResult {
  clusters: Array<{
    text: string;
    synonyms: string[];
    rawAnswers: string[];
  }>;
  wildcards: string[];
}
