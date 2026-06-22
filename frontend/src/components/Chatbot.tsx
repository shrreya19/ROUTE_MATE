import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface QA {
  keywords: string[];
  question: string;
  answer: string;
  tags: string[];
}

const KNOWLEDGE_BASE: QA[] = [
  {
    question: "What is RouteMate?",
    keywords: ["what", "routemate", "route", "mate", "app", "about", "purpose", "concept", "intro", "carpool", "ride", "share", "commute"],
    tags: ["General"],
    answer: "**RouteMate** is a smart carpooling web application designed to connect daily commuters traveling along similar routes. By sharing rides, RouteMate helps you **save on fuel and toll costs**, **reduce carbon emissions**, and **meet fellow professionals** in a safe, verified environment."
  },
  {
    question: "How do I get started with RouteMate?",
    keywords: ["get started", "start", "use", "how to", "steps", "guide", "tutorial", "instructions"],
    tags: ["General"],
    answer: "Getting started with RouteMate is simple:\n\n1. **Create your Profile**: Sign up and complete email/phone verification.\n2. **Search your Route**: Enter your origin and destination to find matching pools.\n3. **Host or Join a Pool**: Join an existing pool or host your own if you are driving.\n4. **Coordinate in Chat**: Chat securely with your pool members to arrange pickup times.\n5. **Ride & Split Costs**: Share the commute and split fuel expenses easily!"
  },
  {
    question: "How does route matching work?",
    keywords: ["matching", "match", "algorithm", "score", "heuristic", "heuristic score", "accuracy", "percentage", "how to match", "formula", "weights"],
    tags: ["Technical"],
    answer: "RouteMate uses a custom **geospatial heuristic scoring algorithm** to find your best matches. The score ranges up to **100%** based on three factors:\n\n- **Source Proximity (35%)**: How close your pickup locations are (decays to 0 over a 5 km radius).\n- **Destination & Direction (35%)**: Considers proximity of dropoff locations (70% weight) and travel directions approximated via cosine similarity vector match (30% weight).\n- **Time Window Match (30%)**: How closely your departure times align (decays to 0 if the difference exceeds 30 minutes).\n\nThis ensures you only connect with buddies traveling your exact, safe corridor!"
  },
  {
    question: "Is RouteMate safe?",
    keywords: ["safe", "safety", "trust", "secure", "verification", "verified", "phone", "email", "protect", "danger", "report"],
    tags: ["Safety"],
    answer: "Safety is our top priority at RouteMate. We protect our community using:\n\n- **Verified Profiles**: Mandatory email and phone verification for all users.\n- **Anonymous Messaging**: Coordinate rides via our built-in real-time chat without sharing your phone number.\n- **Algorithmic Bounds**: Restricting ride requests only to closely matched corridors.\n- **Live Reporting**: Easy reporting of suspicious behavior, with 24/7 monitoring."
  },
  {
    question: "How do I host a carpool?",
    keywords: ["host", "create", "drive", "driver", "offering", "seat", "capacity", "car", "vehicle"],
    tags: ["Usage"],
    answer: "To host a carpool:\n\n1. Log in to your RouteMate account.\n2. Click the **'Host now!'** button on the dashboard or navigate to the 'Create Pool' page.\n3. Enter your starting point, destination, date, departure time, and vehicle capacity (number of available seats).\n4. Specify your mode of transport.\n5. Click **Publish**. Your pool will appear on the map for nearby riders to request a seat!"
  },
  {
    question: "How do I join a pool?",
    keywords: ["join", "request", "rider", "passenger", "seat", "booking", "book", "find", "search"],
    tags: ["Usage"],
    answer: "To join a pool:\n\n1. Use the **Find Carpool** search bar on the Home page to search your route.\n2. Browse through the available list of pools (higher match scores are listed first).\n3. Click on a pool card to view the details and click **Request to Join**.\n4. Once the host accepts your request, you'll be added to the pool's private group chat to coordinate details!"
  },
  {
    question: "How do I chat with other riders?",
    keywords: ["chat", "message", "communicate", "group chat", "poolchat", "inbox", "coordinate"],
    tags: ["Usage"],
    answer: "Once your join request is accepted by the host, you gain access to the **Pool Chat**. You can access it via the **Rides** section of your profile or directly through the pool link. The group chat allows you to agree on exact pickup locations, timing, and details in real-time."
  },
  {
    question: "How much does it cost / How are payments made?",
    keywords: ["price", "cost", "pay", "payment", "split", "toll", "charge", "free", "money", "cash"],
    tags: ["Pricing"],
    answer: "RouteMate is designed to **split fuel and toll costs** rather than generate profit. The host lists the suggested contribution per seat upfront. You can arrange the actual payment method directly with the pool members (e.g., cash, UPI, or other transfer services) when you ride."
  },
  {
    question: "What is the tech stack of RouteMate?",
    keywords: ["tech", "stack", "built", "creator", "supabase", "react", "vite", "python", "flask", "leaflet", "map", "developer", "database"],
    tags: ["Technical"],
    answer: "RouteMate is built using a modern high-performance stack:\n\n- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion, and Leaflet Maps.\n- **Backend**: Python (Flask/FastAPI) for advanced route matching and geohash filtering.\n- **Database & Auth**: Supabase with PostgreSQL (using Real-time triggers for live messaging and RLS policies for security)."
  },
  {
    question: "How do ratings and feedback work?",
    keywords: ["rating", "rate", "star", "review", "feedback", "trust score", "reputation"],
    tags: ["Safety"],
    answer: "After completing a ride, both drivers and passengers can rate each other (from 1 to 5 stars) and leave comments. These ratings are displayed publicly on profiles to help build community trust and maintain high standards."
  }
];

// Helper to format text with basic markdown styling (**bold**, numbered lists, bullet points)
const formatAnswer = (text: string) => {
  return text.split('\n').map((line, idx) => {
    // Process bold text (**text**)
    let formattedLine = line;
    const boldRegex = /\*\*(.*?)\*\*/g;
    formattedLine = formattedLine.replace(boldRegex, '<strong class="text-[#121212] font-black">$1</strong>');

    // Render list items or normal text
    if (line.match(/^\d+\.\s/)) {
      // Numbered list
      return (
        <div key={idx} className="pl-4 mb-2 flex items-start gap-2">
          <span className="text-[#FFC107] font-black shrink-0">{line.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s/, '') }} className="text-gray-600 text-sm font-medium" />
        </div>
      );
    } else if (line.trim().startsWith('-')) {
      // Bullet list
      return (
        <div key={idx} className="pl-4 mb-2 flex items-start gap-2">
          <span className="text-[#FFC107] shrink-0 font-bold">•</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^-\s/, '') }} className="text-gray-600 text-sm font-medium" />
        </div>
      );
    } else if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    } else {
      return (
        <p key={idx} dangerouslySetInnerHTML={{ __html: formattedLine }} className="text-gray-600 text-sm font-medium leading-relaxed mb-2" />
      );
    }
  });
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi there! 👋 I am your RouteMate Guide. Ask me anything about how the app works, safety, pricing, or our matching algorithm!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const findBestResponse = (query: string): string => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return "Please enter a valid question.";

    const words = normalizedQuery
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 1);

    let bestMatch: QA | null = null;
    let bestScore = 0;

    for (const qa of KNOWLEDGE_BASE) {
      let score = 0;
      
      // Keywords matches
      for (const keyword of qa.keywords) {
        if (normalizedQuery.includes(keyword)) {
          score += 3; // Contains keyword
        }
        for (const word of words) {
          if (keyword === word) {
            score += 5; // Exact word match
          } else if (keyword.startsWith(word) || word.startsWith(keyword)) {
            score += 1.5; // Partial word match
          }
        }
      }

      // Title match
      const titleWords = qa.question.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
      for (const word of words) {
        if (titleWords.includes(word)) {
          score += 4;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = qa;
      }
    }

    if (bestMatch && bestScore >= 4) {
      return bestMatch.answer;
    }

    return "I couldn't find a exact answer for that. Here are some things you can try:\n- Ask how the **matching algorithm** works.\n- Ask about our **safety** features.\n- Ask how to **host** or **join** a pool.\n\nOr click one of the quick suggestions below!";
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const responseText = findBestResponse(text);
      const botMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend(inputValue);
    }
  };

  // Quick suggestions based on common questions
  const suggestions = [
    "How does matching work?",
    "Is RouteMate safe?",
    "How to host a pool?",
    "Payments & costs"
  ];

  return (
    <div className="fixed z-50 select-none">
      {/* FLOATING ACTION BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-[#121212] hover:bg-[#FFC107] text-[#FFC107] hover:text-[#121212] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-colors duration-300 z-50`}
        aria-label="Open Chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <MessageCircle size={24} />
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC107] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FFC107] border border-[#121212] flex items-center justify-center">
                  <Sparkles size={6} className="text-[#121212] scale-[0.8]" />
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* CHAT WINDOW WIDGET */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-36 left-4 right-4 md:left-auto md:right-8 md:bottom-24 w-auto md:w-[380px] h-[500px] bg-white/95 backdrop-blur-md border border-gray-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden z-40 max-w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div className="bg-[#121212] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FFC107]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                    RouteMate Guide
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online Support</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 custom-scrollbar bg-gray-50/50">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isBot ? 'justify-start' : 'justify-end'} w-full`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm font-medium shadow-sm leading-relaxed ${
                        isBot
                          ? 'bg-white text-gray-600 border border-gray-100 rounded-tl-sm'
                          : 'bg-[#121212] text-white rounded-tr-sm'
                      }`}
                    >
                      {isBot ? (
                        <div className="flex flex-col">
                          {formatAnswer(msg.text)}
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start w-full"
                >
                  <div className="bg-white text-gray-500 border border-gray-100 rounded-[1.5rem] rounded-tl-sm px-4 py-3.5 shadow-sm flex gap-1.5 items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips List */}
            <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 shrink-0 overflow-x-auto flex gap-2 whitespace-nowrap scrollbar-hide py-3">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#FFC107]/10 hover:border-[#FFC107]/50 text-xs font-bold text-[#121212] rounded-full border border-gray-200 shadow-sm transition-all hover:scale-102 cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask about RouteMate..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isTyping}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#121212] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/20 focus:border-[#FFC107] transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-[#FFC107] text-[#121212] rounded-xl font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
