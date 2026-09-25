import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/impeccable.css';
import './styles/taste-tokens.css';
import 'katex/dist/katex.min.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
