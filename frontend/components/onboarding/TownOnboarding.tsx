import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from 'shadcn/ui/input';
import { Button } from 'shadcn/ui/button';

const steps = [
  'Town Info',
  'Admin Staff',
  'Leagues',
  'Facilities',
  'Registration',
];

const TownOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [townInfo, setTownInfo] = useState({ name: '', logo: '', zipCodes: '', website: '' });
  const stepRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepRef.current?.focus();
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Step ${step + 1}: ${steps[step]}`;
    }
  }, [step]);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="max-w-lg mx-auto p-2 sm:p-4">
      <nav aria-label="Onboarding steps" className="flex justify-between mb-6">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center px-1 py-2 rounded-lg transition-colors duration-200 ${i === step ? 'font-bold text-blue-700 bg-blue-100 dark:bg-blue-900' : 'text-gray-400'}`}
            aria-current={i === step ? 'step' : undefined}
          >
            {label}
          </div>
        ))}
      </nav>
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step1"
            ref={stepRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-lg mx-auto"
            aria-label="Step 1: Town Info"
            role="region"
          >
            <h2 className="text-xl font-bold mb-2">Step 1: Town Info</h2>
            <Input placeholder="Town Name" value={townInfo.name} onChange={e => setTownInfo({ ...townInfo, name: e.target.value })} className="focus:ring-2 focus:ring-blue-500" />
            <Input placeholder="Logo URL" value={townInfo.logo} onChange={e => setTownInfo({ ...townInfo, logo: e.target.value })} className="focus:ring-2 focus:ring-blue-500" />
            <Input placeholder="Zip Codes (comma separated)" value={townInfo.zipCodes} onChange={e => setTownInfo({ ...townInfo, zipCodes: e.target.value })} className="focus:ring-2 focus:ring-blue-500" />
            <Input placeholder="Website URL" value={townInfo.website} onChange={e => setTownInfo({ ...townInfo, website: e.target.value })} className="focus:ring-2 focus:ring-blue-500" />
            <Button onClick={next} className="w-full mt-4">Next</Button>
          </motion.div>
        )}
        {/* Steps 2-5 would be similar, with forms for each */}
        {step === steps.length - 1 && (
          <motion.div
            key="preview"
            ref={stepRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-lg mx-auto"
            aria-label="White-label Preview"
            role="region"
          >
            <h2 className="text-xl font-bold mb-2">White-label Preview</h2>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 flex flex-col items-center">
              <img src={townInfo.logo} alt="Logo" className="h-12 mb-2 rounded-full border border-gray-200 dark:border-gray-700" />
              <div className="font-bold text-lg">{townInfo.name}</div>
              <div className="text-sm text-gray-500">{townInfo.website}</div>
            </div>
            <Button onClick={prev} className="w-full">Back</Button>
            <Button variant="success" className="w-full">Finish & Save</Button>
          </motion.div>
        )}
      </AnimatePresence>
      {step > 0 && step < steps.length - 1 && <Button onClick={prev} className="mt-4 w-full">Back</Button>}
    </div>
  );
};

export default TownOnboarding; 