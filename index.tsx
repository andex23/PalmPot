import React from 'react';
import ReactDOM from 'react-dom/client';
import PalmPotAVD from './NaijaBitesAVD';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PalmPotAVD />
  </React.StrictMode>
);