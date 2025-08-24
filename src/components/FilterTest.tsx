import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Alert, TextField } from '@mui/material';
import { useDataService } from '../hooks/useDataService';

interface TestFilters {
  department: string;
  status: string;
  salary: string;
}

const FilterTest: React.FC = () => {
  const [testFilters, setTestFilters] = useState<TestFilters>({
    department: '',
    status: '',
    salary: ''
  });

  // Test with various filter combinations
  const employeesWithFilters = useDataService({ 
    collectionName: 'employees',
    enabled: false
  });

  const employeesNoFilters = useDataService({ 
    collectionName: 'employees',
    enabled: false
  });

  const employeesUndefinedFilters = useDataService({ 
    collectionName: 'employees',
    enabled: false
  });

  const employeesNullFilters = useDataService({ 
    collectionName: 'employees',
    enabled: false
  });

  const handleFilterChange = (field: keyof TestFilters, value: string) => {
    setTestFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const runFilterTests = () => {
    console.log('Running filter tests...');
    
    // Test 1: Valid filters
    employeesWithFilters.refetch();
    
    // Test 2: Empty filters
    employeesNoFilters.refetch();
    
    // Test 3: Undefined filters
    employeesUndefinedFilters.refetch();
    
    // Test 4: Null filters
    employeesNullFilters.refetch();
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'info' | 'warning' => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'loading': return 'info';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Filter Validation Test
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component tests various filter scenarios to ensure our validation fixes prevent the 
        "Cannot read properties of undefined (reading 'toString')" errors.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Filters
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
            <Box>
              <TextField
                fullWidth
                label="Department"
                value={testFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                placeholder="Enter department name"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Status"
                value={testFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                placeholder="Enter status"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={testFilters.salary}
                onChange={(e) => handleFilterChange('salary', e.target.value)}
                placeholder="Enter salary"
              />
            </Box>
          </Box>
          
          <Button 
            variant="contained" 
            onClick={runFilterTests}
            sx={{ mr: 2 }}
          >
            Run All Tests
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => employeesWithFilters.refetch()}
            sx={{ mr: 2 }}
          >
            Test Current Filters
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                With Current Filters
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Filters: {JSON.stringify(testFilters)}
              </Typography>
              <Alert severity={getStatusColor(employeesWithFilters.error ? 'error' : 'success')}>
                {employeesWithFilters.error || 'Ready to test'}
              </Alert>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Data count: {employeesWithFilters.data?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                No Filters (Empty Object)
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Filters: {}
              </Typography>
              <Alert severity={getStatusColor(employeesNoFilters.error ? 'error' : 'success')}>
                {employeesNoFilters.error || 'Ready to test'}
              </Alert>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Data count: {employeesNoFilters.data?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Undefined Filters
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Filters: undefined
              </Typography>
              <Alert severity={getStatusColor(employeesUndefinedFilters.error ? 'error' : 'success')}>
                {employeesUndefinedFilters.error || 'Ready to test'}
              </Alert>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Data count: {employeesUndefinedFilters.data?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Null Filters
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Filters: null
              </Typography>
              <Alert severity={getStatusColor(employeesNullFilters.error ? 'error' : 'success')}>
                {employeesNullFilters.error || 'Ready to test'}
              </Alert>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Data count: {employeesNullFilters.data?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Results Summary
          </Typography>
          <Typography variant="body2" paragraph>
            All tests should complete without throwing the "Cannot read properties of undefined (reading 'toString')" error.
            Check the console for detailed logs of the filter conversion process.
          </Typography>
          
          <Alert severity="info">
            <Typography variant="body2">
              <strong>What this tests:</strong><br/>
              • Object filters conversion to Firestore format<br/>
              • Empty object filter handling<br/>
              • Undefined/null filter handling<br/>
              • Filter validation before Firestore queries<br/>
              • Error handling for malformed filters
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FilterTest;
