import React from 'react';
import {
  Box,
  Pagination,
  PaginationItem,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Stack,
  useTheme
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

const CustomPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showTotal = true,
  size = 'medium'
}) => {
  const theme = useTheme();

  const handlePageChange = (event, page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (event) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(event.target.value);
    }
  };

  const getPageInfo = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return { startItem, endItem };
  };

  const { startItem, endItem } = getPageInfo();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        py: 2,
        px: 1
      }}
    >
      {/* Left side - Items per page and total info */}
      <Stack direction="row" spacing={2} alignItems="center">
        {showItemsPerPage && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Items per page:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                variant="outlined"
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
                sx={{ height: 32 }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )}

        {showTotal && (
          <Typography variant="body2" color="text.secondary">
            Showing {startItem}-{endItem} of {totalItems} items
          </Typography>
        )}
      </Stack>

      {/* Right side - Pagination controls */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Pagination
          page={currentPage}
          count={totalPages}
          onChange={handlePageChange}
          size={size}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          renderItem={(item) => (
            <PaginationItem
              slots={{
                first: FirstPageIcon,
                last: LastPageIcon,
                previous: NavigateBeforeIcon,
                next: NavigateNextIcon,
              }}
              {...item}
            />
          )}
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: 1,
              fontWeight: 500,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CustomPagination; 