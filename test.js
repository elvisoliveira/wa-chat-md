// npm test — the parts that don't need WhatsApp's DOM.
import assert from 'node:assert';
import { parseHeader } from './src/dom.js';
import markdown from './src/markdown.js';
import merge from './src/merge.js';

// parseHeader: the "[time, date] sender: " WhatsApp puts on text messages
assert.deepStrictEqual(parseHeader('[12:49, 28/07/2026] Alice: '), { time: '12:49', date: '28/07/2026', sender: 'Alice' });
assert.deepStrictEqual(parseHeader('[9:05 PM, 7/28/2026] Bob Silva: '), { time: '9:05 PM', date: '7/28/2026', sender: 'Bob Silva' });
assert.deepStrictEqual(parseHeader('[1:00, 1/1/2026] A: B: '), { time: '1:00', date: '1/1/2026', sender: 'A: B' });
assert.deepStrictEqual(parseHeader(''), { time: '', date: '', sender: '' });

// merge: stitching the windows you scroll through
let order = merge([], ['m5', 'm6', 'm7']); // chat opened at the bottom
order = merge(order, ['m3', 'm4', 'm5']); // scrolled up a bit
assert.deepStrictEqual(order, ['m3', 'm4', 'm5', 'm6', 'm7']);
order = merge(order, ['m6', 'm7', 'm8']); // new message arrived
assert.deepStrictEqual(order, ['m3', 'm4', 'm5', 'm6', 'm7', 'm8']);
order = merge(order, ['m1', 'm2']); // jumped up, no overlap
assert.deepStrictEqual(order, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8']);
assert.deepStrictEqual(merge(order, ['m4', 'm5']), order); // nothing new

// markdown: days, quotes, media-only messages
const msg = (o) => ({ id: '', date: '', time: '?', sender: null, quote: '', text: '', media: '', ...o });
assert.strictEqual(
  markdown('Alice', [
    msg({ date: '28/07/2026', time: '12:49', sender: 'Alice', text: 'Back from the festival' }),
    msg({ date: '28/07/2026', time: '12:50', sender: 'Me', quote: 'Alice: Back from the festival', text: 'Glad you survived' }),
    msg({ time: '12:51', media: '[image]' }), // no date, no sender in the markup
    msg({ date: '29/07/2026', time: '09:00', sender: 'Alice', text: 'line 1\nline 2' }),
  ]),
  `# Alice

## 28/07/2026
[12:49] Alice: Back from the festival
[12:50] Me:
> Alice: Back from the festival
Glad you survived
[12:51] Alice: [image]

## 29/07/2026
[09:00] Alice:
line 1
line 2
`,
);

console.log('ok');
