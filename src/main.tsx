import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {redirectPreviewToProduction} from './lib/authConfig';
import './index.css';

if (!redirectPreviewToProduction()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
