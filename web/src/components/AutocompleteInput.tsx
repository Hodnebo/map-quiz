'use client';

import { useState, useRef, useEffect } from 'react';
import { TextField, Box, Paper, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { Bydel } from '@/lib/types';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  suggestions: Bydel[];
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder = "Skriv navnet på området...",
  disabled = false,
  maxSuggestions = 5
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  const filteredSuggestions = suggestions
    .filter(bydel => 
      bydel.name.toLowerCase().includes(value.toLowerCase()) && 
      bydel.name.toLowerCase() !== value.toLowerCase()
    )
    .slice(0, maxSuggestions);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setHighlightedIndex(-1);
  };

  // Handle key down events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault();
        onSubmit(value);
      }
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
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0) {
          const selectedSuggestion = filteredSuggestions[highlightedIndex];
          onChange(selectedSuggestion.name);
          onSubmit(selectedSuggestion.name);
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else {
          onSubmit(value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Bydel) => {
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
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
          },
        }}
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <Paper
          ref={listRef}
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <List dense>
            {filteredSuggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index === highlightedIndex ? 'action.hover' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover',
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
            ))}
          </List>
        </Paper>
      )}
      
      {isOpen && filteredSuggestions.length === 0 && value.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Ingen forslag funnet
          </Typography>
        </Paper>
      )}
    </Box>
  );
}