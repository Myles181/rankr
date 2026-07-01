import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ArtistDashboard from './pages/ArtistDashboard';
import FanDashboard from './pages/FanDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/artist" element={<ArtistDashboard />} />
        <Route path="/fan" element={<FanDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
