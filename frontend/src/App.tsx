import { useState, useEffect } from 'react';
import { AuthDialog } from './components/AuthDialog';
import { UserMenu } from './components/UserMenu';
import { CatalogDialog } from './components/CatalogDialog';
import { SocialLinksDialog } from './components/SocialLinksDialog';
import { SocialPreview } from './components/SocialPreviews';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { 
  LogIn, Zap, ImagePlus, Sparkles, Type, Hash, Upload, Info, 
  ArrowDown, Check, Instagram, Facebook, Twitter, Linkedin, 
  Plus, X, Download, Save 
} from 'lucide-react';

export type CreationMethod = 'ai-generated' | 'upload-enhance' | null;
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | null;

export interface PostData {
  creationMethod: CreationMethod;
  description?: string;
  uploadedImage?: File;
  imageEditDescription?: string;
  selectedOutput?: number;
  platform?: Platform;
  hashtags: string[];
  caption?: string;
  companyName?: string;
  companyPhone?: string;
}

const platforms = [
  { id: 'instagram' as Platform, name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' },
  { id: 'facebook' as Platform, name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'twitter' as Platform, name: 'Twitter/X', icon: Twitter, color: 'bg-slate-900' },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
];

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
];

export default function App() {
  const [postData, setPostData] = useState<PostData>({
    creationMethod: null,
    hashtags: [],
  });

  const [user, setUser] = useState<{ email: string; name: string; accessToken: string } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCatalogDialog, setShowCatalogDialog] = useState(false);
  const [showSocialLinksDialog, setShowSocialLinksDialog] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({});

  // Input step state
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageEditDescription, setImageEditDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Platform/hashtag step state
  const [hashtagInput, setHashtagInput] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('marketai_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const updatePostData = (data: Partial<PostData>) => {
    setPostData((prev) => ({ ...prev, ...data }));
  };

  const resetFlow = () => {
    setPostData({ creationMethod: null, hashtags: [] });
    setDescription('');
    setCompanyName('');
    setCompanyPhone('');
    setUploadedImage(null);
    setImageEditDescription('');
    setHashtagInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (userData: { email: string; name: string; accessToken: string }) => {
    setUser(userData);
    localStorage.setItem('marketai_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('marketai_user');
    alert('Logged out successfully');
  };

  const handleSavePost = async () => {
    if (!user) {
      alert('Please login to save posts to your catalog');
      setShowAuthDialog(true);
      return;
    }

    try {
      const imageUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500';
      const { projectId } = await import('./utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/catalog/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          platform: postData.platform,
          caption: postData.caption || '',
          hashtags: postData.hashtags,
          imageUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to save post');
      alert('Post saved to catalog!');
      resetFlow();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    }
  };

  // Auto-update postData when input changes
  useEffect(() => {
    if (postData.creationMethod === 'ai-generated') {
      updatePostData({ description, companyName, companyPhone });
    } else {
      updatePostData({ uploadedImage, imageEditDescription });
    }
  }, [description, companyName, companyPhone, uploadedImage, imageEditDescription]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setUploadedImage(e.dataTransfer.files[0]);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim();
    if (tag && !postData.hashtags.includes(tag)) {
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      updatePostData({ hashtags: [...postData.hashtags, formattedTag] });
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    updatePostData({ hashtags: postData.hashtags.filter((h) => h !== tag) });
  };

  const generateAIHashtags = () => {
    const aiHashtags = ['#Marketing', '#SocialMedia', '#Business', '#Sale', '#NewPost', '#DigitalMarketing'];
    const newTags = aiHashtags.filter((tag) => !postData.hashtags.includes(tag));
    updatePostData({ hashtags: [...postData.hashtags, ...newTags.slice(0, 3)] });
  };

  const outputs = postData.creationMethod === 'ai-generated'
    ? gradients.map((gradient, i) => ({
        gradient,
        companyName: postData.companyName || 'Your Business',
        companyPhone: postData.companyPhone || '',
        mainText: postData.description || 'Your amazing offer',
        bottomText: ['Limited Time!', "Don't Miss Out!", 'Shop Now!'][i],
      }))
    : gradients.map((gradient, i) => ({
        gradient,
        mainText: postData.imageEditDescription ? ['Enhanced Version', 'Styled Version', 'Premium Version'][i] : 'Enhanced Image',
      }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-300 px-6 py-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-4xl tracking-tight" style={{
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>MarketAI</h1>
          <p className="text-slate-600 text-lg tracking-wide">Social Media Post Creator</p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu
              user={user}
              onLogout={handleLogout}
              onOpenCatalog={() => setShowCatalogDialog(true)}
              onOpenSocialLinks={() => setShowSocialLinksDialog(true)}
            />
          ) : (
            <Button onClick={() => setShowAuthDialog(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <LogIn className="w-4 h-4" />
              Login / Register
            </Button>
          )}
          <button onClick={resetFlow} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Reset
          </button>
        </div>
      </header>

      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} onAuthSuccess={handleAuthSuccess} />
      {user && <CatalogDialog open={showCatalogDialog} onClose={() => setShowCatalogDialog(false)} accessToken={user.accessToken} connectedAccounts={connectedAccounts} />}
      {user && <SocialLinksDialog open={showSocialLinksDialog} onClose={() => setShowSocialLinksDialog(false)} accessToken={user.accessToken} onConnectionsUpdate={setConnectedAccounts} />}

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Step 1: Creation Method */}
        <section id="creation-method" className="scroll-mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">Step 1</div>
            <h2 className="text-slate-900 mb-2">Choose Your Creation Method</h2>
            <p className="text-slate-600">Select how you'd like to create your social media post</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                postData.creationMethod === 'ai-generated' ? 'border-purple-500 ring-4 ring-purple-200' : 'border-transparent hover:border-purple-500'
              }`}
              onClick={() => {
                updatePostData({ creationMethod: 'ai-generated' });
                setTimeout(() => document.getElementById('input')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-center text-slate-900 mb-3">AI-Generated Content</h3>
              <p className="text-center text-slate-600 mb-6">Create complete posts with AI-generated images and content from just a text description</p>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3 text-slate-600">
                  <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-500" />
                  <span className="text-sm">AI creates custom visuals</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <Type className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-500" />
                  <span className="text-sm">Generates engaging copy</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <Hash className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-500" />
                  <span className="text-sm">Smart hashtag suggestions</span>
                </div>
              </div>
              <button className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-center">
                {postData.creationMethod === 'ai-generated' ? 'Selected' : 'Start Creating'}
              </button>
            </div>

            <div
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                postData.creationMethod === 'upload-enhance' ? 'border-emerald-500 ring-4 ring-emerald-200' : 'border-transparent hover:border-emerald-500'
              }`}
              onClick={() => {
                updatePostData({ creationMethod: 'upload-enhance' });
                setTimeout(() => document.getElementById('input')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-center text-slate-900 mb-3">Upload & Enhance</h3>
              <p className="text-center text-slate-600 mb-6">Upload your own image and enhance it with AI-powered styling and text overlays</p>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3 text-slate-600">
                  <ImagePlus className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span className="text-sm">Upload any image</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span className="text-sm">AI-enhanced styling</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <Type className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span className="text-sm">Smart text overlays</span>
                </div>
              </div>
              <button className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-center">
                {postData.creationMethod === 'upload-enhance' ? 'Selected' : 'Upload Image'}
              </button>
            </div>
          </div>
        </section>

        {/* Step 2: Input */}
        {postData.creationMethod && (
          <section id="input" className="scroll-mt-24 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">Step 2</div>
                <h2 className="text-slate-900 mb-2">
                  {postData.creationMethod === 'ai-generated' ? 'Describe Your Post' : 'Upload & Enhance Your Image'}
                </h2>
                <p className="text-slate-600">
                  {postData.creationMethod === 'ai-generated'
                    ? 'Provide a simple description and company details. The AI will create a colorful post with banners for your information.'
                    : 'Upload your image and describe how you would like it enhanced with AI'}
                </p>
              </div>

              {postData.creationMethod === 'ai-generated' ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="description">Post Description</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Spring sale announcement, 20% off all items this weekend"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="Your Business Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Company Phone Number</Label>
                    <Input id="companyPhone" placeholder="(555) 123-4567" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="mt-2" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900">Simple AI Enhancement Process</p>
                      <p className="text-sm text-blue-700 mt-1">Upload your image, describe the changes you want, and our AI will enhance it with professional styling, filters, and text overlays.</p>
                    </div>
                  </div>
                  <div>
                    <Label>Upload Image</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                        dragActive ? 'border-emerald-500 bg-emerald-50' : uploadedImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && setUploadedImage(e.target.files[0])}
                      />
                      <Upload className={`w-12 h-12 mx-auto mb-4 ${uploadedImage ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {uploadedImage ? (
                        <div>
                          <p className="text-emerald-900">{uploadedImage.name}</p>
                          <p className="text-sm text-emerald-700 mt-1">File uploaded successfully</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-700 mb-2">Drag and drop your image here, or click to browse</p>
                          <label htmlFor="file-upload" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Describe Your Desired Changes</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="e.g., Add a vintage filter, brighten the colors, add text overlay saying 'New Collection'"
                      value={imageEditDescription}
                      onChange={(e) => setImageEditDescription(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {((postData.creationMethod === 'ai-generated' && description.trim()) || (postData.creationMethod === 'upload-enhance' && uploadedImage)) && (
                <div className="mt-8 text-center">
                  <Button onClick={() => document.getElementById('output-selection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="gap-2">
                    Continue to Output Selection
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step 3: Output Selection */}
        {postData.creationMethod && (postData.description || postData.uploadedImage) && (
          <section id="output-selection" className="scroll-mt-24 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">Step 3</div>
              <h2 className="text-slate-900 mb-2">Choose Your Favorite Design</h2>
              <p className="text-slate-600">Select one of the three AI-generated options below</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {outputs.map((output, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all ${
                    postData.selectedOutput === index ? 'ring-4 ring-blue-500 scale-105' : 'hover:shadow-xl hover:scale-102'
                  }`}
                  onClick={() => updatePostData({ selectedOutput: index })}
                >
                  <div className="relative aspect-square" style={{ background: output.gradient }}>
                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                      {output.companyName && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                          <p className="text-slate-900">{output.companyName}</p>
                          {output.companyPhone && <p className="text-sm text-slate-600">{output.companyPhone}</p>}
                        </div>
                      )}
                      <div className="text-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-xl inline-block">
                          <p className="text-slate-900">{output.mainText}</p>
                        </div>
                      </div>
                      {output.bottomText && (
                        <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg text-center">
                          <p className="text-white">{output.bottomText}</p>
                        </div>
                      )}
                    </div>
                    {postData.selectedOutput === index && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 text-center">
                    <p className="text-slate-700">Option {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>

            {postData.selectedOutput !== undefined && (
              <div className="text-center">
                <Button onClick={() => document.getElementById('platform-hashtags')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="gap-2">
                  Continue to Platform Selection
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Step 4: Platform & Hashtags */}
        {postData.selectedOutput !== undefined && (
          <section id="platform-hashtags" className="scroll-mt-24 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">Step 4</div>
                <h2 className="text-slate-900 mb-2">Platform & Hashtags</h2>
                <p className="text-slate-600">Choose your social media platform and add hashtags</p>
              </div>

              <div className="mb-8">
                <Label className="mb-4 block">Select Platform</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`cursor-pointer rounded-xl p-6 transition-all ${
                        postData.platform === platform.id ? 'ring-4 ring-blue-500 scale-105 bg-white shadow-xl' : 'bg-slate-50 hover:scale-105 hover:shadow-lg'
                      }`}
                      onClick={() => updatePostData({ platform: platform.id })}
                    >
                      <div className={`${platform.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <platform.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-center text-sm text-slate-700">{platform.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <Label className="mb-3 block">Post Caption</Label>
                <Textarea
                  placeholder="Write your post caption here..."
                  value={postData.caption || ''}
                  onChange={(e) => updatePostData({ caption: e.target.value })}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-sm text-slate-500 mt-2">{(postData.caption || '').length} characters</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Hashtags</Label>
                  <Button onClick={generateAIHashtags} variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Generate
                  </Button>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter hashtag (e.g., marketing)"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  />
                  <Button onClick={addHashtag} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {postData.hashtags.length > 0 ? (
                  <div className="bg-slate-50 rounded-lg p-4 min-h-[100px]">
                    <div className="flex flex-wrap gap-2">
                      {postData.hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1.5 flex items-center gap-2">
                          {tag}
                          <button onClick={() => removeHashtag(tag)} className="hover:text-red-600 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-8 text-center min-h-[100px] flex items-center justify-center">
                    <p className="text-slate-500 text-sm">No hashtags added yet. Add manually or use AI to generate.</p>
                  </div>
                )}
              </div>

              {postData.platform && (
                <div className="mt-8 text-center">
                  <Button onClick={() => document.getElementById('final-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="gap-2">
                    Continue to Preview
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step 5: Final Preview */}
        {postData.platform && (
          <section id="final-preview" className="scroll-mt-24 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">Step 5</div>
              <h2 className="text-slate-900 mb-2">Final Preview</h2>
              <p className="text-slate-600">Review your post before saving to your catalog</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-50 rounded-2xl p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-slate-900">Post Preview</h3>
                  {(() => {
                    const platformData = platforms.find(p => p.id === postData.platform);
                    const Icon = platformData?.icon;
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200">
                        {Icon && <Icon className="w-4 h-4 text-slate-700" />}
                        <span className="text-sm capitalize text-slate-700">{postData.platform}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-6">
                  <SocialPreview platform={postData.platform} postData={postData} imageUrl={gradients[postData.selectedOutput ?? 0]} />
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-2">Preview Details:</p>
                  <div className="space-y-1 text-xs text-slate-700">
                    {postData.caption && <p>• Caption: {postData.caption.substring(0, 50)}{postData.caption.length > 50 ? '...' : ''}</p>}
                    <p>• Hashtags: {postData.hashtags.length} added</p>
                    <p>• Platform: {postData.platform}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-slate-900 mb-4">Post Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Creation Method</p>
                      <p className="text-slate-900 capitalize">{postData.creationMethod === 'ai-generated' ? 'AI-Generated Content' : 'Upload & Enhance'}</p>
                    </div>
                    {postData.platform && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Platform</p>
                        <p className="text-slate-900 capitalize">{postData.platform}</p>
                      </div>
                    )}
                    {postData.companyName && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Company Name</p>
                        <p className="text-slate-900">{postData.companyName}</p>
                      </div>
                    )}
                    {postData.companyPhone && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Phone Number</p>
                        <p className="text-slate-900">{postData.companyPhone}</p>
                      </div>
                    )}
                    {postData.caption && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Caption</p>
                        <p className="text-slate-900 text-sm line-clamp-3">{postData.caption}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Hashtags</p>
                      <p className="text-slate-900">{postData.hashtags.length} hashtag{postData.hashtags.length !== 1 ? 's' : ''} added</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={() => alert('Post downloaded! (This would trigger an actual download in production)')} variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download Post
                  </Button>
                  <Button onClick={handleSavePost} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save to Catalog
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">Your post will be saved to your catalog where you can access it anytime for publishing or editing.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <div className="h-24"></div>
      <Toaster />
    </div>
  );
}
