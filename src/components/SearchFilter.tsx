import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Typography,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  useTheme,
  Paper,
  SxProps,
  Theme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Type definitions
interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface SearchFilterProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;
  onClearAll?: () => void;
  searchPlaceholder?: string;
  filterOptions?: FilterConfig[];
  loading?: boolean;
  sx?: SxProps<Theme>;
}

const SearchFilter = ({
  searchValue = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  onClearAll,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  loading = false,
  sx = {}
}: SearchFilterProps) => {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters);

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearchValue(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchValue('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };


  const handleClearAll = () => {
    setLocalSearchValue('');
    setLocalFilters({});
    if (onClearAll) {
      onClearAll();
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  const activeFiltersCount = Object.values(localFilters).filter(value => 
    value !== '' && value !== null && value !== undefined
  ).length;

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, ...sx }}>
      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={localSearchValue}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: localSearchValue && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  disabled={loading}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowFilters(!showFilters)}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Filters
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ ml: 1, height: 20, minWidth: 20 }}
            />
          )}
        </Button>

        {(localSearchValue || hasActiveFilters) && (
          <Button
            variant="text"
            onClick={handleClearAll}
            disabled={loading}
            sx={{ minWidth: 80 }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {filterOptions.map((option) => (
              <FormControl key={option.key} size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{option.label}</InputLabel>
                <Select
                  value={localFilters[option.key] || ''}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  label={option.label}
                  disabled={loading}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        mt: 0.5,
                        maxHeight: 300,
                        zIndex: 99999,
                        '& .MuiMenuItem-root': {
                          py: 1.5,
                          px: 2,
                          fontSize: '0.875rem',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    disablePortal: true,
                    keepMounted: true,
                    disableScrollLock: true,
                    slotProps: {
                      paper: {
                        elevation: 8,
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All {option.label}</em>
                  </MenuItem>
                  {option.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Stack>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(localFilters).map(([key, value]) => {
                  if (!value || value === '') return null;
                  
                  const filterOption = filterOptions.find(opt => opt.key === key);
                  const optionLabel = filterOption?.options.find(opt => opt.value === value)?.label || value;
                  
                  return (
                    <Chip
                      key={key}
                      label={`${filterOption?.label || key}: ${optionLabel}`}
                      onDelete={() => handleFilterChange(key, '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SearchFilter; 