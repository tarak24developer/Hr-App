
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  Grow,
  Backdrop,
  Paper,
  Container
} from '@mui/material';


interface LoadingSpinnerProps {
  loading?: boolean;
  message?: string;
  type?: 'full' | 'inline' | 'overlay';
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  loading = false, 
  message = 'Loading...', 
  type = 'full', 
  size = 'medium'
}) => {
  if (!loading) return null;

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'medium': return 40;
      case 'large': return 60;
      default: return 40;
    }
  };

  const getMessage = () => {
    if (typeof message === 'string') {
      return message;
    }
    return 'Loading...';
  };

  // Full page loading
  if (type === 'full') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      >
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={getSize()} 
              sx={{ 
                color: 'primary.main',
                mb: 2,
              }} 
            />
            <Typography variant="h6" color="text.secondary">
              {getMessage()}
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  // Inline loading
  if (type === 'inline') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={getSize()} />
        <Typography variant="body2" color="text.secondary">
          {getMessage()}
        </Typography>
      </Box>
    );
  }

  // Overlay loading
  if (type === 'overlay') {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        open={loading}
      >
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            textAlign: 'center',
            minWidth: 200,
          }}
        >
          <CircularProgress 
            size={getSize()} 
            sx={{ 
              color: 'primary.main',
              mb: 2,
            }} 
          />
          <Typography variant="body1" color="text.primary">
            {getMessage()}
          </Typography>
        </Paper>
      </Backdrop>
    );
  }

  // Button loading
  if (type === 'button') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">
          {getMessage()}
        </Typography>
      </Box>
    );
  }

  // Card loading
  if (type === 'card') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: 2,
            p: 4,
          }}
        >
          <Grow in timeout={600}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress 
                size={getSize()} 
                sx={{ 
                  color: 'primary.main',
                  mb: 2,
                }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {getMessage()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we load your data...
              </Typography>
            </Box>
          </Grow>
        </Box>
      </Container>
    );
  }

  // Default loading
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <CircularProgress size={getSize()} />
    </Box>
  );
};

export default LoadingSpinner; 