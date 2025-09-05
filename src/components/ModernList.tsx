import type { ReactNode, MouseEvent } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Grow,
  useTheme,
  alpha,
  type SxProps,
  type Theme,
  type ListProps,
} from '@mui/material';

// Type definitions
type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
type PaletteColorKey = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface ModernListAction {
  icon: ReactNode;
  tooltip: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  color?: PaletteColorKey;
}

interface ModernListDetail {
  icon?: ReactNode;
  text: string;
}

interface ModernListItem {
  id?: string | number;
  avatar?: ReactNode;
  icon?: ReactNode;
  title?: string;
  name?: string;
  subtitle?: string;
  status?: string;
  statusColor?: ChipColor;
  details?: ModernListDetail[];
  actions?: ModernListAction[];
}

interface ModernListProps extends Omit<ListProps, 'children'> {
  items?: ModernListItem[];
  renderItem?: (item: ModernListItem, index: number) => ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
  sx?: SxProps<Theme>;
}

const ModernList = ({
  items = [] as ModernListItem[],
  renderItem,
  emptyMessage = "No items found",
  emptyIcon,
  loading = false,
  sx = {},
  ...props
}: ModernListProps) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
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
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        {emptyIcon && (
          <Box sx={{ mb: 2 }}>
            {emptyIcon}
          </Box>
        )}
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List
      sx={{
        '& .MuiListItem-root': {
          mb: 2,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.8)',
            transform: 'translateX(4px)',
          },
        },
        ...sx,
      }}
      {...props}
    >
      {items.map((item: ModernListItem, index: number) => (
        <Grow in timeout={800 + index * 100} key={item.id || index}>
          {renderItem ? (
            <Box component="div">{renderItem(item, index)}</Box>
          ) : (
            <ListItem>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    width: 48,
                    height: 48,
                  }}
                >
                  {item.avatar || item.icon || '?'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.title || item.name}
                    </Typography>
                    {item.status && (
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.statusColor || 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    {item.subtitle && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item.subtitle}
                      </Typography>
                    )}
                    {item.details && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {item.details.map((detail: ModernListDetail, detailIndex: number) => (
                          <Box key={detailIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {detail.icon && detail.icon}
                            <Typography variant="caption" color="text.secondary">
                              {detail.text}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {item.actions && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.actions.map((action: ModernListAction, actionIndex: number) => {
                      const paletteKey: PaletteColorKey = action.color || 'primary';
                      const hoverBg = alpha(theme.palette[paletteKey]!.main, 0.1);
                      return (
                        <Tooltip key={actionIndex} title={action.tooltip}>
                          <IconButton
                            onClick={action.onClick}
                            sx={{
                              color: `${paletteKey}.main`,
                              '&:hover': {
                                background: hoverBg,
                              },
                            }}
                          >
                            {action.icon}
                          </IconButton>
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          )}
        </Grow>
      ))}
    </List>
  );
};

export default ModernList; 