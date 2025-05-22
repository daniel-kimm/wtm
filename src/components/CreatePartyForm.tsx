import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Theme,
  Grid
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface CreatePartyFormProps {
  onClose: () => void;
  onAddParty: (partyData: {
    title: string;
    location: string;
    description: string;
    date: string;
    latitude: number;
    longitude: number;
  }) => void;
  theme: Theme;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: '16px'
};

const defaultCenter = {
  lat: 42.0564,
  lng: -87.6753
};

export function CreatePartyForm({ onClose, onAddParty, theme }: CreatePartyFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    date: '',
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng
  });

  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLng | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Cleanup function to remove the marker
  const cleanupMarker = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  // Cleanup when form is closed or unmounts
  useEffect(() => {
    return () => {
      cleanupMarker();
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    cleanupMarker();

    console.log('Initializing map in CreatePartyForm...');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not defined');
      return;
    }
    console.log('API key found:', apiKey.substring(0, 5) + '...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded in CreatePartyForm');
      const newMap = new google.maps.Map(mapRef.current!, {
        center: defaultCenter,
        zoom: 15,
      });
      console.log('Map created in CreatePartyForm');

      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          setSelectedLocation(e.latLng);
          setFormData(prev => ({
            ...prev,
            location: `${e.latLng.lat().toFixed(6)}, ${e.latLng.lng().toFixed(6)}`
          }));

          // Remove the previous marker before adding a new one
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }

          // Create new marker
          const newMarker = new google.maps.Marker({
            position: e.latLng,
            map: newMap,
          });
          markerRef.current = newMarker;
        }
      });

      setMap(newMap);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      cleanupMarker();
    };
  }, [mapRef.current]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert('Please select a location on the map');
      return;
    }
    onAddParty({
      ...formData,
      latitude: selectedLocation.lat(),
      longitude: selectedLocation.lng()
    });
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
        color: 'white'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          create new party
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="party title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: 'white' }}>
              select location on map
            </Typography>
            <div ref={mapRef} style={mapContainerStyle} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="location description"
              name="location"
              value={formData.location}
              required
              placeholder="click on the map to select location"
              InputProps={{ readOnly: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="date"
              name="date"
              type="datetime-local"
              value={formData.date}
              onChange={handleChange}
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                !formData.title ||
                !formData.location ||
                !formData.date ||
                !selectedLocation
              }
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              create party
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
} 