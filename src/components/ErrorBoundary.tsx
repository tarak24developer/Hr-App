import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  Fade,
  Grow,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env['NODE_ENV'] === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
            window.location.href = '/dashboard';
  };

  toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  override render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        showDetails={this.state.showDetails}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
        onToggleDetails={this.toggleDetails}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  onRetry: () => void;
  onGoHome: () => void;
  onToggleDetails: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  showDetails, 
  onRetry, 
  onGoHome, 
  onToggleDetails 
}) => {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <Grow in timeout={1000}>
            <Paper
              elevation={8}
              sx={{
                p: { xs: 3, sm: 4, md: 6 },
                borderRadius: 4,
                width: '100%',
                maxWidth: 600,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
              }}
            >
              {/* Error Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                <ErrorIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>

              {/* Error Title */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                  color: 'text.primary',
                }}
              >
                Oops! Something went wrong
              </Typography>

              {/* Error Message */}
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.6,
                }}
              >
                We encountered an unexpected error. Don't worry, our team has been notified and is working to fix it.
              </Typography>

              {/* Error Alert */}
              <Alert
                severity="error"
                icon={<BugReportIcon />}
                sx={{
                  mb: 4,
                  borderRadius: 2,
                  textAlign: 'left',
                  '& .MuiAlert-icon': {
                    fontSize: '1.25rem',
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Error Details:
                </Typography>
                <Typography variant="caption" component="div">
                  {error?.message || 'An unknown error occurred'}
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={onRetry}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    },
                    minWidth: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={onGoHome}
                  sx={{
                    minWidth: { xs: '100%', sm: 'auto' },
                    borderWidth: '2px',
                    '&:hover': {
                      borderWidth: '2px',
                    },
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>

              {/* Error Details Toggle */}
              {errorInfo && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="text"
                    onClick={onToggleDetails}
                    sx={{
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    {showDetails ? 'Hide' : 'Show'} Technical Details
                  </Button>

                  {showDetails && (
                    <Fade in timeout={300}>
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          background: '#f8f9fa',
                          borderRadius: 2,
                          border: '1px solid #e9ecef',
                          textAlign: 'left',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        <Typography
                          variant="caption"
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {errorInfo.componentStack}
                        </Typography>
                      </Box>
                    </Fade>
                  )}
                </Box>
              )}

              {/* Help Text */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 3,
                  fontSize: '0.75rem',
                  opacity: 0.7,
                }}
              >
                If this problem persists, please contact support
              </Typography>
            </Paper>
          </Grow>
        </Box>
      </Fade>
    </Container>
  );
};

export default ErrorBoundary; 