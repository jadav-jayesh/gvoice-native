# gVoice — React Native app

Native (iOS + Android) client for the gVoice meeting platform. It reuses the web
app's API contract, types, and business logic unchanged — it only re-implements
the UI in React Native.

- No redesign, no business-logic change, no API-contract change.
- Backend is the existing server; the app adapts to it (cookie auth, CSRF).

## Stack

- Expo (dev client) · TypeScript strict
- React Navigation (native-stack + bottom-tabs)
- TanStack Query (server state) + Zustand (thin client state)
- `@react-native-cookies/cookies` for the CSRF cookie
- `react-native-svg`, `expo-video`, FlashList (used from M2+)

## Architecture

```
src/
├── core/
│   ├── api/       client (transport) · endpoints · types · cookieStore
│   ├── auth/      AuthProvider + useAuth (login/logout/bootstrap)
│   ├── lib/       format.ts (vendored from web)
│   ├── query/     TanStack QueryClient
│   ├── store/     Zustand auth store
│   ├── theme/     tokens · themes (light/dark) · ThemeProvider
│   └── config.ts  API base URL
├── ui/            Screen · Text · Button · Card · Badge (themed)
├── navigation/    RootNavigator (AuthGate → tabs) + param types
└── screens/       Login · Dashboard · MeetingsList · MeetingDetail · Insights · Profile
```

### Auth = cookies (not bearer tokens)

The server sets `token` + `refresh_token` (httpOnly) and `csrf` (readable),
all `secure; sameSite=none`. The native network stack stores and re-attaches the
httpOnly cookies automatically. We only read `csrf` (via `@react-native-cookies`)
to echo it as `X-CSRF-Token` on writes. `src/core/api/client.ts` is a near-verbatim
port of the web client, including the single-flight 401→refresh→retry.

> ⚠️ Cookies are `secure: true` → the backend MUST be **https**. A plain
> `http://localhost` backend will not set the session cookie on a device.
> The API base URL is `app.json → expo.extra.apiBaseUrl` (currently the live server).

## Run

`@react-native-cookies/cookies` and `expo-video` are native modules, so this
needs a **dev client** (not Expo Go).

```bash
npm install

# Build + run a dev client (needs Xcode / Android SDK, or use EAS):
npx expo run:ios
npx expo run:android
# or cloud build:  npx eas build --profile development --platform ios
```

Then sign in with a live-server account.

## Verify without a device

```bash
npx tsc --noEmit                    # types
npx expo export --platform ios      # full JS bundle resolves
```

## Status

**M0 (foundation) done:** shared API layer + cookie auth + theme (light/dark/system)
+ navigation + Login + Meetings list/detail + Dashboard/Insights stubs + Profile.

Next milestones: M2 meetings polish → M3 transcript/MoM/sentiment → M4 recording
→ M5 join live meeting → M6 insights/share/profile. Admin + Calendar OAuth = Phase 2.
See `../gVoice-AI-whisper_integration/NATIVE-APP-PLAN.md`.
