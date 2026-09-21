import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PremiumApp from './PremiumApp';
import './premium.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PremiumApp />
  </StrictMode>,
);
