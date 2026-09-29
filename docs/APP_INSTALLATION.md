# BTR Rwamiko app

The school system is an installable web app hosted on the existing Render site.
Open `/install` for device instructions. The homepage and portal account menu
link to this page. Users keep their existing accounts and role permissions.

## Installation

- Android: open in Chrome and use the install button or browser menu.
- iPhone/iPad: open in Safari, choose Share → Add to Home Screen, and keep
  “Open as Web App” enabled when shown.
- Desktop: open in Chrome or Edge and use the install button or browser install menu.

The install button appears only when the browser supplies an install prompt.
Otherwise, the page shows instructions. Accepting a prompt is reported as an
installation request; only the `appinstalled` event or standalone display mode
marks the app installed.

The app requires internet access for school data and media. Offline navigation
shows a reconnect screen. The service worker stores only that public screen
and two app icons. It does not cache account pages, API responses, uploads,
media, or mutations. New deployments are fetched from the network without
forcing a reload while users are editing forms.

## Branding

The open book represents learning; circuit connections represent technical
skills and school communication; the gold arrow represents growth. Navy, cyan,
white, and gold match the system’s visual direction. The official school crest
remains available for school identity.

Generated with the built-in imagegen tool. The final source is
`frontend/public/app-icons/btr-app-source.png`. Production exports include
32px browser, 180px Apple, 192px and 512px app icons, and a padded 512px maskable
icon. PNG exports were resized from the final generated artwork.

### Final image editing prompt

“Polish this BTR school app icon into a production icon. Preserve the concept:
white open book, cyan circuit traces, golden upward arrow, bold BTR letters.
Place it on a completely solid opaque deep navy #0b1831 square background
filling the entire image edge to edge. NO transparency anywhere. Refine all
edges to smooth crisp vector-like edges. Make all BTR letters clean solid
white with correctly shaped negative spaces. Use flat colors, no shading or
texture. Scale the entire emblem and BTR text down so all important artwork
fits within the centered circle with radius 36% of the square width, with
generous navy padding around it for Android maskable icon crops. One finished
icon only, no mockup, no extra text, 1024x1024.”

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
