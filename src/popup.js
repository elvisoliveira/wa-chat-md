const $ = (id) => document.getElementById(id);

/** @param {{ error: string } | { name: string, count: number, md: string }} state */
function render(state) {
  if ('error' in state) {
    $('title').textContent = state.error;
    return;
  }
  $('title').textContent = `${state.name} · ${state.count} messages`;
  $('md').value = state.md;
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
  chrome.tabs.sendMessage(tab.id, 'get', (state) =>
    // No answer: the tab was open before the extension was (re)loaded.
    render(chrome.runtime.lastError || !state ? { error: 'Reload the WhatsApp tab (F5)' } : state),
  );
});
