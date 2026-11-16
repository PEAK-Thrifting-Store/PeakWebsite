import { useState, useEffect } from 'react'
import { Trash2, Mail, MailOpen, Inbox } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from './AdminApp'
import type { Message } from '@/types'

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      setMessages(await adminApi.getMessages())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const unread = messages.filter((m) => !m.is_read).length

  const markRead = async (msg: Message) => {
    if (msg.is_read) return
    try {
      const updated = await adminApi.markRead(msg.id)
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
    } catch {
      toast('Error', 'error')
    }
  }

  const deleteMsg = async (id: number) => {
    if (!confirm('Delete this message?')) return
    try {
      await adminApi.deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast('Message deleted')
    } catch {
      toast('Error', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl text-[var(--text)]">Messages</h1>
        {unread > 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold text-cream"
            style={{ background: 'var(--accent)' }}
          >
            {unread} new
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--text)] opacity-40">
          <Inbox size={40} />
          <p className="text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="admin-card flex gap-4 cursor-pointer"
              style={!msg.is_read ? { borderColor: 'var(--accent)', borderLeftWidth: 3 } : {}}
              onClick={() => markRead(msg)}
            >
              <div className="mt-0.5 shrink-0 text-[var(--text)]" style={{ opacity: msg.is_read ? 0.3 : 1 }}>
                {msg.is_read ? <MailOpen size={18} /> : <Mail size={18} style={{ color: 'var(--accent)' }} />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[var(--text)]">{msg.name}</span>
                  <span className="text-xs opacity-40 text-[var(--text)] shrink-0">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-xs opacity-60 text-[var(--text)]">{msg.contact}</p>
                <p className="text-sm text-[var(--text)] opacity-80 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.message}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id) }}
                className="shrink-0 p-1.5 rounded hover:bg-red-900/30 text-red-400 opacity-50 hover:opacity-100 transition self-start"
                aria-label="Delete message"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
