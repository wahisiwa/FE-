/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Menu,
  X,
  Star,
  CheckCircle,
  Trophy,
  BrainCircuit,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { studyData, Category, Term } from './data';

type ViewMode = 'list' | 'flashcards' | 'quiz';

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Review States
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [showOnlyReview, setShowOnlyReview] = useState(false);

  // Flashcard & Quiz state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Load progress from LocalStorage
  useEffect(() => {
    const savedMastered = localStorage.getItem('fe_mastered_ids');
    const savedReview = localStorage.getItem('fe_review_ids');
    if (savedMastered) setMasteredIds(new Set(JSON.parse(savedMastered)));
    if (savedReview) setReviewIds(new Set(JSON.parse(savedReview)));
  }, []);

  // Save progress to LocalStorage
  useEffect(() => {
    localStorage.setItem('fe_mastered_ids', JSON.stringify(Array.from(masteredIds)));
  }, [masteredIds]);

  useEffect(() => {
    localStorage.setItem('fe_review_ids', JSON.stringify(Array.from(reviewIds)));
  }, [reviewIds]);

  const allTerms = useMemo(() => studyData.flatMap(c => c.terms), []);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === 'all') return { id: 'all', title: '全カテゴリ', terms: allTerms };
    return studyData.find(c => c.id === selectedCategoryId) || studyData[0];
  }, [selectedCategoryId, allTerms]);

  const filteredTerms = useMemo(() => {
    let terms = selectedCategory.terms;
    if (showOnlyReview) {
      terms = terms.filter(t => reviewIds.has(t.id));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(t => 
        t.term.toLowerCase().includes(query) || 
        t.meaning.toLowerCase().includes(query) ||
        t.points.toLowerCase().includes(query)
      );
    }
    return terms;
  }, [selectedCategory, searchQuery, showOnlyReview, reviewIds]);

  // Initialize shuffled indices when terms change
  useEffect(() => {
    const indices = Array.from({ length: filteredTerms.length }, (_, i) => i);
    setShuffledIndices(indices);
    setCurrentCardIndex(0);
  }, [filteredTerms]);

  const shuffleTerms = () => {
    const newIndices = [...shuffledIndices];
    for (let i = newIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newIndices[i], newIndices[j]] = [newIndices[j], newIndices[i]];
    }
    setShuffledIndices(newIndices);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const currentTerm = useMemo(() => {
    if (filteredTerms.length === 0) return null;
    const index = shuffledIndices[currentCardIndex] ?? 0;
    return filteredTerms[index] || filteredTerms[0];
  }, [filteredTerms, shuffledIndices, currentCardIndex]);

  const toggleMastered = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSet = new Set(masteredIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setMasteredIds(newSet);
  };

  const toggleReview = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSet = new Set(reviewIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setReviewIds(newSet);
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsSidebarOpen(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredTerms.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredTerms.length) % filteredTerms.length);
    }, 150);
  };

  const resetProgress = () => {
    if (window.confirm('学習進捗をリセットしますか？')) {
      setMasteredIds(new Set());
      setReviewIds(new Set());
      localStorage.removeItem('fe_mastered_ids');
      localStorage.removeItem('fe_review_ids');
    }
  };

  const getCategoryStats = (category: Category) => {
    const masteredCount = category.terms.filter(t => masteredIds.has(t.id)).length;
    return { mastered: masteredCount, total: category.terms.length };
  };

  const getCategoryProgress = (category: Category) => {
    const { mastered, total } = getCategoryStats(category);
    return (mastered / total) * 100;
  };

  const totalProgress = useMemo(() => {
    const masteredCount = allTerms.filter(t => masteredIds.has(t.id)).length;
    return (masteredCount / allTerms.length) * 100;
  }, [allTerms, masteredIds]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Mobile Header */}
      <header className="md:hidden glass p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">FE</div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">Syllabus 9.2</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Study Guide</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full active:scale-90 transition-transform"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 bg-[var(--color-bg)] md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full md:w-80 border-r border-[var(--color-line)] flex flex-col
      `}>
        <div className="p-8 border-b border-[var(--color-line)] hidden md:block">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl">FE</div>
            <h1 className="text-xl font-bold tracking-tight">Syllabus 9.2</h1>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Fundamental IT Engineer</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Navigation</div>
          <button
            onClick={() => handleCategoryChange('all')}
            className={`
              w-full text-left px-4 py-4 rounded-2xl transition-all duration-200 flex items-center justify-between group
              ${selectedCategoryId === 'all' ? 'bg-[#1A1A1A] text-white shadow-xl scale-[1.02]' : 'hover:bg-gray-100'}
            `}
          >
            <div className="flex items-center gap-3">
              <LayoutGrid size={18} className={selectedCategoryId === 'all' ? 'text-yellow-400' : 'text-gray-400'} />
              <span className="text-sm font-bold">全カテゴリ表示</span>
            </div>
            {selectedCategoryId === 'all' && <ChevronRight size={16} />}
          </button>

              <div className="px-4 py-3 mt-6 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold flex justify-between items-center">
                <span>Categories</span>
                <button onClick={resetProgress} className="text-red-400 hover:text-red-500 transition-colors">Reset</button>
              </div>
              {studyData.map((category) => {
                const stats = getCategoryStats(category);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`
                      w-full text-left px-4 py-4 rounded-2xl transition-all duration-200 flex flex-col group mb-1
                      ${selectedCategoryId === category.id ? 'bg-[#1A1A1A] text-white shadow-xl scale-[1.02]' : 'hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-sm font-bold truncate pr-2">{category.title}</span>
                      {selectedCategoryId === category.id && <ChevronRight size={16} className="text-yellow-400" />}
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5 opacity-60 font-bold">
                      <span>{stats.mastered} / {stats.total} Mastered</span>
                      <span>{Math.round((stats.mastered / stats.total) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${selectedCategoryId === category.id ? 'bg-yellow-400' : 'bg-[#1A1A1A]'}`}
                        style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
        </nav>

        <div className="p-6 border-t border-[var(--color-line)] bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <Trophy size={14} className="text-yellow-500" />
              <span>Overall Progress</span>
            </div>
            <span className="text-xs font-bold">{Math.round(totalProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              className="h-full bg-[#1A1A1A]"
            ></motion.div>
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-gray-400 font-bold">
            <span>{masteredIds.size} MASTERED</span>
            <span>{allTerms.length} TOTAL</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation & Search */}
        <div className="sticky top-[73px] md:top-0 z-30 glass p-4 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-2 flex-1 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="キーワードで検索..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--color-line)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowOnlyReview(!showOnlyReview)}
                className={`
                  px-5 py-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95
                  ${showOnlyReview ? 'bg-yellow-400 border-yellow-500 text-[#1A1A1A]' : 'bg-white border-[var(--color-line)] text-gray-500 hover:bg-gray-50'}
                `}
              >
                <Star size={16} fill={showOnlyReview ? "currentColor" : "none"} />
                復習対象
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl self-stretch lg:self-auto">
              {[
                { id: 'list', icon: BookOpen, label: 'List' },
                { id: 'flashcards', icon: Layers, label: 'Cards' },
                { id: 'quiz', icon: BrainCircuit, label: 'Quiz' }
              ].map((mode) => (
                <button 
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`
                    flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95
                    ${viewMode === mode.id ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-gray-400 hover:text-[#1A1A1A]'}
                  `}
                >
                  <mode.icon size={14} /> {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto"
              >
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((term, idx) => (
                    <div key={term.id} className={`term-card group ${masteredIds.has(term.id) ? 'opacity-40 grayscale-[0.8]' : ''}`}>
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">#{idx + 1}</span>
                          <h3 className="text-lg md:text-xl font-bold tracking-tight leading-tight">{term.term}</h3>
                          {masteredIds.has(term.id) && (
                            <span className="bg-green-100 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Mastered</span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={(e) => toggleReview(term.id, e)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 ${reviewIds.has(term.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                          >
                            <Star size={18} fill={reviewIds.has(term.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={(e) => toggleMastered(term.id, e)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 ${masteredIds.has(term.id) ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                          >
                            <CheckCircle size={18} fill={masteredIds.has(term.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div>
                          <span className="col-header">解説</span>
                          <p className="text-[15px] md:text-base leading-relaxed text-gray-600 font-medium">{term.meaning}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex-1">
                            <span className="col-header">重要ポイント</span>
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                              <p className="text-sm font-bold text-gray-500 italic leading-snug">{term.points}</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#1A1A1A] transition-colors ml-4">
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-white border border-dashed border-gray-200 rounded-full flex items-center justify-center text-gray-300">
                      <Search size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-400">用語が見つかりません</p>
                      <p className="text-sm text-gray-300 mt-1">検索ワードを変えてみてください</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : viewMode === 'flashcards' ? (
              <motion.div 
                key="flashcards"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto"
              >
                {filteredTerms.length > 0 && currentTerm ? (
                  <>
                    <div className="w-full aspect-[4/5] md:aspect-[16/10] perspective-2000 mb-8">
                      <div 
                        className={`flashcard-inner cursor-pointer ${isFlipped ? 'flashcard-flipped' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <div className="flashcard-front">
                          <div className="absolute top-6 left-6 flex gap-2">
                            {reviewIds.has(currentTerm.id) && <Star size={20} fill="#EAB308" className="text-yellow-500" />}
                            {masteredIds.has(currentTerm.id) && <CheckCircle size={20} fill="#22C55E" className="text-green-500" />}
                          </div>
                          <span className="col-header mb-6">用語</span>
                          <h3 className="text-3xl md:text-5xl font-bold text-center px-6 leading-tight tracking-tight">
                            {currentTerm.term}
                          </h3>
                          <div className="mt-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
                            <RotateCcw size={12} /> Tap to flip
                          </div>
                        </div>
                        <div className="flashcard-back">
                          <span className="col-header mb-6">解説</span>
                          <p className="text-lg md:text-2xl text-center mb-8 px-6 leading-relaxed font-bold text-gray-700">
                            {currentTerm.meaning}
                          </p>
                          <div className="w-12 h-1 bg-gray-100 rounded-full mb-8"></div>
                          <span className="col-header mb-3">重要ポイント</span>
                          <p className="text-sm md:text-base text-center px-8 text-gray-400 font-bold italic">
                            {currentTerm.points}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-8 w-full px-2">
                      <div className="flex items-center justify-center gap-3 w-full max-w-sm">
                        <button 
                          onClick={(e) => toggleReview(currentTerm.id, e)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 ${reviewIds.has(currentTerm.id) ? 'bg-yellow-400 text-[#1A1A1A]' : 'bg-white border border-[var(--color-line)] text-gray-400'}`}
                        >
                          <Star size={18} fill={reviewIds.has(currentTerm.id) ? "currentColor" : "none"} />
                          復習
                        </button>
                        <button 
                          onClick={(e) => toggleMastered(currentTerm.id, e)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 ${masteredIds.has(currentTerm.id) ? 'bg-green-500 text-white' : 'bg-white border border-[var(--color-line)] text-gray-400'}`}
                        >
                          <CheckCircle size={18} fill={masteredIds.has(currentTerm.id) ? "currentColor" : "none"} />
                          習得
                        </button>
                      </div>

                      <div className="flex items-center gap-8">
                        <button onClick={prevCard} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-[var(--color-line)] active:scale-90 transition-all shadow-lg">
                          <ChevronLeft size={24} />
                        </button>
                        <div className="flex flex-col items-center min-w-[80px]">
                          <div className="text-xl font-bold tracking-tighter">
                            {currentCardIndex + 1} <span className="text-gray-200 mx-0.5">/</span> {filteredTerms.length}
                          </div>
                          <button onClick={shuffleTerms} className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500 mt-1 flex items-center gap-1 hover:underline">
                            <RotateCcw size={10} /> Shuffle
                          </button>
                        </div>
                        <button onClick={nextCard} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-[var(--color-line)] active:scale-90 transition-all shadow-lg">
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-24 text-center text-gray-400 font-bold italic">対象の用語がありません</div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto"
              >
                <div className="text-center mb-8 px-4">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Quiz Mode</h2>
                  <p className="text-sm text-gray-400 font-bold">解説文から正しい用語を導き出しましょう。</p>
                </div>

                {filteredTerms.length > 0 && currentTerm ? (
                  <div className="w-full bg-white border border-[var(--color-line)] rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
                      <motion.div 
                        className="h-full bg-[#1A1A1A]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentCardIndex + 1) / filteredTerms.length) * 100}%` }}
                      ></motion.div>
                    </div>

                    <div className="mb-10">
                      <div className="flex justify-between items-center mb-4">
                        <span className="col-header">Question</span>
                        <button onClick={shuffleTerms} className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                          <RotateCcw size={12} /> Shuffle
                        </button>
                      </div>
                      <p className="text-xl md:text-2xl font-bold leading-relaxed text-gray-700">
                        {currentTerm.meaning}
                      </p>
                    </div>

                    <div className="mb-10 p-6 md:p-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[160px]">
                      <span className="col-header mb-4">Answer</span>
                      <AnimatePresence mode="wait">
                        {isFlipped ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center text-center"
                          >
                            <h4 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">{currentTerm.term}</h4>
                            <p className="text-xs text-gray-400 font-bold italic leading-tight">{currentTerm.points}</p>
                          </motion.div>
                        ) : (
                          <button 
                            onClick={() => setIsFlipped(true)}
                            className="w-full h-full flex flex-col items-center justify-center gap-3 py-6 text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300 hover:text-[#1A1A1A] transition-colors"
                          >
                            <RotateCcw size={20} className="mb-2 opacity-50" />
                            Tap to reveal
                          </button>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center gap-3">
                      {isFlipped ? (
                        <>
                          <button 
                            onClick={() => {
                              toggleMastered(currentTerm.id);
                              nextCard();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-sm"
                          >
                            <CheckCircle size={18} /> 正解・習得
                          </button>
                          <button 
                            onClick={() => {
                              toggleReview(currentTerm.id);
                              nextCard();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-400 text-[#1A1A1A] rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-sm"
                          >
                            <Star size={18} /> 不正解・復習
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={nextCard}
                          className="w-full md:w-auto px-10 py-4 border border-[var(--color-line)] rounded-2xl font-bold text-xs text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all active:scale-95"
                        >
                          スキップ ({currentCardIndex + 1}/{filteredTerms.length})
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-gray-400 font-bold italic">対象の用語がありません</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
