# AI Feud Context

This repository contains the AI Feud game, comprising an offline data generation pipeline and a real-time web client.

## Language

See [docs/glossary.md](./docs/glossary.md) for the complete domain language and entity relationships.

**Synonym**:
A short, 1-3 word matchable token (common words, shorthand, abbreviations) a player would type.
_Avoid_: Descriptive phrase, flavor text, creative paraphrase

**Demographic**:
A self-contained data unit containing a name, description of the universe/theme, and the personas that belong to it.
_Avoid_: Theme, collection

**aiPrompt**:
The prompt phrasing used during the data pipeline to elicit answers from personas and perform clustering.
_Avoid_: Topic text (when referring to pipeline generation)

**uiText**:
The player-facing display text for a topic on the game board.
_Avoid_: Question text, aiPrompt

## Flagged ambiguities

- "Synonym" was used loosely to mean "acceptable alternative words", leading the LLM to generate creative paraphrases. Resolved: Synonyms are strictly matchable input tokens.
- "Topic text" was used interchangeably for generation and display. Resolved: `aiPrompt` drives generation, `uiText` drives display.
