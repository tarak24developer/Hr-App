import React from 'react';
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
} from '@mui/material';

const ModernList = ({
  items = [],
  renderItem,
  emptyMessage = "No items found",
  emptyIcon,
  loading = false,
  sx = {},
  ...props
}) => {
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
      {items.map((item, index) => (
        <Grow in timeout={800 + index * 100} key={item.id || index}>
          {renderItem ? (
            renderItem(item, index)
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
                        {item.details.map((detail, detailIndex) => (
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
                    {item.actions.map((action, actionIndex) => (
                      <Tooltip key={actionIndex} title={action.tooltip}>
                        <IconButton
                          onClick={action.onClick}
                          sx={{
                            color: action.color || 'primary.main',
                            '&:hover': {
                              background: alpha(theme.palette[action.color || 'primary'].main, 0.1),
                            },
                          }}
                        >
                          {action.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
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