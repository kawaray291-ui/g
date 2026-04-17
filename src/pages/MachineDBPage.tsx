import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory, Monitor } from 'lucide-react';

export default function MachineDBPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate('/')} className="active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">台情報DB</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-10">
        <button
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 px-6 py-7 active:bg-gray-50 transition-colors"
          onClick={() => navigate('/machine-db/makers')}
        >
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Factory size={30} className="text-orange-600" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-gray-800">メーカーDB</p>
            <p className="text-sm text-gray-500 mt-0.5">メーカー情報を管理</p>
          </div>
        </button>

        <button
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 px-6 py-7 active:bg-gray-50 transition-colors"
          onClick={() => navigate('/machine-db/machines')}
        >
          <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Monitor size={30} className="text-teal-600" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-gray-800">機種DB</p>
            <p className="text-sm text-gray-500 mt-0.5">機種情報を管理</p>
          </div>
        </button>
      </div>
    </div>
  );
}
