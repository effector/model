import React from 'react';
import ReactDOM from 'react-dom/client';
import { invoke } from '@withease/factories';
import { AppView } from './view/AppView';
import { createApp } from './models/app';
import { AppProvider } from './view/AppContext';
import './index.css';

const container = document.querySelector('#root') as HTMLElement;

const root = ReactDOM.createRoot(container);

const app1 = invoke(createApp);
const app2 = invoke(createApp);

root.render(
  <React.StrictMode>
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <AppProvider app={app1}>
        <AppView />
      </AppProvider>
      <AppProvider app={app2}>
        <AppView />
      </AppProvider>
    </div>
  </React.StrictMode>,
);
