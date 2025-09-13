import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, MapPin, Users, Brain } from "lucide-react";

interface ScrollInterventionAction {
  label: string;
  aiPrompt: string;
  variant: "primary" | "secondary" | "ghost";
}

interface ScrollInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: {
    id: string;
    title: string;
    message: string;
    actions: ScrollInterventionAction[];
  };
  onAction: (action: ScrollInterventionAction) => void;
  scrollTime: number;
}

const motivationalQuotes = [
  "The difference between try and triumph is just a little umph!",
  "Champions are made in the moments when no one is watching.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The only bad workout is the one that didn't happen.",
  "Success isn't always about greatness. It's about consistency.",
  "Every expert was once a beginner. Keep going.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don't wish for it. Work for it.",
  "Your future self is watching you right now through memories.",
  "Make yourself proud."
];

const ScrollInterventionModal: React.FC<ScrollInterventionModalProps> = ({
  isOpen,
  onClose,
  intervention,
  onAction,
  scrollTime
}) => {
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  const scrollMinutes = Math.floor(scrollTime / 60000);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {intervention.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {intervention.message}
              </p>
              
              {/* Scroll Time Indicator */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  You've been browsing for <span className="font-semibold text-blue-600">{scrollMinutes} minutes</span>
                </p>
              </div>
            </div>

            {/* Motivational Quote */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500"
            >
              <p className="text-sm text-gray-700 italic text-center">
                "{randomQuote}"
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {intervention.actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => {
                    onAction(action);
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                    action.variant === "primary"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
                      : action.variant === "secondary"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {action.label === "Start a Drill" && <Target className="w-4 h-4" />}
                    {action.label === "Find Nearby Gym" && <MapPin className="w-4 h-4" />}
                    {action.label === "Find Teammates" && <Users className="w-4 h-4" />}
                    {action.label === "What did I learn?" && <Brain className="w-4 h-4" />}
                    {action.label}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6 pt-4 border-t border-gray-100"
            >
              <p className="text-xs text-gray-500">
                SportBeacon AI is here to help you stay focused on your goals
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollInterventionModal; 