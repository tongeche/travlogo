// js/config.js
export async function fetchConfig() {
    const resp = await fetch('/data/config.json');
    if (!resp.ok) throw new Error('Could not load config.json');
    return await resp.json();
  }
  