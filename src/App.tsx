import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HallListPage from './pages/HallListPage';
import HallDetailPage from './pages/HallDetailPage';
import FloorMapPage from './pages/FloorMapPage';
import DailyFloorMapPage from './pages/DailyFloorMapPage';
import MachineDetailPage from './pages/MachineDetailPage';
import EventDBPage from './pages/EventDBPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/halls" element={<HallListPage />} />
        <Route path="/halls/:hallId" element={<HallDetailPage />} />
        <Route path="/halls/:hallId/map" element={<FloorMapPage />} />
        <Route path="/halls/:hallId/map/daily/:date" element={<DailyFloorMapPage />} />
        <Route path="/halls/:hallId/machines/:machineId" element={<MachineDetailPage />} />
        <Route path="/events" element={<EventDBPage />} />
      </Routes>
    </BrowserRouter>
  );
}
