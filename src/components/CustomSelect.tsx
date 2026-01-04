import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
  error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  placeholder = "Pilih opsi",
  options,
  onValueChange,
  className,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set initial label based on value
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      setSelectedLabel(option?.label || '');
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: SelectOption, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLabel(option.label);
    onValueChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      // Focus first option or next option
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      // Focus last option or previous option
    }
  };

  return (
    <div 
      ref={selectRef}
      className="relative w-full"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Select Trigger */}
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          "truncate",
          !selectedLabel && "text-gray-500"
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-lg animate-in fade-in-0 zoom-in-95"
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-900 outline-none hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  isSelected && "bg-blue-100 text-blue-900 font-medium"
                )}
                onClick={(e) => handleOptionClick(option, e)}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isSelected && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;