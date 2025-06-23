import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Image, 
  DollarSign, 
  Hash,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Wallet,
  Sparkles
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import { ethers } from 'ethers';

interface MintFormData {
  name: string;
  description: string;
  price: string;
  supply: string;
  category: string;
  metadata_uri: string;
  image_file?: File;
}

interface MintingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

const MINTING_STEPS: Omit<MintingStep, 'status' | 'error'>[] = [
  {
    id: 'connect',
    title: 'Connect Wallet',
    description: 'Ensure your wallet is connected and ready'
  },
  {
    id: 'upload',
    title: 'Upload Metadata',
    description: 'Upload NFT image and metadata to IPFS'
  },
  {
    id: 'sign',
    title: 'Sign Message',
    description: 'Sign the minting request with your wallet'
  },
  {
    id: 'mint',
    title: 'Mint NFT',
    description: 'Mint NFT on the blockchain'
  },
  {
    id: 'list',
    title: 'List for Sale',
    description: 'Create marketplace listing'
  }
];

export const CreatorMintPanel: React.FC = () => {
  const { address, isConnected, signMessage } = useWallet();
  const [formData, setFormData] = useState<MintFormData>({
    name: '',
    description: '',
    price: '',
    supply: '',
    category: 'sports',
    metadata_uri: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [mintingSteps, setMintingSteps] = useState<MintingStep[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);

  const updateStep = (stepId: string, status: MintingStep['status'], error?: string) => {
    setMintingSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status, error }
          : step
      )
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image_file: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Simulate IPFS upload (replace with actual IPFS service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('NFT name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required');
    if (!formData.supply || parseInt(formData.supply) <= 0) errors.push('Valid supply is required');
    if (!formData.image_file && !formData.metadata_uri) errors.push('Image or metadata URI is required');
    
    return errors;
  };

  const handleMint = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }

    setIsMinting(true);
    setMintResult(null);
    
    // Initialize steps
    setMintingSteps(MINTING_STEPS.map(step => ({ ...step, status: 'pending' as const })));

    try {
      // Step 1: Check wallet connection
      updateStep('connect', 'loading');
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      updateStep('connect', 'success');

      // Step 2: Upload metadata
      updateStep('upload', 'loading');
      let metadataUri = formData.metadata_uri;
      
      if (formData.image_file) {
        const imageUri = await uploadToIPFS(formData.image_file);
        metadataUri = imageUri;
      }

      const metadata = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        image_uri: metadataUri,
        creator: address,
        created_at: new Date().toISOString()
      };

      // Upload metadata to IPFS (simulated)
      const metadataUriFinal = await uploadToIPFS(new Blob([JSON.stringify(metadata)]));
      updateStep('upload', 'success');

      // Step 3: Sign message
      updateStep('sign', 'loading');
      const priceWei = ethers.utils.parseEther(formData.price);
      const message = `Create NFT Listing: ${formData.name} - Supply: ${formData.supply} - Price: ${priceWei} wei`;
      
      const signature = await signMessage(message);
      updateStep('sign', 'success');

      // Step 4: Submit to backend
      updateStep('mint', 'loading');
      const response = await api.post('/api/nft/list', {
        name: formData.name,
        description: formData.description,
        supply: parseInt(formData.supply),
        price: priceWei.toString(),
        creator_wallet: address,
        signature: signature,
        metadata_uri: metadataUriFinal,
        category: formData.category
      });
      updateStep('mint', 'success');

      // Step 5: List for sale
      updateStep('list', 'loading');
      // The backend handles listing automatically
      updateStep('list', 'success');

      setMintResult(response.data);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        supply: '',
        category: 'sports',
        metadata_uri: ''
      });
      setImagePreview('');

    } catch (error) {
      console.error('Minting failed:', error);
      const currentStep = mintingSteps.find(step => step.status === 'loading');
      if (currentStep) {
        updateStep(currentStep.id, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsMinting(false);
    }
  };

  const getStepIcon = (step: MintingStep) => {
    switch (step.status) {
      case 'pending':
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
      case 'loading':
        return <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create & Mint NFT</h1>
        <p className="text-gray-600">Upload your content and mint it as an NFT on SportBeaconAI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mint Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              NFT Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">NFT Name *</label>
              <Input
                placeholder="Enter NFT name..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isMinting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Describe your NFT..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                disabled={isMinting}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isMinting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectContent>
                <SelectContent>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price and Supply */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (ETH) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    min="0"
                    className="pl-10"
                    disabled={isMinting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supply *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="1"
                    value={formData.supply}
                    onChange={(e) => setFormData(prev => ({ ...prev, supply: e.target.value }))}
                    min="1"
                    className="pl-10"
                    disabled={isMinting}
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">NFT Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isMinting}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 mx-auto object-cover rounded-lg"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Metadata URI (Alternative) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Metadata URI (Alternative)</label>
              <Input
                placeholder="ipfs:// or https://..."
                value={formData.metadata_uri}
                onChange={(e) => setFormData(prev => ({ ...prev, metadata_uri: e.target.value }))}
                disabled={isMinting}
              />
              <p className="text-xs text-gray-500">
                Use this if you have metadata already uploaded to IPFS
              </p>
            </div>

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isMinting || !isConnected}
              className="w-full"
              size="lg"
            >
              {isMinting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isMinting ? 'Minting...' : (isConnected ? 'Mint NFT' : 'Connect Wallet')}
            </Button>

            {!isConnected && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Wallet className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                <p className="text-sm text-yellow-800">Connect your wallet to mint NFTs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minting Progress */}
        <div className="space-y-6">
          {/* Progress Steps */}
          {mintingSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Minting Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mintingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      {getStepIcon(step)}
                      <div className="flex-1">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.error && (
                          <p className="text-sm text-red-600 mt-1">{step.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mint Result */}
          {mintResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  NFT Minted Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Listing ID:</span>
                    <span className="font-mono text-sm">{mintResult.listing_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Token ID:</span>
                    <span className="font-mono text-sm">{mintResult.token_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-mono text-sm">{ethers.utils.formatEther(mintResult.price_wei)} ETH</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`https://mumbai.polygonscan.com/tx/${mintResult.mint_tx_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Mint Transaction
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`https://mumbai.polygonscan.com/tx/${mintResult.listing_tx_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Listing Transaction
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Ensure your wallet has enough ETH for gas fees
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  High-quality images (PNG/JPG) work best for NFTs
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Set a competitive price to attract buyers
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Your NFT will be immediately listed on the marketplace
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 