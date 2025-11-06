import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Library, Upload, Trash2, Instagram, Facebook, Twitter, Linkedin, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import type { Platform } from '../App';

interface SavedPost {
  id: string;
  platform: Platform;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  createdAt: string;
}

interface CatalogDialogProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
  connectedAccounts: Record<string, boolean>;
}

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

const platformColors = {
  instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-slate-900',
  linkedin: 'bg-blue-700',
};

export function CatalogDialog({ open, onClose, accessToken, connectedAccounts }: CatalogDialogProps) {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPost, setUploadingPost] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPosts();
    }
  }, [open]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/catalog/posts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load posts');

      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/catalog/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete post');

      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleUploadToSocial = async (post: SavedPost) => {
    if (!connectedAccounts[post.platform]) {
      alert(`Please connect your ${post.platform} account first in Social Media Links`);
      return;
    }

    setUploadingPost(post.id);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/social/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          postId: post.id,
          platform: post.platform,
        }),
      });

      if (!response.ok) throw new Error('Failed to upload post');

      alert(`Post successfully uploaded to ${post.platform}!`);
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Failed to upload post to social media');
    } finally {
      setUploadingPost(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Library className="w-6 h-6" />
            My Post Catalog
          </DialogTitle>
          <DialogDescription>
            View, manage, and upload your saved posts to social media
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Library className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No saved posts yet</p>
            <p className="text-sm text-slate-400 mt-2">
              Create and save posts to build your catalog
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => {
                const Icon = platformIcons[post.platform];
                const isUploading = uploadingPost === post.id;

                return (
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Post Image */}
                    <div className="aspect-square bg-slate-100 relative">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 ${platformColors[post.platform]} w-10 h-10 rounded-full flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Post Details */}
                    <div className="p-4">
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                        {post.caption || 'No caption'}
                      </p>

                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.hashtags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.hashtags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.hashtags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUploadToSocial(post)}
                          disabled={isUploading || !connectedAccounts[post.platform]}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePost(post.id)}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {!connectedAccounts[post.platform] && (
                        <p className="text-xs text-orange-600 mt-2">
                          Connect {post.platform} to upload
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
