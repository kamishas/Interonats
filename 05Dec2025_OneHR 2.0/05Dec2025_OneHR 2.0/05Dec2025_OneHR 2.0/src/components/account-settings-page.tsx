import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Lock, User, Mail, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

const API_URL = API_ENDPOINTS.USER_SRVC;

interface AccountSettingsPageProps {
  onBack?: () => void;
}

export function AccountSettingsPage({ onBack }: AccountSettingsPageProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Update name if user changes (e.g. initial load)
  useEffect(() => {
    if (user) {
      if (user.firstName && user.lastName) {
        setFirstName(user.firstName);
        setLastName(user.lastName);
      } else {
        // Fallback: split full name
        const nameParts = (user.name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const toastId = toast.loading('Uploading profile picture...');

    try {
      const response = await fetch(`${API_URL}/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.avatarUrl) {
          updateUser({ ...user, avatarUrl: data.avatarUrl });
          toast.success("Profile picture updated", { id: toastId });
        } else {
            throw new Error(data.error || "Failed to upload");
        }
      } else {
        throw new Error("Failed to upload avatar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload profile picture", { id: toastId });
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      const endpoint = `${API_URL}/users/${user.id}`;
      const body = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email: user.email,
        source: 'account_settings'
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const responseData = await response.json().catch(() => ({}));

      if (responseData.pendingChanges) {
        toast.info(responseData.message || 'Changes submitted for HR approval');
        return;
      }

      // Update via AuthContext which handles both state and localStorage
      updateUser({
        ...user,
        name: fullName,
        firstName: firstName,
        lastName: lastName
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = `${API_URL}/users/change-password`; 

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          email: user.email, 
          newPassword: newPassword,
          currentPassword: currentPassword,
          userId: user.id 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Password update error:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    if (!password) return { label: '', color: '', width: '0%' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if ((/[a-z]/.test(password))) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength === 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = passwordStrength(newPassword);
  
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle>Account Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600 capitalize">
                      {user.role.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        placeholder="First Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-muted text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed directly. Contact IT support for assistance.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength:</span>
                        <span className={`font-medium ${
                          strength.label === 'Weak' ? 'text-red-500' : 
                          strength.label === 'Medium' ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Password Requirements:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li className="flex items-center gap-2">
                      {newPassword.length >= 8 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-blue-400" />
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      {/[A-Z]/.test(newPassword) ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-blue-400" />
                      )}
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[a-z]/.test(newPassword) ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-blue-400" />
                      )}
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[0-9]/.test(newPassword) ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-blue-400" />
                      )}
                      One number
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          {activeTab === 'profile' ? (
            <Button onClick={handleUpdateProfile} disabled={isLoading || (firstName + ' ' + lastName).trim() === user.name}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
