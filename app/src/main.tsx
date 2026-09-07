import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Не знайдено #root — перевір index.html');

createRoot(container).render(
  <StrictMode>
    <PorscheDesignSystemProvider>
      <App />
    </PorscheDesignSystemProvider>
  </StrictMode>
);
