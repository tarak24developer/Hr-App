import React, { useState } from 'react';
import {
  Box,
  Typography,
  ClickAwayListener,
  Paper
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

interface DashboardDropdownProps {
  value: string | number | null;
  onChange: (value: string | number) => void;
  options: Array<string | { value: string | number; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const DashboardDropdown: React.FC<DashboardDropdownProps> = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  disabled = false,
  size = 'small'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const selectedOption = options.find((option: string | { value: string | number; label: string }) => 
    typeof option === 'string' ? option === value : option.value === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: size === 'small' ? '4px 8px' : '8px 12px',
          border: '1px solid',
          borderColor: disabled ? 'action.disabled' : 'divider',
          borderRadius: 1,
          backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: size === 'small' ? 32 : 40,
          fontSize: '0.75rem',
          '&:hover': {
            borderColor: disabled ? 'action.disabled' : 'primary.main',
          },
          '&:focus-within': {
            borderColor: 'primary.main',
            borderWidth: 2,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: displayValue === placeholder ? 'text.secondary' : 'text.primary',
            fontSize: '0.75rem',
          }}
        >
          {displayValue}
        </Typography>
        <KeyboardArrowDownIcon
          sx={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
            fontSize: 16,
            color: 'text.secondary',
          }}
        />
      </Box>

      {isOpen && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 999999,
              mt: 0.5,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              maxHeight: 200,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
              },
            }}
          >
            {options.map((option: string | { value: string | number; label: string }, index: number) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              
              return (
                <Box
                  key={index}
                  onClick={() => handleSelect(optionValue)}
                  sx={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&:first-of-type': {
                      borderTopLeftRadius: '4px',
                      borderTopRightRadius: '4px',
                    },
                    '&:last-of-type': {
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                    },
                  }}
                >
                  {optionLabel}
                </Box>
              );
            })}
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default DashboardDropdown; 