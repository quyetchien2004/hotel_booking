import { useEffect, useRef, useState } from 'react';
import SiteLayout from '../components/SiteLayout';
import api from '../services/api';

const QUICK_PROMPTS = [
  { label: 'Cách đặt phòng nhanh nhất?', prompt: 'Cách đặt phòng nhanh nhất trên hệ thống là gì?' },
  { label: 'Thanh toán cọc 30% hoạt động ra sao?', prompt: 'Tôi muốn thanh toán cọc 30% thì quy trình xử lý như thế nào?' },
  { label: 'Điều kiện nhận voucher', prompt: 'Các điều kiện nhận voucher WELCOME10, LOYAL10 và FREQUENT25 là gì?' },
  { label: 'Xác thực CCCD và trust score', prompt: 'Làm sao để xác thực CCCD thành công và tăng độ tin cậy tài khoản?' },
];

const BOT_DELAY_MS = 1200;

function TypingIndicator() {
  return (
    <div className="ai-msg-row bot">
      <div className="ai-avatar bot">AI</div>
      <div className="ai-msg bot">
        <div className="ai-typing" aria-label="Bot is typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const logRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages([{ role: 'bot', text: 'Xin chào! Tôi là trợ lý AI của CCT Hotels Company. Bạn cần tôi hỗ trợ gì hôm nay?' }]);
      }, BOT_DELAY_MS);
    }, 300);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(message) {
    const msg = (message || input).trim();
    if (!msg) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { role: 'bot', text: 'Vui lòng nhập thông tin để tôi hỗ trợ bạn tốt hơn.' }]);
      }, BOT_DELAY_MS);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setSending(true);
    setTyping(true);

    try {
      const res = await api.post('/chatbot/ask', { message: msg });
      const answer = res.data?.answer || 'Bot chưa có phản hồi phù hợp.';
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { role: 'bot', text: answer }]);
        setSending(false);
      }, BOT_DELAY_MS);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Đã có lỗi xảy ra.';
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { role: 'bot', text: 'Đã có lỗi xảy ra: ' + errMsg }]);
        setSending(false);
      }, BOT_DELAY_MS);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') send();
  }

  return (
    <SiteLayout activePage="chatbot" headerVariant="light">
      <style>{`
        .ai-chat-page{display:grid;grid-template-columns:minmax(250px,320px) minmax(0,1fr);gap:18px}
        .ai-panel{border:1px solid #d9e1fb;border-radius:18px;background:linear-gradient(145deg,#f7f9ff 0%,#fff 50%,#f2fbff 100%);box-shadow:0 16px 36px rgba(28,51,112,.10)}
        .ai-sidebar{padding:20px}
        .ai-badge{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:8px 14px;background:#ebf1ff;color:#2448a3;font-size:12px;font-weight:700;letter-spacing:.3px}
        .ai-title{margin-top:16px;margin-bottom:8px;font-weight:700;color:#19223f}
        .ai-text{color:#5b6480;font-size:14px;line-height:1.6}
        .ai-chip-list{margin-top:16px;display:grid;gap:10px}
        .ai-chip{width:100%;border:1px solid #d6e2ff;border-radius:12px;background:#fff;color:#26304a;text-align:left;padding:10px 12px;font-size:13px;transition:all .25s ease;cursor:pointer}
        .ai-chip:hover{transform:translateY(-1px);border-color:#91aefc;box-shadow:0 8px 16px rgba(45,81,170,.12)}
        .ai-main{display:grid;grid-template-rows:auto minmax(380px,54vh) auto;padding:0;overflow:hidden}
        .ai-main-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #e3e9fb;background:linear-gradient(120deg,#fff 0%,#f4f7ff 100%)}
        .ai-main-head h5{margin:0;color:#1d2a4f;font-weight:700}
        .ai-status{display:inline-flex;align-items:center;gap:8px;color:#3a4a72;font-size:12px;font-weight:600}
        .ai-status-dot{width:10px;height:10px;border-radius:50%;background:#2cc46a;animation:pulse 1.8s infinite}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(44,196,106,.65)}70%{box-shadow:0 0 0 8px rgba(44,196,106,0)}100%{box-shadow:0 0 0 0 rgba(44,196,106,0)}}
        .ai-chat-log{padding:14px;overflow-y:auto;background:radial-gradient(circle at 10% 10%,#eef5ff 0%,transparent 34%),radial-gradient(circle at 90% 90%,#eafdf5 0%,transparent 30%),#fcfdff}
        .ai-msg-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:10px}
        .ai-msg-row.user{justify-content:flex-end}
        .ai-avatar{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;font-size:13px}
        .ai-avatar.bot{border:1px solid #2e65d5;background:linear-gradient(145deg,#2e63d2 0%,#3a85e3 100%);color:#fff;font-weight:700}
        .ai-avatar.user{background:linear-gradient(140deg,#2d5fd0 0%,#3f88e6 100%);color:#fff;font-weight:700}
        .ai-msg{max-width:min(74%,640px);border-radius:18px;padding:9px 13px;font-size:13.5px;line-height:1.5;white-space:pre-line;animation:msgUp .3s ease}
        .ai-msg.user{border-top-right-radius:6px;background:linear-gradient(140deg,#2f5fd0 0%,#3573db 50%,#2f6dc7 100%);color:#fff;box-shadow:0 10px 20px rgba(47,95,208,.25)}
        .ai-msg.bot{border:1px solid #dbe4ff;border-top-left-radius:6px;background:#fff;color:#212943;box-shadow:0 8px 18px rgba(31,54,108,.08)}
        @keyframes msgUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ai-typing{display:inline-flex;align-items:center;gap:6px;min-height:16px}
        .ai-typing span{width:8px;height:8px;border-radius:50%;background:#5c6a90;opacity:.35;animation:typingWave 1.1s infinite ease-in-out}
        .ai-typing span:nth-child(2){animation-delay:.15s}
        .ai-typing span:nth-child(3){animation-delay:.3s}
        @keyframes typingWave{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:.95}}
        .ai-input-wrap{border-top:1px solid #e3e9fb;padding:12px 14px;background:#fff}
        .ai-input-group{display:flex;align-items:center;gap:8px;background:#edf1fb;border:1px solid #dbe5ff;border-radius:999px;padding:6px}
        .ai-input{flex:1;min-width:0;border:none;background:transparent;border-radius:999px;padding:8px 12px;font-size:13.5px}
        .ai-input:focus{outline:none;box-shadow:none}
        .ai-send{border:none;border-radius:999px;width:38px;height:38px;padding:0;background:linear-gradient(140deg,#2050c8 0%,#3382df 100%);color:#fff;display:inline-flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;cursor:pointer}
        .ai-send:hover{transform:translateY(-1px);box-shadow:0 10px 18px rgba(39,93,202,.27)}
        .ai-send:disabled{opacity:.7;cursor:not-allowed;transform:none;box-shadow:none}
        @media(max-width:991.98px){.ai-chat-page{grid-template-columns:1fr}.ai-main{grid-template-rows:auto minmax(360px,56vh) auto}}
      `}</style>

      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">AI Concierge Trực Tuyến</h2>
          <p className="text-muted mb-0">Trợ lý AI hỗ trợ 24/7 cho đặt phòng, thanh toán, voucher và quản lý tài khoản tại CCT Hotels Company.</p>
        </div>

        <div className="ai-chat-page">
          <aside className="ai-panel ai-sidebar">
            <span className="ai-badge">
              <i className="fa-solid fa-sparkles" />
              AI Assistant
            </span>
            <h5 className="ai-title">Xin chào, tôi là CCT AI</h5>
            <p className="ai-text">Tôi có thể giúp bạn tra cứu trạng thái booking, giải thích phương thức thanh toán và gợi ý sử dụng voucher phù hợp.</p>
            <div className="ai-chip-list">
              {QUICK_PROMPTS.map((qp, i) => (
                <button key={i} className="ai-chip" type="button" onClick={() => setInput(qp.prompt)}>
                  {qp.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="ai-panel ai-main">
            <div className="ai-main-head">
              <h5>Phòng Chat AI</h5>
              <span className="ai-status"><span className="ai-status-dot" />Online</span>
            </div>

            <div className="ai-chat-log" ref={logRef}>
              {messages.map((m, i) => (
                <div key={i} className={`ai-msg-row ${m.role}`}>
                  <div className={`ai-avatar ${m.role}`}>{m.role === 'bot' ? 'AI' : 'B'}</div>
                  <div className={`ai-msg ${m.role}`}>{m.text}</div>
                </div>
              ))}
              {typing && <TypingIndicator />}
            </div>

            <div className="ai-input-wrap">
              <div className="ai-input-group">
                <input
                  className="ai-input"
                  placeholder="Nhập câu hỏi của bạn..."
                  maxLength={500}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button className="ai-send" type="button" aria-label="Gửi tin nhắn" onClick={() => send()} disabled={sending}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 17, height: 17, fill: 'currentColor', display: 'block' }}>
                    <path d="M3.4 11.2 19.6 4.6c1.4-.6 2.8.8 2.2 2.2l-6.6 16.2c-.6 1.5-2.7 1.4-3.2-.1l-1.5-4.9-4.9-1.5c-1.5-.5-1.6-2.6-.2-3.2Zm6.9 4.5.9 3.1 5.2-12.8-12.8 5.2 3.1.9 5.4-2.7-1.8 2.6Z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
