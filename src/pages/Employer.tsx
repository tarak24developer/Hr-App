import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Container,
  Fade,
  Avatar,
  Chip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Business as IndustryIcon
} from '@mui/icons-material';

interface EmployerProfile {
  id: string;
  companyName: string;
  logo?: string;
  industry: string;
  description: string;
  foundedYear: number;
  headquarters: string;
  website: string;
  email: string;
  phone: string;
  employeeCount: number;
  legalName: string;
  taxId: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  companyType: 'public' | 'private' | 'nonprofit' | 'government';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Employer: React.FC = () => {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<EmployerProfile>({
    id: '',
    companyName: '',
    industry: '',
    description: '',
    foundedYear: new Date().getFullYear(),
    headquarters: '',
    website: '',
    email: '',
    phone: '',
    employeeCount: 0,
    legalName: '',
    taxId: '',
    companySize: 'small',
    companyType: 'private',
    isActive: true,
    createdAt: '',
    updatedAt: ''
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const sampleProfile: EmployerProfile = {
    id: '1',
    companyName: 'TechCorp Solutions',
    logo: '/images/company-logo.png',
    industry: 'Technology',
    description: 'A leading technology company specializing in innovative software solutions.',
    foundedYear: 2015,
    headquarters: 'San Francisco, CA',
    website: 'https://techcorp.com',
    email: 'info@techcorp.com',
    phone: '+1 (555) 123-4567',
    employeeCount: 150,
    legalName: 'TechCorp Solutions Inc.',
    taxId: '12-3456789',
    companySize: 'medium',
    companyType: 'private',
    isActive: true,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(sampleProfile);
      setFormData(sampleProfile);
    } catch (err) {
      setError('Failed to load employer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData(profile);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProfile = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      setEditing(false);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCompanySizeLabel = (size: string) => {
    switch (size) {
      case 'startup': return '1-10 employees';
      case 'small': return '11-50 employees';
      case 'medium': return '51-250 employees';
      case 'large': return '251-1000 employees';
      case 'enterprise': return '1000+ employees';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          No employer profile found. Please contact support.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={300}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Employer Profile
            </Typography>
            {!editing ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                </Button>
              </Stack>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 3,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                  src={profile.logo || ''}
                >
                  {profile.companyName.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  {editing ? (
                    <TextField
                      label="Company Name"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                      {profile.companyName}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<IndustryIcon />}
                      label={profile.industry}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${profile.employeeCount} employees`}
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CalendarIcon />}
                      label={`Founded ${profile.foundedYear}`}
                      color="success"
                      variant="outlined"
                    />
                  </Box>

                  {editing ? (
                    <TextField
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      {profile.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    Company Information
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Legal Name
                      </Typography>
                      {editing ? (
                        <TextField
                          value={formData.legalName}
                          onChange={(e) => handleInputChange('legalName', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{profile.legalName}</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Tax ID
                      </Typography>
                      {editing ? (
                        <TextField
                          value={formData.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{profile.taxId}</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Industry
                      </Typography>
                      {editing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={formData.industry}
                            onChange={(e) => handleInputChange('industry', e.target.value)}
                          >
                            <MenuItem value="Technology">Technology</MenuItem>
                            <MenuItem value="Healthcare">Healthcare</MenuItem>
                            <MenuItem value="Finance">Finance</MenuItem>
                            <MenuItem value="Education">Education</MenuItem>
                            <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                            <MenuItem value="Retail">Retail</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1">{profile.industry}</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Company Size
                      </Typography>
                      {editing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={formData.companySize}
                            onChange={(e) => handleInputChange('companySize', e.target.value)}
                          >
                            <MenuItem value="startup">Startup (1-10)</MenuItem>
                            <MenuItem value="small">Small (11-50)</MenuItem>
                            <MenuItem value="medium">Medium (51-250)</MenuItem>
                            <MenuItem value="large">Large (251-1000)</MenuItem>
                            <MenuItem value="enterprise">Enterprise (1000+)</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1">{getCompanySizeLabel(profile.companySize)}</Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Stack>

            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Contact Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        {editing ? (
                          <TextField
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        ) : (
                          <Typography variant="body1">{profile.email}</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        {editing ? (
                          <TextField
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        ) : (
                          <Typography variant="body1">{profile.phone}</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Headquarters
                        </Typography>
                        {editing ? (
                          <TextField
                            value={formData.headquarters}
                            onChange={(e) => handleInputChange('headquarters', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        ) : (
                          <Typography variant="body1">{profile.headquarters}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default Employer;
