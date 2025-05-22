import React, { useState, ChangeEvent } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Grid,
  Paper,
  ThemeProvider,
  createTheme,
  alpha,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Northwestern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4E2A84', // Northwestern Purple
      light: '#6B4C9A',
      dark: '#3A1F5E',
    },
    secondary: {
      main: '#FFFFFF', // White
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

interface Party {
  id: number;
  title: string;
  location: string;
  description: string;
  votes: number;
}

function App() {
  const [parties, setParties] = useState<Party[]>([]);
  const [newParty, setNewParty] = useState({
    title: '',
    location: '',
    description: ''
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreatePartyOpen, setIsCreatePartyOpen] = useState(false);

  const handleAddParty = () => {
    if (newParty.title && newParty.location) {
      setParties([
        ...parties,
        {
          id: Date.now(),
          ...newParty,
          votes: 0
        }
      ]);
      setNewParty({ title: '', location: '', description: '' });
      setIsCreatePartyOpen(false);
    }
  };

  const handleVote = (id: number, increment: number) => {
    setParties(parties.map(party => 
      party.id === id ? { ...party, votes: party.votes + increment } : party
    ));
  };

  const CreatePartyForm = () => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Create New Party
        </Typography>
        <IconButton onClick={() => setIsCreatePartyOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Party Title"
            value={newParty.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewParty({ ...newParty, title: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Location"
            value={newParty.location}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewParty({ ...newParty, location: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newParty.description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewParty({ ...newParty, description: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddParty}
            size="large"
            sx={{ 
              px: 4,
              py: 1.5,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              boxShadow: '0 3px 5px 2px rgba(78, 42, 132, .3)',
            }}
          >
            Add Party
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              WTM - Where's The Move?
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setIsDrawerOpen(true)}
              sx={{ ml: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <List>
              <ListItem button onClick={() => {
                setIsCreatePartyOpen(true);
                setIsDrawerOpen(false);
              }}>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Create Party" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          {isCreatePartyOpen ? (
            <CreatePartyForm />
          ) : (
            <>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                Tonight's Parties
              </Typography>

              {parties.map((party) => (
                <Card key={party.id} sx={{ mb: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                          {party.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon sx={{ color: 'primary.light', mr: 1, fontSize: 20 }} />
                          <Typography color="textSecondary">
                            {party.location}
                          </Typography>
                        </Box>
                        {party.description && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
                            <DescriptionIcon sx={{ color: 'primary.light', mr: 1, mt: 0.5, fontSize: 20 }} />
                            <Typography variant="body2" color="textSecondary">
                              {party.description}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 2,
                          p: 1
                        }}>
                          <IconButton 
                            onClick={() => handleVote(party.id, -1)}
                            sx={{ color: 'primary.main' }}
                          >
                            <ThumbDownIcon />
                          </IconButton>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              mx: 2,
                              color: 'primary.main',
                              fontWeight: 600,
                              minWidth: 40,
                              textAlign: 'center'
                            }}
                          >
                            {party.votes}
                          </Typography>
                          <IconButton 
                            onClick={() => handleVote(party.id, 1)}
                            sx={{ color: 'primary.main' }}
                          >
                            <ThumbUpIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 