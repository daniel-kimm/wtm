import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarTodayIcon,
  Home as HomeIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isNorthwesternEmail, supabase } from './lib/supabase';
import { CreatePartyForm } from './components/CreatePartyForm';

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

interface Comment {
  id: number;
  party_id: number;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
}

interface Party {
  id: number;
  title: string;
  location: string;
  description: string;
  votes: number;
  date: string;
  created_at?: string;
  user_id?: string;
  comments?: Comment[];
  creator_email?: string;
  creator_name?: string;
  creator_avatar?: string;
  latitude?: number;
  longitude?: number;
}

interface UserVotes {
  [partyId: number]: 'up' | 'down' | null;
}

// Add a date formatting function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Add a function to format the creation time
const formatCreationTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

// Add map container style
const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)', // Subtract AppBar height
  border: '1px solid #ccc',
  borderRadius: '4px',
  overflow: 'hidden'
};

// Northwestern coordinates
const defaultCenter = {
  lat: 42.0564,
  lng: -87.6753
};

function AppContent() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreatePartyOpen, setIsCreatePartyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedParty, setExpandedParty] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing map...');
    // Temporarily hardcode the API key for testing
    const apiKey = 'AIzaSyCN9bsomrJ7SxcRqApI9GnSjMavCpyWoWE';
    console.log('Using API key:', apiKey.substring(0, 5) + '...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded');
      const newMap = new google.maps.Map(mapRef.current!, {
        center: defaultCenter,
        zoom: 15,
      });
      console.log('Map created');
      setMap(newMap);
    };
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [mapRef.current]);

  // Update markers when parties change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add new markers
    parties.forEach(party => {
      if (party.latitude && party.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: party.latitude, lng: party.longitude },
          map,
          title: party.title,
        });
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div><strong>${party.title}</strong><br/>${party.location}</div>`
        });
        google.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker as unknown as google.maps.MVCObject);
        });
        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  }, [parties, map]);

  // Fetch parties when component mounts or when user changes
  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Ensure user profile exists
        await ensureUserProfile();

        // Fetch parties with comments
        const { data: partiesData, error: partiesError } = await supabase
          .from('parties_with_users')
          .select('*')
          .order('date', { ascending: true });

        if (partiesError) throw partiesError;

        // Fetch comments for each party
        const partiesWithComments = await Promise.all(
          partiesData.map(async (party) => {
            const { data: comments, error: commentsError } = await supabase
              .from('comments_with_users')
              .select('*')
              .eq('party_id', party.id)
              .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;
            return { ...party, comments };
          })
        );

        setParties(partiesWithComments);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user]);

  // Add this function to ensure user profile exists
  const ensureUserProfile = async () => {
    if (!user) return null;

    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingProfile) {
        return existingProfile;
      }

      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  };

  // Update handleAddParty to use ensureUserProfile
  const handleAddParty = async (partyData: Omit<Party, 'id' | 'votes' | 'created_at' | 'user_id'>) => {
    try {
      console.log('Creating new party with data:', partyData);
      console.log('Current user:', user?.id);

      // Ensure user profile exists first
      await ensureUserProfile();

      const { data, error } = await supabase
        .from('parties')
        .insert([
          {
            title: partyData.title,
            location: partyData.location,
            description: partyData.description,
            date: partyData.date.split('T')[0],
            votes: 0,
            user_id: user?.id,
            latitude: partyData.latitude,
            longitude: partyData.longitude
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Optimistically add the new party
      setParties(prev => [...prev, data]);
      setIsCreatePartyOpen(false);

      // Helper to re-fetch with retries
      const fetchPartiesWithRetry = async (retries = 3, delay = 500) => {
        for (let i = 0; i < retries; i++) {
          const { data: partiesData, error: partiesError } = await supabase
            .from('parties_with_users')
            .select('*')
            .order('date', { ascending: true });

          // If the new party is present and has latitude/longitude, update state and return
          if (
            !partiesError &&
            Array.isArray(partiesData) &&
            partiesData.some(
              p =>
                p.id === data.id &&
                p.latitude != null &&
                p.longitude != null
            )
          ) {
            setParties(partiesData);
            return;
          }
          // Wait before retrying
          await new Promise(res => setTimeout(res, delay));
        }
        // Final attempt (even if not found)
        const { data: partiesData } = await supabase
          .from('parties_with_users')
          .select('*')
          .order('date', { ascending: true });
        if (Array.isArray(partiesData)) setParties(partiesData);
      };

      // Call the retry fetch
      fetchPartiesWithRetry();
    } catch (error) {
      console.error('Error adding party:', error);
      setError('Failed to create party. Please try again.');
    }
  };

  const handleVote = async (id: number, voteType: 'up' | 'down') => {
    let voteChange = 0;
    setParties(prev => prev.map(party => {
      if (party.id === id) {
        const currentVote = userVotes[id] || null;
        if (currentVote === voteType) {
          voteChange = voteType === 'up' ? -1 : 1;
          setUserVotes(prev => ({ ...prev, [id]: null }));
        } else if (currentVote === null) {
          voteChange = voteType === 'up' ? 1 : -1;
          setUserVotes(prev => ({ ...prev, [id]: voteType }));
        } else {
          voteChange = voteType === 'up' ? 2 : -2;
          setUserVotes(prev => ({ ...prev, [id]: voteType }));
        }
        return { ...party, votes: party.votes + voteChange };
      }
      return party;
    }));

    // Persist the new vote count to Supabase
    const party = parties.find(p => p.id === id);
    if (!party) return;
    const newVoteCount = party.votes + voteChange;
    const { error } = await supabase
      .from('parties')
      .update({ votes: newVoteCount })
      .eq('id', id);

    if (error) {
      console.error('Error updating votes:', error);
      return;
    }

    // Re-fetch parties to get the latest vote counts from the database
    const { data: partiesData, error: partiesError } = await supabase
      .from('parties_with_users')
      .select('*')
      .order('date', { ascending: true });

    if (!partiesError && Array.isArray(partiesData)) {
      setParties(partiesData);
    }
  };

  const handleDeleteParty = async (partyId: number) => {
    try {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', partyId);

      if (error) throw error;

      setParties(prev => prev.filter(party => party.id !== partyId));
    } catch (error) {
      console.error('Error deleting party:', error);
      setError('Failed to delete party. Please try again.');
    }
  };

  const handleAddComment = async (partyId: number) => {
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            party_id: partyId,
            user_id: user?.id,
            content: newComment.trim()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setParties(prev => prev.map(party => {
        if (party.id === partyId) {
          return {
            ...party,
            comments: [...(party.comments || []), data]
          };
        }
        return party;
      }));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (partyId: number, commentId: number) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setParties(prev => prev.map(party => {
        if (party.id === partyId) {
          return {
            ...party,
            comments: party.comments?.filter(c => c.id !== commentId) || []
          };
        }
        return party;
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    }
  };

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ 
          flexGrow: 1, 
          minHeight: '100vh', 
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              welcome to wtm
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              sign in with your northwestern email to continue
            </Typography>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={signInWithGoogle}
              size="large"
              fullWidth
              sx={{ 
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                boxShadow: '0 3px 5px 2px rgba(78, 42, 132, .3)',
              }}
            >
              sign in with google
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (!isNorthwesternEmail(user.email || '')) {
    console.log('User email:', user.email);
    console.log('User metadata:', user.user_metadata);
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ 
          flexGrow: 1, 
          minHeight: '100vh', 
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              access denied
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
              this platform is only available to northwestern students.
              please sign in with your @northwestern.edu email address.
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
              current email: {user.email}
            </Typography>
            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={signOut}
              size="large"
              fullWidth
              sx={{ 
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                boxShadow: '0 3px 5px 2px rgba(78, 42, 132, .3)',
              }}
            >
              sign out
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              wtm?
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={user.user_metadata?.avatar_url} 
                alt={user.email || 'User'} 
                sx={{ width: 32, height: 32 }}
              />
              <IconButton 
                color="inherit" 
                onClick={() => setIsDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
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
                setIsCreatePartyOpen(false);
                setIsDrawerOpen(false);
              }}>
                <ListItemIcon>
                  <HomeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="home" />
              </ListItem>
              <ListItem button onClick={() => {
                setIsCreatePartyOpen(true);
                setIsDrawerOpen(false);
              }}>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="create party" />
              </ListItem>
              <Divider />
              <ListItem button onClick={signOut}>
                <ListItemIcon>
                  <LogoutIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="sign out" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Grid container spacing={0}>
          {/* Map Section */}
          <Grid item xs={12} md={6}>
            <div ref={mapRef} style={mapContainerStyle} />
          </Grid>

          {/* Parties Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              height: 'calc(100vh - 64px)', 
              overflowY: 'auto',
              p: 2
            }}>
              {isCreatePartyOpen ? (
                <CreatePartyForm 
                  onClose={() => setIsCreatePartyOpen(false)}
                  onAddParty={handleAddParty}
                  theme={theme}
                />
              ) : (
                <>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                    parties @ northwestern
                  </Typography>

                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                      <Typography>{error}</Typography>
                      <Button 
                        onClick={() => window.location.reload()} 
                        sx={{ mt: 2 }}
                        variant="contained"
                      >
                        Retry
                      </Button>
                    </Paper>
                  ) : parties.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="textSecondary">
                        no parties scheduled yet. be the first to create one!
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsCreatePartyOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        create party
                      </Button>
                    </Paper>
                  ) : (
                    parties.map((party) => (
                      <Card key={party.id} sx={{ mb: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AccessTimeIcon sx={{ color: 'primary.light', mr: 1, fontSize: 20 }} />
                                <Typography variant="body2" color="textSecondary">
                                  posted {formatCreationTime(party.created_at || '')}
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                                {party.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationIcon sx={{ color: 'primary.light', mr: 1, fontSize: 20 }} />
                                <Typography color="textSecondary">
                                  {party.location}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarTodayIcon sx={{ color: 'primary.light', mr: 1, fontSize: 20 }} />
                                <Typography color="textSecondary">
                                  {formatDate(party.date)}
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
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 1
                              }}>
                                {party.user_id === user?.id && (
                                  <IconButton
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this party?')) {
                                        handleDeleteParty(party.id);
                                      }
                                    }}
                                    sx={{ 
                                      color: 'error.main',
                                      '&:hover': {
                                        color: 'error.dark',
                                        bgcolor: 'error.light'
                                      }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'flex-end',
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  borderRadius: 2,
                                  p: 1
                                }}>
                                  <IconButton 
                                    onClick={() => handleVote(party.id, 'down')}
                                    sx={{ 
                                      color: userVotes[party.id] === 'down' ? 'error.main' : 'primary.main',
                                      '&:hover': {
                                        color: 'error.main'
                                      }
                                    }}
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
                                    onClick={() => handleVote(party.id, 'up')}
                                    sx={{ 
                                      color: userVotes[party.id] === 'up' ? 'success.main' : 'primary.main',
                                      '&:hover': {
                                        color: 'success.main'
                                      }
                                    }}
                                  >
                                    <ThumbUpIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                                comments
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setExpandedParty(expandedParty === party.id ? null : party.id)}
                              >
                                {expandedParty === party.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Box>
                            
                            {expandedParty === party.id && (
                              <>
                                <Box sx={{ mb: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleAddComment(party.id)}
                                    disabled={!newComment.trim()}
                                  >
                                    post comment
                                  </Button>
                                </Box>
                                
                                {party.comments?.map((comment) => (
                                  <Box
                                    key={comment.id}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      mb: 2,
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: 'background.default'
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                                          {comment.user_name || comment.user_email}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          {formatCreationTime(comment.created_at)}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2">{comment.content}</Typography>
                                    </Box>
                                    {comment.user_id === user?.id && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteComment(party.id, comment.id)}
                                        sx={{ ml: 1 }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Box>
                                ))}
                              </>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 