# wa-chat-md

Firefox and Chrome extension (Manifest V3): the popup shows the WhatsApp Web
chat open on screen as Markdown, with Copy and Download buttons, and keeps
updating while it is open.

It never scrolls by itself. WhatsApp Web keeps only the messages near the
viewport in the page, so a content script collects them as they render: to get
older messages, scroll the chat up yourself. Firefox keeps the popup open while
you scroll the page behind it, so you watch them arrive; Chrome closes it on the
first click on the page, so there you reopen it. Switching chats starts a new
collection; reloading the page forgets it.

```
# Alice

## 28/07/2026
[12:49] Alice: Back from the festival
[12:50] Me:
> Alice: Back from the festival
Glad you survived
[12:51] Alice: [image] look at this
```

## Install
```sh
npm install
npm run build     # or: npm run watch, rebuilding on save
```
- **Firefox**: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on
  → `dist/manifest.json`. Temporary add-ons go away when Firefox closes; to
  keep it, sign it (unlisted) on addons.mozilla.org, which the
  `browser_specific_settings.gecko.id` in the manifest is for. If the popup says
  to reload the tab and reloading doesn't help, allow the add-on on
  web.whatsapp.com (Extensions → WA Chat MD → Permissions).
- **Chrome**: `chrome://extensions` → Developer mode → Load unpacked → `dist/`.
  It flags `browser_specific_settings` as an unknown key; harmless.

Reload the WhatsApp tab once after installing, and after each rebuild reload
the extension, then the tab.

Building needs Node and `rsvg-convert` (librsvg), which renders the icon.

## Limits
- Reads WhatsApp Web's markup, so it breaks when that changes (`SEL`, `HEADER`
  and `TIME` in `src/dom.js`).
- Media-only messages carry no sender in the markup; in groups they show the
  chat name.
- Dates appear as WhatsApp shows them (your locale).
- Runs locally; nothing leaves the browser.

## Layout
| file | role |
|---|---|
| `src/dom.js` | the only code that knows WhatsApp's markup: `SEL`, the `HEADER`/`TIME` patterns ([magic-regexp](https://regexp.dev)), `readMessage`, `readChat` |
| `src/merge.js` | stitches the windows you scroll through into one ordered list |
| `src/markdown.js` | messages → Markdown |
| `src/content.js` | wires them up: watches the page, answers the popup |
| `src/popup.*` | shows the result, Copy / Download |
| `src/icon.svg` | the icon; the build renders its PNGs |
| `build.js` | esbuild: `src/` → `dist/` |

`npm test` checks `parseHeader`, `merge` and `markdown`.

## License

MIT.
