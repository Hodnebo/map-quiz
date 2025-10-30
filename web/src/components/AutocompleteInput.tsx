'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TextField, Box, Paper, List, ListItem, ListItemText, Typography, useTheme } from '@mui/material';
import type { Region } from '@/lib/types';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  suggestions: Region[];
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  'data-testid'?: string;
  // currentTargetId removed - not used
}

export default function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder = "Skriv navnet på området...",
  disabled = false,
  maxSuggestions = 5,
  'data-testid': dataTestId,
  // currentTargetId removed - not used
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Filter suggestions based on input value - show suggestions that start with input, or contain it if no starts-with matches
  const startsWithSuggestions = suggestions.filter(region => 
    region.name.toLowerCase().startsWith(value.toLowerCase()) && 
    region.name.toLowerCase() !== value.toLowerCase()
  );
  
  const containsSuggestions = suggestions.filter(region => 
    region.name.toLowerCase().includes(value.toLowerCase()) && 
    region.name.toLowerCase() !== value.toLowerCase() &&
    !startsWithSuggestions.some(s => s.id === region.id)
  );
  
  const filteredSuggestions = [...startsWithSuggestions, ...containsSuggestions].slice(0, maxSuggestions);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setHighlightedIndex(-1);
  };

  // Auto-highlight first suggestion when suggestions change
  useEffect(() => {
    if (isOpen && filteredSuggestions.length > 0 && highlightedIndex === -1) {
      setHighlightedIndex(0);
    }
  }, [isOpen, filteredSuggestions.length, highlightedIndex]);

  // Handle key down events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      if (highlightedIndex >= 0) {
        // Submit highlighted suggestion
        const selectedSuggestion = filteredSuggestions[highlightedIndex];
        onChange(selectedSuggestion.name);
        onSubmit(selectedSuggestion.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
      } else if (filteredSuggestions.length > 0) {
        // Auto-select the best match (first suggestion)
        const selectedSuggestion = filteredSuggestions[0];
        onChange(selectedSuggestion.name);
        onSubmit(selectedSuggestion.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
      return;
    }

    if (!isOpen || filteredSuggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Region) => {
    onChange(suggestion.name);
    onSubmit(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle input blur
  const handleInputBlur = (event: React.FocusEvent) => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  // Focus input when component mounts
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={inputRef}
        data-testid={dataTestId || 'autocomplete-input'}
        fullWidth
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        onFocus={() => setIsOpen(value.length > 0)}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        size="small"
        inputProps={{
          'data-testid': dataTestId || 'autocomplete-input',
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            color: isDarkMode ? '#ffffff' : '#000000',
            '& fieldset': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.87)',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#ffffff' : '#1976d2',
            },
          },
          '& .MuiInputLabel-root': {
            color: isDarkMode ? '#cccccc' : '#666666',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: isDarkMode ? '#ffffff' : '#1976d2',
          },
        }}
      />
      
      {isOpen && filteredSuggestions.length > 0 && createPortal(
        <Paper
          ref={listRef}
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: '120px', // Position above the input card
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100vw - 64px)', // Use viewport width minus padding
            maxWidth: 400,
            zIndex: 999999,
            maxHeight: 200,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '2px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <List dense>
            {filteredSuggestions.map((suggestion, index) => {
              const isHighlighted = index === highlightedIndex;
              
              return (
                <ListItem
                  key={`${suggestion.id}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: isHighlighted 
                      ? (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    margin: '2px 4px',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-1px)',
                      boxShadow: isDarkMode 
                        ? '0 2px 8px rgba(255, 255, 255, 0.1)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                <ListItemText
                  primary={suggestion.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                  }}
                />
              </ListItem>
              );
            })}
          </List>
        </Paper>,
        document.body
      )}
      
      {isOpen && filteredSuggestions.length === 0 && value.length > 0 && createPortal(
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: '120px', // Position above the input card
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100vw - 64px)', // Use viewport width minus padding
            maxWidth: 400,
            zIndex: 999999,
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '2px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            p: 1,
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.75rem',
              color: isDarkMode ? '#cccccc' : '#666666',
              textAlign: 'center'
            }}
          >
            Ingen forslag funnet
          </Typography>
        </Paper>,
        document.body
      )}
    </Box>
  );
}