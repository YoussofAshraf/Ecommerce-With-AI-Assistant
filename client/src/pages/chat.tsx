import { Message, MessageContent } from "@/components/ai/message";
import { Response } from "@/components/ai/response";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  threadId?: string;
  response: string;
  fallback?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Call your LangChain backend
      const endpoint = threadId 
        ? `http://localhost:3000/chat/${threadId}` 
        : 'http://localhost:3000/chat';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      
      // Store thread ID for conversation continuity
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Show a subtle indicator if this was a fallback response
      if (data.fallback) {
        console.log('Received fallback response due to quota limits');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = "I'm sorry, I'm having trouble connecting to my knowledge base right now.";
      
      // Handle specific error types
      if (error.message.includes('quota') || error.message.includes('429')) {
        errorContent = "🚫 **API Quota Exceeded**\n\nI've temporarily reached my daily limit for AI responses. This happens when:\n\n• Google Gemini API quota has been exceeded\n• Too many requests in a short time\n\n**What you can do:**\n\n1. **Wait and try again** - Quotas usually reset after 24 hours\n2. **Check your Google Cloud Console** for quota limits\n3. **Upgrade your API plan** if you need higher limits\n\n**For now, here are some example furniture items from our collection:**\n\n🛋️ **Modern Sectional Sofa** - $1,299\n🪑 **Ergonomic Office Chair** - $399  \n🛏️ **Queen Platform Bed** - $799\n🍽️ **Dining Table Set** - $899\n\nPlease try again later when the quota resets!";
      } else if (error.message.includes('500')) {
        errorContent = "The AI service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        errorContent = "Unable to connect to the server. Please check if the backend server is running on port 3000.";
      }
      
      setError(error.message || 'Failed to get response from AI assistant');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const clearChat = () => {
    setMessages([]);
    setThreadId(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">AI Furniture Assistant</h1>
              <p className="text-lg text-muted-foreground">
                Ask me about our furniture inventory, get product recommendations, or browse our collection.
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" onClick={clearChat}>
                Clear Chat
              </Button>
            )}
          </div>
          {threadId && (
            <p className="text-sm text-muted-foreground mt-2">
              Conversation ID: {threadId}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">Error: {error}</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="h-[600px] overflow-y-auto border rounded-lg p-4 mb-4 bg-background">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="mb-4">Welcome! I'm your AI furniture assistant.</p>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Try asking:</p>
                  <ul className="mt-2 space-y-1 text-left max-w-md">
                    <li>• "Show me modern dining tables"</li>
                    <li>• "I need a comfortable office chair"</li>
                    <li>• "What sofas do you have under $1000?"</li>
                    <li>• "Find bedroom furniture sets"</li>
                    <li>• "What's new in your collection?"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  <Response isStreaming={isLoading && message === messages[messages.length - 1]}>
                    {message.content}
                  </Response>
                </MessageContent>
              </Message>
            ))
          )}
          {isLoading && (
            <Message from="assistant" key="loading">
              <MessageContent>
                <Response isStreaming={true}>
                  Searching our furniture inventory...
                </Response>
              </MessageContent>
            </Message>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about our furniture collection..."
            className="flex-1 px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Searching..." : "Send"}
          </Button>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Powered by Google Gemini AI & LangChain • Connected to furniture inventory database
        </div>
      </div>
    </div>
  );
}