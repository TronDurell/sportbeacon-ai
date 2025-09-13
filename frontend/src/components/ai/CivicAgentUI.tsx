import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Phone, 
  Mail, 
  Globe,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings,
  CheckCircle,
  Info
} from "lucide-react";
import CivicAgent, { CivicQuery, CivicResponse } from "../../lib/ai/CivicAgent";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  response?: CivicResponse;
}

interface CivicAgentUIProps {
  municipalityName?: string;
  leaguePolicies?: any[];
  adminRole?: string;
}

const CivicAgentUI: React.FC<CivicAgentUIProps> = ({ 
  municipalityName = "Cary",
  leaguePolicies = [],
  adminRole = "public"
}) => {
  const [agent, setAgent] = useState<CivicAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFacilities, setShowFacilities] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Civic Agent
  useEffect(() => {
    const civicAgent = new CivicAgent(municipalityName, leaguePolicies, adminRole);
    setAgent(civicAgent);

    // Send welcome message
    civicAgent.getOnboardingAssistant().then(response => {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: response.answer,
        timestamp: new Date(),
        response
      };
      setMessages([welcomeMessage]);
    });

    return () => {
      civicAgent.endSession();
    };
  }, [municipalityName, leaguePolicies, adminRole]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!agent || !content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Determine query type based on content
      const queryType = determineQueryType(content);
      
      const query: CivicQuery = {
        type: queryType,
        question: content,
        context: extractContext(content)
      };

      const response = await agent.handleQuery(query);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.answer,
        timestamp: new Date(),
        response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again or contact our office for assistance.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const determineQueryType = (content: string): "policy" | "registration" | "facility" | "recommendation" | "general" => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("policy") || lowerContent.includes("refund") || lowerContent.includes("cost") || lowerContent.includes("age")) {
      return "policy";
    } else if (lowerContent.includes("register") || lowerContent.includes("sign up") || lowerContent.includes("join")) {
      return "registration";
    } else if (lowerContent.includes("facility") || lowerContent.includes("location") || lowerContent.includes("where")) {
      return "facility";
    } else if (lowerContent.includes("recommend") || lowerContent.includes("suggest") || lowerContent.includes("best")) {
      return "recommendation";
    } else {
      return "general";
    }
  };

  const extractContext = (content: string) => {
    const context: any = {};
    const lowerContent = content.toLowerCase();
    
    // Extract age
    const ageMatch = lowerContent.match(/(\d+)\s*(?:years?\s*old|y\.?o\.?)/);
    if (ageMatch) {
      context.childAge = parseInt(ageMatch[1]);
    }
    
    // Extract sport
    const sports = ["soccer", "basketball", "baseball", "football", "volleyball", "tennis", "swimming"];
    for (const sport of sports) {
      if (lowerContent.includes(sport)) {
        context.sport = sport;
        break;
      }
    }
    
    // Extract skill level
    if (lowerContent.includes("beginner")) context.skillLevel = "beginner";
    else if (lowerContent.includes("intermediate")) context.skillLevel = "intermediate";
    else if (lowerContent.includes("advanced")) context.skillLevel = "advanced";
    
    return context;
  };

  const quickActions = [
    {
      title: "Registration",
      icon: Users,
      questions: [
        "How do I register my child for soccer?",
        "What are the registration deadlines?",
        "How much does it cost to register?"
      ]
    },
    {
      title: "Policies",
      icon: BookOpen,
      questions: [
        "What is the refund policy?",
        "What are the age requirements?",
        "Do you offer sibling discounts?"
      ]
    },
    {
      title: "Facilities",
      icon: MapPin,
      questions: [
        "Where are the soccer fields located?",
        "What facilities are available?",
        "What are the facility hours?"
      ]
    },
    {
      title: "Recommendations",
      icon: Star,
      questions: [
        "What league is best for my 8-year-old?",
        "Can you recommend a sport for beginners?",
        "What programs are available for teenagers?"
      ]
    }
  ];

  const handleQuickAction = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {municipalityName} Parks & Recreation Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Get answers about leagues, registration, policies, and facilities
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showQuickActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Quick Actions
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Chat Assistant</h3>
                  <p className="text-sm text-gray-500">Ask me anything about {municipalityName} sports</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Response details */}
                      {message.response && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Info className="w-3 h-3" />
                            Confidence: {Math.round(message.response.confidence * 100)}%
                          </div>
                          
                          {message.response.relatedPolicies && message.response.relatedPolicies.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Related Policies:</p>
                              <div className="space-y-1">
                                {message.response.relatedPolicies.slice(0, 2).map((policy, index) => (
                                  <div key={index} className="text-xs bg-white p-2 rounded border">
                                    <p className="font-medium">{policy.sport}</p>
                                    <p className="text-gray-600">Cost: ${policy.cost}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {message.response.nextSteps && message.response.nextSteps.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Next Steps:</p>
                              <ul className="text-xs space-y-1">
                                {message.response.nextSteps.map((step, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                  placeholder="Ask about registration, policies, facilities..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((category) => (
                  <div key={category.title}>
                    <button
                      onClick={() => setSelectedCategory(selectedCategory === category.title ? "" : category.title)}
                      className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{category.title}</span>
                      </div>
                      {selectedCategory === category.title ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    {selectedCategory === category.title && (
                      <div className="mt-2 ml-6 space-y-2">
                        {category.questions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickAction(question)}
                            className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 p-1 rounded"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">(919) 469-4000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">parks@cary.gov</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm">cary.gov/parks</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Mon-Fri 8AM-5PM</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Search</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies, facilities..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFacilities(!showFacilities)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg ${
                    showFacilities 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Facilities
                </button>
                <button
                  onClick={() => setShowPolicies(!showPolicies)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg ${
                    showPolicies 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Policies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivicAgentUI; 