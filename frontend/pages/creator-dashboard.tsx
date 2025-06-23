import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { CreatorDashboard } from '@/components/CreatorDashboard';
import { WalletConnectButton } from '@/components/web3/WalletConnectButton';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowLeft, 
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const CreatorDashboardPage: NextPage = () => {
  const { isConnected, address } = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for wallet connection check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Creator Dashboard</h2>
          <p className="text-gray-600">Initializing your creator workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Creator Dashboard - SportBeaconAI</title>
        <meta name="description" content="Manage your NFTs, earnings, and analytics on SportBeaconAI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
                  <p className="text-sm text-gray-600">SportBeaconAI NFT Monetization Platform</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {isConnected && address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                  </div>
                )}
                <WalletConnectButton />
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {!isConnected ? (
            <div className="max-w-2xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-12 pb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Creator Dashboard</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Connect your wallet to access your NFT collection, earnings, and creator analytics.
                  </p>
                  
                  <div className="space-y-4">
                    <WalletConnectButton size="lg" />
                    
                    <div className="text-sm text-gray-500">
                      <p>Don't have a wallet? </p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">
                        Learn how to get started
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Preview */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">NFT Management</h3>
                    <p className="text-sm text-gray-600">
                      Mint, manage, and track your NFT collection with real-time blockchain data.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Marketplace</h3>
                    <p className="text-sm text-gray-600">
                      List your NFTs for sale and earn from secondary market transactions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Track your earnings, engagement, and performance with detailed analytics.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <CreatorDashboard />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">© 2024 SportBeaconAI. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CreatorDashboardPage; 