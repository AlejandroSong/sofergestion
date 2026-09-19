import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {redirectPreviewToProduction} from './lib/authConfig';
import {isNativeShell} from './lib/googleAuth';
import './index.css';

if (!isNativeShell() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

if (!redirectPreviewToProduction()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
