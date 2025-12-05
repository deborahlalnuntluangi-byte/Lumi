
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from '../types';
import { Send, Mic, Languages } from 'lucide-react';
import Avatar from './Avatar';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onVoiceInput: () => void;
  isListening: boolean;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isTyping, 
  onSendMessage, 
  onVoiceInput,
  isListening,
  selectedLanguage,
  onLanguageChange
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  // Determine avatar state
  const avatarState = isListening ? 'listening' : isTyping ? 'thinking' : 'idle';

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 w-full bg-white/90 backdrop-blur-sm z-10 border-b border-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="sm" state={avatarState} />
          <div>
            <div className="font-bold text-slate-700 leading-tight">Lumi</div>
            <div className="text-[10px] text-slate-400">AI Companion</div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
          <Languages className="w-3.5 h-3.5 text-slate-500 mr-2" />
          <select 
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 mt-10">
            <div className="mb-6 animate-float">
               <Avatar size="lg" state={avatarState} />
            </div>
            <h2 className="text-lg font-semibold text-slate-600 mb-2">Hi, I'm Lumi</h2>
            <p className="max-w-xs text-sm">
              I speak English, Hindi, and Kannada. Choose your language above and start talking!
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}
          >
            {/* Detected Mood Label (Only for AI messages usually, but useful to see what it detected from user) */}
            {msg.sender === Sender.AI && msg.detectedMood && (
               <div className="mb-1 text-[10px] uppercase font-bold tracking-wider text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full inline-block self-start">
                 You sound {msg.detectedMood}
               </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.sender === Sender.USER
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
            
            {/* Image Attachment */}
            {msg.image && (
              <div className={`mt-2 max-w-[80%] rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${msg.sender === Sender.USER ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                <img src={msg.image} alt="Generated content" className="w-full h-auto" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
              <span className="text-xs text-slate-400 mr-2">Lumi is thinking</span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/50 border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <button
            type="button"
            onClick={onVoiceInput}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isListening 
                ? 'bg-rose-500 text-white listening-pulse' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type in ${selectedLanguage === 'en-US' ? 'English' : selectedLanguage === 'hi-IN' ? 'Hindi' : 'Kannada'}...`}
            className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
