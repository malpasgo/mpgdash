import React, { useState, useMemo } from 'react';
import { useRoadmapData } from '@/hooks/useRoadmapData';
import RoadmapKPICards from '@/components/dashboard/RoadmapKPICards';
import RoadmapChartsApex from '@/components/dashboard/RoadmapChartsApex';
import { ProgressProvider, useProgress } from '@/contexts/ProgressContext';
import { Loader2, AlertCircle, Calendar, Target, Search, Filter, ChevronDown, ChevronUp, Clock, Eye, EyeOff, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'react-apexcharts';
import { COMPREHENSIVE_ROADMAP_DATA, RoadmapItemDetailed } from '@/lib/roadmapData';
import { RoadmapItem, parseDetailedActionPlan, ROADMAP_PHASES } from '@/lib/supabase';

const RoadmapEnhanced: React.FC = () => {
  const {
    roadmapItems,
    loading,
    error,
    statistics,
    progressStats
  } = useRoadmapData();

  // Timeline functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'accordion'>('accordion');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Get comprehensive roadmap data for timeline
  const comprehensiveData = COMPREHENSIVE_ROADMAP_DATA;

  // Filter and search functionality for timeline
  const filteredTimelineData = useMemo(() => {
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
      grouped[phase] = filteredTimelineData.filter(item => item.phase === phase);
    });
    
    return grouped;
  }, [filteredTimelineData]);

  // Toggle functions for timeline
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Memuat data roadmap...</p>
          <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProgressProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Roadmap Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">
                    Strategic planning dan progress tracking untuk PT. Malaka Pasai Global
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* KPI Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Performance Indicators</h2>
            <RoadmapKPICards 
              roadmapItems={roadmapItems}
              progressStats={progressStats}
              statistics={statistics}
            />
          </div>

          {/* Charts Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics & Insights</h2>
            <RoadmapChartsApex 
              roadmapItems={roadmapItems}
              progressStats={progressStats}
            />
          </div>

          {/* Timeline Roadmap Ekspor Section */}
          <TimelineRoadmapSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedPhase={selectedPhase}
            setSelectedPhase={setSelectedPhase}
            viewMode={viewMode}
            setViewMode={setViewMode}
            expandedPhases={expandedPhases}
            expandedItems={expandedItems}
            togglePhaseExpansion={togglePhaseExpansion}
            toggleItemExpansion={toggleItemExpansion}
            filteredTimelineData={filteredTimelineData}
            itemsByPhase={itemsByPhase}
            comprehensiveData={comprehensiveData}
          />

          {/* Summary Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                <div className="text-sm text-gray-600">Total Periods</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{
                  Object.keys(progressStats?.yearlyProgress || {}).length
                }</div>
                <div className="text-sm text-gray-600">Years Covered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{progressStats?.progressPercentage?.toFixed(1) || 0}%</div>
                <div className="text-sm text-gray-600">Overall Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProgressProvider>
  );
};

// Timeline Roadmap Section Component
interface TimelineRoadmapSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPhase: string;
  setSelectedPhase: (phase: string) => void;
  viewMode: 'timeline' | 'accordion';
  setViewMode: (mode: 'timeline' | 'accordion') => void;
  expandedPhases: Set<string>;
  expandedItems: Set<number>;
  togglePhaseExpansion: (phase: string) => void;
  toggleItemExpansion: (itemId: number) => void;
  filteredTimelineData: RoadmapItemDetailed[];
  itemsByPhase: Record<string, RoadmapItemDetailed[]>;
  comprehensiveData: RoadmapItemDetailed[];
}

const TimelineRoadmapSection: React.FC<TimelineRoadmapSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedPhase,
  setSelectedPhase,
  viewMode,
  setViewMode,
  expandedPhases,
  expandedItems,
  togglePhaseExpansion,
  toggleItemExpansion,
  filteredTimelineData,
  itemsByPhase,
  comprehensiveData
}) => {
  const { progressStats, checkboxStates } = useProgress();

  // Get progress for a specific period
  const getPeriodProgress = (periodId: number) => {
    const item = filteredTimelineData.find(item => item.id === periodId);
    if (!item) return { completed: 0, total: 0, percentage: 0 };
    
    const actionItems = item.action_plan_detailed;
    const total = actionItems.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    
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

  // Prepare ApexCharts timeline data
  const timelineChartData = useMemo(() => {
    const phases = Object.entries(ROADMAP_PHASES);
    const series = phases.map(([phaseKey, phase]) => {
      const phaseItems = filteredTimelineData.filter(item => item.phase === phaseKey);
      
      return {
        name: phase.name,
        data: phaseItems.map(item => {
          const progress = getPeriodProgress(item.id);
          return {
            x: `${item.month_name} ${item.year}`,
            y: [new Date(item.year, item.month - 1).getTime(), new Date(item.year, item.month).getTime()],
            fillColor: phase.color,
            progress: progress.percentage,
            period: item.period,
            focus: item.focus
          };
        })
      };
    });

    return series.filter(s => s.data.length > 0);
  }, [filteredTimelineData]);

  const timelineChartOptions = {
    chart: {
      type: 'rangeBar' as const,
      height: 400,
      toolbar: {
        show: true
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        rangeBarGroupRows: true
      }
    },
    colors: Object.values(ROADMAP_PHASES).map(phase => phase.color),
    fill: {
      type: 'solid'
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        format: 'MMM yyyy'
      }
    },
    yaxis: {
      show: true
    },
    legend: {
      position: 'top' as const
    },
    tooltip: {
      custom: function({series, seriesIndex, dataPointIndex, w}) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        return `
          <div class="bg-white p-3 rounded-lg shadow-lg border">
            <div class="font-semibold text-gray-900">${data.period}</div>
            <div class="text-sm text-gray-600 mt-1">${data.focus}</div>
            <div class="text-sm font-medium text-green-600 mt-2">Progress: ${data.progress}%</div>
          </div>
        `;
      }
    }
  };

  return (
    <div className="mb-8">
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
              Menampilkan <span className="font-semibold text-gray-900">{filteredTimelineData.length}</span> dari <span className="font-semibold text-gray-900">{comprehensiveData.length}</span> periode
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {viewMode === 'timeline' ? (
            /* ApexCharts Timeline View */
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Visualization</h3>
              {timelineChartData.length > 0 ? (
                <Chart
                  options={timelineChartOptions}
                  series={timelineChartData}
                  type="rangeBar"
                  height={400}
                />
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Tidak ada data timeline untuk ditampilkan</p>
                </div>
              )}
            </div>
          ) : (
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
                                  <div className="p-4">
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
                                        onClick={() => toggleItemExpansion(item.id)}
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
          )}

          {/* Empty State */}
          {filteredTimelineData.length === 0 && (
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
      </div>
    </div>
  );
};

export default RoadmapEnhanced;