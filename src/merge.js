// Merges a slice of message ids, in screen order, into the known order.
// WhatsApp Web only keeps the rows near the viewport in the DOM, so each look
// sees a window of the chat; overlapping windows are stitched together.
// ponytail: indexOf per new id is O(n²); fine for a few thousand messages.
export default function merge(order, ids) {
  const known = new Set(order);
  const k = ids.findIndex((id) => known.has(id));
  if (k === -1) {
    // No overlap (jumped far): you scroll up to load more, so treat it as older.
    return ids.concat(order);
  }
  const out = order.slice();
  const fresh = (id) => !known.has(id);
  out.splice(out.indexOf(ids[k]), 0, ...ids.slice(0, k).filter(fresh));
  let prev = ids[k];
  for (const id of ids.slice(k + 1)) {
    if (fresh(id)) out.splice(out.indexOf(prev) + 1, 0, id);
    prev = id;
  }
  return out;
}
