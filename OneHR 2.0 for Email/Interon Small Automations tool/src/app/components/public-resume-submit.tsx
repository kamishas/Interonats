import { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, Building2, ArrowLeft, Check, ChevronsUpDown, X, Code, Plus, Circle } from "lucide-react";
import { resumeApi } from '../../api/resume-api';
import { useNavigate } from 'react-router';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

// Mock list of people for "Who is the resume for?"
const HIRING_MANAGERS = [
  "Sarah Jenkins (Engineering Manager)",
  "Michael Chen (CTO)",
  "Jessica Williams (Product Lead)",
  "David Miller (HR Director)",
  "Emily Davis (Senior Recruiter)",
  "Robert Wilson (VP of Engineering)",
  "Jennifer Taylor (Design Lead)"
];

export function PublicResumeSubmit() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [hiringManagers, setHiringManagers] = useState(HIRING_MANAGERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    visaStatus: '',
    referredBy: '',
    resumeFor: '',
    requireSponsorship: '',
    skills: '',
  });
  
  const filteredManagers = hiringManagers.filter((manager) =>
    manager.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showAddButton = searchQuery.trim() && !hiringManagers.some(m => m.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFileName(e.target.files[0].name);
    }
  };

  const handleResumeForSelect = (currentValue: string) => {
    const currentSelection = formData.resumeFor ? formData.resumeFor.split(',').filter(Boolean) : [];
    let newSelection;

    if (currentSelection.includes(currentValue)) {
      newSelection = currentSelection.filter((value) => value !== currentValue);
    } else {
      newSelection = [...currentSelection, currentValue];
    }
    
    setFormData({...formData, resumeFor: newSelection.join(',')});
  };

  const removeResumeFor = (valueToRemove: string) => {
    const currentSelection = formData.resumeFor ? formData.resumeFor.split(',').filter(Boolean) : [];
    const newSelection = currentSelection.filter((value) => value !== valueToRemove);
    setFormData({...formData, resumeFor: newSelection.join(',')});
  };

  const handleAddCustomManager = () => {
    if (searchQuery.trim() && !hiringManagers.includes(searchQuery.trim())) {
      const newManager = searchQuery.trim();
      setHiringManagers([...hiringManagers, newManager]);
      handleResumeForSelect(newManager);
      setSearchQuery("");
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSkill = skillInput.trim();
      if (trimmedSkill && !skillsList.includes(trimmedSkill)) {
        const newSkills = [...skillsList, trimmedSkill];
        setSkillsList(newSkills);
        setFormData({ ...formData, skills: newSkills.join(',') });
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skillsList.filter(skill => skill !== skillToRemove);
    setSkillsList(newSkills);
    setFormData({ ...formData, skills: newSkills.join(',') });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert comma-separated string to array for resumeFor
      const resumeForArray = formData.resumeFor ? formData.resumeFor.split(',').filter(Boolean) : undefined;

      await resumeApi.add({
        candidateName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()) : ['Pending Review'],
        status: 'new',
        uploadedAt: new Date().toISOString().split('T')[0],
        experience: formData.experience,
        visaStatus: formData.visaStatus || undefined,
        referredBy: formData.referredBy || undefined,
        resumeFor: resumeForArray,
        requireSponsorship: formData.requireSponsorship || undefined,
      });

      setIsSubmitted(true);
      toast.success('Resume submitted successfully!', {
        description: 'Thank you for your submission. We will review your application and get back to you soon.'
      });
    } catch (error) {
      console.error('Failed to submit resume', error);
      toast.error('Failed to submit resume. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-white/60 bg-white/60 backdrop-blur-sm shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your resume has been successfully submitted. We will review your application and get back to you soon.
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedResumeFor = formData.resumeFor ? formData.resumeFor.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative">
      {/* Back button for authenticated users (recruiters viewing the form) */}
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 hover:bg-white/50"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="w-full max-w-3xl border-white/60 bg-white/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Submit Your Resume
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Fill out the form below to apply for open positions at our company.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    required 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    required 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Desired position *</Label>
                  <Input 
                    id="position" 
                    placeholder="e.g. Frontend Developer" 
                    required 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input 
                    id="experience" 
                    placeholder="e.g. 5 years" 
                    required 
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visaStatus">Visa Status</Label>
                  <select
                    id="visaStatus"
                    value={formData.visaStatus}
                    onChange={(e) => setFormData({...formData, visaStatus: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-input bg-white/80 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select Visa Status</option>
                    <option value="citizen">US Citizen</option>
                    <option value="greencard">Green Card</option>
                    <option value="h1b">H1B Visa</option>
                    <option value="l1">L1 Visa</option>
                    <option value="f1opt">F1 OPT</option>
                    <option value="f1stemopt">F1 STEM OPT</option>
                    <option value="tn">TN Visa</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requireSponsorship">Do you require sponsorship?</Label>
                  <select
                    id="requireSponsorship"
                    value={formData.requireSponsorship}
                    onChange={(e) => setFormData({...formData, requireSponsorship: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-input bg-white/80 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select Option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Skills and Resume For */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Code className="h-4 w-4" />
                    </div>
                    <Input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press Enter (e.g. React, TypeScript)"
                      className="pl-9 bg-white/80"
                    />
                  </div>
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skillsList.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 border-gray-200 px-3 py-1 text-sm font-normal">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-gray-300/50 p-0.5"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Remove {skill}</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Who is the resume for? (Optional)</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-white/80 font-normal hover:bg-white/90"
                      >
                        {selectedResumeFor.length > 0
                          ? `${selectedResumeFor.length} people selected`
                          : "Select hiring managers / recruiters..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search people..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {filteredManagers.length === 0 && !showAddButton && (
                            <CommandItem disabled value="no-results-found" className="py-6 text-center text-sm text-muted-foreground justify-center cursor-default opacity-100">
                              No person found.
                            </CommandItem>
                          )}
                          
                          {filteredManagers.length > 0 && (
                            <CommandGroup>
                              {filteredManagers.map((person) => {
                                const isSelected = selectedResumeFor.includes(person);
                                return (
                                  <CommandItem
                                    key={person}
                                    value={person}
                                    onSelect={() => handleResumeForSelect(person)}
                                  >
                                    <div className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-full border",
                                      isSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground opacity-50"
                                    )}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <span>{person}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                            
                          {showAddButton && (
                            <CommandGroup heading="Create new">
                              <CommandItem
                                value={searchQuery}
                                onSelect={handleAddCustomManager}
                                className="text-blue-600 font-medium cursor-pointer"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add "{searchQuery}"
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Selected Tags Display */}
                  {selectedResumeFor.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedResumeFor.map((person) => (
                        <Badge key={person} variant="secondary" className="flex items-center gap-1 bg-white border-gray-200">
                          {person}
                          <button
                            type="button"
                            onClick={() => removeResumeFor(person)}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Remove {person}</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referredBy">Referred By (Optional)</Label>
                  <Input 
                    id="referredBy" 
                    placeholder="Name of referrer" 
                    value={formData.referredBy}
                    onChange={(e) => setFormData({...formData, referredBy: e.target.value})}
                    className="bg-white/80"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Resume Upload</h3>
              <div className="space-y-2">
                <Label htmlFor="upload-resume">Upload Your Resume *</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative bg-white/50">
                  <input 
                    type="file" 
                    id="upload-resume" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                      {uploadFileName ? <FileText className="h-6 w-6 text-blue-600" /> : <Upload className="h-6 w-6 text-blue-600" />}
                    </div>
                    {uploadFileName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-600">{uploadFileName}</p>
                        <p className="text-xs text-gray-500">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-base font-medium text-gray-900">Click to upload your resume</p>
                        <p className="text-sm text-gray-500">PDF, DOC or DOCX (MAX. 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="mr-2 h-5 w-5 animate-pulse" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
