'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { toast } from './Toast'
import { supportAPI } from '@/lib/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
}

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    description: '',
  })
  const [showUserForm, setShowUserForm] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInfo.name || !userInfo.phone) {
      toast('Заполните имя и телефон', 'warning')
      return
    }
    setShowUserForm(false)
    // Добавляем приветственное сообщение
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Здравствуйте, ${userInfo.name}! Чем могу помочь?`,
      sender: 'support',
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputValue
    setInputValue('')
    setLoading(true)

    try {
      // Отправляем сообщение в поддержку
      await supportAPI.create({
        name: userInfo.name,
        phone: userInfo.phone,
        description: userInfo.description,
        message: messageText,
      })

      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Спасибо за обращение! Ваше сообщение отправлено. Наш специалист свяжется с вами в ближайшее время. Обычно это занимает не более 15 минут.',
        sender: 'support',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, supportMessage])
      toast('Сообщение отправлено', 'success')
    } catch (error: any) {
      toast(error.userMessage || 'Ошибка при отправке сообщения', 'error')
      // Удаляем сообщение пользователя при ошибке
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setInputValue(messageText)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 hover:scale-110 active:scale-95"
        aria-label="Открыть чат поддержки"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium">
            {messages.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      {!isMinimized && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={handleClose}
        />
      )}
      <div
        className={`fixed z-[9999] flex flex-col transition-all bg-white shadow-2xl border border-gray-100 ${
          isMinimized 
            ? 'h-16 md:bottom-6 md:right-6 md:w-96 md:rounded-2xl' 
            : 'md:bottom-6 md:right-6 md:w-96 md:max-w-[calc(100vw-3rem)] md:rounded-2xl md:h-[600px] md:max-h-[calc(100vh-3rem)] bottom-0 left-0 right-0 w-full h-[100vh] max-h-[100vh] rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col'
        }`}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Поддержка LOCUS</h3>
            <p className="text-xs text-blue-100">Обычно отвечаем за 15 минут</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Свернуть"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0 overscroll-contain">
            {showUserForm ? (
              <form onSubmit={handleUserFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Иван"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="+7 (999) 123-45-67"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание проблемы
                  </label>
                  <textarea
                    value={userInfo.description}
                    onChange={(e) => setUserInfo({ ...userInfo, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    placeholder="Опишите вашу проблему..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
                >
                  Начать диалог
                </button>
              </form>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {!showUserForm && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="w-10 h-10 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
    </>
  )
}
