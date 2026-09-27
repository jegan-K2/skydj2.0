/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT — CLIENT CHATBOT MODULE (chatbot.js)
   Floating bottom-right chat assistant for the client-facing pages.
   Uses the FAQ knowledge base from i18n.js (SKY_i18n.getFAQ()).
   Must be loaded AFTER i18n.js.
   ========================================================================== */

(function () {
  'use strict';

  /* ── Only show chatbot on non-admin pages ─── */
  const isAdminPage = window.location.pathname.includes('admin');
  if (isAdminPage) return;

  /* ── Inject CSS ──────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ─── Chatbot FAB ─── */
    #skyBotFab {
      position: fixed;
      bottom: 26px;
      right: 26px;
      z-index: 9900;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4a017 0%, #f5cc45 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(212,160,23,0.55), 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.55rem;
      transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
      outline: none;
    }
    #skyBotFab:hover {
      transform: scale(1.1) rotate(-5deg);
      box-shadow: 0 6px 28px rgba(212,160,23,0.75), 0 3px 10px rgba(0,0,0,0.5);
    }
    #skyBotFab .fab-pulse {
      position: absolute;
      top: 0; right: 0;
      width: 14px;
      height: 14px;
      background: #22c55e;
      border: 2px solid #080a10;
      border-radius: 50%;
      animation: botPulse 2s ease-in-out infinite;
    }
    @keyframes botPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.35); opacity: 0.7; }
    }

    /* ─── Chatbot Window ─── */
    #skyBotWindow {
      position: fixed;
      bottom: 96px;
      right: 26px;
      z-index: 9901;
      width: 340px;
      max-height: 520px;
      display: flex;
      flex-direction: column;
      background: #0d0f18;
      border: 1px solid rgba(212,160,23,0.35);
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(212,160,23,0.08);
      transform: scale(0.85) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), opacity 0.22s ease;
      overflow: hidden;
    }
    #skyBotWindow.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    #skyBotHeader {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(212,160,23,0.04) 100%);
      border-bottom: 1px solid rgba(212,160,23,0.2);
    }
    .bot-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4a017 0%, #f5cc45 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(212,160,23,0.4);
    }
    .bot-header-info { flex: 1; min-width: 0; }
    .bot-header-title {
      font-family: 'Outfit', 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
      line-height: 1.2;
    }
    .bot-header-subtitle {
      font-size: 0.72rem;
      color: #d4a017;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .bot-online-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      animation: botPulse 2s ease-in-out infinite;
    }
    #skyBotClose {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 6px;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }
    #skyBotClose:hover { color: #fff; background: rgba(255,255,255,0.08); }

    /* Messages */
    #skyBotMessages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #skyBotMessages::-webkit-scrollbar { width: 4px; }
    #skyBotMessages::-webkit-scrollbar-track { background: transparent; }
    #skyBotMessages::-webkit-scrollbar-thumb { background: rgba(212,160,23,0.3); border-radius: 2px; }

    .bot-msg {
      max-width: 88%;
      padding: 10px 13px;
      border-radius: 14px;
      font-size: 0.87rem;
      line-height: 1.55;
      word-break: break-word;
      white-space: pre-wrap;
      animation: msgFadeIn 0.22s ease;
    }
    @keyframes msgFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .bot-msg-bot {
      background: rgba(212,160,23,0.1);
      border: 1px solid rgba(212,160,23,0.18);
      color: #e2c97e;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .bot-msg-user {
      background: rgba(212,160,23,0.22);
      border: 1px solid rgba(212,160,23,0.35);
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    /* Typing indicator */
    .bot-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: rgba(212,160,23,0.07);
      border: 1px solid rgba(212,160,23,0.14);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
      max-width: 80px;
    }
    .bot-typing span {
      width: 7px;
      height: 7px;
      background: #d4a017;
      border-radius: 50%;
      animation: typingBounce 1.2s ease-in-out infinite;
    }
    .bot-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bot-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30%            { transform: translateY(-7px); opacity: 1; }
    }

    /* Input area */
    #skyBotInputArea {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid rgba(212,160,23,0.15);
      background: rgba(0,0,0,0.3);
    }
    #skyBotInput {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(212,160,23,0.2);
      border-radius: 10px;
      color: #fff;
      font-size: 0.86rem;
      padding: 8px 12px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      resize: none;
    }
    #skyBotInput:focus { border-color: rgba(212,160,23,0.5); }
    #skyBotInput::placeholder { color: rgba(255,255,255,0.3); }
    #skyBotSendBtn {
      background: linear-gradient(135deg, #d4a017 0%, #f5cc45 100%);
      border: none;
      border-radius: 10px;
      color: #080a10;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 14px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      white-space: nowrap;
    }
    #skyBotSendBtn:hover { transform: scale(1.05); box-shadow: 0 3px 10px rgba(212,160,23,0.4); }
    #skyBotSendBtn:active { transform: scale(0.97); }

    /* Quick questions */
    .bot-quick-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .bot-quick-btn {
      background: rgba(212,160,23,0.1);
      border: 1px solid rgba(212,160,23,0.25);
      color: #d4a017;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 0.78rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .bot-quick-btn:hover { background: rgba(212,160,23,0.2); }

    /* Responsive */
    @media (max-width: 400px) {
      #skyBotWindow { width: calc(100vw - 24px); right: 12px; }
      #skyBotFab    { bottom: 18px; right: 18px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ──────────────────────────────────────────────────────── */
  const fab = document.createElement('button');
  fab.id = 'skyBotFab';
  fab.setAttribute('aria-label', 'Open chat assistant');
  fab.innerHTML = `🎵<span class="fab-pulse"></span>`;

  const win = document.createElement('div');
  win.id = 'skyBotWindow';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'SKY DJ Chat Assistant');
  win.innerHTML = `
    <div id="skyBotHeader">
      <div class="bot-avatar">🎧</div>
      <div class="bot-header-info">
        <div class="bot-header-title" id="skyBotTitle">SKY DJ Assistant</div>
        <div class="bot-header-subtitle">
          <span class="bot-online-dot"></span>
          <span id="skyBotSubtitle">Ask me anything!</span>
        </div>
      </div>
      <button id="skyBotClose" aria-label="Close chat">✕</button>
    </div>
    <div id="skyBotMessages" role="log" aria-live="polite"></div>
    <div id="skyBotInputArea">
      <input type="text" id="skyBotInput" maxlength="300" autocomplete="off" />
      <button id="skyBotSendBtn" id="skyBotSend">Send</button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(win);

  /* ── State ───────────────────────────────────────────────────────────── */
  let isOpen = false;
  let isTyping = false;
  let hasGreeted = false;

  /* ── Helper: get i18n safely ─────────────────────────────────────────── */
  function t(key) {
    return (window.SKY_i18n && window.SKY_i18n.t) ? window.SKY_i18n.t(key) : key;
  }
  function getFAQ() {
    return (window.SKY_i18n && window.SKY_i18n.getFAQ) ? window.SKY_i18n.getFAQ() : [];
  }

  /* ── Update UI text based on current language ─────────────────────────── */
  function updateBotUIText() {
    document.getElementById('skyBotTitle').textContent   = t('chatbot_title');
    document.getElementById('skyBotSubtitle').textContent = t('chatbot_subtitle');
    document.getElementById('skyBotInput').placeholder   = t('chatbot_placeholder');
    document.getElementById('skyBotSendBtn').textContent  = t('chatbot_send');
    fab.setAttribute('aria-label', t('chatbot_open_label'));
    document.getElementById('skyBotClose').setAttribute('aria-label', t('chatbot_close_label'));
  }

  /* ── Open / Close ────────────────────────────────────────────────────── */
  function openBot() {
    isOpen = true;
    win.classList.add('open');
    fab.style.transform = 'rotate(90deg) scale(0.9)';
    updateBotUIText();
    if (!hasGreeted) {
      hasGreeted = true;
      setTimeout(() => addBotMessage(t('chatbot_greeting'), true), 350);
    }
    setTimeout(() => document.getElementById('skyBotInput').focus(), 300);
  }

  function closeBot() {
    isOpen = false;
    win.classList.remove('open');
    fab.style.transform = '';
  }

  fab.addEventListener('click', () => isOpen ? closeBot() : openBot());
  document.getElementById('skyBotClose').addEventListener('click', closeBot);

  /* ── Add messages ────────────────────────────────────────────────────── */
  const messagesEl = document.getElementById('skyBotMessages');

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'bot-msg bot-msg-user';
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function addBotMessage(text, withQuickBtns = false) {
    const div = document.createElement('div');
    div.className = 'bot-msg bot-msg-bot';
    div.textContent = text;
    messagesEl.appendChild(div);

    if (withQuickBtns) {
      addQuickButtons();
    }
    scrollToBottom();
  }

  function addQuickButtons() {
    const quickQuestions = {
      en: ['Our Services', 'Equipment', 'Pricing', 'How to Book', 'Contact Us'],
      ta: ['எங்கள் சேவைகள்', 'உபகரணங்கள்', 'விலை', 'புக்கிங்', 'தொடர்பு'],
      tl: ['Services enna', 'Equipment', 'Price evvalavu', 'Epdi book', 'Contact pannunga']
    };
    const lang = window.SKY_i18n ? window.SKY_i18n.getLanguage() : 'en';
    const qs = quickQuestions[lang] || quickQuestions['en'];

    const wrap = document.createElement('div');
    wrap.className = 'bot-quick-btns';
    qs.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'bot-quick-btn';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        wrap.remove();
        handleUserInput(q);
      });
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    const el = document.createElement('div');
    el.className = 'bot-typing';
    el.id = 'skyBotTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('skyBotTyping');
    if (el) el.remove();
    isTyping = false;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Find best FAQ match ─────────────────────────────────────────────── */
  function findAnswer(query) {
    const q = query.toLowerCase().trim();
    const faq = getFAQ();
    for (const item of faq) {
      for (const pattern of item.patterns) {
        if (q.includes(pattern.toLowerCase())) {
          return item.answer;
        }
      }
    }
    return null;
  }

  /* ── Handle user input ───────────────────────────────────────────────── */
  function handleUserInput(text) {
    text = text.trim();
    if (!text) return;

    addUserMessage(text);

    showTyping();
    const delay = 700 + Math.random() * 500;
    setTimeout(() => {
      hideTyping();
      const answer = findAnswer(text) || t('chatbot_unknown');
      addBotMessage(answer);
    }, delay);
  }

  /* ── Input send actions ──────────────────────────────────────────────── */
  const input   = document.getElementById('skyBotInput');
  const sendBtn = document.getElementById('skyBotSendBtn');

  sendBtn.addEventListener('click', () => {
    handleUserInput(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput(input.value);
      input.value = '';
    }
  });

  /* ── Re-apply UI text when language changes ──────────────────────────── */
  document.addEventListener('sky:langchange', () => {
    updateBotUIText();
    // Reset greeting so the new language greeting shows if bot is reopened
    if (!isOpen) {
      hasGreeted = false;
      messagesEl.innerHTML = '';
    }
  });

  /* ── Initial UI text ─────────────────────────────────────────────────── */
  updateBotUIText();

})();
