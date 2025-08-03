// src/components/multi-select-dropdown/MultiSelectDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import './MultiSelectDropdown.css';

const MultiSelectDropdown = ({ 
  options = [], 
  selectedValues = [], 
  onChange,
  placeholder = "Seleccionar...",
  renderOption = null,
  renderSelectedCount = null,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (value) => {
    if (disabled) return;
    
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    
    if (renderSelectedCount) {
      return renderSelectedCount(selectedValues);
    }

    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }

    return `${selectedValues.length} seleccionados`;
  };

  return (
    <div className={`multiselect-dropdown ${className} ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`multiselect-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="multiselect-text">{getDisplayText()}</span>
        <FaChevronDown className={`multiselect-arrow ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="multiselect-menu">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                className={`multiselect-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggle(option.value)}
              >
                <div className="option-content">
                  {renderOption ? renderOption(option) : (
                    <>
                      {option.icon && <span className="option-icon">{option.icon}</span>}
                      <span className="option-label">{option.label}</span>
                    </>
                  )}
                </div>
                {isSelected && (
                  <FaCheck className="option-check" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;