import type { ReactNode, MouseEvent } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Grow,
  useTheme,
  alpha,
  type SxProps,
  type Theme,
  type CardProps,
} from '@mui/material';

type GradientColor = 'primary' | 'success' | 'warning' | 'error' | 'info';
type TrendColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface ModernCardProps extends Omit<CardProps, 'title' | 'color'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  color?: GradientColor;
  trend?: string;
  trendValue?: string;
  trendColor?: TrendColor;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  sx?: SxProps<Theme>;
  delay?: number;
}

const ModernCard = ({
  title,
  subtitle,
  value,
  icon,
  color = 'primary',
  trend,
  trendValue,
  trendColor = 'success',
  onClick,
  children,
  sx = {},
  delay = 0,
  ...props
}: ModernCardProps) => {
  const theme = useTheme();

  const getColorGradient = (colorName: GradientColor): string => {
    const gradients: Record<GradientColor, string> = {
      primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      info: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    };
    return gradients[colorName] || gradients.primary;
  };

  const getTrendColor = (trendColorName: TrendColor): string => {
    const paletteKey: TrendColor = trendColorName || 'success';
    return theme.palette[paletteKey].main;
  };

  return (
    <Grow in timeout={300 + delay}>
      <Card
        sx={{
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            ...(onClick && {
              backgroundColor: 'background.paper',
            }),
          },
          ...sx,
        }}
        onClick={onClick}
        {...props}
      >
        <CardContent sx={{ p: 2, overflow: 'hidden' }}>
          {children || (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                {icon && (
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      background: getColorGradient(color),
                      mr: 1.5,
                      '& .MuiSvgIcon-root': {
                        fontSize: 18,
                      },
                    }}
                  >
                    {icon}
                  </Avatar>
                )}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  {title && (
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 0.25,
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        fontSize: '0.7rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {value && (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 0.75,
                    fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}
                >
                  {value}
                </Typography>
              )}
              
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    label={trend}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: 18,
                      background: alpha(getTrendColor(trendColor), 0.1),
                      color: getTrendColor(trendColor),
                      border: `1px solid ${alpha(getTrendColor(trendColor), 0.2)}`,
                    }}
                  />
                  {trendValue && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.65rem' }}
                    >
                      {trendValue}
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

export default ModernCard; 