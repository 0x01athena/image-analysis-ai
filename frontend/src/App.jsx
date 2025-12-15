import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './pages/landing/LandingPage';
import SettingsPage from './pages/settings/SettingsPage';
import BatchProcessingPage from './pages/batch-processing/BatchProcessingPage';
import ProductsViewPage from './pages/products/ProductsViewPage';
import ProductDetailsPage from './pages/products/ProductDetailsPage';
import WorkerRegistrationPage from './pages/workers/WorkerRegistrationPage';
import ExportHistoryPage from './pages/exports/ExportHistoryPage';
import FoldersPage from './pages/folders/FoldersPage';
import { UploadProvider } from './contexts/UploadContext';
import "./App.css";

function App() {
  return (
    <UploadProvider>
      <Router>
        <div className="App h-screen flex flex-col">
          <Navigation />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/batch-processing" element={<BatchProcessingPage />} />
              <Route path="/products" element={<ProductsViewPage />} />
              <Route path="/products/:managementNumber" element={<ProductDetailsPage />} />
              <Route path="/workers" element={<WorkerRegistrationPage />} />
              <Route path="/export-history" element={<ExportHistoryPage />} />
              <Route path="/folders" element={<FoldersPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UploadProvider>
  );
}

export default App;
