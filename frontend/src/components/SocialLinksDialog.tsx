import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Instagram, Facebook, Twitter, Linkedin, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import type { Platform } from '../App';

interface SocialLinksDialogProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
  onConnectionsUpdate: (connections: Record<string, boolean>) => void;
}

interface SocialAccount {
  platform: Platform;
  name: string;
  icon: any;
  color: string;
  isConnected: boolean;
  accessToken?: string;
}

export function SocialLinksDialog({ open, onClose, accessToken, onConnectionsUpdate }: SocialLinksDialogProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { platform: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 via-pink-500 to-orange-500', isConnected: false },
    { platform: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700', isConnected: false },
    { platform: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'from-slate-800 to-slate-900', isConnected: false },
    { platform: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-800', isConnected: false },
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadConnections();
    }
  }, [open]);

  const loadConnections = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/social/connections`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load connections');

      const data = await response.json();
      
      setAccounts(prev => prev.map(account => ({
        ...account,
        isConnected: data.connections[account.platform] || false,
      })));

      // Update parent component
      const connectionMap = data.connections;
      onConnectionsUpdate(connectionMap);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !tokenInput) return;

    setIsLoading(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/social/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          accessToken: tokenInput,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect account');

      setAccounts(prev => prev.map(account =>
        account.platform === selectedPlatform
          ? { ...account, isConnected: true }
          : account
      ));

      setSelectedPlatform(null);
      setTokenInput('');
      alert(`${selectedPlatform} connected successfully!`);
      loadConnections(); // Refresh connections
    } catch (error) {
      console.error('Error connecting account:', error);
      alert('Failed to connect account. Please check your access token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/social/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) throw new Error('Failed to disconnect account');

      setAccounts(prev => prev.map(account =>
        account.platform === platform
          ? { ...account, isConnected: false }
          : account
      ));

      loadConnections(); // Refresh connections
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Failed to disconnect account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <LinkIcon className="w-6 h-6" />
            Social Media Accounts
          </DialogTitle>
          <DialogDescription>
            Connect your social media accounts to upload posts directly from your catalog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {accounts.map((account) => {
            const Icon = account.icon;
            const isSelected = selectedPlatform === account.platform;

            return (
              <div
                key={account.platform}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${account.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{account.name}</h3>
                      <p className="text-sm text-slate-500">
                        {account.isConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  {account.isConnected ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Connected</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(account.platform)}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedPlatform(account.platform)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Connect
                    </Button>
                  )}
                </div>

                {/* Connection Form */}
                {isSelected && !account.isConnected && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        placeholder={`Enter your ${account.name} access token`}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        type="password"
                      />
                      <p className="text-xs text-slate-500">
                        Get your access token from {account.name}'s developer portal
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConnect}
                        disabled={!tokenInput || isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Confirm Connection'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPlatform(null);
                          setTokenInput('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> This is a prototype. In production, use OAuth 2.0 for secure authentication. 
            Never share your access tokens publicly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
