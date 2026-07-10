export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    if (!url.pathname.includes('.')) {
      const fallback = new URL('/index.html', url);
      return env.ASSETS.fetch(new Request(fallback, request));
    }

    return response;
  },
};
