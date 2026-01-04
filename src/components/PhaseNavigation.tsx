import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Target } from 'lucide-react';
import { RoadmapItem, ROADMAP_PHASES, getPhaseStats } from '@/lib/supabase';

interface PhaseNavigationProps {
  roadmapItems: RoadmapItem[];
  onPhaseClick: (phase: keyof typeof ROADMAP_PHASES) => void;
  activePhase?: keyof typeof ROADMAP_PHASES | null;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  roadmapItems,
  onPhaseClick,
  activePhase
}) => {
  const phaseStats = getPhaseStats(roadmapItems);
  const phases = Object.entries(ROADMAP_PHASES) as [keyof typeof ROADMAP_PHASES, typeof ROADMAP_PHASES[keyof typeof ROADMAP_PHASES]][];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Navigasi Fase Roadmap</h3>
          <p className="text-sm text-gray-600">Pilih fase untuk melihat detail progress dan timeline</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
            <Target className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{phases.length} Fase</span>
          </div>
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <Clock className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium text-green-700">2025-2030</span>
          </div>
        </div>
      </div>
      
      {/* Desktop Phase Navigation */}
      <div className="hidden lg:flex items-center justify-between space-x-3">
        {phases.map(([phaseKey, phase], index) => {
          const isActive = activePhase === phaseKey;
          const stats = phaseStats[phaseKey];
          const isLast = index === phases.length - 1;
          
          return (
            <React.Fragment key={phaseKey}>
              <motion.button
                onClick={() => onPhaseClick(phaseKey)}
                className={`flex-1 group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-blue-500 shadow-lg scale-[1.02] bg-blue-50/80' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                }`}
                whileHover={{ scale: isActive ? 1.02 : 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Gradient background for active state */}
                {isActive && (
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ backgroundColor: phase.color }}
                  />
                )}
                
                <div className="relative p-5">
                  {/* Phase indicator and name aligned */}
                  <div className="flex items-center mb-3">
                    <div 
                      className={`w-3 h-3 rounded-full mr-3 transition-all duration-300 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}
                      style={{ backgroundColor: phase.color }}
                    />
                    <h4 className={`font-bold text-sm transition-colors duration-300 ${
                      isActive ? 'text-blue-900' : 'text-gray-900 group-hover:text-gray-800'
                    }`}>
                      {phase.name}
                    </h4>
                  </div>
                  
                  <p className={`text-xs leading-relaxed mb-3 transition-colors duration-300 ${
                    isActive ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-700'
                  }`}>
                    {phase.description}
                  </p>
                  
                  {/* Year range with enhanced styling */}
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                    isActive ? 'bg-white/80 text-blue-800' : 'bg-gray-50 text-gray-700 group-hover:bg-gray-100'
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span>
                      {phase.yearRange[0] === phase.yearRange[1] 
                        ? phase.yearRange[0]
                        : `${phase.yearRange[0]}-${phase.yearRange[1]}`}
                    </span>
                  </div>
                </div>
                
                {/* Active phase highlight */}
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
                    style={{ backgroundColor: phase.color }}
                  />
                )}
              </motion.button>
              
              {!isLast && (
                <div className="flex items-center justify-center">
                  <ChevronRight className={`h-5 w-5 transition-colors duration-300 ${
                    index < phases.findIndex(([key]) => key === activePhase) ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Mobile Phase Navigation */}
      <div className="lg:hidden space-y-3">
        {phases.map(([phaseKey, phase]) => {
          const isActive = activePhase === phaseKey;
          const stats = phaseStats[phaseKey];
          
          return (
            <motion.button
              key={phaseKey}
              onClick={() => onPhaseClick(phaseKey)}
              className={`w-full group relative overflow-hidden rounded-xl border-l-4 text-left transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-50/80 shadow-md border-blue-500' 
                  : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-400'
              }`}
              style={{
                borderLeftColor: phase.color
              }}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: phase.color }}
                      />
                      <h4 className={`font-bold text-sm transition-colors duration-300 ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {phase.name}
                      </h4>
                    </div>
                    <p className={`text-xs mb-2 transition-colors duration-300 ${
                      isActive ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {phase.description}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                      isActive ? 'bg-white/80 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>
                        {phase.yearRange[0] === phase.yearRange[1] 
                          ? phase.yearRange[0]
                          : `${phase.yearRange[0]}-${phase.yearRange[1]}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseNavigation;