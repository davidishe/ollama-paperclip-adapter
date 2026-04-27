# ollama-paperclip-adapter

Paperclip external adapter for [Ollama](https://ollama.com) — run local LLMs as Paperclip agents without any API key or cloud dependency.

## Setup

### 1. Install Ollama

Download from [ollama.com/download](https://ollama.com/download) or:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull a model

```bash
ollama pull llama3.2
# or any other model:
ollama pull qwen2.5-coder
ollama pull mistral
ollama pull deepseek-r1
```

### 3. Configure the adapter in Paperclip

Go to **Settings → Adapters → Add adapter** and set:

```yaml
adapterType: ollama_local
adapterConfig:
  model: llama3.2
  # Optional:
  baseUrl: http://localhost:11434   # default
  maxTokens: 8192                   # default
  temperature: 0.7                  # default
  timeoutMs: 120000                 # default
  customSystemPrompt: ""            # append extra instructions
```

No API key is required. Ollama runs fully locally.

## Supported models

Any model pulled into your local Ollama. Popular choices:

| Model ID | Description |
|---|---|
| `llama3.2` | Meta Llama 3.2 |
| `llama3.1` | Meta Llama 3.1 |
| `qwen2.5-coder` | Alibaba Qwen 2.5 Coder |
| `qwen2.5` | Alibaba Qwen 2.5 |
| `mistral` | Mistral 7B |
| `gemma3` | Google Gemma 3 |
| `phi4` | Microsoft Phi-4 |
| `deepseek-r1` | DeepSeek R1 (reasoning) |
| `codellama` | Meta Code Llama |

## Remote Ollama

To use a remote Ollama server (e.g. a GPU machine on your local network):

```yaml
adapterConfig:
  model: llama3.2
  baseUrl: http://192.168.1.100:11434
```

## Cost

Ollama models run locally — `costUsd` is always `0`.

## Development

```bash
npm install
npm run build
npm test
```
