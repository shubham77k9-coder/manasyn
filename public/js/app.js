// ── Manasyn — Client-side shared JavaScript ──

// Theme toggle
function toggleTheme() {
  const current = document.body.dataset.theme || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.body.dataset.theme = next;
  document.getElementById('icon-sun').style.display = next === 'dark' ? 'none' : 'block';
  document.getElementById('icon-moon').style.display = next === 'dark' ? 'block' : 'none';

  // Persist via query param (server reads it into session)
  const url = new URL(window.location.href);
  url.searchParams.set('theme', next);
  fetch(url.pathname + '?theme=' + next, { method: 'GET' }).catch(() => {});
}

// Set initial icon state
(function() {
  const theme = document.body.dataset.theme || 'light';
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display = theme === 'dark' ? 'none' : 'block';
    moon.style.display = theme === 'dark' ? 'block' : 'none';
  }
})();

// Voice toggle (global placeholder for voice-enabled pages)
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

  recognition.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
    }
    if (msgInput) msgInput.value = text;
    if (answerInput) answerInput.value = text;
  };

  recognition.onerror = (e) => {
    console.error('Voice error:', e.error);
  };

  recognition.start();
}

// Auto-scroll conversation to bottom
function scrollMessagesToBottom() {
  const messages = document.getElementById('messages');
  if (messages) {
    messages.scrollTop = messages.scrollHeight;
  }
}

// Run on load
window.addEventListener('DOMContentLoaded', () => {
  scrollMessagesToBottom();
});