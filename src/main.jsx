import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import AppMVP from './AppMVP.jsx'
import InvestmentThesis from './InvestmentThesis.jsx'
import MvpDashboard from './MvpDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<App />} />
        <Route path="/mvp" element={<AppMVP />} />
        <Route path="/mvp/dashboard" element={<MvpDashboard />} />
        <Route path="/investment" element={<InvestmentThesis />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
