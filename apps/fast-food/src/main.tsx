import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppView } from './view/AppView';
import './index.css';

const container = document.querySelector('#root') as HTMLElement;

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AppView />
  </React.StrictMode>,
);
