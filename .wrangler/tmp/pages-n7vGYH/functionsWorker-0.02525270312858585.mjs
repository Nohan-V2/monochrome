var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-wbxhNj/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// cors-helper.js
function getAllowedOrigins(env) {
  if (!env.ALLOWED_ORIGINS) {
    return [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://YOUR_VERCEL_DOMAIN.vercel.app"
      // WORKER: default Vercel production origin placeholder
    ];
  }
  return env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
}
__name(getAllowedOrigins, "getAllowedOrigins");
function getOrigin(request, allowedOrigins) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] || "*";
}
__name(getOrigin, "getOrigin");
function handleCORSPreflight(request, allowedOrigins) {
  if (request.method === "OPTIONS") {
    const origin = getOrigin(request, allowedOrigins);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  return null;
}
__name(handleCORSPreflight, "handleCORSPreflight");
function addCORSHeaders(response, request, allowedOrigins) {
  const origin = getOrigin(request, allowedOrigins);
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("Access-Control-Allow-Origin", origin);
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return newResponse;
}
__name(addCORSHeaders, "addCORSHeaders");

// album/[id].js
var TidalAPI = class _TidalAPI {
  static {
    __name(this, "TidalAPI");
  }
  static CLIENT_ID = "txNoH4kkV41MfH25";
  static CLIENT_SECRET = "dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98=";
  async getToken() {
    const params = new URLSearchParams({
      client_id: _TidalAPI.CLIENT_ID,
      client_secret: _TidalAPI.CLIENT_SECRET,
      grant_type: "client_credentials"
    });
    const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${_TidalAPI.CLIENT_ID}:${_TidalAPI.CLIENT_SECRET}`)
      },
      body: params
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }
  async fetchJson(url, params = {}) {
    const token = await this.getToken();
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const finalUrl = u.toString().replace("//api.tidal.com", "//tidal-api.geeked.wtf/api");
    const res = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Tidal API error: ${res.status}`);
    return res.json();
  }
  async getAlbumMetadata(id) {
    return await this.fetchJson(`https://api.tidal.com/v1/albums/${id}`, { countryCode: "US" });
  }
  getCoverUrl(id, size = "1280") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
var ServerAPI = class {
  static {
    __name(this, "ServerAPI");
  }
  constructor() {
    this.INSTANCES_URLS = ["https://tidal-uptime.geeked.wtf"];
    this.apiInstances = null;
  }
  async getInstances() {
    if (this.apiInstances) return this.apiInstances;
    let data = null;
    const urls2 = [...this.INSTANCES_URLS].sort(() => Math.random() - 0.5);
    for (const url of urls2) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
        break;
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }
    if (data) {
      this.apiInstances = (data.api || []).map((item) => item.url || item).filter((url) => !/\.squid\.wtf/i.test(url));
      return this.apiInstances;
    }
    console.error("Failed to load instances from all uptime APIs");
    return [
      "https://hifi.geeked.wtf",
      "https://eu-central.monochrome.tf",
      "https://us-west.monochrome.tf",
      "https://arran.monochrome.tf",
      "https://api.monochrome.tf",
      "https://monochrome-api.samidy.com",
      "https://maus.qqdl.site",
      "https://vogel.qqdl.site",
      "https://katze.qqdl.site",
      "https://hund.qqdl.site",
      "https://tidal.kinoplus.online",
      "https://wolf.qqdl.site"
    ];
  }
  async fetchWithRetry(relativePath) {
    const instances = await this.getInstances();
    if (instances.length === 0) {
      throw new Error("No API instances configured.");
    }
    let lastError = null;
    for (const baseUrl of instances) {
      const url = baseUrl.endsWith("/") ? `${baseUrl}${relativePath.substring(1)}` : `${baseUrl}${relativePath}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`All API instances failed for: ${relativePath}`);
  }
  async getAlbumMetadata(id) {
    try {
      const response = await this.fetchWithRetry(`/album/${id}`);
      return await response.json();
    } catch {
      const response = await this.fetchWithRetry(`/album?id=${id}`);
      return await response.json();
    }
  }
  getCoverUrl(id, size = "1280") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
var _cr = [
  "emVl",
  // zee
  "em1j",
  // zmc
  "emluZyBtdXNpYw==",
  // zing music
  "ZXRjIGJvbGx5d29vZA==",
  // etc bollywood
  "Ym9sbHl3b29kIG11c2lj",
  // bollywood music
  "ZXNzZWw=",
  // essel
  "emluZGFnaQ=="
  // zindagi
].map(atob);
var _isBlockedCopyright = /* @__PURE__ */ __name((c) => {
  const text = typeof c === "string" ? c : c?.text;
  return !!text && _cr.some((s) => text.toLowerCase().includes(s));
}, "_isBlockedCopyright");
async function onRequest(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const albumId = params.id;
  if (isBot && albumId) {
    let api;
    let album;
    let tracks = [];
    try {
      api = new TidalAPI();
      album = await api.getAlbumMetadata(albumId);
    } catch (directError) {
      console.warn(`Direct Tidal API failed for album ${albumId}, falling back to proxies:`, directError);
      try {
        api = new ServerAPI();
        const data = await api.getAlbumMetadata(albumId);
        album = data.data || data.album || data;
        tracks = album.items || data.tracks || [];
      } catch (fallbackError) {
        console.error(`All methods failed for album ${albumId}:`, fallbackError);
      }
    }
    if (album && _isBlockedCopyright(album.copyright)) {
      return new Response("This content was removed due to a DMCA notice.", { status: 200 });
    }
    if (album && (album.title || album.name)) {
      try {
        const title = album.title || album.name;
        const artist = album.artist?.name || "Unknown Artist";
        const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : "";
        const trackCount = album.numberOfTracks || tracks.length;
        const description = `Album by ${artist} \u2022 ${year} \u2022 ${trackCount} Tracks
Listen on Monochrome`;
        const imageUrl = album.cover ? api.getCoverUrl(album.cover, "1280") : "https://monochrome.samidy.com/assets/appicon.png";
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.album">
                        <meta property="og:url" content="${pageUrl}">
                        <meta property="music:musician" content="${artist}">
                        <meta property="music:release_date" content="${album.releaseDate}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Album Cover">
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      } catch (error) {
        console.error(`Error generating meta tags for album ${albumId}:`, error);
      }
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest, "onRequest");

// artist/[id].js
var TidalAPI2 = class _TidalAPI {
  static {
    __name(this, "TidalAPI");
  }
  static CLIENT_ID = "txNoH4kkV41MfH25";
  static CLIENT_SECRET = "dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98=";
  async getToken() {
    const params = new URLSearchParams({
      client_id: _TidalAPI.CLIENT_ID,
      client_secret: _TidalAPI.CLIENT_SECRET,
      grant_type: "client_credentials"
    });
    const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${_TidalAPI.CLIENT_ID}:${_TidalAPI.CLIENT_SECRET}`)
      },
      body: params
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }
  async fetchJson(url, params = {}) {
    const token = await this.getToken();
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const finalUrl = u.toString().replace("//api.tidal.com", "//tidal-api.geeked.wtf/api");
    const res = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Tidal API error: ${res.status}`);
    return res.json();
  }
  async getArtistMetadata(id) {
    return await this.fetchJson(`https://api.tidal.com/v1/artists/${id}`, { countryCode: "US" });
  }
  getArtistPictureUrl(id, size = "750") {
    if (!id) return "";
    const formattedId = id.replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
var ServerAPI2 = class {
  static {
    __name(this, "ServerAPI");
  }
  constructor() {
    this.INSTANCES_URLS = ["https://tidal-uptime.geeked.wtf"];
    this.apiInstances = null;
  }
  async getInstances() {
    if (this.apiInstances) return this.apiInstances;
    let data = null;
    const urls2 = [...this.INSTANCES_URLS].sort(() => Math.random() - 0.5);
    for (const url of urls2) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
        break;
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }
    if (data) {
      this.apiInstances = (data.api || []).map((item) => item.url || item);
      return this.apiInstances;
    }
    console.error("Failed to load instances from all uptime APIs");
    return [
      "https://eu-central.monochrome.tf",
      "https://us-west.monochrome.tf",
      "https://arran.monochrome.tf",
      "https://triton.squid.wtf",
      "https://api.monochrome.tf",
      "https://monochrome-api.samidy.com",
      "https://maus.qqdl.site",
      "https://vogel.qqdl.site",
      "https://katze.qqdl.site",
      "https://hund.qqdl.site",
      "https://tidal.kinoplus.online",
      "https://wolf.qqdl.site"
    ];
  }
  async fetchWithRetry(relativePath) {
    const instances = await this.getInstances();
    if (instances.length === 0) {
      throw new Error("No API instances configured.");
    }
    let lastError = null;
    for (const baseUrl of instances) {
      const url = baseUrl.endsWith("/") ? `${baseUrl}${relativePath.substring(1)}` : `${baseUrl}${relativePath}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`All API instances failed for: ${relativePath}`);
  }
  async getArtistMetadata(id) {
    const response = await this.fetchWithRetry(`/artist/?id=${id}`);
    return await response.json();
  }
  getArtistPictureUrl(id, size = "750") {
    if (!id) return "";
    const formattedId = id.replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
async function onRequest2(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const artistId = params.id;
  if (isBot && artistId) {
    let api;
    let artist;
    try {
      api = new TidalAPI2();
      artist = await api.getArtistMetadata(artistId);
    } catch (directError) {
      console.warn(`Direct Tidal API failed for artist ${artistId}, falling back to proxies:`, directError);
      try {
        api = new ServerAPI2();
        const data = await api.getArtistMetadata(artistId);
        artist = data.artist || data.data || data;
      } catch (fallbackError) {
        console.error(`All methods failed for artist ${artistId}:`, fallbackError);
      }
    }
    if (artist && (artist.name || artist.title)) {
      try {
        const name = artist.name || artist.title;
        const description = `Listen to ${name} on Monochrome`;
        const imageUrl = artist.picture ? api.getArtistPictureUrl(artist.picture, "750") : "https://monochrome.samidy.com/assets/appicon.png";
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${name}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${name}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="profile">
                        <meta property="og:url" content="${pageUrl}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${name}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${name}</h1>
                        <img src="${imageUrl}" alt="Artist Picture">
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      } catch (error) {
        console.error(`Error generating meta tags for artist ${artistId}:`, error);
      }
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest2, "onRequest");

// playlist/[id].js
var TidalAPI3 = class _TidalAPI {
  static {
    __name(this, "TidalAPI");
  }
  static CLIENT_ID = "txNoH4kkV41MfH25";
  static CLIENT_SECRET = "dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98=";
  async getToken() {
    const params = new URLSearchParams({
      client_id: _TidalAPI.CLIENT_ID,
      client_secret: _TidalAPI.CLIENT_SECRET,
      grant_type: "client_credentials"
    });
    const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${_TidalAPI.CLIENT_ID}:${_TidalAPI.CLIENT_SECRET}`)
      },
      body: params
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }
  async fetchJson(url, params = {}) {
    const token = await this.getToken();
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const finalUrl = u.toString().replace("//api.tidal.com", "//tidal-api.geeked.wtf/api");
    const res = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Tidal API error: ${res.status}`);
    return res.json();
  }
  async getPlaylistMetadata(id) {
    return await this.fetchJson(`https://api.tidal.com/v1/playlists/${id}`, { countryCode: "US" });
  }
  getCoverUrl(id, size = "1080") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
var ServerAPI3 = class {
  static {
    __name(this, "ServerAPI");
  }
  constructor() {
    this.INSTANCES_URLS = ["https://tidal-uptime.geeked.wtf"];
    this.apiInstances = null;
  }
  async getInstances() {
    if (this.apiInstances) return this.apiInstances;
    let data = null;
    const urls2 = [...this.INSTANCES_URLS].sort(() => Math.random() - 0.5);
    for (const url of urls2) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
        break;
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }
    if (data) {
      this.apiInstances = (data.api || []).map((item) => item.url || item).filter((url) => !/\.squid\.wtf/i.test(url));
      return this.apiInstances;
    }
    console.error("Failed to load instances from all uptime APIs");
    return [
      "https://eu-central.monochrome.tf",
      "https://us-west.monochrome.tf",
      "https://arran.monochrome.tf",
      "https://api.monochrome.tf",
      "https://monochrome-api.samidy.com",
      "https://maus.qqdl.site",
      "https://vogel.qqdl.site",
      "https://katze.qqdl.site",
      "https://hund.qqdl.site",
      "https://tidal.kinoplus.online",
      "https://wolf.qqdl.site"
    ];
  }
  async fetchWithRetry(relativePath) {
    const instances = await this.getInstances();
    if (instances.length === 0) {
      throw new Error("No API instances configured.");
    }
    let lastError = null;
    for (const baseUrl of instances) {
      const url = baseUrl.endsWith("/") ? `${baseUrl}${relativePath.substring(1)}` : `${baseUrl}${relativePath}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`All API instances failed for: ${relativePath}`);
  }
  async getPlaylistMetadata(id) {
    try {
      const response = await this.fetchWithRetry(`/playlist/${id}`);
      return await response.json();
    } catch {
      const response = await this.fetchWithRetry(`/playlist?id=${id}`);
      return await response.json();
    }
  }
  getCoverUrl(id, size = "1080") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
async function onRequest3(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const playlistId = params.id;
  if (isBot && playlistId) {
    let api;
    let playlist;
    try {
      api = new TidalAPI3();
      playlist = await api.getPlaylistMetadata(playlistId);
    } catch (directError) {
      console.warn(`Direct Tidal API failed for playlist ${playlistId}, falling back to proxies:`, directError);
      try {
        api = new ServerAPI3();
        const data = await api.getPlaylistMetadata(playlistId);
        playlist = data.playlist || data.data || data;
      } catch (fallbackError) {
        console.error(`All methods failed for playlist ${playlistId}:`, fallbackError);
      }
    }
    if (playlist && (playlist.title || playlist.name)) {
      try {
        const title = playlist.title || playlist.name;
        const trackCount = playlist.numberOfTracks;
        const description = `Playlist \u2022 ${trackCount} Tracks
Listen on Monochrome`;
        const imageId = playlist.squareImage || playlist.image;
        const imageUrl = imageId ? api.getCoverUrl(imageId, "1080") : "https://monochrome.samidy.com/assets/appicon.png";
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.playlist">
                        <meta property="og:url" content="${pageUrl}">
                        <meta property="music:song_count" content="${trackCount}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Playlist Cover">
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      } catch (error) {
        console.error(`Error generating meta tags for playlist ${playlistId}:`, error);
      }
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest3, "onRequest");

// track/[id].js
function getTrackTitle(track, { fallback = "Unknown Title" } = {}) {
  if (!track?.title) return fallback;
  return track?.version ? `${track.title} (${track.version})` : track.title;
}
__name(getTrackTitle, "getTrackTitle");
function getTrackArtists(track = {}, { fallback = "Unknown Artist" } = {}) {
  if (track?.artists?.length) {
    return track.artists.map((artist) => artist?.name).join(", ");
  }
  return fallback;
}
__name(getTrackArtists, "getTrackArtists");
var TidalAPI4 = class _TidalAPI {
  static {
    __name(this, "TidalAPI");
  }
  static CLIENT_ID = "txNoH4kkV41MfH25";
  static CLIENT_SECRET = "dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98=";
  async getToken() {
    const params = new URLSearchParams({
      client_id: _TidalAPI.CLIENT_ID,
      client_secret: _TidalAPI.CLIENT_SECRET,
      grant_type: "client_credentials"
    });
    const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${_TidalAPI.CLIENT_ID}:${_TidalAPI.CLIENT_SECRET}`)
      },
      body: params
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }
  async fetchJson(url, params = {}) {
    const token = await this.getToken();
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const finalUrl = u.toString().replace("//api.tidal.com", "//tidal-api.geeked.wtf/api");
    const res = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Tidal API error: ${res.status}`);
    return res.json();
  }
  async getTrackMetadata(id) {
    return await this.fetchJson(`https://api.tidal.com/v1/tracks/${id}/`, { countryCode: "US" });
  }
  async getStreamUrl(id) {
    const data = await this.fetchJson(`https://api.tidal.com/v1/tracks/${id}/playbackinfo`, {
      audioquality: "LOW",
      playbackmode: "STREAM",
      assetpresentation: "FULL",
      countryCode: "US"
    });
    return data.url || data.streamUrl;
  }
  getCoverUrl(id, size = "1280") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
};
var ServerAPI4 = class {
  static {
    __name(this, "ServerAPI");
  }
  constructor() {
    this.INSTANCES_URLS = ["https://tidal-uptime.geeked.wtf"];
    this.apiInstances = null;
  }
  async getInstances() {
    if (this.apiInstances) return this.apiInstances;
    let data = null;
    const urls2 = [...this.INSTANCES_URLS].sort(() => Math.random() - 0.5);
    for (const url of urls2) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
        break;
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }
    if (data) {
      this.apiInstances = (data.api || []).map((item) => item.url || item);
      return this.apiInstances;
    }
    console.error("Failed to load instances from all uptime APIs");
    return [
      "https://eu-central.monochrome.tf",
      "https://us-west.monochrome.tf",
      "https://arran.monochrome.tf",
      "https://triton.squid.wtf",
      "https://api.monochrome.tf",
      "https://monochrome-api.samidy.com",
      "https://maus.qqdl.site",
      "https://vogel.qqdl.site",
      "https://katze.qqdl.site",
      "https://hund.qqdl.site",
      "https://tidal.kinoplus.online",
      "https://wolf.qqdl.site"
    ];
  }
  async fetchWithRetry(relativePath) {
    const instances = await this.getInstances();
    if (instances.length === 0) {
      throw new Error("No API instances configured.");
    }
    let lastError = null;
    for (const baseUrl of instances) {
      const url = baseUrl.endsWith("/") ? `${baseUrl}${relativePath.substring(1)}` : `${baseUrl}${relativePath}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`All API instances failed for: ${relativePath}`);
  }
  async getTrackMetadata(id) {
    const response = await this.fetchWithRetry(`/info/?id=${id}`);
    const json = await response.json();
    const data = json.data || json;
    const items = Array.isArray(data) ? data : [data];
    const found = items.find((i) => i.id == id || i.item && i.item.id == id);
    if (found) {
      return found.item || found;
    }
    throw new Error("Track metadata not found");
  }
  getCoverUrl(id, size = "1280") {
    if (!id) return "";
    const formattedId = String(id).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }
  async getStreamUrl(id) {
    const response = await this.fetchWithRetry(`/stream?id=${id}&quality=LOW`);
    const data = await response.json();
    return data.url || data.streamUrl;
  }
};
var _cr2 = [
  "emVl",
  // zee
  "em1j",
  // zmc
  "emluZyBtdXNpYw==",
  // zing music
  "ZXRjIGJvbGx5d29vZA==",
  // etc bollywood
  "Ym9sbHl3b29kIG11c2lj",
  // bollywood music
  "ZXNzZWw=",
  // essel
  "emluZGFnaQ=="
  // zindagi
].map(atob);
var _isBlockedCopyright2 = /* @__PURE__ */ __name((c) => {
  const text = typeof c === "string" ? c : c?.text;
  return !!text && _cr2.some((s) => text.toLowerCase().includes(s));
}, "_isBlockedCopyright");
async function onRequest4(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const trackId = params.id;
  if (isBot && trackId) {
    let api;
    let track;
    try {
      api = new TidalAPI4();
      track = await api.getTrackMetadata(trackId);
    } catch (directError) {
      console.warn(`Direct Tidal API failed for track ${trackId}, falling back to proxies:`, directError);
      try {
        api = new ServerAPI4();
        track = await api.getTrackMetadata(trackId);
      } catch (fallbackError) {
        console.error(`All methods failed for track ${trackId}:`, fallbackError);
      }
    }
    if (track && _isBlockedCopyright2(track.copyright)) {
      return new Response("This content was removed due to a DMCA notice.", { status: 200 });
    }
    if (track) {
      try {
        const title = getTrackTitle(track);
        const artist = getTrackArtists(track);
        const description = `${artist} - ${track.album.title}`;
        const imageUrl = api.getCoverUrl(track.album.cover, "1280");
        const trackUrl = new URL(request.url).href;
        let audioUrl = track.previewUrl || track.previewURL;
        if (!audioUrl) {
          try {
            audioUrl = await api.getStreamUrl(trackId);
          } catch (e) {
            console.error("Failed to fetch stream fallback:", e);
          }
        }
        const audioMeta = audioUrl ? `
                    <meta property="og:audio" content="${audioUrl}">
                    <meta property="og:audio:type" content="audio/mp4">
                    <meta property="og:video" content="${audioUrl}">
                    <meta property="og:video:type" content="audio/mp4">
                ` : "";
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title} by ${artist}</title>
                        <meta name="description" content="${description}">

                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.song">
                        <meta property="og:url" content="${trackUrl}">
                        <meta property="music:duration" content="${track.duration}">
                        <meta property="music:album" content="${track.album.title}">
                        <meta property="music:musician" content="${artist}">

                        ${audioMeta}

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">

                        <meta name="theme-color" content="#000000">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>by ${artist}</p>
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, {
          headers: { "content-type": "text/html;charset=UTF-8" }
        });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      } catch (error) {
        console.error(`Error generating meta tags for track ${trackId}:`, error);
      }
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest4, "onRequest");

// unreleased/[sheetId]/[projectName].js
var ARTISTS_NDJSON_URL = "https://assets.artistgrid.cx/artists.ndjson";
var TRACKER_API_ENDPOINTS = [
  "https://trackerapi-1.artistgrid.cx/get/",
  "https://trackerapi-2.artistgrid.cx/get/",
  "https://trackerapi-3.artistgrid.cx/get/"
];
function getSheetId(url) {
  if (!url) return null;
  const match2 = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match2 ? match2[1] : null;
}
__name(getSheetId, "getSheetId");
function transformImageUrl(url) {
  if (!url) return url;
  return url.replace("https://s3.sad.ovh/trackerapi/", "https://r2.artistgrid.cx/");
}
__name(transformImageUrl, "transformImageUrl");
async function loadArtistsData() {
  try {
    const response = await fetch(ARTISTS_NDJSON_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    return text.trim().split("\n").filter((line) => line.trim()).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((item) => item !== null);
  } catch (e) {
    console.error("Failed to load Artists List:", e);
    return [];
  }
}
__name(loadArtistsData, "loadArtistsData");
async function fetchTrackerData(sheetId) {
  for (const baseUrl of TRACKER_API_ENDPOINTS) {
    try {
      const response = await fetch(`${baseUrl}${sheetId}`);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.eras) {
        for (const eraName in data.eras) {
          const era = data.eras[eraName];
          if (era.image) {
            era.image = transformImageUrl(era.image);
          }
        }
      }
      return data;
    } catch (e) {
      console.warn(`Failed to fetch from ${baseUrl}, trying next...`, e);
    }
  }
  return null;
}
__name(fetchTrackerData, "fetchTrackerData");
async function onRequest5(context) {
  const { request, params, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const sheetId = params.sheetId;
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : null;
  if (isBot && sheetId && projectName) {
    try {
      const artists = await loadArtistsData();
      const artist = artists.find((a) => getSheetId(a.url) === sheetId);
      const trackerData = await fetchTrackerData(sheetId);
      if (artist && artist.name && trackerData && trackerData.eras) {
        const era = trackerData.eras[projectName];
        const imageUrl = era && era.image ? era.image : "https://monochrome.tf/assets/appicon.png";
        const pageUrl = new URL(request.url).href;
        const title = `${projectName} - ${artist.name}`;
        const description = `Stream ${projectName} by ${artist.name} on Monochrome`;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.album">
                        <meta property="og:url" content="${pageUrl}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="${projectName} cover">
                    </body>
                    </html>
                `;
        return new Response(metaHtml, {
          headers: { "content-type": "text/html;charset=UTF-8" }
        });
      }
    } catch (error) {
      console.error(`Error generating meta tags for unreleased project ${sheetId}/${projectName}:`, error);
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest5, "onRequest");

// podcasts/[id].js
var PODCASTINDEX_API_BASE = "https://api.podcastindex.org/api/1.0";
var PODCAST_API_KEY = "YU5HMSDYBQQVYDF6QN4P";
var PODCAST_API_SECRET = "8hCvpjSL7T$S7^5ftnf5MhqQwYUYVjM^fmUL3Ld$";
async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha1, "sha1");
async function getAuthHeaders() {
  const apiHeaderTime = Math.floor(Date.now() / 1e3).toString();
  const combined = PODCAST_API_KEY + PODCAST_API_SECRET + apiHeaderTime;
  const authHeader = await sha1(combined);
  return {
    "User-Agent": "MonochromeMusic/1.0",
    "X-Auth-Key": PODCAST_API_KEY,
    "X-Auth-Date": apiHeaderTime,
    Authorization: authHeader
  };
}
__name(getAuthHeaders, "getAuthHeaders");
async function onRequest6(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const podcastId = params.id;
  if (isBot && podcastId) {
    try {
      const headers = await getAuthHeaders();
      const response2 = await fetch(`${PODCASTINDEX_API_BASE}/podcasts/byfeedid?id=${podcastId}&pretty`, {
        method: "GET",
        headers
      });
      if (!response2.ok) throw new Error(`PodcastIndex error: ${response2.status}`);
      const data = await response2.json();
      const feed = data.status === "true" && data.feed ? data.feed : null;
      if (feed && feed.title) {
        const title = feed.title;
        const author = feed.author || feed.ownerName || "";
        const episodeCount = feed.episodeCount || 0;
        const _rawDescription = feed.description || "";
        const description = author ? `Podcast by ${author} \u2022 ${episodeCount} Episodes
Listen on Monochrome` : `Podcast \u2022 ${episodeCount} Episodes
Listen on Monochrome`;
        const imageUrl = feed.image || feed.artwork || "https://monochrome.tf/assets/appicon.png";
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="website">
                        <meta property="og:url" content="${pageUrl}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Podcast Cover">
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      }
    } catch (error) {
      console.error(`Error for podcast ${podcastId}:`, error);
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest6, "onRequest");

// unreleased/[sheetId].js
var ARTISTS_NDJSON_URL2 = "https://assets.artistgrid.cx/artists.ndjson";
var ASSETS_BASE_URL = "https://assets.artistgrid.cx";
function getSheetId2(url) {
  if (!url) return null;
  const match2 = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match2 ? match2[1] : null;
}
__name(getSheetId2, "getSheetId");
function normalizeArtistName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
__name(normalizeArtistName, "normalizeArtistName");
async function loadArtistsData2() {
  try {
    const response = await fetch(ARTISTS_NDJSON_URL2);
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    return text.trim().split("\n").filter((line) => line.trim()).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((item) => item !== null);
  } catch (e) {
    console.error("Failed to load Artists List:", e);
    return [];
  }
}
__name(loadArtistsData2, "loadArtistsData");
async function onRequest7(context) {
  const { request, params, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const sheetId = params.sheetId;
  if (isBot && sheetId) {
    try {
      const artists = await loadArtistsData2();
      const artist = artists.find((a) => getSheetId2(a.url) === sheetId);
      if (artist && artist.name) {
        const normalizedName = normalizeArtistName(artist.name);
        const imageUrl = `${ASSETS_BASE_URL}/${normalizedName}.webp`;
        const pageUrl = new URL(request.url).href;
        const title = `${artist.name} | Unreleased`;
        const description = `Stream unreleased music by ${artist.name} on Monochrome`;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="profile">
                        <meta property="og:url" content="${pageUrl}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${artist.name}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="${artist.name}">
                    </body>
                    </html>
                `;
        return new Response(metaHtml, {
          headers: { "content-type": "text/html;charset=UTF-8" }
        });
      }
    } catch (error) {
      console.error(`Error generating meta tags for unreleased artist ${sheetId}:`, error);
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest7, "onRequest");

// user/@[username].js
async function onRequest8(context) {
  const { request, params, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const preflightResponse = handleCORSPreflight(request, allowedOrigins);
  if (preflightResponse) return preflightResponse;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const username = params.username;
  if (isBot && username) {
    try {
      const POCKETBASE_URL2 = "https://data.samidy.xyz";
      const filter = `username="${username}"`;
      const profileUrl = `${POCKETBASE_URL2}/api/collections/DB_users/records?filter=${encodeURIComponent(filter)}&fields=username,display_name,avatar_url,banner,about,status`;
      const response2 = await fetch(profileUrl);
      if (!response2.ok) throw new Error(`PocketBase error: ${response2.status}`);
      const data = await response2.json();
      const profile = data.items && data.items.length > 0 ? data.items[0] : null;
      if (profile) {
        const displayName = profile.display_name || profile.username;
        const title = `${displayName} (@${profile.username})`;
        let description = profile.about || `View ${displayName}'s profile on Monochrome.`;
        if (profile.status) {
          try {
            const statusObj = JSON.parse(profile.status);
            description = `Listening to: ${statusObj.text}

${description}`;
          } catch {
            description = `Listening to: ${profile.status}

${description}`;
          }
        }
        const imageUrl = profile.avatar_url || "https://monochrome.tf/assets/appicon.png";
        const bannerUrl = profile.banner || "";
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">
                        
                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="profile">
                        <meta property="og:url" content="${pageUrl}">
                        
                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Profile Avatar">
                        ${bannerUrl ? `<img src="${bannerUrl}" alt="Profile Banner">` : ""}
                    </body>
                    </html>
                `;
        const metaResponse = new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
        return addCORSHeaders(metaResponse, request, allowedOrigins);
      }
    } catch (error) {
      console.error(`Error for user profile ${username}:`, error);
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  const response = env.ASSETS.fetch(new Request(url, request));
  return addCORSHeaders(await response, request, allowedOrigins);
}
__name(onRequest8, "onRequest");

// userplaylist/[id].js
var POCKETBASE_URL = "https://data.samidy.xyz";
var PUBLIC_COLLECTION = "public_playlists";
function safeParseTracks(tracksData) {
  if (!tracksData) return [];
  if (Array.isArray(tracksData)) return tracksData;
  if (typeof tracksData === "string") {
    try {
      return JSON.parse(tracksData);
    } catch {
      return [];
    }
  }
  return [];
}
__name(safeParseTracks, "safeParseTracks");
function parseDuration(durationStr) {
  if (!durationStr || durationStr === "N/A" || typeof durationStr !== "string") return 0;
  const parts = durationStr.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}
__name(parseDuration, "parseDuration");
function calculatePlaylistDuration(tracks) {
  let totalSeconds = 0;
  for (const track of tracks) {
    const duration = track.duration || track.durationSeconds || 0;
    if (typeof duration === "number") {
      totalSeconds += duration;
    } else if (typeof duration === "string") {
      totalSeconds += parseDuration(duration);
    }
  }
  return totalSeconds;
}
__name(calculatePlaylistDuration, "calculatePlaylistDuration");
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}
__name(formatDuration, "formatDuration");
async function onRequest9(context) {
  const { request, params, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  const playlistId = params.id;
  if (isBot && playlistId) {
    try {
      const filter = `uuid="${playlistId}"`;
      const apiUrl = `${POCKETBASE_URL}/api/collections/${PUBLIC_COLLECTION}/records?filter=${encodeURIComponent(filter)}&perPage=1`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`PocketBase error: ${response.status}`);
      const result = await response.json();
      const record = result.items && result.items.length > 0 ? result.items[0] : null;
      if (record) {
        let extraData = {};
        try {
          extraData = record.data ? JSON.parse(record.data) : {};
        } catch {
          extraData = {};
        }
        const title = record.title || record.name || extraData && (extraData.title || extraData.name) || "Untitled Playlist";
        let tracks = safeParseTracks(record.tracks);
        const trackCount = tracks.length;
        const totalDuration = calculatePlaylistDuration(tracks);
        const durationStr = formatDuration(totalDuration);
        let rawCover = record.image || record.cover || record.playlist_cover || "";
        if (!rawCover && extraData && typeof extraData === "object") {
          rawCover = extraData.cover || extraData.image || "";
        }
        let imageUrl = "";
        if (rawCover && (rawCover.startsWith("http") || rawCover.startsWith("data:"))) {
          imageUrl = rawCover;
        } else if (rawCover) {
          imageUrl = `${POCKETBASE_URL}/api/files/${PUBLIC_COLLECTION}/${record.id}/${rawCover}`;
        }
        if (!imageUrl && tracks.length > 0) {
          const firstCover = tracks.find((t) => t.album?.cover)?.album?.cover;
          if (firstCover) {
            const formattedId = String(firstCover).replace(/-/g, "/");
            imageUrl = `https://resources.tidal.com/images/${formattedId}/1080x1080.jpg`;
          }
        }
        if (!imageUrl) {
          imageUrl = "https://monochrome.tf/assets/appicon.png";
        }
        const description = `Playlist \u2022 ${trackCount} Tracks \u2022 ${durationStr}
Listen on Monochrome`;
        const pageUrl = new URL(request.url).href;
        const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.playlist">
                        <meta property="og:url" content="${pageUrl}">
                        <meta property="music:song_count" content="${trackCount}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Playlist Cover">
                    </body>
                    </html>
                `;
        return new Response(metaHtml, { headers: { "content-type": "text/html;charset=UTF-8" } });
      }
    } catch (error) {
      console.error(`Error for user playlist ${playlistId}:`, error);
    }
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest9, "onRequest");

// about/index.js
async function onRequest10(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | About</title>
                <meta name="description" content="A minimalist music streaming application">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | About">
                <meta property="og:description" content="A minimalist music streaming application">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | About">
                <meta name="twitter:description" content="A minimalist music streaming application">
            </head>
            <body>
                <h1>Monochrome Music | About</h1>
                <p>A minimalist music streaming application</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest10, "onRequest");

// donate/index.js
async function onRequest11(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | Donate</title>
                <meta name="description" content="A minimalist music streaming application">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | Donate">
                <meta property="og:description" content="A minimalist music streaming application">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | Donate">
                <meta name="twitter:description" content="A minimalist music streaming application">
            </head>
            <body>
                <h1>Monochrome Music | Donate</h1>
                <p>A minimalist music streaming application</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest11, "onRequest");

// library/index.js
async function onRequest12(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | Library</title>
                <meta name="description" content="A minimalist music streaming application">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | Library">
                <meta property="og:description" content="A minimalist music streaming application">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | Library">
                <meta name="twitter:description" content="A minimalist music streaming application">
            </head>
            <body>
                <h1>Monochrome Music | Library</h1>
                <p>A minimalist music streaming application</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest12, "onRequest");

// parties/index.js
async function onRequest13(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | Listening Parties</title>
                <meta name="description" content="Listen to music with your friends">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | Listening Parties">
                <meta property="og:description" content="Listen to music with your friends">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | Listening Parties">
                <meta name="twitter:description" content="Listen to music with your friends">
            </head>
            <body>
                <h1>Monochrome Music | Listening Parties</h1>
                <p>Listen to music with your friends</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest13, "onRequest");

// recent/index.js
async function onRequest14(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | Recent</title>
                <meta name="description" content="A minimalist music streaming application">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | Recent">
                <meta property="og:description" content="A minimalist music streaming application">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | Recent">
                <meta name="twitter:description" content="A minimalist music streaming application">
            </head>
            <body>
                <h1>Monochrome Music | Recent</h1>
                <p>A minimalist music streaming application</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest14, "onRequest");

// settings/index.js
async function onRequest15(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Monochrome Music | Settings</title>
                <meta name="description" content="A minimalist music streaming application">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="Monochrome">
                <meta property="og:title" content="Monochrome Music | Settings">
                <meta property="og:description" content="A minimalist music streaming application">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="Monochrome Music | Settings">
                <meta name="twitter:description" content="A minimalist music streaming application">
            </head>
            <body>
                <h1>Monochrome Music | Settings</h1>
                <p>A minimalist music streaming application</p>
            </body>
            </html>
        `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest15, "onRequest");

// unreleased/index.js
async function onRequest16(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
    userAgent
  );
  if (isBot) {
    const pageUrl = request.url;
    const metaHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Monochrome Music | Unreleased</title>
            <meta name="description" content="Stream unreleased music on Monochrome. Provided by Artistgrid.">
            <meta name="theme-color" content="#000000">

            <meta property="og:site_name" content="Monochrome">
            <meta property="og:title" content="Monochrome Music | Unreleased">
            <meta property="og:description" content="Stream unreleased music on Monochrome. Provided by Artistgrid.">
            <meta property="og:type" content="website">
            <meta property="og:url" content="${pageUrl}">

            <meta name="twitter:card" content="summary">
            <meta name="twitter:title" content="Monochrome Music | Unreleased">
            <meta name="twitter:description" content="Stream unreleased music on Monochrome. Provided by Artistgrid.">
        </head>
        <body>
            <h1>Monochrome Music | Unreleased</h1>
            <p>Stream unreleased music on Monochrome. Provided by Artistgrid.</p>
        </body>
        </html>
    `;
    return new Response(metaHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
  const url = new URL(request.url);
  url.pathname = "/";
  return env.ASSETS.fetch(new Request(url, request));
}
__name(onRequest16, "onRequest");

// ../.wrangler/tmp/pages-n7vGYH/functionsRoutes-0.8307975044851406.mjs
var routes = [
  {
    routePath: "/album/t/:id",
    mountPath: "/album/t",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/artist/t/:id",
    mountPath: "/artist/t",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/playlist/t/:id",
    mountPath: "/playlist/t",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/track/t/:id",
    mountPath: "/track/t",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/unreleased/:sheetId/:projectName",
    mountPath: "/unreleased/:sheetId",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/album/:id",
    mountPath: "/album",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/artist/:id",
    mountPath: "/artist",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/playlist/:id",
    mountPath: "/playlist",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/podcasts/:id",
    mountPath: "/podcasts",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/track/:id",
    mountPath: "/track",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/unreleased/:sheetId",
    mountPath: "/unreleased",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/user/@:username",
    mountPath: "/user",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/userplaylist/:id",
    mountPath: "/userplaylist",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/about",
    mountPath: "/about",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/donate",
    mountPath: "/donate",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/library",
    mountPath: "/library",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/parties",
    mountPath: "/parties",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/recent",
    mountPath: "/recent",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/settings",
    mountPath: "/settings",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/unreleased",
    mountPath: "/unreleased",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  }
];

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-wbxhNj/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-wbxhNj/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.02525270312858585.mjs.map
