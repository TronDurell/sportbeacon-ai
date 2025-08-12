// TODO: Phase 2 - Backend Integration
// - Replace mock API calls with real Firebase/Firestore integration
// - Add real-time data synchronization
// - Implement proper error handling and retry logic

// TODO: Phase 2 - Real API Endpoints
// - Integrate with Stripe for payment processing
// - Add real video storage and CDN integration
// - Implement real-time chat APIs

// TODO: Phase 2 - Security & Validation
// - Add server-side validation for all form inputs
// - Implement proper authentication and authorization
// - Add data encryption for sensitive information

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Paper
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Delete,
  Add,
  PhotoCamera,
  SportsSoccer,
  School,
  LocationOn,
  Phone,
  Email,
  Person,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { PlayerProfile, DrillDetail } from '../types';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import type { PlayerProfileDocument } from '../firebase/types';

interface PlayerProfileEditProps {
  playerId?: string;
  mode?: 'create' | 'edit' | 'view';
  onSave?: (profile: PlayerProfile) => void;
  onDelete?: (playerId: string) => void;
  onCancel?: () => void;
}

interface FormData extends Omit<PlayerProfile, 'id'> {
  // FormData is the same as PlayerProfile but without the id field
  // The id is handled separately in the component
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  position: '',
  skillLevel: '',
  team: '',
  school: '',
  location: '',
  bio: '',
  avatar: '',
  isActive: true,
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },
  preferences: {
    notifications: true,
    publicProfile: true,
    shareStats: true
  }
};

const positions = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const relationships = ['Parent', 'Guardian', 'Coach', 'Other'];

export const PlayerProfileEdit: React.FC<PlayerProfileEditProps> = ({
  playerId,
  mode = 'view',
  onSave,
  onDelete,
  onCancel
}) => {
  const { user } = useAuth();
  const { profile, loading, error: firebaseError, createProfile, updateProfile, deleteProfile } = usePlayerProfile(playerId || null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (profile && mode !== 'create') {
      // Convert PlayerProfileDocument to FormData
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        position: profile.position,
        skillLevel: profile.skillLevel,
        team: profile.team,
        school: profile.school,
        location: profile.location,
        bio: profile.bio,
        avatar: profile.avatar,
        isActive: profile.isActive,
        emergencyContact: profile.emergencyContact,
        preferences: profile.preferences
      });
    }
  }, [profile, mode]);

  // Handle Firebase errors
  useEffect(() => {
    if (firebaseError) {
      setError(firebaseError.message);
    }
  }, [firebaseError]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('Please fill in all required fields');
      }

      // Upload avatar if selected
      let avatarUrl = formData.avatar;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const profileData: PlayerProfile = {
        id: playerId || Date.now().toString(),
        ...formData,
        avatar: avatarUrl
      };

      if (mode === 'create') {
        await createPlayerProfile(profileData);
        setSuccess('Player profile created successfully!');
      } else {
        await updatePlayerProfile(playerId!, profileData);
        setSuccess('Player profile updated successfully!');
      }

      onSave?.(profileData);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const createPlayerProfile = async (data: FormData) => {
    try {
      const profileData: Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        ...data,
        id: playerId || Date.now().toString()
      };
      await createProfile(profileData);
    } catch (error) {
      throw new Error('Failed to create profile');
    }
  };

  const updatePlayerProfile = async (id: string, data: FormData) => {
    try {
      const updates: Partial<Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'createdBy'>> = {
        ...data
      };
      await updateProfile(updates);
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // Mock upload - replace with actual Firebase Storage integration
    await new Promise(resolve => setTimeout(resolve, 1000));
    return URL.createObjectURL(file);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deletePlayerProfile(playerId!);
      setSuccess('Player profile deleted successfully!');
      onDelete?.(playerId!);
    } catch (error) {
      setError('Failed to delete profile');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const deletePlayerProfile = async (id: string) => {
    try {
      await deleteProfile();
    } catch (error) {
      throw new Error('Failed to delete profile');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setShowAvatarDialog(true);
    }
  };

  if (loading && !formData.firstName) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {mode === 'create' ? 'Create Player Profile' : 
             isEditing ? 'Edit Player Profile' : 'Player Profile'}
          </Typography>
          <Box>
            {mode !== 'create' && (
              <>
                {!isEditing ? (
                  <Button
                    startIcon={<Edit />}
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      onClick={handleSave}
                      disabled={isLoading}
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      variant="outlined"
                      onClick={() => {
                        setIsEditing(false);
                        onCancel?.();
                      }}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {isEditing && (
                  <Button
                    startIcon={<Delete />}
                    variant="outlined"
                    color="error"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Avatar Section */}
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              {isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  component="label"
                  fullWidth
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              )}
            </Box>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} md={9}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Sports Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Sports Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={formData.position}
                    label="Position"
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  >
                    {positions.map((pos) => (
                      <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Skill Level</InputLabel>
                  <Select
                    value={formData.skillLevel}
                    label="Skill Level"
                    onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                  >
                    {skillLevels.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Team"
                  value={formData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="School"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!isEditing}
              placeholder="Tell us about yourself, your goals, and your experience..."
            />
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Emergency Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={formData.emergencyContact.relationship}
                    label="Relationship"
                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  >
                    {relationships.map((rel) => (
                      <MenuItem key={rel} value={rel}>{rel}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Preferences */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.preferences.notifications}
                      onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                      disabled={!isEditing}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.preferences.publicProfile}
                      onChange={(e) => handleInputChange('preferences.publicProfile', e.target.checked)}
                      disabled={!isEditing}
                    />
                  }
                  label="Public Profile"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.preferences.shareStats}
                      onChange={(e) => handleInputChange('preferences.shareStats', e.target.checked)}
                      disabled={!isEditing}
                    />
                  }
                  label="Share Statistics"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Status */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">Status</Typography>
              <Chip
                label={formData.isActive ? 'Active' : 'Inactive'}
                color={formData.isActive ? 'success' : 'default'}
              />
              {isEditing && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active Player"
                />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        {mode === 'create' && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
            >
              Create Profile
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Player Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this player profile? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}; 