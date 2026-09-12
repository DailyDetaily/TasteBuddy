import { configFromEnvironment, createApp } from '../integrations/chatgpt/app.mjs';

let app;

export default function handler(request, response) {
  try {
    app ??= createApp(configFromEnvironment(process.env));
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = 503;
    response.end(JSON.stringify({ error: 'connection_unavailable' }));
    return;
  }
  // Vercel may pass the internal destination rather than the original rewrite path.
  request.url = '/mcp';
  return app(request, response);
}
