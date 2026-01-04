import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Download, Calendar, Target, DollarSign, CheckCircle2, Circle, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Edit2, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { RoadmapItem, STATUS_CONFIG, ROADMAP_PHASES, getPhaseForItem, parseDetailedActionPlan } from '@/lib/supabase';
import { useProgress } from '@/contexts/ProgressContext';

interface DetailModalProps {
  item: RoadmapItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  allItems: RoadmapItem[];
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  canNavigateNext,
  canNavigatePrevious,
  allItems
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [editedFocus, setEditedFocus] = useState('');
  const [editedActionItems, setEditedActionItems] = useState<string[]>([]);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [tempActionText, setTempActionText] = useState('');
  const [savedData, setSavedData] = useState<{[key: number]: {focus: string, actionItems: string[]}}>({});
  
  const focusInputRef = useRef<HTMLInputElement>(null);
  const actionInputRef = useRef<HTMLInputElement>(null);
  
  const { toggleCheckbox, getItemProgress, isCheckboxLoading, errorMessage } = useProgress();

  // Initialize edited data when item changes
  useEffect(() => {
    if (item) {
      // Load from localStorage first
      const localStorageKey = `roadmap-edits-${item.id}`;
      const savedLocal = localStorage.getItem(localStorageKey);
      
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          setEditedFocus(parsed.focus || item.focus);
          setEditedActionItems(parsed.actionItems || parseDetailedActionPlan(item.action_plan_detailed));
          // Also update savedData state
          setSavedData(prev => ({
            ...prev,
            [item.id]: {
              focus: parsed.focus || item.focus,
              actionItems: parsed.actionItems || parseDetailedActionPlan(item.action_plan_detailed)
            }
          }));
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
          // Fallback to original data
          setEditedFocus(item.focus);
          setEditedActionItems(parseDetailedActionPlan(item.action_plan_detailed));
        }
      } else {
        // No localStorage data, check savedData state or use original
        const saved = savedData[item.id];
        if (saved) {
          setEditedFocus(saved.focus);
          setEditedActionItems(saved.actionItems);
        } else {
          setEditedFocus(item.focus);
          setEditedActionItems(parseDetailedActionPlan(item.action_plan_detailed));
        }
      }
    }
  }, [item, savedData]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingFocus && focusInputRef.current) {
      focusInputRef.current.focus();
    }
  }, [isEditingFocus]);

  useEffect(() => {
    if (editingActionIndex !== null && actionInputRef.current) {
      actionInputRef.current.focus();
    }
  }, [editingActionIndex]);

  if (!item) return null;

  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.neutral;
  const phase = getPhaseForItem(item);
  const phaseConfig = phase ? ROADMAP_PHASES[phase] : null;
  
  const detailedActionItems = editedActionItems;
  const currentIndex = allItems.findIndex(i => i.id === item.id);
  const totalItems = allItems.length;

  // Save data function - now with localStorage persistence
  const saveChanges = () => {
    if (!item) return;
    
    const dataToSave = {
      focus: editedFocus,
      actionItems: editedActionItems
    };
    
    // Save to state
    setSavedData(prev => ({
      ...prev,
      [item.id]: dataToSave
    }));
    
    // Save to localStorage
    const localStorageKey = `roadmap-edits-${item.id}`;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Focus editing functions
  const handleEditFocus = () => {
    setIsEditingFocus(true);
  };

  const handleSaveFocus = () => {
    setIsEditingFocus(false);
    saveChanges();
  };

  const handleCancelFocus = () => {
    if (!item) return;
    
    // Load from localStorage first, then savedData, then original
    const localStorageKey = `roadmap-edits-${item.id}`;
    const savedLocal = localStorage.getItem(localStorageKey);
    
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        setEditedFocus(parsed.focus || item.focus);
      } catch (error) {
        const saved = savedData[item.id];
        setEditedFocus(saved ? saved.focus : item.focus);
      }
    } else {
      const saved = savedData[item.id];
      setEditedFocus(saved ? saved.focus : item.focus);
    }
    
    setIsEditingFocus(false);
  };

  const handleFocusKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveFocus();
    } else if (e.key === 'Escape') {
      handleCancelFocus();
    }
  };

  // Action item editing functions
  const handleEditAction = (index: number) => {
    setEditingActionIndex(index);
    setTempActionText(editedActionItems[index]);
  };

  const handleSaveAction = () => {
    if (editingActionIndex !== null) {
      const newActionItems = [...editedActionItems];
      newActionItems[editingActionIndex] = tempActionText;
      setEditedActionItems(newActionItems);
      setEditingActionIndex(null);
      setTempActionText('');
      saveChanges();
    }
  };

  const handleCancelAction = () => {
    setEditingActionIndex(null);
    setTempActionText('');
  };

  const handleActionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAction();
    } else if (e.key === 'Escape') {
      handleCancelAction();
    }
  };

  const handleAddAction = () => {
    const newActionItems = [...editedActionItems, 'Action item baru'];
    setEditedActionItems(newActionItems);
    setEditingActionIndex(newActionItems.length - 1);
    setTempActionText('Action item baru');
    
    // Save immediately when adding new action
    if (item) {
      const dataToSave = {
        focus: editedFocus,
        actionItems: newActionItems
      };
      
      setSavedData(prev => ({
        ...prev,
        [item.id]: dataToSave
      }));
      
      const localStorageKey = `roadmap-edits-${item.id}`;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  const handleDeleteAction = (index: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus action item ini?')) {
      const newActionItems = editedActionItems.filter((_, i) => i !== index);
      setEditedActionItems(newActionItems);
      if (editingActionIndex === index) {
        setEditingActionIndex(null);
        setTempActionText('');
      } else if (editingActionIndex !== null && editingActionIndex > index) {
        setEditingActionIndex(editingActionIndex - 1);
      }
      
      // Save immediately when deleting action
      if (item) {
        const dataToSave = {
          focus: editedFocus,
          actionItems: newActionItems
        };
        
        setSavedData(prev => ({
          ...prev,
          [item.id]: dataToSave
        }));
        
        const localStorageKey = `roadmap-edits-${item.id}`;
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
    }
  };

  const handleCheckboxToggle = async (actionIndex: number, isCompleted: boolean) => {
    await toggleCheckbox(item.id, actionIndex, isCompleted);
  };

  const handleExport = () => {
    const exportContent = `ROADMAP EKSPOR - ${item.period}\n\n` +
      `Fokus: ${item.focus}\n\n` +
      `Action Plan Detail:\n` +
      detailedActionItems.map((actionItem, index) => {
        const isCompleted = getItemProgress(item.id, index);
        return `${isCompleted ? '✅' : '☐'} ${actionItem}`;
      }).join('\n') +
      `\n\nFinancial Note: ${item.financial_note}\n\n` +
      `Status: ${statusConfig.label}\n` +
      (phaseConfig ? `Fase: ${phaseConfig.name}\n` : '') +
      `\nGenerated on: ${new Date().toLocaleDateString('id-ID')}`;

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${item.period.toLowerCase().replace(' ', '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: "auto", 
      opacity: 1,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1] as const
        },
        opacity: {
          duration: 0.3,
          delay: 0.1
        }
      }
    }
  };

  const completedCount = detailedActionItems.reduce((count, _, index) => {
    return count + (getItemProgress(item.id, index) ? 1 : 0);
  }, 0);
  const totalCount = detailedActionItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          {/* Error Toast Notification */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -50, x: '-50%' }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-[101] flex items-center space-x-2"
              >
                <AlertTriangle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{item.period}</h2>
                <div className="flex items-center space-x-2">
                  {/* Internal Navigation */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={onPrevious}
                      disabled={!canNavigatePrevious}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Periode Sebelumnya"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onNext}
                      disabled={!canNavigateNext}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Periode Selanjutnya"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {currentIndex + 1} dari {totalItems}
                  </span>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{item.month_name} {item.year}</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress: {completedCount}/{totalCount} tasks</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <motion.div 
                    className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Focus */}
              <div className="mb-6">
                <div className="flex items-center mb-3 justify-between">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Fokus Periode</h3>
                  </div>
                  {!isEditingFocus && (
                    <button
                      onClick={handleEditFocus}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditingFocus ? (
                  <div className="space-y-3">
                    <input
                      ref={focusInputRef}
                      type="text"
                      value={editedFocus}
                      onChange={(e) => setEditedFocus(e.target.value)}
                      onKeyDown={handleFocusKeyPress}
                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveFocus}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Simpan
                      </button>
                      <button
                        onClick={handleCancelFocus}
                        className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p 
                    className="text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onDoubleClick={handleEditFocus}
                    title="Double-click untuk edit"
                  >
                    {editedFocus}
                  </p>
                )}
              </div>

              {/* Action Plan Detail with Checkboxes */}
              <div className="mb-6">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center justify-between w-full mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Action Plan Detail</h3>
                    <span className="ml-3 text-sm text-gray-600">({completedCount}/{totalCount} completed)</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      variants={contentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="overflow-hidden"
                    >
                      <div className="space-y-3">
                        {detailedActionItems.map((actionItem, index) => {
                          const isCompleted = getItemProgress(item.id, index);
                          const isLoading = isCheckboxLoading(item.id, index);
                          const isEditing = editingActionIndex === index;
                          
                          return (
                            <motion.div
                              key={index}
                              className={`flex items-start p-3 rounded-lg border-2 transition-all duration-200 group ${
                                isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-gray-200 hover:border-blue-300'
                              }`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <button
                                onClick={() => handleCheckboxToggle(index, !isCompleted)}
                                disabled={isLoading}
                                className={`flex-shrink-0 mr-3 mt-1 p-1 rounded-full transition-all duration-200 relative ${
                                  isCompleted 
                                    ? 'text-green-600 hover:text-green-700' 
                                    : 'text-gray-400 hover:text-blue-600'
                                } ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                ) : isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      ref={actionInputRef}
                                      type="text"
                                      value={tempActionText}
                                      onChange={(e) => setTempActionText(e.target.value)}
                                      onKeyDown={handleActionKeyPress}
                                      className="w-full px-2 py-1 border-2 border-blue-300 rounded focus:border-blue-500 focus:outline-none text-gray-700"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={handleSaveAction}
                                        className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors duration-200"
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Simpan
                                      </button>
                                      <button
                                        onClick={handleCancelAction}
                                        className="flex items-center px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between">
                                    <span 
                                      className={`flex-1 leading-relaxed cursor-pointer ${
                                        isCompleted 
                                          ? 'text-green-800 line-through opacity-75' 
                                          : 'text-gray-700'
                                      } ${isLoading ? 'opacity-50' : ''}`}
                                      onDoubleClick={() => handleEditAction(index)}
                                      title="Double-click untuk edit"
                                    >
                                      {actionItem}
                                    </span>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                                      <button
                                        onClick={() => handleEditAction(index)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                        title="Edit"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAction(index)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        title="Hapus"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                        
                        {/* Add New Action Item Button */}
                        <motion.button
                          onClick={handleAddAction}
                          className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Tambah Action Item Baru
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Financial Note */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Catatan Finansial</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{item.financial_note}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={onPrevious}
                  disabled={!canNavigatePrevious}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={onNext}
                  disabled={!canNavigateNext}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Selanjutnya →
                </button>
              </div>
              
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailModal;