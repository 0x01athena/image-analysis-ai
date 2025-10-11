import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './pages/landing/LandingPage';
import SettingsPage from './pages/settings/SettingsPage';
import BatchProcessingPage from './pages/batch-processing/BatchProcessingPage';
import ResultsPage from './pages/results/ResultsPage';
import ProductsPage from './pages/products/ProductsPage';
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/batch-processing" element={<BatchProcessingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/products" element={<ProductsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
