import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { useWardrobeManager } from '@/hooks/useWardrobeManager'
import { sendChatMessage } from '@/lib/ai-client'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'

interface AIChatPanelProps {
    className?: string
}

export const AIChatPanel = React.memo<AIChatPanelProps>(({ className }) => {
    const { clothingItems } = useWardrobeManager()
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your AI Personal Stylist powered by Grok. I can help you create outfits from your wardrobe. How can I help you today?",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()

        if (!inputValue.trim() || isTyping) return

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsTyping(true)

        try {
            const apiMessages = messages.concat(userMessage).map(m => ({
                role: m.role,
                content: m.content
            }))

            const response = await sendChatMessage({
                messages: apiMessages,
                wardrobeContext: clothingItems
            })

            const botMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: response.content,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            console.error('Chat failed', error)
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `I'm encountering an issue: ${(error as Error).message || 'Unknown error'}. Please check your connection and API key.`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <Card className={cn('flex flex-col h-[600px] shadow-xl', className)}>
            <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <CardTitle>AI Stylist Chat</CardTitle>
                        <p className="text-xs text-gray-500">Powered by Grok</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            'flex gap-3 max-w-[80%]',
                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-primary-100 text-primary-600'
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>

                        <div className={cn(
                            'rounded-2xl px-4 py-2 text-sm',
                            msg.role === 'user'
                                ? 'bg-gray-900 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        )}>
                            {msg.content}
                            <div className={cn(
                                'text-[10px] mt-1 opacity-70',
                                msg.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                            )}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 mr-auto max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="border-t p-4 bg-gray-50/50">
                <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask for fashion advice..."
                        className="flex-1"
                        disabled={isTyping}
                    />
                    <Button type="submit" disabled={!inputValue.trim() || isTyping}>
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
})

AIChatPanel.displayName = 'AIChatPanel'
