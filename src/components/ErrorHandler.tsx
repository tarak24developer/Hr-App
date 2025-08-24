import { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Paper,
  Container,
  Fade,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ErrorDetails {
  type: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
  action?: string;
}

interface ErrorHandlerProps {
  error: any;
  onRetry?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({ error, onRetry, onClose, children }) => {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  useEffect(() => {
    if (error) {
      setShowSnackbar(true);
      setErrorDetails(parseError(error));
    }
  }, [error]);

  const parseError = (error: any): ErrorDetails => {
    // Network errors
    if (!error.response) {
      return {
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        severity: 'error',
        retryable: true
      };
    }

    // HTTP status code based errors
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return {
          type: 'validation',
          title: 'Invalid Request',
          message: data?.message || 'Please check your input and try again.',
          severity: 'warning',
          retryable: false
        };
      
      case 401:
        return {
          type: 'authentication',
          title: 'Authentication Required',
          message: 'Please log in again to continue.',
          severity: 'error',
          retryable: false,
          action: 'redirect'
        };
      
      case 403:
        return {
          type: 'authorization',
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          severity: 'error',
          retryable: false
        };
      
      case 404:
        return {
          type: 'not_found',
          title: 'Resource Not Found',
          message: 'The requested resource could not be found.',
          severity: 'warning',
          retryable: false
        };
      
      case 409:
        return {
          type: 'conflict',
          title: 'Conflict',
          message: data?.message || 'This action conflicts with existing data.',
          severity: 'warning',
          retryable: false
        };
      
      case 422:
        return {
          type: 'validation',
          title: 'Validation Error',
          message: data?.message || 'Please check your input and try again.',
          severity: 'warning',
          retryable: false
        };
      
      case 429:
        return {
          type: 'rate_limit',
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
          severity: 'warning',
          retryable: true
        };
      
      case 500:
        return {
          type: 'server',
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          severity: 'error',
          retryable: true
        };
      
      case 502:
      case 503:
      case 504:
        return {
          type: 'service_unavailable',
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          severity: 'error',
          retryable: true
        };
      
      default:
        return {
          type: 'unknown',
          title: 'Unexpected Error',
          message: data?.message || 'An unexpected error occurred. Please try again.',
          severity: 'error',
          retryable: true
        };
    }
  };

  const handleRetry = () => {
    setShowSnackbar(false);
    if (onRetry) {
      onRetry();
    }
  };

  const handleClose = () => {
    setShowSnackbar(false);
    if (onClose) {
      onClose();
    }
  };

  const handleRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network':
      case 'server':
      case 'service_unavailable':
        return <ErrorIcon />;
      case 'validation':
      case 'conflict':
        return <WarningIcon />;
      case 'authentication':
      case 'authorization':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // If no error, render children normally
  if (!error) {
    return children;
  }

  // For critical errors, show full page error
  if (errorDetails?.type === 'authentication' || errorDetails?.type === 'server') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Fade in timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3 }}>
              {errorDetails && getErrorIcon(errorDetails.type)}
            </Box>
            
            <Typography variant="h5" gutterBottom>
              {errorDetails?.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {errorDetails?.message}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {errorDetails?.type === 'authentication' ? (
                <Button 
                  variant="contained" 
                  onClick={handleRedirect}
                  startIcon={<RefreshIcon />}
                >
                  Go to Login
                </Button>
              ) : errorDetails?.retryable ? (
                <Button 
                  variant="contained" 
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                >
                  Try Again
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  onClick={handleClose}
                >
                  Close
                </Button>
              )}
            </Box>
          </Paper>
        </Fade>
      </Container>
    );
  }

  // For non-critical errors, show snackbar
  return (
    <>
      {children}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={errorDetails?.type === 'rate_limit' ? 10000 : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={errorDetails?.severity || 'error'}
          onClose={handleClose}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {errorDetails?.retryable && (
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleRetry}
                  sx={{ mr: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          }
          sx={{ width: '100%' }}
        >
          <AlertTitle>{errorDetails?.title}</AlertTitle>
          {errorDetails?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ErrorHandler; 