# Установка ollama-paperclip-adapter на VPS с интеграцией в Paperclip

> Этот файл — инструкция для AI-агента (или человека). Следуй шагам по порядку.
> Предполагается: Ubuntu/Debian VPS, Paperclip уже установлен и запущен как systemd-сервис.

---

## Шаг 1. Установить Ollama системно

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Проверь что работает:

```bash
ollama --version
curl http://localhost:11434/
# ожидаемый ответ: "Ollama is running"
```

---

## Шаг 2. Загрузить модель

Загрузи хотя бы одну модель. Рекомендуем для старта:

```bash
ollama pull llama3.2        # 2 GB, хороший баланс качества и скорости
# или
ollama pull qwen2.5-coder   # для задач с кодом
# или
ollama pull mistral         # лёгкая и быстрая
```

Посмотреть доступные модели:

```bash
ollama list
```

---

## Шаг 3. Клонировать адаптер

```bash
git clone https://github.com/davidishe/ollama-paperclip-adapter.git
cd ollama-paperclip-adapter
npm install
npm run build
npm test   # должно быть 11 тестов зелёных
```

---

## Шаг 4. Зарегистрировать адаптер в Paperclip

Paperclip читает список внешних адаптеров из файла `~/.paperclip/adapter-plugins.json`
(где `~` — домашняя директория пользователя, под которым запущен Paperclip).

### 4a. Создать директорию для плагинов

```bash
mkdir -p ~/.paperclip/adapter-plugins/node_modules

cat > ~/.paperclip/adapter-plugins/package.json <<'EOF'
{
  "name": "paperclip-adapter-plugins",
  "version": "0.0.0",
  "private": true
}
EOF
```

### 4b. Записать путь адаптера в реестр

Замени `/ABSOLUTE/PATH/TO/ollama-paperclip-adapter` на реальный путь:

```bash
ADAPTER_PATH="/ABSOLUTE/PATH/TO/ollama-paperclip-adapter"

cat > ~/.paperclip/adapter-plugins.json <<EOF
[
  {
    "packageName": "ollama-paperclip-adapter",
    "localPath": "${ADAPTER_PATH}",
    "version": "0.1.0",
    "type": "ollama_local",
    "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
  }
]
EOF
```

Проверь файл:

```bash
cat ~/.paperclip/adapter-plugins.json
```

---

## Шаг 5. Перезапустить Paperclip

```bash
sudo systemctl restart paperclip
sudo systemctl status paperclip   # должен быть active (running)
```

После перезапуска Paperclip загрузит адаптер и тип `ollama_local` станет доступен в UI.

---

## Шаг 6. Проверить адаптер в Paperclip

Открой Paperclip UI → **Settings → Adapters**.
В списке должен появиться адаптер `ollama_local`.

Нажми **Test** — адаптер проверит:
1. Доступность Ollama на `http://localhost:11434`
2. Наличие нужной модели через `/api/tags`

---

## Шаг 7. Создать агента с Ollama

В Paperclip UI → **Agents → New agent**, выбери:
- **Adapter**: `ollama_local`
- **Adapter config**:

```yaml
model: llama3.2
baseUrl: http://localhost:11434   # можно опустить — это дефолт
maxTokens: 8192
temperature: 0.7
```

---

## Конфигурация адаптера (все поля)

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `model` | string | — | **Обязательно.** Имя модели в Ollama (например `llama3.2`) |
| `baseUrl` | string | `http://localhost:11434` | URL Ollama-сервера |
| `maxTokens` | number | `8192` | Максимум токенов в ответе |
| `temperature` | number | `0.7` | Температура сэмплирования |
| `timeoutMs` | number | `120000` | Таймаут запроса в мс |
| `customSystemPrompt` | string | — | Дополнительные инструкции к системному промту |

---

## Удалённый Ollama (другой сервер в сети)

Если Ollama работает не на localhost, а на отдельной машине (например GPU-сервер):

```yaml
model: llama3.2
baseUrl: http://192.168.1.100:11434
```

Убедись что на том сервере Ollama слушает на нужном интерфейсе:

```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

---

## Особенности

- **Нет API-ключа** — Ollama работает без аутентификации по умолчанию
- **`costUsd` всегда `0`** — локальные модели бесплатны
- **История сессий** сохраняется между heartbeat-ами (до 20 последних сообщений)
- **`listModels()`** автоматически запрашивает Ollama и показывает реально установленные модели

---

## Диагностика

```bash
# Ollama работает?
curl http://localhost:11434/

# Какие модели установлены?
curl http://localhost:11434/api/tags | jq '.models[].name'

# Тест чата напрямую
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "ping"}],
  "stream": false
}'

# Логи Paperclip
sudo journalctl -u paperclip -f
```

---

## Обновление адаптера

```bash
cd /path/to/ollama-paperclip-adapter
git pull
npm run build
sudo systemctl restart paperclip
```
