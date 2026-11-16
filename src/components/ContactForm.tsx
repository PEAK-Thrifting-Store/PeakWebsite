import { useState } from 'react'
import { motion } from 'motion/react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import { publicApi } from '@/lib/api'

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({ name: '', contact: '', message: '', website: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      await publicApi.sendMessage({
        name: form.name,
        contact: form.contact,
        message: form.message,
        website: form.website, // honeypot
      })
      setStatus('success')
      setForm({ name: '', contact: '', message: '', website: '' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        className="flex flex-col items-center gap-4 py-12 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle size={48} className="text-[var(--accent)]" />
        <h3 className="font-display text-2xl">Message received.</h3>
        <p className="text-[var(--text)] opacity-70 text-sm">We'll get back to you on Instagram soon.</p>
        <button className="btn-ghost mt-2" onClick={() => setStatus('idle')}>Send another</button>
      </motion.div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text)] placeholder-opacity-40 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm font-body'

  return (
    <form onSubmit={submit} className="max-w-lg mx-auto space-y-4" noValidate>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={set('website')}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />

      <div>
        <label htmlFor="cf-name" className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60">
          Name
        </label>
        <input
          id="cf-name"
          type="text"
          value={form.name}
          onChange={set('name')}
          placeholder="Your name"
          required
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cf-contact" className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60">
          Instagram / WhatsApp
        </label>
        <input
          id="cf-contact"
          type="text"
          value={form.contact}
          onChange={set('contact')}
          placeholder="@username or +962..."
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60">
          Message
        </label>
        <textarea
          id="cf-message"
          value={form.message}
          onChange={set('message')}
          placeholder="What are you looking for?"
          required
          maxLength={2000}
          rows={5}
          className={`${inputClass} resize-none`}
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">
          <AlertCircle size={15} />
          {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'sending'} className="btn-primary w-full justify-center">
        {status === 'sending' ? (
          <span className="animate-spin inline-block w-4 h-4 border-2 border-cream border-t-transparent rounded-full" />
        ) : (
          <Send size={16} />
        )}
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
