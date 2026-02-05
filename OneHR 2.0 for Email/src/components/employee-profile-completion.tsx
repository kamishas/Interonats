import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  User, Lock, Calendar, MapPin, Phone, CheckCircle2, 
  AlertCircle, Shield, Info, Search, RefreshCw, Check, X, FileText, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { encrypt } from '../utils/encryption';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

interface AddressValidationResult {
  valid: boolean;
  demoMode?: boolean;
  message?: string;
  warnings?: string[];
  addressChanged?: boolean;
  originalAddress?: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  standardizedAddress?: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    formattedAddress?: string;
  };
  suggestions?: Array<{
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    formattedAddress?: string;
  }>;
  metadata?: {
    deliveryPointValidation?: string;
    deliveryPointBarcode?: string;
    vacant?: boolean;
    residential?: boolean;
    recordType?: string;
    countyFips?: string;
    congressionalDistrict?: string;
  };
  error?: string;
  details?: string;
}

interface EmployeeProfileCompletionProps {
  employee: any;
  onComplete: () => void;
}

export function EmployeeProfileCompletion({ employee, onComplete }: EmployeeProfileCompletionProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workAuthFile, setWorkAuthFile] = useState<File | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    ssn: '',
    dateOfBirth: employee.dateOfBirth || '',
    address: employee.address || '',
    address2: employee.address2 || '',
    city: employee.city || '',
    state: employee.state || '',
    zipCode: employee.zipCode || '',
    phoneNumber: employee.phoneNumber || ''
  });

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }>>([
    { id: '1', name: '', relationship: '', phone: '', email: '', isPrimary: true }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSSN, setShowSSN] = useState(false);
  
  // Address validation states
  const [addressValidating, setAddressValidating] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [showAddressConfirmDialog, setShowAddressConfirmDialog] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressValidationResult['suggestions']>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [addressDemoMode, setAddressDemoMode] = useState(false);

  const totalSteps = 5; // Updated from 4 to 5 for work authorization document
  const progress = (step / totalSteps) * 100;

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    // SSN is now optional, but if provided, must be valid
    if (formData.ssn.trim()) {
      // Remove any non-digit characters for validation
      const cleanSSN = formData.ssn.replace(/\D/g, '');
      if (cleanSSN.length !== 9) {
        newErrors.ssn = 'SSN must be 9 digits';
      }
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Check if employee is at least 16 years old
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 16) {
        newErrors.dateOfBirth = 'Employee must be at least 16 years old';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      }
    }
    
    // Check if address has been validated and confirmed
    if (!addressConfirmed) {
      newErrors.address = 'Please validate and confirm your address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Address validation function
  const validateAddress = async () => {
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      toast.error('Please fill in all address fields before validation');
      return;
    }

    setAddressValidating(true);
    setErrors({});

    try {
      // Call backend address validation endpoint
      console.log('Calling address validation API:', `${API_URL}/validate-address`);
      
      const response = await fetch(`${API_URL}/validate-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          street: formData.address,
          street2: formData.address2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        })
      }).catch((fetchError) => {
        console.error('Fetch failed:', fetchError);
        throw new Error('Network error: Unable to connect to address validation service');
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const textError = await response.text();
          console.error('Address validation error (text):', textError);
          throw new Error('Address validation service returned an error');
        }
        console.error('Address validation error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Address validation service unavailable');
      }

      const result: AddressValidationResult = await response.json();
      console.log('Address validation result:', result);

      if (result.valid) {
        // Address is valid - show confirmation dialog
        setAddressValidated(true);
        setShowAddressConfirmDialog(true);
        setAddressDemoMode(result.demoMode || false);
        
        // Show demo mode message if applicable
        if (result.demoMode) {
          toast.warning('🚨 DEMO MODE: Address format is valid but NOT verified with USPS!', {
            duration: 8000,
          });
          toast.warning('This address may not exist! Configure USPS credentials for real validation.', {
            duration: 8000,
          });
        }
        
        // Show any warnings
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            if (result.demoMode) {
              toast.error(warning, { duration: 6000 });
            } else {
              toast.warning(warning);
            }
          });
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          // Server returned standardized/corrected address
          setAddressSuggestions(result.suggestions);
          if (result.addressChanged) {
            toast.info('Address has been standardized. Please review the suggested format.');
          }
        } else {
          // No suggestions - address is exactly correct
          setAddressSuggestions([]);
          toast.success(result.message || 'Address validated successfully');
        }
      } else {
        // Address is invalid
        setAddressValidated(false);
        
        if (result.suggestions && result.suggestions.length > 0) {
          // Show suggestions
          setAddressSuggestions(result.suggestions);
          setShowAddressConfirmDialog(true);
          toast.info('We found some suggestions for your address');
        } else {
          // No suggestions available
          const errorMsg = result.message || result.error || 'Unable to validate address. Please check and try again.';
          toast.error(errorMsg);
          
          if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach(warning => toast.warning(warning));
          }
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
      
      // Provide helpful error messages based on error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
        toast.error('Unable to connect to validation service. Your address will be accepted as-is.');
      } else {
        toast.error('Address validation temporarily unavailable. You may proceed with your address.');
      }
      // Allow user to proceed without validation in case of service issues
      setAddressValidated(true);
      setAddressConfirmed(true);
    } finally {
      setAddressValidating(false);
    }
  };

  const handleConfirmAddress = () => {
    if (selectedSuggestion !== null && addressSuggestions[selectedSuggestion]) {
      // User selected a suggestion
      const suggestion = addressSuggestions[selectedSuggestion];
      setFormData({
        ...formData,
        address: suggestion.street,
        address2: suggestion.street2 || '',
        city: suggestion.city,
        state: suggestion.state,
        zipCode: suggestion.zipCode
      });
      toast.success('Address updated with standardized format');
    }
    
    setAddressConfirmed(true);
    setShowAddressConfirmDialog(false);
    setErrors({});
    toast.success('Address confirmed successfully!');
  };

  const handleUseOriginalAddress = () => {
    // User wants to keep their original address
    setAddressConfirmed(true);
    setShowAddressConfirmDialog(false);
    setErrors({});
    toast.success('Address confirmed');
  };

  const handleNext = () => {
    let isValid = false;
    
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();
    else if (step === 4) isValid = validateStep4();
    else if (step === 5) isValid = validateStep5();
    
    if (isValid && step < totalSteps) {
      setStep(step + 1);
      setErrors({});
    } else if (isValid && step === totalSteps) {
      handleSubmit();
    }
  };

  const validateStep5 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!workAuthFile) {
      newErrors.workAuthFile = 'Work authorization document is required';
    } else {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (workAuthFile.size > maxSize) {
        newErrors.workAuthFile = 'File size must be less than 10MB';
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(workAuthFile.type)) {
        newErrors.workAuthFile = 'File must be PDF, JPG, or PNG format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    
    // At least one emergency contact is required
    const primaryContact = emergencyContacts[0];
    if (!primaryContact.name.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }
    if (!primaryContact.relationship.trim()) {
      newErrors.emergencyRelationship = 'Relationship is required';
    }
    if (!primaryContact.phone.trim()) {
      newErrors.emergencyPhone = 'Phone number is required';
    } else {
      const cleaned = primaryContact.phone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.emergencyPhone = 'Phone number must be 10 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, {
      id: Date.now().toString(),
      name: '',
      relationship: '',
      phone: '',
      email: '',
      isPrimary: false
    }]);
  };

  const removeEmergencyContact = (id: string) => {
    if (emergencyContacts.length <= 1) {
      toast.error('At least one emergency contact is required');
      return;
    }
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  const updateEmergencyContact = (id: string, field: string, value: string) => {
    setEmergencyContacts(emergencyContacts.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    } else {
      // On step 1, ask if they want to cancel
      if (confirm('Are you sure you want to cancel profile completion? You can complete it later from your dashboard.')) {
        window.history.back();
      }
    }
  };

  const formatSSN = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 9);
    
    if (limited.length <= 3) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 10);
    
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Encrypt SSN before sending (only if provided)
      let encryptedSSN = null;
      if (formData.ssn.trim()) {
        const cleanSSN = formData.ssn.replace(/\D/g, '');
        encryptedSSN = encrypt(cleanSSN);
      }
      
      // Upload work authorization document if provided
      let workAuthDocUrl = null;
      if (workAuthFile) {
        try {
          const formDataFile = new FormData();
          formDataFile.append('file', workAuthFile);
          formDataFile.append('employeeId', employee.id);
          formDataFile.append('documentType', 'work-authorization');
          
          console.log('[Profile Completion] Uploading work authorization document:', {
            fileName: workAuthFile.name,
            fileSize: workAuthFile.size,
            fileType: workAuthFile.type,
            employeeId: employee.id
          });
          
          const uploadResponse = await fetch(`${API_URL}/upload-employee-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: formDataFile
          });
          
          const uploadResult = await uploadResponse.json();
          console.log('[Profile Completion] Upload response:', uploadResult);
          
          if (!uploadResponse.ok) {
            const errorMessage = uploadResult.error || uploadResult.details || 'Failed to upload work authorization document';
            throw new Error(errorMessage);
          }
          
          workAuthDocUrl = uploadResult.url;
          toast.success('Work authorization document uploaded successfully!');
        } catch (uploadError: any) {
          console.error('[Profile Completion] Upload error:', uploadError);
          throw new Error(`Failed to upload work authorization document: ${uploadError.message}`);
        }
      }
      
      const updateData = {
        ...employee,
        firstName: formData.firstName,
        lastName: formData.lastName,
        ssnEncrypted: encryptedSSN,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phoneNumber: formData.phoneNumber,
        emergencyContacts: emergencyContacts.filter(c => c.name.trim()), // Only save contacts with names
        workAuthorizationDoc: workAuthDocUrl,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile completed successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast.error(`Error completing profile: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-blue-600" />
                Complete Your Profile
              </CardTitle>
              <CardDescription className="mt-2">
                Please confirm and provide your personal information to complete your account setup
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between pt-2">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Name</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${step >= 2 ? 'bg-blue-600' : ''}`} style={{ width: step >= 2 ? '100%' : '0%' }} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">SSN & DOB</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${step >= 3 ? 'bg-blue-600' : ''}`} style={{ width: step >= 3 ? '100%' : '0%' }} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 3 ? <CheckCircle2 className="h-5 w-5" /> : '3'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Contact</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${step >= 4 ? 'bg-blue-600' : ''}`} style={{ width: step >= 4 ? '100%' : '0%' }} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 4 ? <CheckCircle2 className="h-5 w-5" /> : '4'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Emergency</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${step >= 5 ? 'bg-blue-600' : ''}`} style={{ width: step >= 5 ? '100%' : '0%' }} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 5 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 5 ? <CheckCircle2 className="h-5 w-5" /> : '5'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Work Auth</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Notice */}
          <Alert className="bg-green-50 border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Secure & Private</AlertTitle>
            <AlertDescription className="text-green-700">
              All sensitive information is encrypted and stored securely. Your data is protected with AES-256-GCM encryption.
            </AlertDescription>
          </Alert>

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Confirm Your Name</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter your first name"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter your last name"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please ensure your name matches your official identification documents.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: SSN & Date of Birth */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Secure Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ssn" className="flex items-center gap-2">
                  Social Security Number <span className="text-muted-foreground">(Optional)</span>
                  <Shield className="h-3 w-3 text-green-600" title="This field will be encrypted" />
                </Label>
                <div className="relative">
                  <Input
                    id="ssn"
                    type={showSSN ? 'text' : 'password'}
                    value={formData.ssn}
                    onChange={(e) => setFormData({ ...formData, ssn: formatSSN(e.target.value) })}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className={errors.ssn ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                    onClick={() => setShowSSN(!showSSN)}
                  >
                    {showSSN ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {errors.ssn && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.ssn}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  Your SSN will be encrypted with AES-256-GCM before storage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Lock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  This information is required for tax and employment verification purposes. It will be kept strictly confidential.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Contact Information</h3>
                </div>
                {addressConfirmed && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Address Verified
                  </Badge>
                )}
              </div>

              {/* Address validation alert */}
              {!addressConfirmed && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Address Validation Required</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    After entering your address, click "Validate Address" to confirm it's correct. This ensures accurate delivery of important documents.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setAddressConfirmed(false);
                    setAddressValidated(false);
                  }}
                  placeholder="123 Main Street"
                  className={errors.address ? 'border-red-500' : ''}
                  disabled={addressConfirmed}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">
                  Apartment, Suite, etc. (Optional)
                </Label>
                <Input
                  id="address2"
                  value={formData.address2}
                  onChange={(e) => {
                    setFormData({ ...formData, address2: e.target.value });
                    setAddressConfirmed(false);
                    setAddressValidated(false);
                  }}
                  placeholder="Apt 4B"
                  disabled={addressConfirmed}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      setAddressConfirmed(false);
                      setAddressValidated(false);
                    }}
                    placeholder="City"
                    className={errors.city ? 'border-red-500' : ''}
                    disabled={addressConfirmed}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => {
                      setFormData({ ...formData, state: value });
                      setAddressConfirmed(false);
                      setAddressValidated(false);
                    }}
                    disabled={addressConfirmed}
                  >
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">
                  ZIP Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => {
                    setFormData({ ...formData, zipCode: e.target.value });
                    setAddressConfirmed(false);
                    setAddressValidated(false);
                  }}
                  placeholder="12345"
                  maxLength={10}
                  className={errors.zipCode ? 'border-red-500' : ''}
                  disabled={addressConfirmed}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.zipCode}
                  </p>
                )}
              </div>

              {/* Address Validation Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={validateAddress}
                  disabled={addressValidating || addressConfirmed}
                  className="flex-1"
                  variant={addressConfirmed ? "outline" : "default"}
                >
                  {addressValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : addressConfirmed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Address Validated
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Validate Address
                    </>
                  )}
                </Button>
                
                {addressConfirmed && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddressConfirmed(false);
                      setAddressValidated(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: formatPhone(e.target.value) })}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className={`pl-10 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This address will be used for official communications and tax documents.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Emergency Contacts */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Emergency Contacts</h3>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Why do we need this?</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Emergency contact information helps us reach someone on your behalf in case of an urgent situation.
                  At least one emergency contact is required.
                </AlertDescription>
              </Alert>

              {emergencyContacts.map((contact, index) => (
                <Card key={contact.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {contact.isPrimary ? (
                          <>
                            <Badge className="bg-blue-600">Primary</Badge>
                            Emergency Contact
                          </>
                        ) : (
                          `Emergency Contact ${index + 1}`
                        )}
                      </CardTitle>
                      {!contact.isPrimary && emergencyContacts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmergencyContact(contact.id)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${contact.id}`}>
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`name-${contact.id}`}
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                        placeholder="Enter contact name"
                        className={contact.isPrimary && errors.emergencyName ? 'border-red-500' : ''}
                      />
                      {contact.isPrimary && errors.emergencyName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.emergencyName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`relationship-${contact.id}`}>
                        Relationship <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={contact.relationship}
                        onValueChange={(value) => updateEmergencyContact(contact.id, 'relationship', value)}
                      >
                        <SelectTrigger 
                          id={`relationship-${contact.id}`}
                          className={contact.isPrimary && errors.emergencyRelationship ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {contact.isPrimary && errors.emergencyRelationship && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.emergencyRelationship}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`phone-${contact.id}`}>
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`phone-${contact.id}`}
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(contact.id, 'phone', formatPhone(e.target.value))}
                          placeholder="(555) 123-4567"
                          maxLength={14}
                          className={`pl-10 ${contact.isPrimary && errors.emergencyPhone ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {contact.isPrimary && errors.emergencyPhone && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.emergencyPhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-${contact.id}`}>
                        Email (Optional)
                      </Label>
                      <Input
                        id={`email-${contact.id}`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateEmergencyContact(contact.id, 'email', e.target.value)}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addEmergencyContact}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Add Another Emergency Contact
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You can add multiple emergency contacts. We'll contact them in order if we cannot reach you.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 5: Work Authorization Document */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Work Authorization Document</h3>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Required Documentation</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Please upload a document that authorizes you to work in the United States. This could be:
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>US Passport</li>
                    <li>Green Card (Permanent Resident Card)</li>
                    <li>Work Authorization Document (EAD)</li>
                    <li>Work Visa (H-1B, L-1, TN, etc.)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="workAuthUpload">
                  Work Authorization Document <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="workAuthUpload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setWorkAuthFile(e.target.files[0]);
                      setErrors({});
                    }
                  }}
                  className={`cursor-pointer ${errors.workAuthFile ? 'border-red-500' : ''}`}
                />
                {workAuthFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{workAuthFile.name}</span>
                  </div>
                )}
                {errors.workAuthFile && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.workAuthFile}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <Shield className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This document will be stored securely and reviewed by our HR team to verify your employment eligibility. All documents are encrypted and stored in compliance with employment regulations.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : step === totalSteps ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Profile
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Address Confirmation Dialog */}
      <Dialog open={showAddressConfirmDialog} onOpenChange={setShowAddressConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Confirm Your Address
            </DialogTitle>
            <DialogDescription>
              {addressSuggestions.length > 0
                ? "We found standardized versions of your address. Please select the correct one or use your original address."
                : "Please confirm that your address is correct."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Demo Mode Warning */}
            {addressDemoMode && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">⚠️ DEMO MODE - Address NOT Verified</AlertTitle>
                <AlertDescription className="text-red-700 text-sm space-y-1">
                  <p><strong>WARNING:</strong> This address has NOT been verified against the USPS database!</p>
                  <p>The address format looks correct, but it may not be a real deliverable address.</p>
                  <p className="text-xs mt-2">To enable real USPS validation, configure USPS API credentials in environment variables.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Original Address */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Your Entered Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{formData.address}</div>
                  {formData.address2 && <div className="text-gray-600">{formData.address2}</div>}
                  <div className="text-gray-600">
                    {formData.city}, {formData.state} {formData.zipCode}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {addressSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base">Standardized Addresses</Label>
                <div className="space-y-2">
                  {addressSuggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedSuggestion === index
                          ? 'border-2 border-blue-600 bg-blue-50'
                          : 'border hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedSuggestion(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            selectedSuggestion === index ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {selectedSuggestion === index ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1 text-sm">
                            <div className="font-medium">{suggestion.street}</div>
                            {suggestion.street2 && <div className="text-gray-600">{suggestion.street2}</div>}
                            <div className="text-gray-600">
                              {suggestion.city}, {suggestion.state} {suggestion.zipCode}
                            </div>
                          </div>
                          {selectedSuggestion === index && (
                            <Badge className="bg-blue-600">Recommended</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Why standardize?</strong> Using the standardized USPS format ensures accurate delivery of mail and important documents.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!addressValidated && addressSuggestions.length === 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  We couldn't validate this address. Please double-check that it's correct before proceeding.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {addressSuggestions.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleUseOriginalAddress}
                >
                  Use My Address As-Is
                </Button>
                <Button
                  onClick={handleConfirmAddress}
                  disabled={selectedSuggestion === null}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Use Selected Address
                </Button>
              </>
            ) : (
              <Button onClick={handleConfirmAddress}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Address
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
