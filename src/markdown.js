/**
 * The chat as Markdown: one heading per day, "[HH:MM] Sender: text" per message.
 * @param {string} name
 * @param {import('./dom.js').Message[]} messages in chat order
 */
export default function markdown(name, messages) {
  const lines = [`# ${name}`];
  let day = null;
  let date = '';
  for (const m of messages) {
    date = m.date || date; // media-only messages carry no date: same day as the previous one
    if (date !== day) lines.push('', `## ${(day = date) || 'no date'}`);

    const text = [m.media, m.text].filter(Boolean).join(' ');
    const head = `[${m.time}] ${m.sender || name}:`;
    if (m.quote) lines.push(`${head}\n> ${m.quote.replaceAll('\n', '\n> ')}\n${text}`);
    else lines.push(text.includes('\n') ? `${head}\n${text}` : `${head} ${text}`);
  }
  return lines.join('\n') + '\n';
}
