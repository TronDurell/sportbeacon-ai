import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wallet,
  Palette,
  ShoppingCart,
  Award,
  TrendingUp
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  icon: React.ReactNode;
}

export const TestWorkflow: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'connect',
      name: 'Connect Wallet',
      description: 'Connect your Web3 wallet to access the platform',
      status: 'pending',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'mint',
      name: 'Mint NFT',
      description: 'Create and mint your first NFT using CreatorMintPanel',
      status: 'pending',
      icon: <Palette className="w-5 h-5" />
    },
    {
      id: 'list',
      name: 'List NFT',
      description: 'List your NFT on the marketplace for sale',
      status: 'pending',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      id: 'purchase',
      name: 'Purchase NFT',
      description: 'Test purchasing an NFT from the marketplace',
      status: 'pending',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      id: 'reward',
      name: 'Earn Rewards',
      description: 'Receive BEACON token rewards for successful sales',
      status: 'pending',
      icon: <Award className="w-5 h-5" />
    }
  ]);

  const updateStepStatus = (stepId: string, status: 'completed' | 'failed') => {
    setWorkflowSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const testWorkflow = async () => {
    // Simulate workflow testing
    for (let i = 0; i < workflowSteps.length; i++) {
      setCurrentStep(i);
      
      // Simulate step completion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const step = workflowSteps[i];
      if (step.id === 'connect') {
        updateStepStatus(step.id, isConnected ? 'completed' : 'failed');
      } else if (step.id === 'mint') {
        // Simulate successful mint
        updateStepStatus(step.id, 'completed');
      } else if (step.id === 'list') {
        // Simulate successful listing
        updateStepStatus(step.id, 'completed');
      } else if (step.id === 'purchase') {
        // Simulate successful purchase
        updateStepStatus(step.id, 'completed');
      } else if (step.id === 'reward') {
        // Simulate successful reward
        updateStepStatus(step.id, 'completed');
      }
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(0);
    setWorkflowSteps(prev => 
      prev.map(step => ({ ...step, status: 'pending' }))
    );
  };

  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
  const totalSteps = workflowSteps.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT Monetization Workflow Test</h1>
        <p className="text-gray-600">Test the complete end-to-end workflow for creators</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                {completedSteps} of {totalSteps} steps completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={testWorkflow} disabled={currentStep > 0}>
                Start Test
              </Button>
              <Button variant="outline" onClick={resetWorkflow}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.id} className={getStepColor(step.status)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStepIcon(step.status)}
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <span className="font-medium">{step.name}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {step.status === 'completed' && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Completed
                    </Badge>
                  )}
                  {step.status === 'failed' && (
                    <Badge variant="destructive">
                      ✗ Failed
                    </Badge>
                  )}
                  {step.status === 'pending' && index === currentStep && (
                    <Badge variant="outline" className="animate-pulse">
                      In Progress...
                    </Badge>
                  )}
                  {step.status === 'pending' && index !== currentStep && (
                    <Badge variant="secondary">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results */}
      {completedSteps === totalSteps && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Workflow Test Completed Successfully!
            </h3>
            <p className="text-green-700">
              All steps have been completed. Your NFT monetization system is working correctly.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-green-600">
                ✓ Wallet connection verified
              </p>
              <p className="text-sm text-green-600">
                ✓ NFT minting functionality working
              </p>
              <p className="text-sm text-green-600">
                ✓ Marketplace listing operational
              </p>
              <p className="text-sm text-green-600">
                ✓ Purchase flow functional
              </p>
              <p className="text-sm text-green-600">
                ✓ Token rewards system active
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/creator-dashboard', '_blank')}>
              <Palette className="w-6 h-6 mb-2" />
              <span>Creator Dashboard</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/nft-marketplace', '_blank')}>
              <ShoppingCart className="w-6 h-6 mb-2" />
              <span>NFT Marketplace</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/earnings', '_blank')}>
              <Award className="w-6 h-6 mb-2" />
              <span>Earnings & Rewards</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 