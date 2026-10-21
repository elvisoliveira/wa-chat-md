# wa-chat-md

Chrome/Chromium extension (Manifest V3): the popup shows the WhatsApp Web chat
open on screen as Markdown, with Copy and Download buttons.

It never scrolls by itself. WhatsApp Web keeps only the messages near the
viewport in the page, so a content script collects them as they render: to get
older messages, scroll the chat up yourself, then open the popup again.
Switching chats starts a new collection; reloading the page forgets it.

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
`chrome://extensions` → Developer mode → Load unpacked → `dist/`. Reload the
WhatsApp tab once after installing. After a rebuild, hit reload on the
extension, then on the tab.

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
