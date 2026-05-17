// WORKER: CORS utilities - inline to avoid import issues
export const corsHelpers = {
    getAllowedOrigins(env) {
        if (!env || !env.ALLOWED_ORIGINS) {
            return ['http://localhost:5173', 'http://localhost:4173'];
        }
        return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    },

    getOrigin(request, allowedOrigins) {
        const origin = request.headers.get('origin');
        return origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*';
    },

    handlePreflight(request, origins) {
        if (request.method !== 'OPTIONS') return null;
        const origin = this.getOrigin(request, origins);
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    },

    addHeaders(response, request, origins) {
        const origin = this.getOrigin(request, origins);
        const newResp = new Response(response.body, response);
        newResp.headers.set('Access-Control-Allow-Origin', origin);
        newResp.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newResp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return newResp;
    },
};
