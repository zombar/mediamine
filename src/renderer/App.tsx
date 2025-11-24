import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [pingResult, setPingResult] = useState<string>('');

  useEffect(() => {
    // Test IPC communication
    window.electron.ipcRenderer.invoke('ping').then((result) => {
      setPingResult(result);
    });
  }, []);

  return (
    <div className="app">
      <header data-testid="app-header" className="app-header">
        <h1>MediaMine Video Player</h1>
      </header>
      <main data-testid="main-container" className="main-container">
        <p>Welcome to MediaMine - Your Advanced Video Player</p>
        {pingResult && <p data-testid="ipc-test">IPC Test: {pingResult}</p>}
      </main>
    </div>
  );
}

export default App;
