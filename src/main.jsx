import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LeadsProvider } from './context/LeadsContext';
import { App } from './App';
import 'remixicon/fonts/remixicon.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <LeadsProvider>
              <App />
            </LeadsProvider>
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
