// ── Manasyn — Conversation JavaScript ──
const convId = document.getElementById('convId')?.value;
const msgInput = document.getElementById('msgInput');
const messagesDiv = document.getElementById('messages');
function appendMessage(role, content) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg msg--' + (role === 'user' ? 'user' : 'ai');
  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'msg__avatar';
    avatar.innerHTML = '<div class="msg__avatar-dot"></div><span class="msg__avatar-label">MANASYN</span>';
    msgDiv.appendChild(avatar);
  }
  const textDiv = document.createElement('div');
  textDiv.className = 'msg__text';
  textDiv.innerHTML = content.replace(/\n/g, '<br>');
  msgDiv.appendChild(textDiv);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
function appendTypingIndicator() {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg msg--ai';
  msgDiv.id = 'typingIndicator';
  const avatar = document.createElement('div');
  avatar.className = 'msg__avatar';
  avatar.innerHTML = '<div class="msg__avatar-dot"></div><span class="msg__avatar-label">MANASYN</span>';
  msgDiv.appendChild(avatar);
  const textDiv = document.createElement('div');
  textDiv.className = 'msg__text';
  textDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  msgDiv.appendChild(textDiv);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
function removeTypingIndicator() { const el = document.getElementById('typingIndicator'); if (el) el.remove(); }
async function sendMessage() {
  const message = msgInput.value.trim();
  if (!message) return;
  appendMessage('user', message);
  msgInput.value = '';
  appendTypingIndicator();
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: parseInt(convId), message }) });
    const data = await res.json();
    removeTypingIndicator();
    if (data.success) { appendMessage('assistant', data.response); }
    else { appendMessage('assistant', 'Something interrupted the conversation. Your message wasn\'t lost. Please try again.'); }
  } catch (err) { removeTypingIndicator(); appendMessage('assistant', 'Something interrupted the conversation. Your message wasn\'t lost. Please try again.'); }
}
async function sendQuickAction(text) { msgInput.value = text; await sendMessage(); }