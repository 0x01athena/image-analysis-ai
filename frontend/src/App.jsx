import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './pages/landing/LandingPage';
import ImageUploadPage from './pages/main/image-upload/ImageUploadPage';
import BatchProcessingPage from './pages/main/batch-processing/BatchProcessingPage';
import ResultsPage from './pages/main/results/ResultsPage';
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/image-upload" element={<ImageUploadPage />} />
            <Route path="/batch-processing" element={<BatchProcessingPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
