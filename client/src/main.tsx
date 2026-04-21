import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './context/StoreContext';
import { SiteConfigProvider } from './context/SiteConfigContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteConfigProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </SiteConfigProvider>
  </StrictMode>,
)
