// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // Asegúrate de que este archivo exista para tus estilos de Tailwind
import App from './App';
import './index.css';

// Creamos el root apuntando al ID que definiste en el public/index.html
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("No se encontró el elemento raíz. Asegúrate de que index.html tenga un <div id='root'></div>");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);