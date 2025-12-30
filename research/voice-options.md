# French Voice Options Research

## Piper TTS French Voices (Open Source)

Found on HuggingFace: https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR

### Available French Voices:
1. **siwis** - Female voice (medium quality, 63.2 MB ONNX model)
2. **tom** - Male voice
3. **upmc** - Multi-speaker voice (2 speakers)
4. **mls** - Mozilla Common Voice based
5. **mls_1840** - Another MLS variant
6. **gilles** - Another voice option

### File Structure for siwis/medium:
- fr_FR-siwis-medium.onnx (63.2 MB) - The neural network model
- fr_FR-siwis-medium.onnx.json (4.88 kB) - Configuration file
- MODEL_CARD (284 Bytes) - Model information
- ALIASES (16 Bytes) - Voice aliases

## Challenge
Piper TTS models are ONNX neural network models that require:
1. A runtime to execute (piper binary or sherpa-onnx)
2. Cannot be used directly in React Native/Expo without native modules

## Alternative Approach
For a mobile app, better options are:
1. **expo-speech** (current) - Uses device's built-in TTS
2. **Pre-recorded audio files** - Record specific words/phrases
3. **Cloud TTS API** - Google Cloud TTS, Amazon Polly, etc.

## Recommendation for Natural Voices
Since Piper models require native integration, the best approach for natural voices in Expo is:
1. Use pre-recorded MP3 audio files for each vocabulary word
2. Or use a cloud TTS service to generate audio files at build time
