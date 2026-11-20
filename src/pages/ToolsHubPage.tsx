import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, Search, Star } from 'lucide-react';
import { ToolWorkspace } from '../components/tools/ToolWorkspace';
import { getToolById, TOOL_CATEGORIES, TOOLS_CATALOG } from '../data/toolsCatalog';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import type { ToolCategoryId } from '../types';

interface ToolsHubPageProps {
  store: LearningStoreApi;
  initialToolId?: string;
}

export function ToolsHubPage({ store, initialToolId }: ToolsHubPageProps) {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(initialToolId ?? null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId | 'all' | 'favorites'>('all');

  useEffect(() => {
    if (initialToolId) setSelectedToolId(initialToolId);
  }, [initialToolId]);

  const activeTool = selectedToolId ? getToolById(selectedToolId) : undefined;

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TOOLS_CATALOG.filter((tool) => {
      if (activeCategory === 'favorites' && !store.state.favoriteTools.includes(tool.id)) return false;
      if (activeCategory !== 'all' && activeCategory !== 'favorites' && tool.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortDesc.toLowerCase().includes(q) ||
        tool.categoryLabel.toLowerCase().includes(q) ||
        String(tool.number) === q
      );
    });
  }, [search, activeCategory, store.state.favoriteTools]);

  const recentTools = store.state.recentTools
    .map((r) => getToolById(r.toolId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 4);

  if (activeTool) {
    return (
      <ToolWorkspace
        tool={activeTool}
        store={store}
        onBack={() => setSelectedToolId(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-300">
            36 Essential Tools · 6 Academic Categories · AI + Zero-API Local Utilities
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Student Productivity Toolkit
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Every tool opens a dedicated workspace with input validation, copy/export controls, and real Gemini or local browser computation.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all 36 tools (e.g. OCR, SQL, CGPA)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1226] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Recently Used Strip */}
      {recentTools.length > 0 && !search && activeCategory === 'all' && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Recently Used
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedToolId(tool.id)}
                className="rounded-xl aryash-surface-solid p-4 hover:border-indigo-500/45 transition-colors text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {String(tool.number).padStart(2, '0')}. {tool.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{tool.categoryLabel}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0D1226] border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Tools (36)
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('favorites')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeCategory === 'favorites' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Favorites ({store.state.favoriteTools.length})
        </button>
        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-2xl aryash-surface-solid p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-200">No matching tools found</p>
          <p className="text-xs text-slate-400">Try a different search keyword or switch back to All Tools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isFav = store.state.favoriteTools.includes(tool.id);
            return (
              <div
                key={tool.id}
                className="group rounded-2xl aryash-surface-solid p-5 hover:border-indigo-500/45 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedToolId(tool.id)}
                      className="text-left cursor-pointer space-y-1 flex-1 min-w-0"
                    >
                      <p className="text-xs text-slate-400">
                        <span className="font-mono text-indigo-300">#{String(tool.number).padStart(2, '0')}</span>
                        {' · '}
                        <span>{tool.categoryLabel}</span>
                        {' · '}
                        <span>{tool.requiresAI ? 'AI' : 'Instant Local'}</span>
                      </p>
                      <h3 className="font-display text-base font-semibold text-white group-hover:text-indigo-200 transition-colors">
                        {tool.name}
                      </h3>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.toggleFavoriteTool(tool.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-300 cursor-pointer shrink-0"
                      aria-label={isFav ? `Remove ${tool.name} from favorites` : `Favorite ${tool.name}`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-300 text-amber-300' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{tool.shortDesc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedToolId(tool.id)}
                    className="text-xs font-semibold text-indigo-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Open Tool
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
