import React, { useState } from 'react';

interface SafetyChecklist {
  id: string;
  title: string;
  items: {
    id: string;
    text: string;
    critical: boolean;
    category: 'pre_range' | 'on_range' | 'post_range';
  }[];
}

interface MaintenanceTutorial {
  id: string;
  title: string;
  description: string;
  steps: {
    step: number;
    title: string;
    description: string;
    tips: string[];
    warnings: string[];
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tools: string[];
}

interface RangeRule {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'conduct' | 'equipment' | 'procedures';
  importance: 'critical' | 'important' | 'standard';
}

export const RangeOfficerCoach: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'safety' | 'maintenance' | 'rules'>('safety');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const safetyChecklists: SafetyChecklist[] = [
    {
      id: 'pre_range',
      title: 'Pre-Range Safety Checklist',
      items: [
        {
          id: 'firearm_condition',
          text: 'Verify firearm is in good working condition',
          critical: true,
          category: 'pre_range'
        },
        {
          id: 'ammunition_check',
          text: 'Check ammunition for proper caliber and condition',
          critical: true,
          category: 'pre_range'
        },
        {
          id: 'eye_protection',
          text: 'Ensure eye protection meets ANSI Z87.1 standard',
          critical: true,
          category: 'pre_range'
        },
        {
          id: 'hearing_protection',
          text: 'Verify hearing protection provides NRR 25+ dB',
          critical: true,
          category: 'pre_range'
        },
        {
          id: 'range_bag',
          text: 'Pack range bag with essential items',
          critical: false,
          category: 'pre_range'
        },
        {
          id: 'targets',
          text: 'Prepare appropriate targets for practice',
          critical: false,
          category: 'pre_range'
        }
      ]
    },
    {
      id: 'on_range',
      title: 'On-Range Safety Checklist',
      items: [
        {
          id: 'range_rules',
          text: 'Review and follow all range rules',
          critical: true,
          category: 'on_range'
        },
        {
          id: 'muzzle_control',
          text: 'Keep muzzle pointed downrange at all times',
          critical: true,
          category: 'on_range'
        },
        {
          id: 'finger_off_trigger',
          text: 'Keep finger off trigger until ready to shoot',
          critical: true,
          category: 'on_range'
        },
        {
          id: 'target_verification',
          text: 'Verify target and what is beyond it',
          critical: true,
          category: 'on_range'
        },
        {
          id: 'communication',
          text: 'Communicate clearly with other shooters',
          critical: false,
          category: 'on_range'
        },
        {
          id: 'cease_fire',
          text: 'Immediately respond to cease fire commands',
          critical: true,
          category: 'on_range'
        }
      ]
    },
    {
      id: 'post_range',
      title: 'Post-Range Safety Checklist',
      items: [
        {
          id: 'firearm_clear',
          text: 'Verify firearm is completely unloaded',
          critical: true,
          category: 'post_range'
        },
        {
          id: 'case_firearm',
          text: 'Properly case firearm for transport',
          critical: true,
          category: 'post_range'
        },
        {
          id: 'clean_up',
          text: 'Clean up brass and targets',
          critical: false,
          category: 'post_range'
        },
        {
          id: 'report_issues',
          text: 'Report any safety concerns to range staff',
          critical: false,
          category: 'post_range'
        },
        {
          id: 'equipment_check',
          text: 'Check equipment for damage or wear',
          critical: false,
          category: 'post_range'
        }
      ]
    }
  ];

  const maintenanceTutorials: MaintenanceTutorial[] = [
    {
      id: 'basic_cleaning',
      title: 'Basic Handgun Cleaning',
      description: 'Essential cleaning procedure for maintaining firearm reliability',
      difficulty: 'beginner',
      estimatedTime: '15-30 minutes',
      tools: ['cleaning rod', 'bore brush', 'cleaning patches', 'gun oil', 'cleaning solvent'],
      steps: [
        {
          step: 1,
          title: 'Safety First',
          description: 'Ensure firearm is completely unloaded and safe',
          tips: ['Double-check chamber', 'Remove magazine', 'Work in well-ventilated area'],
          warnings: ['Never clean a loaded firearm', 'Keep ammunition away from cleaning area']
        },
        {
          step: 2,
          title: 'Field Strip',
          description: 'Disassemble firearm according to manufacturer instructions',
          tips: ['Follow manual exactly', 'Keep parts organized', 'Note part orientation'],
          warnings: ['Don\'t force parts', 'Stop if unsure about disassembly']
        },
        {
          step: 3,
          title: 'Clean Barrel',
          description: 'Clean barrel bore thoroughly',
          tips: ['Use appropriate caliber brush', 'Push patches through from chamber to muzzle', 'Clean until patches come out clean'],
          warnings: ['Don\'t use excessive force', 'Avoid damaging crown']
        },
        {
          step: 4,
          title: 'Clean Action',
          description: 'Clean action components',
          tips: ['Use appropriate tools', 'Remove carbon buildup', 'Clean all moving parts'],
          warnings: ['Don\'t over-lubricate', 'Avoid getting solvent in trigger mechanism']
        },
        {
          step: 5,
          title: 'Lubricate',
          description: 'Apply appropriate lubrication',
          tips: ['Use manufacturer-recommended oil', 'Apply sparingly', 'Focus on moving parts'],
          warnings: ['Don\'t over-lubricate', 'Avoid oil on grips or sights']
        },
        {
          step: 6,
          title: 'Reassemble',
          description: 'Reassemble firearm carefully',
          tips: ['Follow manual exactly', 'Test function', 'Verify safety operation'],
          warnings: ['Don\'t force parts', 'Test trigger and safety before loading']
        }
      ]
    },
    {
      id: 'detailed_cleaning',
      title: 'Detailed Handgun Maintenance',
      description: 'Comprehensive cleaning and maintenance for serious shooters',
      difficulty: 'intermediate',
      estimatedTime: '45-90 minutes',
      tools: ['all basic tools', 'ultrasonic cleaner', 'detail brushes', 'compressed air', 'lubricants'],
      steps: [
        {
          step: 1,
          title: 'Complete Disassembly',
          description: 'Fully disassemble firearm for deep cleaning',
          tips: ['Take photos during disassembly', 'Use proper tools', 'Keep small parts organized'],
          warnings: ['Don\'t attempt without proper knowledge', 'Some parts may require special tools']
        },
        {
          step: 2,
          title: 'Ultrasonic Cleaning',
          description: 'Use ultrasonic cleaner for deep cleaning',
          tips: ['Use appropriate cleaning solution', 'Follow manufacturer instructions', 'Rinse thoroughly'],
          warnings: ['Don\'t use on aluminum parts', 'Avoid getting solution in optics']
        },
        {
          step: 3,
          title: 'Inspect Parts',
          description: 'Carefully inspect all parts for wear or damage',
          tips: ['Use magnifying glass', 'Check for cracks or wear', 'Note any issues'],
          warnings: ['Replace damaged parts', 'Don\'t use damaged components']
        },
        {
          step: 4,
          title: 'Detail Clean',
          description: 'Clean hard-to-reach areas',
          tips: ['Use detail brushes', 'Clean extractor', 'Clean firing pin channel'],
          warnings: ['Be gentle with small parts', 'Don\'t damage springs']
        },
        {
          step: 5,
          title: 'Lubricate and Protect',
          description: 'Apply appropriate lubricants and protectants',
          tips: ['Use different lubricants for different areas', 'Apply protectant to exterior', 'Follow manufacturer recommendations'],
          warnings: ['Don\'t over-lubricate', 'Avoid incompatible products']
        }
      ]
    }
  ];

  const rangeRules: RangeRule[] = [
    {
      id: 'four_rules',
      title: 'The Four Rules of Gun Safety',
      description: 'The fundamental rules that must always be followed',
      category: 'safety',
      importance: 'critical'
    },
    {
      id: 'muzzle_control',
      title: 'Muzzle Control',
      description: 'Always keep the muzzle pointed in a safe direction',
      category: 'safety',
      importance: 'critical'
    },
    {
      id: 'finger_discipline',
      title: 'Finger Discipline',
      description: 'Keep your finger off the trigger until ready to shoot',
      category: 'safety',
      importance: 'critical'
    },
    {
      id: 'target_identification',
      title: 'Target Identification',
      description: 'Be sure of your target and what is beyond it',
      category: 'safety',
      importance: 'critical'
    },
    {
      id: 'range_commands',
      title: 'Range Commands',
      description: 'Immediately respond to all range commands',
      category: 'procedures',
      importance: 'critical'
    },
    {
      id: 'cease_fire',
      title: 'Cease Fire',
      description: 'Stop shooting immediately when cease fire is called',
      category: 'procedures',
      importance: 'critical'
    },
    {
      id: 'equipment_requirements',
      title: 'Equipment Requirements',
      description: 'Eye and hearing protection must be worn at all times',
      category: 'equipment',
      importance: 'important'
    },
    {
      id: 'firearm_handling',
      title: 'Firearm Handling',
      description: 'Handle firearms only when on the firing line',
      category: 'conduct',
      importance: 'important'
    },
    {
      id: 'ammunition_restrictions',
      title: 'Ammunition Restrictions',
      description: 'Use only approved ammunition types',
      category: 'equipment',
      importance: 'important'
    },
    {
      id: 'range_etiquette',
      title: 'Range Etiquette',
      description: 'Be respectful and courteous to other shooters',
      category: 'conduct',
      importance: 'standard'
    }
  ];

  const toggleChecklistItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600 font-bold';
      case 'important': return 'text-orange-600 font-semibold';
      case 'standard': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'conduct': return 'bg-blue-100 text-blue-800';
      case 'equipment': return 'bg-green-100 text-green-800';
      case 'procedures': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Range Officer Coach</h1>
        <p className="text-gray-600">Comprehensive guidance for safe and effective shooting</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'safety', label: 'Safety Checklists', icon: '🛡️' },
            { id: 'maintenance', label: 'Maintenance Tutorials', icon: '🔧' },
            { id: 'rules', label: 'Range Rules', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Safety Checklists Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Safety First</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Always prioritize safety. Complete all critical items before proceeding. These checklists are designed to prevent accidents and ensure a safe shooting experience.</p>
                </div>
              </div>
            </div>
          </div>

          {safetyChecklists.map((checklist) => (
            <div key={checklist.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{checklist.title}</h2>
              <div className="space-y-3">
                {checklist.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start p-3 rounded-lg border ${
                      completedItems.has(item.id)
                        ? 'bg-green-50 border-green-200'
                        : item.critical
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={completedItems.has(item.id)}
                      onChange={() => toggleChecklistItem(item.id)}
                      className={`mt-1 h-4 w-4 rounded ${
                        item.critical ? 'text-red-600 border-red-300' : 'text-blue-600 border-gray-300'
                      }`}
                    />
                    <div className="ml-3 flex-1">
                      <label className={`text-sm font-medium ${
                        completedItems.has(item.id) ? 'text-green-800 line-through' : 'text-gray-900'
                      }`}>
                        {item.text}
                        {item.critical && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Critical
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Tutorials Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {maintenanceTutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{tutorial.title}</h2>
                <p className="text-gray-600 mt-1">{tutorial.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Difficulty: {tutorial.difficulty}</span>
                  <span>Time: {tutorial.estimatedTime}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Required Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {tutorial.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {tutorial.steps.map((step) => (
                  <div key={step.step} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 mt-1">{step.description}</p>
                        
                        {step.tips.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-green-700 mb-1">Tips:</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {step.tips.map((tip, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {step.warnings.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-red-700 mb-1">Warnings:</h5>
                            <ul className="text-sm text-red-600 space-y-1">
                              {step.warnings.map((warning, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">⚠</span>
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Range Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Range Rules</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>These rules are designed to ensure safety and proper conduct at the range. Always follow the specific rules of your range facility.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {rangeRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-medium ${getImportanceColor(rule.importance)}`}>
                      {rule.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{rule.description}</p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(rule.category)}`}>
                      {rule.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 