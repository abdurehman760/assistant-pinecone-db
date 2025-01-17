# Plan to Use OpenAI Text-to-Speech API

## Overview

Learn how to turn text into lifelike spoken audio using OpenAI's Text-to-Speech (TTS) API.

## Steps

1. **Setup OpenAI API Client**
   - Install the OpenAI client library for your preferred programming language.
   - Obtain your OpenAI API key.

2. **Generate Spoken Audio**
   - Use the `speech` endpoint to convert text to audio.
   - Choose the appropriate model and voice for your needs.
   - Example code snippets for JavaScript, Python, and cURL are provided in the OpenAI documentation.

3. **Save the Audio File**
   - Save the generated audio to a file (e.g., `speech.mp3`).
   - Ensure the file is saved in the desired format (e.g., MP3, AAC, FLAC).

4. **Experiment with Different Voices**
   - Test different voices like `alloy`, `ash`, `coral`, etc., to find the best match for your application.

5. **Real-Time Audio Streaming**
   - Implement real-time audio streaming if needed using chunk transfer encoding.

6. **Supported Languages**
   - Generate spoken audio in various languages supported by the TTS model.

7. **Compliance with Usage Policies**
   - Ensure clear disclosure to end users that the TTS voice is AI-generated.

## Example Code

### JavaScript

```javascript
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();
const speechFile = path.resolve("./speech.mp3");

const mp3 = await openai.audio.speech.create({
  model: "tts-1",
  voice: "alloy",
  input: "Today is a wonderful day to build something people love!",
});

const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile(speechFile, buffer);
```

### Python

```python
from pathlib import Path
from openai import OpenAI

client = OpenAI()
speech_file_path = Path(__file__).parent / "speech.mp3"
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="Today is a wonderful day to build something people love!",
)
response.stream_to_file(speech_file_path)
```

### cURL

```bash
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Today is a wonderful day to build something people love!",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

## Additional Information

- **Audio Quality**: Use `tts-1-hd` for higher quality audio.
- **Supported Formats**: MP3, Opus, AAC, FLAC, WAV, PCM.
- **Supported Languages**: Refer to the Whisper model's language support.

## FAQ

- **Emotional Range**: No direct control over emotional output.
- **Custom Voices**: Not supported.
- **Ownership**: You own the outputted audio files.
