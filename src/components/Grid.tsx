import React from 'react';
import { Grid as MuiGrid } from '@mui/material';
import type { GridProps } from '@mui/material/Grid';

interface CustomGridProps extends Omit<GridProps, 'item' | 'xs' | 'sm'> {
  item?: boolean;
  xs?: number;
  sm?: number;
}

export const Grid = React.forwardRef<HTMLDivElement, CustomGridProps>((props, ref) => (
  <MuiGrid ref={ref} {...props} />
));

Grid.displayName = 'Grid'; 