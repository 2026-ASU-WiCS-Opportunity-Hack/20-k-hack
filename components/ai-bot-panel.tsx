'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function AiBotPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can answer questions about your clients, services, and follow-ups. Try asking "Who has pending housing follow-ups?" or "How many active clients do we have?"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const json = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: json.answer || 'Sorry, I could not get an answer.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* 채팅 모달 */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 h-[420px] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
            <Bot size={16} className="text-white" />
            <span className="text-white font-medium text-sm">AI Assistant</span>
            <span className="ml-auto text-indigo-200 text-xs">SafeCase</span>
          </div>

          {/* 메시지 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력 */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about clients..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={13} className={input.trim() && !loading ? 'text-white' : 'text-gray-400'} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}