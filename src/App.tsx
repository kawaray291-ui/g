import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HallListPage from './pages/HallListPage';
import FloorMapPage from './pages/FloorMapPage';
import MachineDetailPage from './pages/MachineDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HallListPage />} />
        <Route path="/halls/:hallId" element={<FloorMapPage />} />
        <Route path="/halls/:hallId/machines/:machineId" element={<MachineDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
