import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Settings } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center shadow">
        <h1 className="text-lg font-bold flex-1">パチ管理</h1>
        <button
          className="p-2 text-blue-200 active:text-white"
          aria-label="設定"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* メニュー */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-10">
        <button
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 px-6 py-7 active:bg-gray-50 transition-colors"
          onClick={() => navigate('/halls')}
        >
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 size={30} className="text-blue-700" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-gray-800">ホール管理</p>
            <p className="text-sm text-gray-500 mt-0.5">ホールの情報・カレンダーを管理</p>
          </div>
        </button>

        <button
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 px-6 py-7 active:bg-gray-50 transition-colors"
          onClick={() => navigate('/events')}
        >
          <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <CalendarDays size={30} className="text-purple-700" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-gray-800">イベントDB</p>
            <p className="text-sm text-gray-500 mt-0.5">媒体・イベントテンプレートを管理</p>
          </div>
        </button>
      </div>
    </div>
  );
}
