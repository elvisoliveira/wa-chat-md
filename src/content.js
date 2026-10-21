// Collects the open chat as WhatsApp Web renders it and answers the popup.
// Nothing scrolls by itself: scrolling up is how older messages get collected.

import { readChat, readMessage } from './dom.js';
import markdown from './markdown.js';
import merge from './merge.js';

/** @type {{ name: string, order: string[], messages: Map<string, import('./dom.js').Message> } | null} */
let chat = null;

function collect() {
  const seen = readChat();
  if (!seen) return;
  if (chat?.name !== seen.name) chat = { name: seen.name, order: [], messages: new Map() };
  for (const el of seen.elements) {
    if (!chat.messages.has(el.dataset.id)) chat.messages.set(el.dataset.id, readMessage(el));
  }
  chat.order = merge(chat.order, seen.elements.map((el) => el.dataset.id));
}

let timer;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(collect, 200);
}).observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, _sender, reply) => {
  if (request !== 'get') return;
  collect();
  if (!chat?.order.length) return reply({ error: 'No chat open.' });
  const messages = chat.order.map((id) => chat.messages.get(id));
  reply({ name: chat.name, count: messages.length, md: markdown(chat.name, messages) });
});
