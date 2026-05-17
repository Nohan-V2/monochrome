/**
 * CORS Helper for Cloudflare Workers
 * Provides utilities for handling CORS headers and preflight requests
 */

// WORKER: CORS configuration from environment or defaults
export function getAllowedOrigins(env) {
    if (!env.ALLOWED_ORIGINS) {
        return [
            'http://localhost:5173',
            'http://localhost:4173',
            'https://YOUR_VERCEL_DOMAIN.vercel.app', // WORKER: default Vercel production origin placeholder
        ];
    }
    return env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
}

// WORKER: Get the origin from request or default to the first allowed origin
export function getOrigin(request, allowedOrigins) {
    const requestOrigin = request.headers.get('origin');
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
    }
    return allowedOrigins[0] || '*';
}

// WORKER: Handle CORS preflight (OPTIONS) requests
export function handleCORSPreflight(request, allowedOrigins) {
    if (request.method === 'OPTIONS') {
        const origin = getOrigin(request, allowedOrigins);
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }
    return null;
}

// WORKER: Add CORS headers to response
export function addCORSHeaders(response, request, allowedOrigins) {
    const origin = getOrigin(request, allowedOrigins);
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return newResponse;
}
