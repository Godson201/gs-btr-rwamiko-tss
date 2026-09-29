# BTR Rwamiko app

The school system is an installable web app hosted on the existing Render site.
Open `/install` for device instructions. The homepage and portal account menu
link to this page. Users keep their existing accounts and role permissions.

## Installation

- Android: open in Chrome and use the install button or browser menu.
- iPhone/iPad: open in Safari, choose Share → Add to Home Screen, and keep
  “Open as Web App” enabled when shown.
- Desktop: open in Chrome or Edge and use the install button or browser install menu.

The `/install` link opens a page with an install button and a copy-link action.
Homepage and portal “Get the app” links open the native installation prompt
directly when the browser makes it available. Otherwise, they open `/install`.
The install button shows device guidance when native installation is unavailable.
Browsers require a user click and confirmation; opening a shared link cannot
silently install the app. Accepting a prompt is reported as an
installation request; only the `appinstalled` event or standalone display mode
marks the app installed.

The app requires internet access for school data and media. Offline navigation
shows a reconnect screen. The service worker stores only that public screen
and two app icons. It does not cache account pages, API responses, uploads,
media, or mutations. New deployments are fetched from the network without
forcing a reload while users are editing forms.

## Branding

The app icon shows a boy and girl reading together, with course symbols on
an open book. Circuits represent computing and communication; a drafting
square represents construction; a lightning bolt represents electrical
technology; a rising chart represents accounting and growth.

The current artwork is `frontend/public/app-icons/btr-app-source-v2.png`.
See [the design notes and generation prompt](APP_ICON_V2.md) for details.
The official school crest remains available for school identity.

## Verification

- `npm run build` in `frontend`.
- `npm run test:pwa` covers the service worker’s cache boundaries and fallback.
- Browser checks cover 320px, 390px and 1280px layouts, manifest installability,
  icon sizes, prompt acceptance/dismissal, installed state, offline navigation,
  reconnect, and cache contents. iPhone layout/metadata checked using Chromium
  device emulation; physical Safari installation requires device verification.

## References

- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [MDN install prompt API](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Apple home screen web apps](https://support.apple.com/guide/iphone/iphea86e5236/ios)
