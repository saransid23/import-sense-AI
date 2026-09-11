import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ResultsDashboard from './components/ResultsDashboard';
import LoadingScreen from './components/LoadingScreen';
import ManualInputModal from './components/ManualInputModal';
import FaviconPreloader from './components/FaviconPreloader';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [view, setView] = useState('landing'); // landing | loading | results | manual
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [partialData, setPartialData] = useState(null);
  const [stepStates, setStepStates] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalyzeFallback = async (url, overrides = {}) => {
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

  const handleAnalyze = (url, overrides = {}) => {
    setView('loading');
    setError(null);
    setStepStates({});

    const query = new URLSearchParams({ url, ...overrides });
    const streamUrl = `/api/analyze/stream?${query.toString()}`;

    let eventSource;
    let receivedAnyUpdate = false;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('agent-update', (e) => {
        receivedAnyUpdate = true;
        try {
          const update = JSON.parse(e.data);
          setStepStates((prev) => ({
            ...prev,
            [update.agent]: { status: update.status, extra: update.extra },
          }));
        } catch (err) {
          console.error('Failed to parse SSE update:', err);
        }
      });

      eventSource.addEventListener('complete', (e) => {
        eventSource.close();
        try {
          const data = JSON.parse(e.data);
          if (data.success) {
            setAnalysisData(data);
            setView('results');
          } else if (data.needsManualInput) {
            setPendingUrl(url);
            setPartialData(data.partialData);
            setView('manual');
          } else {
            setError(data.error || 'Analysis failed');
            setView('landing');
          }
        } catch (err) {
          handleAnalyzeFallback(url, overrides);
        }
      });

      eventSource.addEventListener('error', () => {
        eventSource.close();
        if (!receivedAnyUpdate) {
          console.warn('[SSE] EventSource failed, falling back to POST /api/analyze');
          handleAnalyzeFallback(url, overrides);
        } else {
          setError('Analysis connection closed unexpectedly. Please try again.');
          setView('landing');
        }
      });
    } catch (err) {
      console.warn('[SSE] EventSource init failed, falling back to POST /api/analyze');
      handleAnalyzeFallback(url, overrides);
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
    setStepStates({});
  };

  return (
    <div className="min-h-screen relative">
      {isInitializing && (
        <FaviconPreloader 
          fullScreen 
          size="lg" 
          text="ImportSense AI" 
          subtext="Initializing Regulatory Intelligence Engine..." 
        />
      )}
      {/* Main content */}
      {!isInitializing && view === 'landing' && (
        <LandingPage onAnalyze={handleAnalyze} error={error} />
      )}
      {!isInitializing && view === 'loading' && <LoadingScreen stepStates={stepStates} />}
      {!isInitializing && view === 'manual' && (
        <ManualInputModal
          partialData={partialData}
          url={pendingUrl}
          onSubmit={handleManualSubmit}
          onCancel={handleReset}
        />
      )}
      {!isInitializing && view === 'results' && analysisData && (
        <ResultsDashboard data={analysisData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
