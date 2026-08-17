// ── Manasyn — Client-side shared JavaScript ──
function toggleTheme() {
  const current = document.body.dataset.theme || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.body.dataset.theme = next;
  document.getElementById('icon-sun').style.display = next === 'dark' ? 'none' : 'block';
  document.getElementById('icon-moon').style.display = next === 'dark' ? 'block' : 'none';
  const url = new URL(window.location.href);
  url.searchParams.set('theme', next);
  fetch(url.pathname + '?theme=' + next, { method: 'GET' }).catch(() => {});
}
(function() {
  const theme = document.body.dataset.theme || 'light';
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display = theme === 'dark' ? 'none' : 'block';
    moon.style.display = theme === 'dark' ? 'block' : 'none';
  }
})();
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Voice input is not supported in your browser. Please type instead.');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  const msgInput = document.getElementById('msgInput');
  const answerInput = document.getElementById('answerInput');
  recognition.onresult = (e) => { let text = ''; for (let i = 0; i < e.results.length; i++) { text += e.results[i][0].transcript; } if (msgInput) msgInput.value = text; if (answerInput) answerInput.value = text; };
  recognition.onerror = (e) => { console.error('Voice error:', e.error); };
  recognition.start();
}
function scrollMessagesToBottom() { const messages = document.getElementById('messages'); if (messages) { messages.scrollTop = messages.scrollHeight; } }
window.addEventListener('DOMContentLoaded', () => { scrollMessagesToBottom(); });