/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface DateInputProps {
  value: string; // Stored as YYYY-MM-DD
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}

export default function DateInput({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'dd/mm/yyyy',
  id
}: DateInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Keep display value in sync with the model value (YYYY-MM-DD)
  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    
    // Check if model value is in YYYY-MM-DD format
    const parts = value.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      setInputValue(`${day}/${month}/${year}`);
    } else {
      // In case it's already in DD/MM/YYYY format or some other format
      setInputValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Allow users to delete back to empty
    if (!rawVal) {
      setInputValue('');
      onChange('');
      return;
    }

    // Strip non-numeric digits
    const clean = rawVal.replace(/\D/g, '');
    let formatted = '';
    
    if (clean.length > 0) {
      formatted += clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += '/' + clean.substring(2, 4);
    }
    if (clean.length > 4) {
      formatted += '/' + clean.substring(4, 8);
    }

    setInputValue(formatted);

    // Propagate up to parent when format is valid and complete (10 characters: DD/MM/YYYY)
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const d = parts[0];
      const m = parts[1];
      const y = parts[2];
      onChange(`${y}-${m}-${d}`);
    }
  };

  return (
    <input
      id={id}
      type="text"
      required={required}
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${className} font-medium`}
      maxLength={10}
    />
  );
}
