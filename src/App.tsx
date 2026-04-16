import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HallListPage from './pages/HallListPage';
import HallDetailPage from './pages/HallDetailPage';
import FloorMapPage from './pages/FloorMapPage';
import MachineDetailPage from './pages/MachineDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HallListPage />} />
        <Route path="/halls/:hallId" element={<HallDetailPage />} />
        <Route path="/halls/:hallId/map" element={<FloorMapPage />} />
        <Route path="/halls/:hallId/machines/:machineId" element={<MachineDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
