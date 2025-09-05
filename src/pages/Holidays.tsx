import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Pagination,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public Holiday' | 'Company Holiday' | 'Optional Holiday' | 'Special Day';
  description: string;
  isActive: boolean;
  isRecurring: boolean;
  country?: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HolidayFormData {
  name: string;
  date: string;
  type: string;
  description: string;
  isActive: boolean;
  isRecurring: boolean;
  country: string;
  region: string;
}

interface HolidayFilters {
  search: string;
  type: string;
  year: string;
  country: string;
  showActiveOnly: boolean;
}

const initialFormData: HolidayFormData = {
  name: '',
  date: '',
  type: '',
  description: '',
  isActive: true,
  isRecurring: false,
  country: '',
  region: ''
};

const initialFilters: HolidayFilters = {
  search: '',
  type: '',
  year: '',
  country: '',
  showActiveOnly: true
};

const holidayTypes = ['Public Holiday', 'Company Holiday', 'Optional Holiday', 'Special Day'];
const years = ['2024', '2025', '2026', '2027', '2028'];
const countries = ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan'];
const regions = ['North', 'South', 'East', 'West', 'Central'];

const typeColors = {
  'Public Holiday': '#2196f3',
  'Company Holiday': '#4caf50',
  'Optional Holiday': '#ff9800',
  'Special Day': '#9c27b0'
};

const typeIcons = {
  'Public Holiday': <PublicIcon />,
  'Company Holiday': <BusinessIcon />,
  'Optional Holiday': <StarIcon />,
  'Special Day': <EventIcon />
};

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [filters, setFilters] = useState<HolidayFilters>(initialFilters);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Remove mock data; integrate Firebase
  const fetchHolidays = async () => {
    try {
      const result = await firebaseService.getCollection('holidays');
      if (result && result.success && result.data) {
        const mapped: Holiday[] = result.data.map((doc: any) => ({
          id: doc.id,
          name: doc.name || '',
          date: doc.date || '',
          type: (doc.type as Holiday['type']) || 'Public Holiday',
          description: doc.description || '',
          isActive: doc.isActive !== false,
          isRecurring: !!doc.isRecurring,
          country: doc.country || '',
          region: doc.region || '',
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
        }));
        setHolidays(mapped);
      } else {
        setHolidays([]);
      }
    } catch (e: any) {
      console.error('Error fetching holidays:', e);
      setSnackbar({
        open: true,
        message: 'Failed to load holidays',
        severity: 'error'
      });
      setHolidays([]);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [holidays, filters]);

  const applyFilters = () => {
    let filtered = [...holidays];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(searchLower) ||
        holiday.description.toLowerCase().includes(searchLower) ||
        (holiday.country || '').toLowerCase().includes(searchLower) ||
        (holiday.region || '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(holiday => holiday.type === filters.type);
    }

    if (filters.year) {
      filtered = filtered.filter(holiday => holiday.date.startsWith(filters.year));
    }

    if (filters.country) {
      filtered = filtered.filter(holiday => holiday.country === filters.country);
    }

    if (filters.showActiveOnly) {
      filtered = filtered.filter(holiday => holiday.isActive);
    }

    setFilteredHolidays(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: keyof HolidayFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateHoliday = () => {
    setSelectedHoliday(null);
    setFormData(initialFormData);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description,
      isActive: holiday.isActive,
      isRecurring: holiday.isRecurring,
      country: holiday.country || '',
      region: holiday.region || ''
    });
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description,
      isActive: holiday.isActive,
      isRecurring: holiday.isRecurring,
      country: holiday.country || '',
      region: holiday.region || ''
    });
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      const result = await firebaseService.deleteDocument('holidays', holidayId);
      if (result && result.success) {
        await fetchHolidays();
        setSnackbar({ open: true, message: 'Holiday deleted successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete holiday', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Error deleting holiday', severity: 'error' });
    }
  };

  const handleSaveHoliday = async () => {
    if (!formData.name || !formData.date || !formData.type) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      if (selectedHoliday) {
        // Update existing holiday
        const updateData = {
          ...formData,
          updatedAt: new Date().toISOString()
        };
        const result = await firebaseService.updateDocument('holidays', selectedHoliday.id, updateData);
        if (result && result.success) {
          setSnackbar({ open: true, message: 'Holiday updated successfully', severity: 'success' });
          setIsDialogOpen(false);
          await fetchHolidays();
        } else {
          setSnackbar({ open: true, message: 'Failed to update holiday', severity: 'error' });
        }
      } else {
        // Create new holiday
        const createData = {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const result = await firebaseService.addDocument('holidays', createData);
        if (result && result.success) {
          setSnackbar({ open: true, message: 'Holiday created successfully', severity: 'success' });
          setIsDialogOpen(false);
          await fetchHolidays();
        } else {
          setSnackbar({ open: true, message: 'Failed to create holiday', severity: 'error' });
        }
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Error saving holiday', severity: 'error' });
    }
  };

  const getTypeColor = (type: string) => {
    return typeColors[type as keyof typeof typeColors] || '#9e9e9e';
  };

  const getTypeIcon = (type: string) => {
    return typeIcons[type as keyof typeof typeIcons] || <EventIcon />;
  };

  const getActiveCount = () => holidays.filter(h => h.isActive).length;
  const getInactiveCount = () => holidays.filter(h => !h.isActive).length;
  const getPublicHolidaysCount = () => holidays.filter(h => h.type === 'Public Holiday').length;
  const getCompanyHolidaysCount = () => holidays.filter(h => h.type === 'Company Holiday').length;
  const getTotalCount = () => holidays.length;

  const paginatedHolidays = filteredHolidays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Holidays Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            sx={{ mr: 1 }}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateHoliday}
          >
            Add Holiday
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Holidays
            </Typography>
            <Typography variant="h4" component="div">
              {getTotalCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All holidays
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Holidays
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {getActiveCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently active
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Public Holidays
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {getPublicHolidaysCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              National holidays
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Company Holidays
            </Typography>
            <Typography variant="h4" component="div" color="secondary.main">
              {getCompanyHolidaysCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Company specific
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Inactive Holidays
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {getInactiveCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Disabled holidays
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Search Holidays"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by name, description, country..."
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {holidayTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select
              value={filters.year}
              label="Year"
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <MenuItem value="">All Years</MenuItem>
              {years.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={filters.country}
              label="Country"
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <MenuItem value="">All Countries</MenuItem>
              {countries.map(country => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={filters.showActiveOnly}
                onChange={(e) => handleFilterChange('showActiveOnly', e.target.checked)}
              />
            }
            label="Show Active Only"
          />
        </Box>
      </Paper>

      {/* Holidays Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Holiday</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Country/Region</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedHolidays.map((holiday) => (
                <TableRow key={holiday.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {holiday.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                        {holiday.description}
                      </Typography>
                      {holiday.isRecurring && (
                        <Chip
                          label="Recurring"
                          size="small"
                          variant="outlined"
                          color="info"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon color="action" fontSize="small" />
                      <Typography variant="body2">
                        {new Date(holiday.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(holiday.type)}
                      <Chip
                        label={holiday.type}
                        size="small"
                        sx={{
                          bgcolor: getTypeColor(holiday.type),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {holiday.country || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {holiday.region || 'All Regions'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={holiday.isActive ? 'Active' : 'Inactive'}
                      color={holiday.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewHoliday(holiday)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Holiday">
                        <IconButton
                          size="small"
                          onClick={() => handleEditHoliday(holiday)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Holiday">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Holiday Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            <Typography variant="h6" component="span">
              {isViewMode ? 'View Holiday' : selectedHoliday ? 'Edit Holiday' : 'Add New Holiday'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isViewMode
              ? 'Viewing holiday details'
              : `Fill the details below to ${selectedHoliday ? 'update the' : 'create a new'} holiday. Fields marked with * are required.`}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Basic Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <TextField
                    fullWidth
                    label="Holiday Name *"
                    placeholder="e.g., Independence Day"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isViewMode}
                    required
                    size="medium"
                    margin="normal"
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <TextField
                    fullWidth
                    label="Date *"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    disabled={isViewMode}
                    required
                    InputLabelProps={{ shrink: true }}
                    helperText={!isViewMode ? 'Select the calendar date for the holiday' : undefined}
                    size="medium"
                    margin="normal"
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControl fullWidth required disabled={isViewMode} size="medium" sx={{ minWidth: 240 }}>
                    <InputLabel id="holiday-type-label">Type *</InputLabel>
                    <Select
                      labelId="holiday-type-label"
                      id="holiday-type-select"
                      value={formData.type}
                      label="Type *"
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {holidayTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(type)}
                            <span>{type}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ gridColumn: 'span 2' }}>
                  <TextField
                    fullWidth
                    label="Description"
                    placeholder="Optional: short note about the holiday"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isViewMode}
                    multiline
                    rows={3}
                    size="medium"
                    margin="normal"
                  />
                </Box>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, mb: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Region & Settings
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControl fullWidth disabled={isViewMode} size="medium" sx={{ minWidth: 240 }}>
                    <InputLabel id="holiday-country-label">Country</InputLabel>
                    <Select
                      labelId="holiday-country-label"
                      id="holiday-country-select"
                      value={formData.country}
                      label="Country"
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                    >
                      {countries.map(country => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControl fullWidth disabled={isViewMode} size="medium" sx={{ minWidth: 240 }}>
                    <InputLabel id="holiday-region-label">Region</InputLabel>
                    <Select
                      labelId="holiday-region-label"
                      id="holiday-region-select"
                      value={formData.region}
                      label="Region"
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                    >
                      <MenuItem value=""><em>All Regions</em></MenuItem>
                      {regions.map(region => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        disabled={isViewMode}
                      />
                    }
                    label="Recurring every year"
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        disabled={isViewMode}
                      />
                    }
                    label="Active"
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSaveHoliday} variant="contained" startIcon={<SaveIcon />}> 
              {selectedHoliday ? 'Update Holiday' : 'Create Holiday'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Holidays;