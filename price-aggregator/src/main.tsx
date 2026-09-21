import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PremiumApp from './PremiumApp';
import LanguageGuard from './LanguageGuard';
import OttocastFeed from './OttocastFeed';
import './premium.css';
import './ottocast-feed.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageGuard />
    <PremiumApp />
    <OttocastFeed />
  </StrictMode>,
);
