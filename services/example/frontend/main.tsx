import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __SERVICE_CONTEXT__?: {
      service: {
        id: string;
        name: string;
        description?: string;
        proxy: {
          path: string;
          target?: string;
          rewrite?: string;
        };
      };
      user?: {
        username: string;
        roles: string[];
        services: string[];
      };
    };
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('缺少 #root 容器');

const root = createRoot(container);
root.render(<App context={window.__SERVICE_CONTEXT__} />);
