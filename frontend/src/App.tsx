import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Health from './pages/Health';
import Insights from './pages/Insights';
import Drills from './pages/Drills';
import Matchmaking from './pages/Matchmaking';
import Winners from './pages/Winners';

const App: React.FC = () => {
  return (
    <div>
      <nav style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/insights">Insights</Link>
        <Link to="/drills">Drills</Link>
        <Link to="/matchmaking">Matchmaking</Link>
        <Link to="/winners">Winners</Link>
        <Link to="/health">Health</Link>
      </nav>
      <main style={{ padding: '16px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/health" element={<Health />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/winners" element={<Winners />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

