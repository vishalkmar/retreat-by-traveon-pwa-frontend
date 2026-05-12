import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

// Per-property chat. The `endpoint` prop tells us whether to hit
// /auditor/... or /officer/... — both backend routes proxy to the same
// shared controller. `sectionKey` scopes the thread to a section; pass
// 'general' for the final-suggestion thread.

const ChatThread = ({ endpoint, propertyId, sectionKey = 'general', className = '' }) => {
  const { user, role } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`${endpoint}/properties/${propertyId}/messages`, { params: { sectionKey } })
      .then((r) => { if (alive) setMessages(r.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [endpoint, propertyId, sectionKey]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (payload) => {
      const m = payload?.message;
      if (!m) return;
      if (m.propertyId !== propertyId) return;
      // Match section filter (treat null and 'general' the same)
      const incomingKey = m.sectionKey || 'general';
      if (sectionKey && sectionKey !== incomingKey) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    };
    socket.on('property:message', onMessage);
    return () => socket.off('property:message', onMessage);
  }, [socket, propertyId, sectionKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const r = await api.post(`${endpoint}/properties/${propertyId}/messages`, {
        body,
        sectionKey,
      });
      const m = r.data?.data?.message;
      if (m) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setText('');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-100 bg-white shadow-card ${className}`}>
      <div className="max-h-72 flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <p className="py-6 text-center text-xs text-slate-400">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No messages yet. Start the discussion.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderType === role && m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? 'bg-brand-700 text-white'
                    : m.senderType === 'officer' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-500'}`}>
                    {m.senderType === 'auditor' ? 'Auditor' : 'Officer'} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatThread;
