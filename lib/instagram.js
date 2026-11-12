const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const FALLBACK_JSON_PATH = path.join(ROOT, 'assets', 'data', 'instagram-feed.json');
const PROFILE_URL = 'https://www.instagram.com/waggin_with_gg/';
const USERNAME = 'waggin_with_gg';

let memoryCache = {
  timestamp: 0,
  payload: null,
};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (_) {
    // Ignore .env read errors
  }
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WagginWithGG-InstagramConnector/1.0',
          ...(options.headers || {}),
        },
        timeout: options.timeout || 25000,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
          }
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function fetchFromMetaGraphApi(accessToken, expandCarousels = false) {
  const items = [];
  let nextUrl =
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url,permalink}` +
    `&limit=100&access_token=${encodeURIComponent(accessToken)}`;

  let safetyPages = 0;
  while (nextUrl && safetyPages < 10) {
    safetyPages += 1;
    const page = await requestJson(nextUrl);
    const data = Array.isArray(page.data) ? page.data : [];

    for (const post of data) {
      const caption = post.caption || 'Waggin with GG on Instagram';
      const permalink = post.permalink || PROFILE_URL;

      if (expandCarousels && post.media_type === 'CAROUSEL_ALBUM' && post.children && Array.isArray(post.children.data)) {
        for (const child of post.children.data) {
          const imgUrl = child.media_type === 'VIDEO' ? child.thumbnail_url : child.media_url;
          if (imgUrl) {
            items.push({
              id: child.id,
              imageUrl: imgUrl,
              permalink: child.permalink || permalink,
              caption,
              mediaType: child.media_type || 'IMAGE',
            });
          }
        }
      } else {
        const imgUrl = post.media_type === 'VIDEO' ? post.thumbnail_url || post.media_url : post.media_url;
        if (imgUrl) {
          items.push({
            id: post.id,
            imageUrl: imgUrl,
            permalink,
            caption,
            mediaType: post.media_type || 'IMAGE',
          });
        }
      }
    }

    nextUrl = page.paging && page.paging.next ? page.paging.next : null;
  }

  return {
    username: USERNAME,
    profileUrl: PROFILE_URL,
    source: 'instagram_graph_api',
    items,
  };
}

async function fetchFromFeedUrl(feedUrl, expandCarousels = false) {
  const data = await requestJson(feedUrl);
  const rawPosts = Array.isArray(data) ? data : Array.isArray(data.posts) ? data.posts : Array.isArray(data.items) ? data.items : [];
  const items = [];

  for (const post of rawPosts) {
    const caption = post.caption || post.prunedCaption || 'Waggin with GG on Instagram';
    const permalink = post.permalink || post.url || PROFILE_URL;

    if (expandCarousels && Array.isArray(post.children) && post.children.length > 0) {
      for (const child of post.children) {
        const imgUrl =
          (child.sizes && child.sizes.large && child.sizes.large.mediaUrl) ||
          child.mediaUrl ||
          child.thumbnailUrl ||
          child.imageUrl;
        if (imgUrl) {
          items.push({
            id: child.id || `${post.id}-child`,
            imageUrl: imgUrl,
            permalink,
            caption,
            mediaType: child.mediaType || 'IMAGE',
          });
        }
      }
      continue;
    }

    const imgUrl =
      (post.sizes && post.sizes.large && post.sizes.large.mediaUrl) ||
      post.thumbnailUrl ||
      post.mediaUrl ||
      post.displayUrl ||
      post.imageUrl;

    if (imgUrl) {
      items.push({
        id: post.id || post.shortCode || String(items.length + 1),
        imageUrl: imgUrl,
        permalink,
        caption,
        width: post.dimensionsWidth || post.width,
        height: post.dimensionsHeight || post.height,
        mediaType: post.mediaType || post.type || 'IMAGE',
      });
    }
  }

  return {
    username: (data && data.username) || USERNAME,
    profileUrl: PROFILE_URL,
    source: 'feed_url',
    items,
  };
}

async function fetchFromApify(apiToken, expandCarousels = false) {
  const endpoint = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(apiToken)}`;
  const posts = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: 45000,
    body: {
      directUrls: [PROFILE_URL],
      resultsType: 'posts',
      resultsLimit: 60,
    },
  });

  const items = [];
  if (Array.isArray(posts)) {
    for (const post of posts) {
      const caption = post.caption || 'Waggin with GG on Instagram';
      const permalink = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : PROFILE_URL);
      if (expandCarousels && Array.isArray(post.images) && post.images.length > 1) {
        for (let i = 0; i < post.images.length; i += 1) {
          items.push({
            id: `${post.id || post.shortCode}-${i}`,
            imageUrl: post.images[i],
            permalink,
            caption,
            mediaType: 'IMAGE',
          });
        }
      } else {
        const imgUrl = post.displayUrl || (Array.isArray(post.images) && post.images[0]);
        if (imgUrl) {
          items.push({
            id: post.id || post.shortCode || String(items.length + 1),
            imageUrl: imgUrl,
            permalink,
            caption,
            width: post.dimensionsWidth,
            height: post.dimensionsHeight,
            mediaType: post.type || 'IMAGE',
          });
        }
      }
    }
  }

  return {
    username: USERNAME,
    profileUrl: PROFILE_URL,
    source: 'apify',
    items,
  };
}

function readFallbackFeed() {
  try {
    const raw = fs.readFileSync(FALLBACK_JSON_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return {
      username: USERNAME,
      profileUrl: PROFILE_URL,
      source: 'empty',
      items: [],
    };
  }
}

async function getInstagramFeed({ forceRefresh = false } = {}) {
  loadDotEnv();

  const now = Date.now();
  if (!forceRefresh && memoryCache.payload && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.payload;
  }

  const expandCarousels = process.env.INSTAGRAM_EXPAND_CAROUSELS === 'true';
  const feedUrl = process.env.INSTAGRAM_FEED_URL;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const apifyToken = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;

  try {
    let liveResult = null;
    if (feedUrl) {
      liveResult = await fetchFromFeedUrl(feedUrl, expandCarousels);
    } else if (accessToken) {
      liveResult = await fetchFromMetaGraphApi(accessToken, expandCarousels);
    } else if (apifyToken) {
      liveResult = await fetchFromApify(apifyToken, expandCarousels);
    }

    if (liveResult && Array.isArray(liveResult.items) && liveResult.items.length > 0) {
      memoryCache = { timestamp: now, payload: liveResult };
      return liveResult;
    }
  } catch (err) {
    console.warn('[Instagram Feed] Live fetch failed, falling back to cached feed:', err.message);
  }

  const fallback = readFallbackFeed();
  memoryCache = { timestamp: now, payload: fallback };
  return fallback;
}

module.exports = {
  getInstagramFeed,
};

