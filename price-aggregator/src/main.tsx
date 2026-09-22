import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PremiumApp from './PremiumApp';
import LanguageGuard from './LanguageGuard';
import './catalog-cache';
import './premium.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageGuard />
    <PremiumApp />
  </StrictMode>,
);
