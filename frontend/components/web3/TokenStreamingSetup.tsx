import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  Wallet, 
  Clock, 
  TrendingUp, 
  Pause, 
  Play,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';

interface StreamConfig {
  enabled: boolean;
  amount: string;
  duration: number; // in days
  frequency: 'hourly' | 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;
}

interface StreamStatus {
  status: 'idle' | 'setting_up' | 'active' | 'paused' | 'completed' | 'error';
  message: string;
  txHash?: string;
  error?: string;
  streamId?: string;
}

interface StreamMetrics {
  totalStreamed: string;
  remainingAmount: string;
  nextPayout: Date;
  payoutAmount: string;
  progress: number;
}

export const TokenStreamingSetup: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    enabled: false,
    amount: '100',
    duration: 30,
    frequency: 'daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    status: 'idle',
    message: 'Streaming is disabled'
  });
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate end date when duration changes
  useEffect(() => {
    const endDate = new Date(streamConfig.startDate);
    endDate.setDate(endDate.getDate() + streamConfig.duration);
    setStreamConfig(prev => ({ ...prev, endDate }));
  }, [streamConfig.duration, streamConfig.startDate]);

  // Simulate stream metrics when streaming is active
  useEffect(() => {
    if (streamStatus.status === 'active' && streamConfig.enabled) {
      const interval = setInterval(() => {
        updateStreamMetrics();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [streamStatus.status, streamConfig.enabled]);

  const updateStreamMetrics = () => {
    if (!streamConfig.enabled) return;

    const now = new Date();
    const start = streamConfig.startDate;
    const end = streamConfig.endDate;
    const total = parseFloat(streamConfig.amount);
    
    const elapsed = Math.min((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()), 1);
    const totalStreamed = total * elapsed;
    const remaining = total - totalStreamed;
    
    // Calculate next payout based on frequency
    let nextPayout = new Date();
    switch (streamConfig.frequency) {
      case 'hourly':
        nextPayout.setHours(nextPayout.getHours() + 1);
        break;
      case 'daily':
        nextPayout.setDate(nextPayout.getDate() + 1);
        break;
      case 'weekly':
        nextPayout.setDate(nextPayout.getDate() + 7);
        break;
    }

    setStreamMetrics({
      totalStreamed: totalStreamed.toFixed(2),
      remainingAmount: remaining.toFixed(2),
      nextPayout,
      payoutAmount: (total / (streamConfig.duration * (streamConfig.frequency === 'hourly' ? 24 : streamConfig.frequency === 'daily' ? 1 : 1/7)))).toFixed(2),
      progress: elapsed * 100
    });
  };

  const setupStreaming = async () => {
    if (!address || !isConnected) return;

    try {
      setLoading(true);
      setStreamStatus({
        status: 'setting_up',
        message: 'Setting up token streaming...'
      });

      // Simulate streaming setup (in real implementation, this would interact with Superfluid/Sablier)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const streamId = 'stream_' + Math.random().toString(16).substr(2, 8);

      setStreamStatus({
        status: 'active',
        message: 'Token streaming is now active',
        txHash: mockTxHash,
        streamId
      });

      // Initialize stream metrics
      updateStreamMetrics();

    } catch (error) {
      setStreamStatus({
        status: 'error',
        message: 'Failed to setup streaming',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const pauseStreaming = async () => {
    setStreamStatus({
      status: 'paused',
      message: 'Streaming is paused'
    });
  };

  const resumeStreaming = async () => {
    setStreamStatus({
      status: 'active',
      message: 'Streaming resumed'
    });
  };

  const stopStreaming = async () => {
    setStreamStatus({
      status: 'completed',
      message: 'Streaming completed'
    });
    setStreamConfig(prev => ({ ...prev, enabled: false }));
  };

  const getStatusIcon = () => {
    switch (streamStatus.status) {
      case 'setting_up':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'active':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (streamStatus.status) {
      case 'active':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      case 'completed':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'setting_up':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return web3Service.getExplorerUrl(txHash);
  };

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'hourly':
        return 'Hourly';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      default:
        return freq;
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Token Streaming Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Connect your wallet to setup token streaming</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Streaming Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Token Streaming Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Stream My Rewards</Label>
              <p className="text-sm text-gray-600">
                Automatically stream your BEACON rewards over time
              </p>
            </div>
            <Switch
              checked={streamConfig.enabled}
              onCheckedChange={(checked) => {
                setStreamConfig(prev => ({ ...prev, enabled: checked }));
                if (!checked) {
                  setStreamStatus({
                    status: 'idle',
                    message: 'Streaming is disabled'
                  });
                }
              }}
              disabled={loading || streamStatus.status === 'setting_up'}
            />
          </div>

          {/* Streaming Configuration */}
          {streamConfig.enabled && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (BEACON)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={streamConfig.amount}
                    onChange={(e) => setStreamConfig(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="100"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={streamConfig.duration}
                    onChange={(e) => setStreamConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Payout Frequency</Label>
                <select
                  id="frequency"
                  value={streamConfig.frequency}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={streamConfig.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setStreamConfig(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={streamConfig.endDate.toISOString().split('T')[0]}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-white rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Payouts:</span>
                      <div className="font-medium">
                        {streamConfig.duration * (streamConfig.frequency === 'hourly' ? 24 : streamConfig.frequency === 'daily' ? 1 : 1/7)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Per Payout:</span>
                      <div className="font-medium">
                        {(parseFloat(streamConfig.amount) / (streamConfig.duration * (streamConfig.frequency === 'hourly' ? 24 : streamConfig.frequency === 'daily' ? 1 : 1/7)))).toFixed(2)} BEACON
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Stream Duration:</span>
                      <div className="font-medium">{streamConfig.duration} days</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {streamConfig.enabled && (
            <div className="flex items-center gap-3">
              {streamStatus.status === 'idle' && (
                <Button
                  onClick={setupStreaming}
                  disabled={loading || !streamConfig.enabled}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Setup Streaming
                </Button>
              )}

              {streamStatus.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    onClick={pauseStreaming}
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={stopStreaming}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {streamStatus.status === 'paused' && (
                <>
                  <Button
                    onClick={resumeStreaming}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={stopStreaming}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Status Message */}
          <div className={`text-sm ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-2">{streamStatus.message}</span>
          </div>

          {/* Success Details */}
          {streamStatus.status === 'active' && streamStatus.txHash && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      Streaming Active - {streamConfig.amount} BEACON
                    </p>
                    <p className="text-sm text-green-600">
                      Stream ID: {streamStatus.streamId}
                    </p>
                    <p className="text-sm text-green-600">
                      TX: {web3Service.formatAddress(streamStatus.txHash)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getBlockExplorerUrl(streamStatus.txHash!), '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {streamStatus.status === 'error' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {streamStatus.error || 'An error occurred while setting up streaming'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Streaming Metrics */}
      {streamStatus.status === 'active' && streamMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Streaming Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Stream Progress</span>
                <span>{streamMetrics.progress.toFixed(1)}%</span>
              </div>
              <Progress value={streamMetrics.progress} className="h-3" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">Total Streamed</div>
                <div className="font-bold text-lg">{streamMetrics.totalStreamed} BEACON</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Remaining</div>
                <div className="font-bold text-lg">{streamMetrics.remainingAmount} BEACON</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600">Next Payout</div>
                <div className="font-bold text-lg">{streamMetrics.payoutAmount} BEACON</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600">Due Date</div>
                <div className="font-bold text-lg">
                  {streamMetrics.nextPayout.toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Frequency Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                Payouts every {formatFrequency(streamConfig.frequency).toLowerCase()} • 
                {streamConfig.frequency === 'hourly' ? ' 24x daily' : 
                 streamConfig.frequency === 'daily' ? ' 1x daily' : ' 1x weekly'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 