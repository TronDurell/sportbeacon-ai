import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from 'shadcn/ui/input';
import { Button } from 'shadcn/ui/button';

const steps = [
  'School Info',
  'Role Selection',
  'Teams',
  'SIS Sync',
  'Review',
];

const SchoolOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [schoolInfo, setSchoolInfo] = useState({ name: '', district: '', contact: '' });
  // ...other state for each step

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="max-w-lg mx-auto p-2 sm:p-4" role="region" aria-label="School onboarding" tabIndex={0}>
      <div className="flex justify-between mb-4">
        {steps.map((label, i) => (
          <div key={label} className={`flex-1 text-center ${i === step ? 'font-bold text-blue-600' : 'text-gray-400'}`}>{label}</div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
            <h2 className="text-xl font-bold">Step 1: School Info</h2>
            <Input placeholder="School Name" value={schoolInfo.name} onChange={e => setSchoolInfo({ ...schoolInfo, name: e.target.value })} />
            <Input placeholder="District" value={schoolInfo.district} onChange={e => setSchoolInfo({ ...schoolInfo, district: e.target.value })} />
            <Input placeholder="Contact Person" value={schoolInfo.contact} onChange={e => setSchoolInfo({ ...schoolInfo, contact: e.target.value })} />
            <Button onClick={next} className="w-full">Next</Button>
          </motion.div>
        )}
        {/* Steps 2-5 would be similar, with forms for each */}
        {step === steps.length - 1 && (
          <motion.div key="review" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
            <h2 className="text-xl font-bold">Review & Finish</h2>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900">
              <div className="font-bold text-lg">{schoolInfo.name}</div>
              <div className="text-sm text-gray-500">{schoolInfo.district}</div>
              <div className="text-sm text-gray-500">Contact: {schoolInfo.contact}</div>
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

export default SchoolOnboarding; 