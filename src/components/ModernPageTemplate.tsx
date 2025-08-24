import React from 'react';
import {
  Box,
  Container,
  Typography,
  Fade,
  Grow,
  useTheme,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

const ModernPageTemplate = ({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  statsCards,
  loading = false,
  loadingText = "Loading...",
  error = null,
  errorText = "Something went wrong",
  onRetry = null,
}) => {
  const theme = useTheme();

  if (loading) {
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
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.1)', opacity: 0.7 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            />
            <Typography variant="h6" color="text.secondary">
              {loadingText}
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          p: 3,
        }}
      >
        <Fade in timeout={800}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
              {errorText}
            </Typography>
            {onRetry && (
              <Box
                component="button"
                onClick={onRetry}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Retry
              </Box>
            )}
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100vh',
        py: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: { xs: 1, sm: 2, md: 2 } }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 3,
            gap: { xs: 1.5, sm: 0 }
          }}>
            <Grow in timeout={1000}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  backgroundClip: 'text', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                }}>
                  {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ 
                  fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                  opacity: 0.8,
                }}>
                  {subtitle}
                </Typography>
              </Box>
            </Grow>
            
            {headerActions && (
              <Grow in timeout={1200}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {headerActions}
                </Box>
              </Grow>
            )}
          </Box>
        </Fade>

        {/* Content */}
        <Fade in timeout={1400}>
          <Box>
            {statsCards && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  {statsCards}
                </Grid>
              </Box>
            )}
            
            <Card
              sx={{
                backgroundColor: 'background.paper',
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                height: '100%',
                p: 2,
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {children}
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ModernPageTemplate; 