"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, X, Send, Minimize2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface ChatWidgetHandle {
  openChat: () => void;
}

const ChatWidget = forwardRef<ChatWidgetHandle>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose openChat method to parent
  useImperativeHandle(ref, () => ({
    openChat: () => {
      setIsOpen(true);
      setIsMinimized(false);
    },
  }));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (error) {
        console.error("Error loading chat messages:", error);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return "Hello! I'm here to help. How can I assist you today?";
    }

    if (lowerMessage.includes("pricing") || lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return "We offer flexible pricing plans. You can check our pricing page at /pricing or contact our sales team for custom quotes.";
    }

    if (lowerMessage.includes("support") || lowerMessage.includes("help")) {
      return "I can help you with general questions. For technical support, please email us at it.imagineering@gmail.com or fill out the contact form.";
    }

    if (lowerMessage.includes("contact") || lowerMessage.includes("email") || lowerMessage.includes("phone")) {
      return "You can reach us via:\n• Email: it.imagineering@gmail.com\n• Phone: +91 9876543212\n• Or fill out the contact form on this page.";
    }

    if (lowerMessage.includes("service") || lowerMessage.includes("provider")) {
      return "We offer 10+ service categories including Contractors, Machines, Land, Homes, Logistics, and more. You can browse all services on our Services page.";
    }

    if (lowerMessage.includes("account") || lowerMessage.includes("login") || lowerMessage.includes("signup")) {
      return "You can create an account by clicking 'Sign Up' in the header. We offer accounts for both service seekers and providers.";
    }

    return "Thank you for your message! Our team will get back to you soon. For immediate assistance, please email us at it.imagineering@gmail.com or call +91 9876543212.";
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        text: "Hello! How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem("chatMessages");
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          data-chat-trigger
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-[hsl(var(--red-accent))] hover:bg-[hsl(var(--red-accent))]/90 text-[hsl(var(--red-accent-foreground))] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          size="icon"
          aria-label="Open chat support"
          title="Open chat support"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isMinimized ? "w-80" : "w-96"
      )}
    >
      <Card className="shadow-2xl border-0 overflow-hidden flex flex-col h-[600px] max-h-[85vh]">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-[hsl(var(--red-accent))] to-[hsl(var(--red-accent))]/90 text-[hsl(var(--red-accent-foreground))] p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Chat Support</h3>
              <p className="text-xs opacity-90">We typically reply in minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(var(--red-accent-foreground))] hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              title={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(var(--red-accent-foreground))] hover:bg-white/20"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === "bot" && (
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--red-accent))]/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-[hsl(var(--red-accent))]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      message.sender === "user"
                        ? "bg-[hsl(var(--red-accent))] text-[hsl(var(--red-accent-foreground))]"
                        : "bg-background border border-border"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--red-accent))]/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-[hsl(var(--red-accent))]" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--red-accent))]/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-[hsl(var(--red-accent))]" />
                  </div>
                  <div className="bg-background border border-border rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="bg-[hsl(var(--red-accent))] hover:bg-[hsl(var(--red-accent))]/90 text-[hsl(var(--red-accent-foreground))]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                For urgent matters, email us at{" "}
                <a href="mailto:it.imagineering@gmail.com" className="underline">
                  it.imagineering@gmail.com
                </a>
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
});

ChatWidget.displayName = "ChatWidget";

export default ChatWidget;

