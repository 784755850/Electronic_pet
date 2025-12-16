
const $ = (id) => document.getElementById(id);
const historyDiv = $('chat-history');
const input = $('message-input');
const sendBtn = $('send-btn');
const closeBtn = $('close-btn');

let messages = [];
let i18nData = {};

function t(key) {
  const keys = key.split('.');
  let v = i18nData;
  for (const k of keys) {
    if (v && v[k]) v = v[k];
    else return key;
  }
  return v;
}

// Initialize
if (window.electronAPI) {
  window.electronAPI.getI18n().then(data => {
     i18nData = data;
     // Translate UI
     const titleEl = document.querySelector('.title');
     if (titleEl) titleEl.textContent = t('chat.title');
     
     const inputEl = $('message-input');
     if (inputEl) inputEl.placeholder = t('chat.placeholder');
     
     const sendBtnEl = $('send-btn');
     if (sendBtnEl) sendBtnEl.textContent = t('chat.send');
     
     // Update initial message if it's the default one
     const historyDiv = $('chat-history');
     if (historyDiv && historyDiv.children.length === 1 && historyDiv.children[0].classList.contains('assistant')) {
         // Only replace if it looks like the default greeting
         // But we can't easily detect that. Let's just leave it or maybe clear and add a localized greeting?
         // For now, let's just leave the static HTML greeting or replace it if we want to be perfect.
         // Actually, let's just leave it.
     }
  });
}

function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  historyDiv.appendChild(div);
  historyDiv.scrollTop = historyDiv.scrollHeight;
  
  // Store in history (limit context window if needed, but for now keep all)
  messages.push({ role, content });
}

async function sendMessage() {
  const content = input.value.trim();
  if (!content) return;
  
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;
  
  appendMessage('user', content);
  
  try {
    const response = await window.electronAPI.llmChat(messages);
    appendMessage('assistant', response);
  } catch (err) {
    console.error(err);
    let errorMsg = err.message;
    if (errorMsg.includes('LLM not enabled')) {
        errorMsg = t('errors.llm_not_enabled');
    } else {
        errorMsg = 'Sorry, I encountered an error: ' + errorMsg;
    }
    appendMessage('assistant', errorMsg);
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.onclick = sendMessage;

input.onkeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

closeBtn.onclick = () => {
  window.close();
};

// Focus input on load
input.focus();
