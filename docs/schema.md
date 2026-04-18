# **Database Schema & State Interfaces**

This document defines the single source of truth for the MongoDB NoSQL database schema and the pure TypeScript runtime state.

**ATTENTION AI AGENTS:** This application strictly separates Pipeline Storage (raw data) from Client Payloads. We use a denormalized NoSQL Document paradigm.

## **1. Static Database Entities (MongoDB)**

### **Collection: survey_results**

This is the primary document fetched by the game client to run a Round. It is lightweight and only contains what the frontend needs to render the board, validate guesses, and show flavor text.

```typescript
export interface SurveyResultDocument {  
  /** Unique identifier (MongoDB ObjectId string) */  
  id: string;   
    
  /** The core setup presented to the players */  
  topicText: string;   
    
  /** The theme defining the 100 AI Personas */  
  demographicName: string;  
    
  /** The aggregated top answers, sorted by score (highest to lowest) */  
  clusters: AnswerCluster[];  
    
  /** Curated quotes from specific personas to show in the UI for flavor */  
  flavorQuotes: FlavorQuote[];  
    
  /** Optional tags for categorization */  
  tags?: string[];  
}

export interface AnswerCluster {  
  /** The primary display text on the board */  
  text: string;  
  /** The frequency (number of AI personas out of 100 that gave this answer) */  
  score: number;  
  /** Valid variations and typos for Exact/Fuzzy matching */  
  synonyms: string[];  
}

export interface FlavorQuote {  
  /** The identity of the AI that gave this response */  
  personaName: string;  
  /** The exact raw string they provided */  
  text: string;  
}
```

### **Collection: pipeline_raw_data (Offline / Admin Only)**

*Note for AI Agents: This collection is NEVER fetched by the Next.js client. It is used purely by the Offline Data Pipeline for storage and future AI retraining.*

```typescript
export interface RawPipelineDocument {  
  surveyResultId: string; // References the SurveyResultDocument  
  topicId: string;  
  demographicName: string;  
  /** All 100 raw unedited responses from the LLM generation step */  
  rawResponses: Array<{ personaId: string; text: string }>;  
}
```

## **2. Runtime State Entities (GameState.ts)**

These entities track the live state of the game. For Phase 1 (MVP), these exist entirely in-memory within custom React hooks (useGameLoop). For Phase 2, these interfaces will easily map to PartyKit/WebSockets.

```typescript
export interface Player {  
  /** Local session ID (Phase 1) or Multiplayer ID (Phase 2) */  
  id: string;  
  /** Running total of points accumulated */  
  scoreTracker: number;  
}

export interface Guess {  
  /** The raw text input submitted by the player */  
  rawInput: string;  
  /** Timestamp of submission */  
  submittedAt: number;  
}

export interface Strike {  
  /** The guess that triggered the penalty */  
  failedGuess: string;  
  /** Visual indicator level (1, 2, or 3) */  
  strikeNumber: 1 | 2 | 3;   
}

export interface Round {  
  /** The active survey data fetched from MongoDB */  
  activeSurvey: SurveyResultDocument;  
  /** Array of clusters the player has successfully guessed */  
  revealedClusters: AnswerCluster[];  
  /** Discrete penalty objects recorded when guesses fail validation */  
  strikes: Strike[];  
  /** Boolean indicating if the board is cleared or 3 strikes reached */  
  isComplete: boolean;  
}
```
