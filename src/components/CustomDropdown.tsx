import React, { useState } from 'react';
import {
  Box,
  Typography,
  ClickAwayListener
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

interface CustomDropdownProps {
  label: string;
  value: string | number | null;
  options: Array<string | { value: string | number; label: string }>;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: any;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option',
  required = false,
  disabled = false,
  sx = {}
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setDropdownOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    const selectedOption = options.find((option: string | { value: string | number; label: string }) => 
      typeof option === 'string' ? option === value : option.value === value
    );
    return selectedOption 
      ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
      : placeholder;
  };

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary', fontSize: '1rem' }}>
        {label} {required && '*'}
      </Typography>
      <Box
        onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
        sx={{
          minHeight: '56px',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 2,
          py: 1.5,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'action.hover',
            borderColor: disabled ? 'divider' : 'primary.main',
          },
          '&:focus-within': {
            borderColor: disabled ? 'divider' : 'primary.main',
            borderWidth: disabled ? 1 : 2,
          },
        }}
      >
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '1.5',
            color: disabled ? 'text.disabled' : 'text.primary',
            flex: 1,
          }}
        >
          {getDisplayValue()}
        </Typography>
        <KeyboardArrowDownIcon 
          sx={{ 
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: disabled ? 'text.disabled' : 'text.secondary'
          }} 
        />
      </Box>
      {dropdownOpen && !disabled && (
        <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
                      <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mt: 1,
                maxHeight: 200,
                overflow: 'auto',
                zIndex: 9999,
                boxShadow: 3,
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
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
              }}
            >
            {options.length > 0 ? (
              options.map((option: string | { value: string | number; label: string }, index: number) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                
                return (
                  <Box
                    key={index}
                    onClick={() => handleOptionClick(optionValue)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: 'text.primary',
                      borderBottom: index < options.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    {optionLabel}
                  </Box>
                );
              })
            ) : (
              <Box sx={{ px: 2, py: 1.5 }}>
                No options available
              </Box>
            )}
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default CustomDropdown; 