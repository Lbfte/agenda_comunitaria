import { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 seconds splash screen
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="splash-container">
        <img src="/logo.png" alt="Agenda Comunitária Logo" className="splash-logo" />
      </div>
    );
  }

  return <Home />;
}

export default App;
