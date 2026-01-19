import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { invoke } from '@withease/factories';
import { AppView } from './view/AppView';
import { createApp } from './models/app';
import { AppProvider } from './view/AppContext';
import './index.css';

const container = document.querySelector('#root') as HTMLElement;

const root = ReactDOM.createRoot(container);

function Root() {
  const [apps, setApps] = useState(() => [
    { id: 'initial', instance: invoke(createApp) },
  ]);

  const addApp = () => {
    setApps((prev) => [
      ...prev,
      { id: crypto.randomUUID(), instance: invoke(createApp) },
    ]);
  };

  return (
    <div className="apps-container">
      {apps.map(({ id, instance }) => (
        <AppProvider key={id} app={instance}>
          <AppView />
        </AppProvider>
      ))}
      <button
        className="add-app-button"
        onClick={addApp}
        title="Add another phone"
      >
        +
      </button>
    </div>
  );
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
