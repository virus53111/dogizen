import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AggregatorApp from './AggregatorApp';
import LanguageGuard from './LanguageGuard';
import './catalog-cache';
import './aggregator.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageGuard />
    <AggregatorApp />
  </StrictMode>,
);
