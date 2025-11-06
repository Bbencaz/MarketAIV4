import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to get authenticated user
async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader) {
    return null;
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }

  return { id: user.id, email: user.email, accessToken };
}

// Health check endpoint
app.get("/make-server-d4ba6aee/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Register new user
app.post("/make-server-d4ba6aee/api/auth/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Registration error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Sign in the user to get access token
    const anonSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: sessionData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in error after registration:', signInError);
      return c.json({ error: signInError.message }, 400);
    }

    return c.json({
      user: {
        email: data.user.email,
        name: data.user.user_metadata.name,
      },
      accessToken: sessionData.session.access_token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return c.json({ error: error.message || "Registration failed" }, 500);
  }
});

// Login user
app.post("/make-server-d4ba6aee/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      user: {
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0],
      },
      accessToken: data.session.access_token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: error.message || "Login failed" }, 500);
  }
});

// ==================== CATALOG ROUTES ====================

// Save post to catalog
app.post("/make-server-d4ba6aee/api/catalog/save", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { platform, caption, hashtags, imageUrl } = await c.req.json();

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post = {
      id: postId,
      userId: user.id,
      platform,
      caption,
      hashtags,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`catalog:${user.id}:${postId}`, post);

    return c.json({ success: true, postId });
  } catch (error: any) {
    console.error('Error saving post to catalog:', error);
    return c.json({ error: error.message || "Failed to save post" }, 500);
  }
});

// Get all posts from catalog
app.get("/make-server-d4ba6aee/api/catalog/posts", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const posts = await kv.getByPrefix(`catalog:${user.id}:`);

    return c.json({ posts });
  } catch (error: any) {
    console.error('Error loading posts from catalog:', error);
    return c.json({ error: error.message || "Failed to load posts" }, 500);
  }
});

// Delete post from catalog
app.delete("/make-server-d4ba6aee/api/catalog/posts/:postId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const postId = c.req.param('postId');
    await kv.del(`catalog:${user.id}:${postId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post from catalog:', error);
    return c.json({ error: error.message || "Failed to delete post" }, 500);
  }
});

// ==================== SOCIAL MEDIA ROUTES ====================

// Connect social media account
app.post("/make-server-d4ba6aee/api/social/connect", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { platform, accessToken } = await c.req.json();

    if (!platform || !accessToken) {
      return c.json({ error: "Missing platform or access token" }, 400);
    }

    // Store the social media access token
    await kv.set(`social:${user.id}:${platform}`, {
      platform,
      accessToken,
      connectedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error connecting social account:', error);
    return c.json({ error: error.message || "Failed to connect account" }, 500);
  }
});

// Disconnect social media account
app.post("/make-server-d4ba6aee/api/social/disconnect", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { platform } = await c.req.json();

    if (!platform) {
      return c.json({ error: "Missing platform" }, 400);
    }

    await kv.del(`social:${user.id}:${platform}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting social account:', error);
    return c.json({ error: error.message || "Failed to disconnect account" }, 500);
  }
});

// Get connected social accounts
app.get("/make-server-d4ba6aee/api/social/connections", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const connectedAccounts = await kv.getByPrefix(`social:${user.id}:`);
    
    const connections: Record<string, boolean> = {};
    for (const account of connectedAccounts) {
      connections[account.platform] = true;
    }

    return c.json({ connections });
  } catch (error: any) {
    console.error('Error getting social connections:', error);
    return c.json({ error: error.message || "Failed to get connections" }, 500);
  }
});

// Upload post to social media
app.post("/make-server-d4ba6aee/api/social/upload", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { postId, platform } = await c.req.json();

    // Get the post from catalog
    const post = await kv.get(`catalog:${user.id}:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Get the social media access token
    const socialAccount = await kv.get(`social:${user.id}:${platform}`);
    if (!socialAccount) {
      return c.json({ error: "Social account not connected" }, 400);
    }

    // In a real implementation, you would use the platform's API here
    // For this prototype, we'll simulate a successful upload
    console.log(`Uploading post ${postId} to ${platform} for user ${user.id}`);
    console.log(`Post data:`, post);
    console.log(`Platform access token available: ${!!socialAccount.accessToken}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return c.json({ 
      success: true,
      message: `Post uploaded to ${platform} successfully (simulated)`,
    });
  } catch (error: any) {
    console.error('Error uploading to social media:', error);
    return c.json({ error: error.message || "Failed to upload post" }, 500);
  }
});

Deno.serve(app.fetch);