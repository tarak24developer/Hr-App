import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,

  Chip
} from '@mui/material';
import { useFirestoreData } from '../hooks/useFirestoreData';

interface CollectionItem {
  name?: string;
  employeeName?: string;
  itemName?: string;
  [key: string]: any;
}

interface CollectionHook {
  data: CollectionItem[];
  loading: boolean;
  error: string | null;
  message: string | null;
  refresh: () => void;
}

interface Collection {
  name: string;
  hook: CollectionHook;
  color: string;
}

// Test component to demonstrate improved data fetching
const DataFetchingTest: React.FC = () => {
  // Test different collections
  const employees = useFirestoreData('employees');
  const departments = useFirestoreData('departments');
  const assets = useFirestoreData('assets');
  const inventory = useFirestoreData('inventory');

  const collections: Collection[] = [
    { name: 'Employees', hook: employees, color: 'primary' },
    { name: 'Departments', hook: departments, color: 'secondary' },
    { name: 'Assets', hook: assets, color: 'success' },
    { name: 'Inventory', hook: inventory, color: 'warning' }
  ];

  const handleRefresh = (collectionName: string, refreshFn: () => void) => {
    console.log(`Refreshing ${collectionName}...`);
    refreshFn();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Fetching Test
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This component demonstrates the improved data fetching with automatic fallback and sample data initialization.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {collections.map(({ name, hook, color }) => (
          <Box key={name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color={`${color}.main`}>
                    {name}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => handleRefresh(name, hook.refresh)}
                    disabled={hook.loading}
                  >
                    {hook.loading ? <CircularProgress size={16} /> : '🔄'}
                  </Button>
                </Box>

                {hook.loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                {hook.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {hook.error}
                  </Alert>
                )}

                {hook.message && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {hook.message}
                  </Alert>
                )}

                {!hook.loading && !hook.error && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Items: {hook.data.length}
                    </Typography>
                    
                    {hook.data.length > 0 ? (
                      <Box>
                        {hook.data.slice(0, 3).map((item: CollectionItem, index: number) => (
                          <Chip
                            key={index}
                            label={item.name || item.employeeName || item.itemName || `Item ${index + 1}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                        {hook.data.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{hook.data.length - 3} more items
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          How it works:
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
          1. <strong>First attempt:</strong> Try to fetch from Firestore
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
          2. <strong>If empty:</strong> Automatically initialize with sample data
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
          3. <strong>Fallback:</strong> Return empty array with helpful message
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
          4. <strong>Error handling:</strong> Graceful degradation with user feedback
        </Typography>
      </Box>
    </Box>
  );
};

export default DataFetchingTest;
