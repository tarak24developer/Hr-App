import type { ReactNode } from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children?: ReactNode;
  value: number;
  index: number;
  [key: string]: any;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tracking-tabpanel-${index}`}
      aria-labelledby={`tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default TabPanel; 