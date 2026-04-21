# Local LLM Setup & Configuration (LM Studio)

This document outlines the required configuration for running the local AI data generation pipeline on an Apple Silicon (M1) Mac with 32GB of Unified Memory.

Because the pipeline relies on switching between an 8B model (for high-concurrency surveying) and a 26B model (for deep semantic clustering), strict memory management via LM Studio's settings is required to prevent Out of Memory (OOM) errors and MLX Segmentation Faults.

## Global Server Settings
To prevent both models from loading simultaneously and crashing the system's memory:
- **Just-In-Time (JIT) Model Loading:** `ENABLED`
- **Time to keep loaded (TTL):** `0` or `1 minute` (Ensures the 8B model unloads instantly when the script finishes).

---

## 1. Survey Model
**Model:** `hermes-3-llama-3.1-8b-lorablated`
**Purpose:** Rapidly generating 100-200 short personas answers concurrently.

In the **Hardware Settings / Presets** for this specific model:
- **Context Length:** `2048` (This model only reads a 1-sentence prompt and outputs a few words. Keeping this low saves massive amounts of VRAM, allowing for high concurrency).
- **GPU Offload:** `Max`
- **KV Cache:** Enable `Flash Attention` (`fp16`).
- **Keep Model in Memory:** `OFF` (CRITICAL: Must be off so it unloads before the 26B model loads).
- **Context Overflow:** `Stop at limit`
- **Structured Output (JSON Mode):** `OFF`
- **Prompt Template:** `Llama 3`

---

## 2. Cluster Model
**Model:** `google/gemma-4-26b-a4b` (Gemma 4)
**Purpose:** Grouping 100+ raw answers into semantic clusters. Requires deep reasoning and a larger context window.

In the **Hardware Settings / Presets** for this specific model:
- **Context Length:** `32000`
- **GPU Offload:** `Max`
- **KV Cache:** Enable `Flash Attention` (`fp16`).
- **Keep Model in Memory:** `OFF`
- **Context Overflow:** `Stop at limit`
- **Structured Output (JSON Mode):** `OFF` (Gemma 4 needs the freedom to output `<|channel|>thought` reasoning tags before generating the final JSON).
- **Prompt Template:** `Gemma`
