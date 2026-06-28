# ElevenLabs Premium Voice Setup

ReadNest uses ElevenLabs only from Firebase Functions. The React app never stores
or calls an ElevenLabs API key directly.

Official API reference:

- https://elevenlabs.io/docs/api-reference/text-to-speech/convert

## What Uses ElevenLabs

Premium paid activities:

- Echo Reader
- Voice Quest

When a paid student or paid teacher taps the voice button, the browser calls the
Firebase callable function:

```text
createActivityVoiceClip
```

The function:

1. Requires Firebase Auth.
2. Checks paid entitlement:
   - `subscriptions/{uid}` in production
   - `testSubscriptions/{uid}` in development
3. Allows Family Plus students, Teacher Pro teachers, and admins.
4. Rate-limits voice clip requests.
5. Calls ElevenLabs using `ELEVENLABS_API_KEY`.
6. Returns short audio bytes to the browser.
7. Writes privacy-safe operational logs to Cloud Logging and `systemLogs`.

If the provider is unavailable, the frontend falls back to browser speech so the
activity remains usable.

## Firebase Function Secret

Set the API key as a Firebase Functions secret:

```bash
firebase functions:secrets:set ELEVENLABS_API_KEY
```

Do not add this as a `VITE_*` variable and do not commit it to GitHub.

## Runtime Values

Set these as backend runtime environment values in the deploy workflow or
Firebase Functions environment file:

```text
ELEVENLABS_VOICE_ID=your_selected_voice_id
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

If `ELEVENLABS_VOICE_ID` is missing, the backend uses the default ElevenLabs
example voice id. For production, choose a voice in your ElevenLabs dashboard
that sounds warm, clear, and age-appropriate for K-2 learners.

## Cost Controls

- Voice generation happens only on click, not automatically on every round.
- The browser caches generated clips for the current session.
- The backend limits each signed-in user to 20 voice clip requests per hour.
- Only premium voice activities are allowed to request provider audio.

## Deploy Checklist

1. Set `ELEVENLABS_API_KEY` in Firebase Secret Manager.
2. Set `ELEVENLABS_VOICE_ID`.
3. Deploy Firebase Functions.
4. Sign in as a paid Family Plus student or Teacher Pro teacher.
5. Open `#/echo-reader` or `#/voice-quest`.
6. Tap the voice button and confirm audio plays.
7. Check Cloud Logging for:

```text
jsonPayload.eventName="elevenlabs_voice_clip_created"
```
