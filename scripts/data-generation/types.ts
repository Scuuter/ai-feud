export interface Persona {
  id: string;
  name: string;
  description: string;
  toneOfVoice: string;
  demographics: string[];
}

export interface Topic {
  id: string;
  aiPrompt: string;
  uiText: string;
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
  /** Persona IDs assigned to this cluster by the Reduce stage; used by enrichment.ts to generate targeted flavor quotes */
  personaIds: string[];
  synonyms: string[];
  flavorQuotes: FlavorQuote[];
}

export interface WildCard {
  personaId: string;
  /** The persona's original raw survey answer; populated by cluster.ts */
  rawAnswer: string;
  synonyms: string[];      // reserved for future use, kept empty
  flavorQuote: FlavorQuote;
}

export interface SurveyResult {
  id: string;
  topicText: string;
  demographicName: string;
  clusters: AnswerCluster[];
  wildcards: WildCard[];
  tags?: string[];
  /** ISO 8601 timestamp set by enrichment.ts. Absence means not yet enriched. */
  enrichedAt?: string;
}



export interface AnswerCategory {
  id: string;
  uiText: string;
  aiPromptName: string;
}
