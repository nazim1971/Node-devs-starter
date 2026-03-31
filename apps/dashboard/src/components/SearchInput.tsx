'use client';

import React, { useCallback, useState } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search…',
  defaultValue = '',
  debounceMs = 350,
  onChange,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);

  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      debouncedOnChange(e.target.value);
    },
    [debouncedOnChange],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={`search-input ${className}`}>
      <span className="search-input__icon" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="search"
        className="search-input__field"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-input__clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
