import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {redirectPreviewToProduction} from './lib/authConfig';
import './index.css';

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      void reg.unregister();
    });
  });
}

const root = document.getElementById('root');
if (root && !redirectPreviewToProduction()) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
