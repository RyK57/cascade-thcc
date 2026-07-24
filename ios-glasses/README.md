# Cascade Glasses — iOS companion app (Meta Wearables DAT)

Voice + vision from Ray-Ban Display / Ray-Ban Meta glasses into Cascade:
hold-to-talk (glasses mic via Bluetooth), capture what you're looking at
(glasses camera via Meta's Wearables Device Access Toolkit), both run through
`POST /api/glasses/turn`, and the agent's reply is spoken back through the
glasses speakers. Falls back to the phone camera when no glasses are connected.

## Build

```bash
brew install xcodegen
cd ios-glasses
xcodegen generate
open CascadeGlasses.xcodeproj
```

Then in Xcode: set your signing team, build to a real iPhone (the DAT SDK
needs a device + the Meta AI app).

## Glasses setup (one-time)

1. Sign up at https://wearables.developer.meta.com/signup/landing — create an
   org + register an app, copy the application ID.
2. Put the app ID in `project.yml` under `MWDATApplicationID`, regenerate.
3. Meta AI app → Settings → App Info → tap version 5× → Developer Mode on.
4. Launch this app → Connect — approve the permission prompt that appears in
   the Meta AI app (App connections → Developer mode apps).

## In-app setup

Open Settings inside the app:
- **Base URL** — the Cascade Vercel deployment
- **Phone** — your number in E.164; you must have texted the Cascade Linq
  number at least once (sandbox is inbound-first)
- **Token** — only if GLASSES_TOKEN is set on the server
