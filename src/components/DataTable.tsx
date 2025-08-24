import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  Box,
  Typography,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

interface Column {
  field: string;
  headerName: string;
  type?: 'text' | 'chip' | 'actions' | 'date' | 'currency' | 'percentage';
  chipColor?: (value: any) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  cellStyle?: any;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: any[]) => void;
  sortable?: boolean;
  pagination?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sx?: any;
}

const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns = [],
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  selectable = false,
  onSelectionChange,
  sortable = true,
  pagination = true,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  sx = {}
}) => {
  const theme = useTheme();
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<any[]>([]);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortable || !orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return order === 'desc' ? -comparison : comparison;
    });
  }, [data, orderBy, order, sortable]);

  // Handle sorting
  const handleRequestSort = useCallback((property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [orderBy, order]);

  // Handle selection
  const handleSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = sortedData.map((n) => n.id);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
      return;
    }
    setSelected([]);
    onSelectionChange?.([]);
  }, [sortedData, onSelectionChange]);

  const handleClick = useCallback((_event: React.MouseEvent, id: any) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: any[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  }, [selected, onSelectionChange]);

  const isSelected = useCallback((id: any) => selected.indexOf(id) !== -1, [selected]);

  // Render cell content
  const renderCell = useCallback((row: any, column: Column) => {
    const value = row[column.field];
    
    switch (column.type) {
      case 'chip':
        return (
          <Chip
            label={value}
            size="small"
            color={column.chipColor?.(value) || 'default'}
            variant="outlined"
          />
        );
      
      case 'actions':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onView && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(row);
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                  sx={{ color: 'warning.main' }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'currency':
        return `₹${Number(value).toLocaleString()}`;
      
      case 'percentage':
        return `${value}%`;
      
      default:
        return value;
    }
  }, [onView, onEdit, onDelete]);

  return (
    <Paper elevation={1} sx={{ ...sx }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < sortedData.length}
                    checked={sortedData.length > 0 && selected.length === sortedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.field ? order : false}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: theme.palette.grey[50],
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleRequestSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Loading...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={() => onRowClick?.(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id || index}
                    selected={isItemSelected}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                          onClick={(event) => handleClick(event, row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.field}
                        align={column.align || 'left'}
                        sx={{
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          ...column.cellStyle,
                        }}
                      >
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange?.(parseInt(event.target.value, 10))}
        />
      )}
    </Paper>
  );
};

export default DataTable; 