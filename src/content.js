// Collects the open chat as WhatsApp Web renders it and streams it to the open
// popup. Nothing scrolls by itself: scrolling up is how older messages arrive.

import { readChat, readMessage } from './dom.js';
import markdown from './markdown.js';
import merge from './merge.js';

/** @type {{ name: string, order: string[], messages: Map<string, import('./dom.js').Message> } | null} */
let chat = null;

/** Reads what is on screen; true when the chat or its messages changed. */
function collect() {
  const seen = readChat();
  if (!seen) return false;
  const switched = chat?.name !== seen.name;
  if (switched) chat = { name: seen.name, order: [], messages: new Map() };
  for (const el of seen.elements) {
    if (!chat.messages.has(el.dataset.id)) chat.messages.set(el.dataset.id, readMessage(el));
  }
  const before = chat.order.length;
  chat.order = merge(chat.order, seen.elements.map((el) => el.dataset.id));
  return switched || chat.order.length !== before;
}

function state() {
  if (!chat?.order.length) return { error: 'No chat open.' };
  const messages = chat.order.map((id) => chat.messages.get(id));
  return { name: chat.name, count: messages.length, md: markdown(chat.name, messages) };
}

/** Popups connected right now; each gets the state again whenever it changes. */
const popups = new Set();

chrome.runtime.onConnect.addListener((port) => {
  popups.add(port);
  port.onDisconnect.addListener(() => popups.delete(port));
  collect();
  port.postMessage(state());
});

let timer;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (collect() && popups.size) popups.forEach((port) => port.postMessage(state()));
  }, 200);
}).observe(document.body, { childList: true, subtree: true });
