interface DropdownOptions {
  maxHeight?: number;
  zIndex?: number;
  fontSize?: string;
  PaperProps?: {
    sx?: Record<string, any>;
  };
}

export const getDropdownStyles = (customOptions: DropdownOptions = {}) => {
  const {
    maxHeight = 300,
    zIndex = 99999,
    fontSize = '0.875rem',
  } = customOptions;

  return {
    maxHeight,
    zIndex,
    fontSize,
    '& .MuiPaper-root': {
      maxHeight,
      zIndex,
      fontSize,
      ...customOptions.PaperProps?.sx
    }
  };
};

// Container styles to ensure content remains visible during dropdown interactions
export const getStableContainerStyles = () => ({
  visibility: 'visible',
  opacity: 1,
  transform: 'none',
  transition: 'none',
  willChange: 'auto',
  zIndex: 1,
});

// Dropdown container styles to prevent layout shifts
export const getDropdownContainerStyles = () => ({
  position: 'relative',
  zIndex: 99999,
  visibility: 'visible',
  opacity: 1,
}); 