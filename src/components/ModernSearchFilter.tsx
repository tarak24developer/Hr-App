import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Grow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const ModernSearchFilter = ({
  searchValue = '',
  onSearchChange,
  filters = [],
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  showFilters = false,
  onToggleFilters,
  placeholder = "Search...",
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState({});

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange?.(localFilters);
    onApplyFilters?.();
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters?.();
  };

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {/* Search and Filter Toggle */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexWrap: 'wrap',
        mb: showFilters ? 2 : 0,
      }}>
        <TextField
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
              },
              '&.Mui-focused': {
                background: 'rgba(255, 255, 255, 1)',
              },
            }
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        
        {filters.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={onToggleFilters}
            size="small"
            sx={{
              borderWidth: '2px',
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              '&:hover': {
                borderWidth: '2px',
                background: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            Filters
          </Button>
        )}
      </Box>

      {/* Active Filters Display */}
      {Object.keys(localFilters).length > 0 && (
        <Grow in timeout={300}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(localFilters).map(([key, value]) => {
                const filter = filters.find(f => f.field === key);
                return (
                  <Chip
                    key={key}
                    label={`${filter?.label || key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, '')}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Grow>
      )}

      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <Grow in timeout={400}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Filter Options
            </Typography>
            
            <Grid container spacing={3}>
              {filters.map((filter) => (
                <Grid item xs={12} sm={6} md={4} key={filter.field}>
                  {filter.type === 'select' ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>{filter.label}</InputLabel>
                      <Select
                        value={localFilters[filter.field] || ''}
                        onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                        label={filter.label}
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
                        }}
                      >
                        <MenuItem value="">All {filter.label}</MenuItem>
                        {filter.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : filter.type === 'date' ? (
                    <TextField
                      fullWidth
                      label={filter.label}
                      type="date"
                      value={localFilters[filter.field] || ''}
                      onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : filter.type === 'dateRange' ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label={`${filter.label} Start`}
                        type="date"
                        value={localFilters[`${filter.field}Start`] || ''}
                        onChange={(e) => handleFilterChange(`${filter.field}Start`, e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        label={`${filter.label} End`}
                        type="date"
                        value={localFilters[`${filter.field}End`] || ''}
                        onChange={(e) => handleFilterChange(`${filter.field}End`, e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      label={filter.label}
                      value={localFilters[filter.field] || ''}
                      onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                      size="small"
                    />
                  )}
                </Grid>
              ))}
            </Grid>

            {/* Filter Actions */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                sx={{
                  borderWidth: '2px',
                  borderRadius: 2,
                  '&:hover': {
                    borderWidth: '2px',
                  },
                }}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Grow>
      </Collapse>
    </Box>
  );
};

export default ModernSearchFilter; 