import { useState } from 'react';
import LandingPage from './components/LandingPage';
import ResultsDashboard from './components/ResultsDashboard';
import LoadingScreen from './components/LoadingScreen';
import ManualInputModal from './components/ManualInputModal';

function App() {
  const [view, setView] = useState('landing'); // landing | loading | results | manual
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [partialData, setPartialData] = useState(null);

  const handleAnalyze = async (url, overrides = {}) => {
    setView('loading');
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...overrides }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisData(data);
        setView('results');
      } else if (data.needsManualInput) {
        // Price couldn't be extracted, show manual input form
        setPendingUrl(url);
        setPartialData(data.partialData);
        setView('manual');
      } else {
        setError(data.error || 'Analysis failed');
        setView('landing');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running.');
      setView('landing');
    }
  };

  const handleManualSubmit = (overrides) => {
    handleAnalyze(pendingUrl, overrides);
  };

  const handleReset = () => {
    setView('landing');
    setAnalysisData(null);
    setError(null);
    setPendingUrl('');
    setPartialData(null);
  };

  return (
    <div className="min-h-screen relative">
      {/* Main content */}
      {view === 'landing' && (
        <LandingPage onAnalyze={handleAnalyze} error={error} />
      )}
      {view === 'loading' && <LoadingScreen />}
      {view === 'manual' && (
        <ManualInputModal
          partialData={partialData}
          url={pendingUrl}
          onSubmit={handleManualSubmit}
          onCancel={handleReset}
        />
      )}
      {view === 'results' && analysisData && (
        <ResultsDashboard data={analysisData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
