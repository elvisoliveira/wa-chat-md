// Everything that knows WhatsApp Web's markup. When WhatsApp changes it, the
// fix belongs in SEL, HEADER or TIME (and maybe readMessage); nothing else
// touches the DOM.

import { anyOf, caseInsensitive, char, charNotIn, createRegExp, digit, exactly, maybe, oneOrMore, whitespace } from 'magic-regexp';

/**
 * @typedef {object} Message
 * @property {string} id
 * @property {string} date    as WhatsApp shows it (locale), "" when unknown
 * @property {string} time    "HH:MM", "?" when unknown
 * @property {string?} sender null when the markup does not say (media-only)
 * @property {string} quote   "Who: text" of the message being replied to, or ""
 * @property {string} text
 * @property {string} media   "[image]", "[audio]", ... or ""
 */

const SEL = {
  main: '#main',
  chatName: 'header span[dir="auto"]',
  message: '[role="row"] [data-id]',
  header: '[data-pre-plain-text]', // "[12:49, 28/07/2026] Alice: " (text messages only)
  meta: '[data-testid="msg-meta"]', // time in the bubble's corner
  quoted: '[data-testid="quoted-message"]',
  quotedAuthor: 'span[dir="auto"]',
  text: 'span.selectable-text',
  outgoing: '.message-out',
  outgoingTail: '[data-icon="tail-out"]',
};

// First match wins, so the order matters (a video also has a play icon).
const MEDIA = [
  ['[deleted]', '[data-icon="recalled"]'],
  ['[audio]', 'audio, [data-icon*="ptt"], [data-icon*="audio"]'],
  ['[video]', 'video, [data-icon="media-play"]'],
  ['[document]', '[data-icon*="document"]'],
  ['[image]', 'img[src^="blob:"]'],
];

// "[12:49, 28/07/2026] Alice: ", on text messages only. Compiled to a plain
// regex at build time.
const HEADER = createRegExp(
  exactly('[').at.lineStart(),
  oneOrMore(charNotIn(',]')).groupedAs('time'),
  ', ',
  oneOrMore(charNotIn(']')).groupedAs('date'),
  '] ',
  oneOrMore(char).groupedAs('sender'),
  exactly(':', whitespace.times.any()).at.lineEnd(),
);

// The bubble's corner: "12:49", "editada 12:49", "12:49 PM".
const TIME = createRegExp(
  exactly(digit.times.between(1, 2), ':', digit.times(2), maybe(maybe(whitespace), anyOf('AM', 'PM'))).groupedAs('time'),
  [caseInsensitive],
);

/** Text with emojis (drawn as <img alt="😀">) and line breaks. */
function textOf(el) {
  let s = '';
  el?.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) s += c.textContent;
    else if (c.tagName === 'IMG') s += c.alt || '';
    else if (c.tagName === 'BR') s += '\n';
    else s += textOf(c);
  });
  return s;
}

/** "[12:49, 28/07/2026] Alice: " → { time, date, sender }; anything else → all empty. */
export function parseHeader(header) {
  const { time = '', date = '', sender = '' } = header.match(HEADER)?.groups ?? {};
  return { time, date, sender };
}

/** @returns {Message} */
export function readMessage(el) {
  const quoted = el.querySelector(SEL.quoted);
  const own = (e) => !quoted?.contains(e); // skip what belongs to the quote
  const all = (sel) => [...el.querySelectorAll(sel)].filter(own);

  const { time, date, sender } = parseHeader(el.querySelector(SEL.header)?.dataset.prePlainText || '');
  const metaTime = textOf(el.querySelector(SEL.meta)).match(TIME)?.groups.time;
  const outgoing = !!el.closest(SEL.outgoing) || !!el.querySelector(SEL.outgoingTail);

  let quote = '';
  if (quoted) {
    const who = textOf(quoted.querySelector(SEL.quotedAuthor)).trim();
    quote = `${who}: ${textOf(quoted).replace(who, '').trim()}`;
  }

  return {
    id: el.dataset.id,
    date: date || '',
    time: time || metaTime || '?',
    sender: sender || (outgoing ? 'Me' : null),
    quote,
    text: all(SEL.text)
      .filter((e) => !e.parentElement.closest(SEL.text)) // outermost spans only
      .map((e) => textOf(e).trim())
      .filter(Boolean)
      .join('\n'),
    media: MEDIA.find(([, sel]) => all(sel).length)?.[0] || '',
  };
}

/** The open chat and the message elements rendered right now, in screen order. */
export function readChat() {
  const main = document.querySelector(SEL.main);
  if (!main) return null;
  return {
    name: main.querySelector(SEL.chatName)?.textContent.trim() || 'Chat',
    // Rows still loading have neither a header nor a time yet.
    elements: [...main.querySelectorAll(SEL.message)].filter((el) => el.querySelector(`${SEL.header}, ${SEL.meta}`)),
  };
}
