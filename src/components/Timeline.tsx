import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Target, FileText, DollarSign, CheckCircle2, Search, Filter, ChevronDown, ChevronUp, Clock, Eye, EyeOff } from 'lucide-react';
import { RoadmapItem, ROADMAP_PHASES, getPhaseForItem, parseDetailedActionPlan } from '@/lib/supabase';
import { COMPREHENSIVE_ROADMAP_DATA, RoadmapItemDetailed, getPhaseForPeriod, getRoadmapItemsByPhase, searchRoadmapItems } from '@/lib/roadmapData';
import { useProgress } from '@/contexts/ProgressContext';

interface TimelineProps {
  roadmapItems: RoadmapItem[];
  onItemClick: (item: RoadmapItem) => void;
  selectedItem?: RoadmapItem | null;
}

export const Timeline: React.FC<TimelineProps> = ({ roadmapItems, onItemClick, selectedItem }) => {
  // Use comprehensive roadmap data
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'accordion'>('accordion');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);
  const itemsPerView = 6;
  const { progressStats, checkboxStates } = useProgress();

  // Get comprehensive roadmap data
  const comprehensiveData = COMPREHENSIVE_ROADMAP_DATA;

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = comprehensiveData;
    
    // Filter by phase
    if (selectedPhase) {
      filtered = filtered.filter(item => item.phase === selectedPhase);
    }
    
    // Search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.focus.toLowerCase().includes(query) ||
        item.action_plan.toLowerCase().includes(query) ||
        item.action_plan_detailed.some(action => action.toLowerCase().includes(query)) ||
        item.period.toLowerCase().includes(query) ||
        item.financial_note.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedPhase, comprehensiveData]);

  // Group items by phase for accordion view
  const itemsByPhase = useMemo(() => {
    const phases = Object.keys(ROADMAP_PHASES) as Array<keyof typeof ROADMAP_PHASES>;
    const grouped: Record<string, RoadmapItemDetailed[]> = {};
    
    phases.forEach(phase => {
      grouped[phase] = filteredData.filter(item => item.phase === phase);
    });
    
    return grouped;
  }, [filteredData]);

  // Group items by year for timeline view
  const itemsByYear = useMemo(() => {
    const grouped: Record<number, RoadmapItemDetailed[]> = {};
    filteredData.forEach(item => {
      if (!grouped[item.year]) {
        grouped[item.year] = [];
      }
      grouped[item.year].push(item);
    });
    return grouped;
  }, [filteredData]);

  const years = Object.keys(itemsByYear).map(Number).sort();
  const maxIndex = Math.max(0, filteredData.length - itemsPerView);

  // Toggle functions
  const togglePhaseExpansion = (phase: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex(prev => Math.min(prev + 6, maxIndex));
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 6, 0));
  };

  const goToYear = (year: number) => {
    const yearItems = itemsByYear[year];
    if (yearItems && yearItems.length > 0) {
      const firstItemOfYear = filteredData.findIndex(item => item.year === year);
      setCurrentIndex(Math.min(firstItemOfYear, maxIndex));
    }
  };

  // Get progress for a specific period
  const getPeriodProgress = (periodId: number) => {
    // Find the roadmap item for this period
    const item = filteredData.find(item => item.id === periodId);
    if (!item) return { completed: 0, total: 0, percentage: 0 };
    
    // Parse action items from the item
    const actionItems = typeof item.action_plan_detailed === 'string' 
      ? JSON.parse(item.action_plan_detailed || '[]')
      : (Array.isArray(item.action_plan_detailed) ? item.action_plan_detailed : []);
    
    const total = actionItems.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    
    // Count completed items from checkbox states
    let completed = 0;
    for (let i = 0; i < total; i++) {
      const key = `${periodId}_${i}`;
      if (checkboxStates[key]) {
        completed++;
      }
    }
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };

  const visibleItems = filteredData.slice(currentIndex, currentIndex + itemsPerView);

  // Convert comprehensive data item for compatibility
  const convertToRoadmapItem = (item: RoadmapItemDetailed): RoadmapItem => {
    return {
      id: item.id,
      period: item.period,
      year: item.year,
      month: item.month,
      month_name: item.month_name,
      focus: item.focus,
      action_plan: item.action_plan,
      action_plan_detailed: JSON.stringify(item.action_plan_detailed),
      financial_note: item.financial_note,
      status: item.status,
      status_color: item.status_color,
      sort_date: item.sort_date
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Timeline Roadmap Ekspor</h2>
            <p className="text-sm text-gray-600">6 Fase Strategis: Agustus 2025 - Desember 2030 (64+ Action Plans)</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('accordion')}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                viewMode === 'accordion' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2 inline" />
              Accordion
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                viewMode === 'timeline' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2 inline" />
              Timeline
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari action plan, fokus, atau periode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Phase Filter */}
          <div className="relative">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Fase</option>
              {Object.entries(ROADMAP_PHASES).map(([key, phase]) => (
                <option key={key} value={key}>{phase.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold text-gray-900">{filteredData.length}</span> dari <span className="font-semibold text-gray-900">{comprehensiveData.length}</span> periode
          </div>
          
          {/* Year Quick Navigation for Timeline Mode */}
          {viewMode === 'timeline' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 mr-2">Lompat ke:</span>
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => goToYear(year)}
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {viewMode === 'accordion' ? (
          /* Accordion View */
          <div className="space-y-4">
            {Object.entries(ROADMAP_PHASES).map(([phaseKey, phase]) => {
              const phaseItems = itemsByPhase[phaseKey] || [];
              const isExpanded = expandedPhases.has(phaseKey);
              
              if (phaseItems.length === 0) return null;
              
              return (
                <motion.div
                  key={phaseKey}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Phase Header */}
                  <button
                    onClick={() => togglePhaseExpansion(phaseKey)}
                    className={`w-full px-6 py-4 text-left transition-all duration-200 hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: phase.color }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {phaseItems.length} periode
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {/* Phase Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 bg-gray-50"
                      >
                        <div className="p-4 space-y-3">
                          {phaseItems.map((item) => {
                            const isItemExpanded = expandedItems.has(item.id);
                            const progress = getPeriodProgress(item.id);
                            
                            return (
                              <motion.div
                                key={item.id}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                                whileHover={{ scale: 1.01 }}
                              >
                                {/* Item Header */}
                                <div 
                                  className="p-4 cursor-pointer"
                                  onClick={() => onItemClick(convertToRoadmapItem(item))}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <h4 className="font-semibold text-gray-900">{item.period}</h4>
                                        <span 
                                          className="px-2 py-1 rounded-full text-xs font-medium"
                                          style={{ 
                                            backgroundColor: `${item.status_color}20`, 
                                            color: item.status_color 
                                          }}
                                        >
                                          {item.status}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium text-gray-800 mb-2">{item.focus}</p>
                                      <p className="text-sm text-gray-600 line-clamp-2">{item.action_plan}</p>
                                      
                                      {/* Progress Bar */}
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium text-gray-600">Progress:</span>
                                          <span className="text-xs text-gray-600">{progress.completed}/{progress.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${progress.percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItemExpansion(item.id);
                                      }}
                                      className="ml-4 p-1 hover:bg-gray-100 rounded"
                                    >
                                      {isItemExpanded ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Expanded Item Details */}
                                <AnimatePresence>
                                  {isItemExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-gray-100 bg-gray-50"
                                    >
                                      <div className="p-4">
                                        <h5 className="font-medium text-gray-900 mb-3">Action Plan Detail:</h5>
                                        <ul className="space-y-2">
                                          {item.action_plan_detailed.map((action, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                              <span className="text-sm text-gray-700">{action}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        
                                        {item.financial_note && (
                                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                              <DollarSign className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                              <div>
                                                <p className="text-sm font-medium text-yellow-800">Financial Note:</p>
                                                <p className="text-sm text-yellow-700 mt-1">{item.financial_note}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Timeline View */
          <div className="relative" ref={timelineRef}>
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-green-200 to-purple-200 rounded-full transform -translate-y-1/2 z-0" />

            {/* Timeline Items */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <AnimatePresence mode="wait">
                {visibleItems.map((item, index) => {
                  const progress = getPeriodProgress(item.id);
                  
                  return (
                    <motion.div
                      key={`${item.id}-${currentIndex}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="relative flex flex-col items-center"
                    >
                      {/* Timeline Node */}
                      <motion.button
                        onClick={() => onItemClick(convertToRoadmapItem(item))}
                        className="relative w-16 h-16 rounded-full border-4 bg-blue-500 border-white transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        style={{ backgroundColor: item.status_color }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Calendar className="h-6 w-6 text-white mx-auto" />
                      </motion.button>

                      {/* Item Card */}
                      <motion.div
                        className="mt-4 p-4 bg-white rounded-lg border-2 shadow-md hover:shadow-lg transition-all duration-300 w-full max-w-xs cursor-pointer border-gray-200"
                        onClick={() => onItemClick(convertToRoadmapItem(item))}
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-center mb-3">
                          <p className="text-xs text-gray-500">{item.month_name} {item.year}</p>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center mb-1">
                            <Target className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs font-medium text-gray-600">Fokus:</span>
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-2">{item.focus}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Progress:</span>
                            <span className="text-xs text-gray-600">{progress.completed}/{progress.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {progress.total > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                              {progress.percentage}%
                            </div>
                          )}
                          <span className="text-xs text-gray-400">Klik untuk detail</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Timeline Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {currentIndex + 1}-{Math.min(currentIndex + itemsPerView, filteredData.length)} dari {filteredData.length}
                </span>
              </div>

              <button
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil ditemukan</h3>
          <p className="text-gray-600 mb-4">Coba ubah filter atau kata kunci pencarian</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPhase('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline;