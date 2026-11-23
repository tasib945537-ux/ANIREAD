import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseProvider } from './contexts/FirebaseContext';
import './index.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://aniread-api.onrender.com').replace(/\\/$/, '');
const nativeFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const originalUrl = input instanceof Request ? input.url : String(input);
  let targetUrl = originalUrl;
  if (originalUrl.startsWith('/api/')) targetUrl = `${apiBase}${originalUrl}`;
  else if (originalUrl.startsWith(`${window.location.origin}/api/`)) {
    targetUrl = `${apiBase}${originalUrl.slice(window.location.origin.length)}`;
  }
  return input instanceof Request
    ? nativeFetch(new Request(targetUrl, input), init)
    : nativeFetch(targetUrl, init);
}) as typeof window.fetch;

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </ErrorBoundary>
);
