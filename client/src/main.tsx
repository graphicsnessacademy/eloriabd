import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { SiteConfigProvider } from './context/SiteConfigContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteConfigProvider>
      <AuthProvider> {/* 2. Wrap here */}
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </SiteConfigProvider>
  </StrictMode>,
)
