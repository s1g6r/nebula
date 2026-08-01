import { Moon, Sun, Network, FileText, CalendarDays, Sparkles, Menu } from 'lucide-react';

interface TopBarProps {
  view: 'notes' | 'graph';
  onViewChange: (v: 'notes' | 'graph') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenToday: () => void;
  onOpenSidebar: () => void;
}

export function TopBar({ view, onViewChange, theme, onToggleTheme, onOpenToday, onOpenSidebar }: TopBarProps) {
  return (
    <div className="h-13 shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0b0e1a]/70 backdrop-blur-sm">
      <button
        onClick={onOpenSidebar}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors -ml-1"
        title="Open notes list"
      >
        <Menu size={18} />
      </button>
      <div className="flex items-center gap-1.5 font-semibold text-[15px] text-violet-600 dark:text-violet-400 select-none pr-1">
        <Sparkles size={17} strokeWidth={2.2} />
        <span className="hidden sm:inline">Nebula</span>
      </div>

      <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5 ml-1">
        <button
          onClick={() => onViewChange('notes')}
          className={`flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-md transition-colors ${
            view === 'notes'
              ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <FileText size={14} /> Notes
        </button>
        <button
          onClick={() => onViewChange('graph')}
          className={`flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-md transition-colors ${
            view === 'graph'
              ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Network size={14} /> Graph
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onOpenToday}
        className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Open today's daily note"
      >
        <CalendarDays size={14} /> Today
      </button>

      <button
        onClick={onToggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
