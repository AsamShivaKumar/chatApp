import React from 'react';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home';
import Login from './pages/Login';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CookiesProvider>
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<h1>Not found!!</h1>} />
        </Routes>
    </BrowserRouter>
  </CookiesProvider>
);