const $ = (id) => document.getElementById(id);

/** @param {{ error: string } | { name: string, count: number, md: string }} state */
function render(state) {
  if ('error' in state) {
    $('title').textContent = state.error;
    return;
  }
  $('title').textContent = `${state.name} · ${state.count} messages`;
  // Older messages land on top while you scroll the chat: keep the view put by
  // holding its distance from the bottom.
  const md = $('md');
  const fromBottom = md.scrollHeight - md.scrollTop;
  md.value = state.md;
  md.scrollTop = md.scrollHeight - fromBottom;
  $('copy').disabled = $('save').disabled = false;
  $('copy').onclick = () => navigator.clipboard.writeText(state.md).then(() => ($('copy').textContent = 'Copied'));
  $('save').onclick = () => download(`whatsapp_${state.name}.md`, state.md); // the browser cleans the file name
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  a.download = name;
  a.click();
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url?.startsWith('https://web.whatsapp.com')) return render({ error: 'Open web.whatsapp.com' });
  let heard = false;
  const port = chrome.tabs.connect(tab.id);
  port.onMessage.addListener((state) => {
    heard = true;
    render(state);
  });
  // Dropped before a word: the tab was open before the extension was (re)loaded.
  port.onDisconnect.addListener(() => heard || render({ error: 'Reload the WhatsApp tab (F5)' }));
});
