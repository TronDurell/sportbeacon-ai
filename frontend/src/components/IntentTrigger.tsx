import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentOrchestration } from '../contexts/AgentOrchestrationContext';
import { 
  Target, 
  BookOpen, 
  Users, 
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface Intent {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const intents: Intent[] = [
  {
    id: 'explore',
    label: 'Explore',
    description: 'Discover new sports, skills, and opportunities',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'train',
    label: 'Train',
    description: 'Improve my skills and physical performance',
    icon: <Target className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'learn',
    label: 'Learn',
    description: 'Study techniques, strategies, and sports knowledge',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'create',
    label: 'Create',
    description: 'Build teams, organize events, and lead communities',
    icon: <Users className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500'
  }
];

interface IntentTriggerProps {
  isOpen: boolean;
  onComplete: (intent: string) => void;
}

const IntentTrigger: React.FC<IntentTriggerProps> = ({ isOpen, onComplete }) => {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendRequest } = useAgentOrchestration();

  const handleIntentSelect = (intentId: string) => {
    setSelectedIntent(intentId);
  };

  const handleSubmit = async () => {
    if (!selectedIntent) return;
    
    setIsSubmitting(true);
    
    // Send intent to AI for contextual setup
    sendRequest({
      type: 'intent_declaration',
      context: selectedIntent,
      data: { intent: selectedIntent }
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    onComplete(selectedIntent);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Target className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                What's Your Mission Today?
              </h1>
              <p className="text-lg text-gray-600">
                Choose your intent to unlock a personalized, purpose-driven experience
              </p>
            </div>

            {/* Intent Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {intents.map((intent, index) => (
                <motion.button
                  key={intent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleIntentSelect(intent.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedIntent === intent.id
                      ? `border-transparent bg-gradient-to-r ${intent.color} text-white shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      selectedIntent === intent.id 
                        ? 'bg-white/20' 
                        : `bg-gradient-to-r ${intent.color} text-white`
                    }`}>
                      {intent.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{intent.label}</h3>
                      <p className={`text-sm ${
                        selectedIntent === intent.id ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        {intent.description}
                      </p>
                    </div>
                    {selectedIntent === intent.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <CheckCircle className="w-6 h-6" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={handleSubmit}
                disabled={!selectedIntent || isSubmitting}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                  selectedIntent && !isSubmitting
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting up your experience...
                  </div>
                ) : (
                  'Start My Journey'
                )}
              </motion.button>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6 pt-6 border-t border-gray-100"
            >
              <p className="text-sm text-gray-500">
                Your intent helps us create a focused, purposeful experience
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntentTrigger; 