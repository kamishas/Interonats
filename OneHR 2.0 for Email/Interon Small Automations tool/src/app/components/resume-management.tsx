import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { 
  FileText, 
  Search, 
  Upload, 
  Filter, 
  MoreVertical, 
  Download, 
  Eye, 
  Trash2,
  Clock,
  Briefcase,
  Flag,
  Users,
  User,
  Link2,
  Copy,
  CheckCircle2,
  X,
  Code,
  ChevronsUpDown,
  Check,
  Plus,
  UserCog
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import { ResumePreviewDialog } from "./resume-preview-dialog";
import { resumeApi, Resume } from '../../api/resume-api';

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

export function ResumeManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedVisaStatus, setSelectedVisaStatus] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload form state
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [hiringManagers, setHiringManagers] = useState(HIRING_MANAGERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [newManagerName, setNewManagerName] = useState("");
  
  // Upload link management
  const [showUploadLinkDialog, setShowUploadLinkDialog] = useState(false);
  const [uploadLink, setUploadLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Status change with email notification
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{resume: Resume, newStatus: string} | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    experience: '',
    visaStatus: '',
    resumeFor: '',
    requireSponsorship: '',
    skills: '',
    referredBy: ''
  });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const data = await resumeApi.list();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFileName(e.target.files[0].name);
    }
  };

  // Skills handlers
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSkill = skillInput.trim();
      if (trimmedSkill && !skillsList.includes(trimmedSkill)) {
        const newSkills = [...skillsList, trimmedSkill];
        setSkillsList(newSkills);
        setUploadFormData({ ...uploadFormData, skills: newSkills.join(',') });
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skillsList.filter(skill => skill !== skillToRemove);
    setSkillsList(newSkills);
    setUploadFormData({ ...uploadFormData, skills: newSkills.join(',') });
  };

  // Hiring Manager handlers
  const handleResumeForSelect = (currentValue: string) => {
    const currentSelection = uploadFormData.resumeFor ? uploadFormData.resumeFor.split(',').filter(Boolean) : [];
    let newSelection;

    if (currentSelection.includes(currentValue)) {
      newSelection = currentSelection.filter((value) => value !== currentValue);
    } else {
      newSelection = [...currentSelection, currentValue];
    }
    
    setUploadFormData({...uploadFormData, resumeFor: newSelection.join(',')});
  };

  const removeResumeFor = (valueToRemove: string) => {
    const currentSelection = uploadFormData.resumeFor ? uploadFormData.resumeFor.split(',').filter(Boolean) : [];
    const newSelection = currentSelection.filter((value) => value !== valueToRemove);
    setUploadFormData({...uploadFormData, resumeFor: newSelection.join(',')});
  };

  const handleAddCustomManager = () => {
    if (searchQuery.trim() && !hiringManagers.includes(searchQuery.trim())) {
      const newManager = searchQuery.trim();
      setHiringManagers([...hiringManagers, newManager]);
      handleResumeForSelect(newManager);
      setSearchQuery("");
    }
  };

  const addNewManager = () => {
    if (newManagerName.trim() && !hiringManagers.includes(newManagerName.trim())) {
      setHiringManagers([...hiringManagers, newManagerName.trim()]);
      setNewManagerName("");
      toast.success("Hiring manager added");
    }
  };

  const deleteManager = (manager: string) => {
    setHiringManagers(hiringManagers.filter(m => m !== manager));
    toast.success("Hiring manager removed");
  };

  const filteredManagers = hiringManagers.filter((manager) =>
    manager.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showAddButton = searchQuery.trim() && !hiringManagers.some(m => m.toLowerCase() === searchQuery.trim().toLowerCase());
  const selectedResumeFor = uploadFormData.resumeFor ? uploadFormData.resumeFor.split(',').filter(Boolean) : [];

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Convert comma-separated string to array for resumeFor
      const resumeForArray = uploadFormData.resumeFor ? uploadFormData.resumeFor.split(',').filter(Boolean) : undefined;

      await resumeApi.add({
        candidateName: `${uploadFormData.firstName} ${uploadFormData.lastName}`,
        email: uploadFormData.email,
        phone: '', // Added empty phone as it might be required by interface but not in form
        position: uploadFormData.position,
        skills: skillsList.length > 0 ? skillsList : ['Pending Review'],
        status: 'new',
        uploadedAt: new Date().toISOString().split('T')[0],
        experience: uploadFormData.experience,
        visaStatus: uploadFormData.visaStatus || undefined,
        resumeFor: resumeForArray,
        requireSponsorship: uploadFormData.requireSponsorship || undefined,
        referredBy: uploadFormData.referredBy || undefined
      });

      toast.success('Resume uploaded successfully!');
      setShowUploadDialog(false);
      setUploadFormData({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        experience: '',
        visaStatus: '',
        resumeFor: '',
        requireSponsorship: '',
        skills: '',
        referredBy: ''
      });
      setSkillsList([]);
      setUploadFileName(null);
      fetchResumes();
    } catch (error) {
      console.error('Failed to upload resume', error);
      toast.error('Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          resume.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resume.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? resume.status === selectedStatus : true;
    const matchesVisaStatus = selectedVisaStatus ? resume.visaStatus === selectedVisaStatus : true;
    
    return matchesSearch && matchesStatus && matchesVisaStatus;
  });

  const getVisaStatusLabel = (code: string) => {
    switch (code) {
      case 'citizen': return 'US Citizen';
      case 'greencard': return 'Green Card';
      case 'h1b': return 'H1B Visa';
      case 'l1': return 'L1 Visa';
      case 'f1opt': return 'F1 OPT';
      case 'f1stemopt': return 'F1 STEM OPT';
      case 'tn': return 'TN Visa';
      case 'other': return 'Other';
      default: return code;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">New</Badge>;
      case 'reviewed':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Reviewed</Badge>;
      case 'interviewing':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">Interviewing</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Hired</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        await resumeApi.delete(id);
        setResumes(resumes.filter(r => r.id !== id));
        toast.success('Resume deleted');
      } catch (error) {
        toast.error('Failed to delete resume');
      }
    }
  };

  const generateUploadLink = () => {
    const linkId = btoa(Date.now().toString() + Math.random().toString());
    const link = `${window.location.origin}/submit-resume/${linkId}`;
    setUploadLink(link);
    setShowUploadLinkDialog(true);
    setLinkCopied(false);
  };

  const copyUploadLink = async () => {
    if (!uploadLink) {
      toast.error('No link to copy');
      return;
    }

    // Method 1: Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(uploadLink);
        setLinkCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setLinkCopied(false), 3000);
        return;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    // Method 2: Fallback to textarea method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = uploadLink;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setLinkCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setLinkCopied(false), 3000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy link. Please copy manually.');
    }
  };

  const openUploadPage = () => {
    // Navigate internally to keep the user within the "Figma" demo environment
    // Extract the path from the full URL
    try {
      const url = new URL(uploadLink);
      navigate(url.pathname);
      setShowUploadLinkDialog(false);
    } catch (e) {
      // Fallback if URL parsing fails
      const path = uploadLink.replace(window.location.origin, '');
      navigate(path);
      setShowUploadLinkDialog(false);
    }
  };

  const handleStatusChange = (resume: Resume, newStatus: string) => {
    setStatusChangeData({ resume, newStatus });
    
    // Generate email template based on status
    let template = '';
    switch (newStatus) {
      case 'reviewed':
        template = `Dear ${resume.candidateName},\n\nThank you for submitting your application for the ${resume.position} position. We have reviewed your resume and would like to move forward with your application.\n\nBest regards,\nHR Team`;
        break;
      case 'interviewing':
        template = `Dear ${resume.candidateName},\n\nWe are pleased to inform you that you have been selected for an interview for the ${resume.position} position. We will contact you soon to schedule an interview.\n\nBest regards,\nHR Team`;
        break;
      case 'hired':
        template = `Dear ${resume.candidateName},\n\nCongratulations! We are delighted to offer you the ${resume.position} position. Welcome to our team!\n\nBest regards,\nHR Team`;
        break;
      case 'rejected':
        template = `Dear ${resume.candidateName},\n\nThank you for your interest in the ${resume.position} position. After careful consideration, we have decided to move forward with other candidates.\n\nWe appreciate your time and wish you the best in your job search.\n\nBest regards,\nHR Team`;
        break;
      default:
        template = `Dear ${resume.candidateName},\n\nYour application status has been updated.\n\nBest regards,\nHR Team`;
    }
    
    setEmailTemplate(template);
    setShowEmailDialog(true);
  };

  const confirmStatusChange = async (sendEmail: boolean) => {
    if (!statusChangeData) return;

    try {
      const updatedResume = { ...statusChangeData.resume, status: statusChangeData.newStatus };
      await resumeApi.update(statusChangeData.resume.id, updatedResume);
      
      setResumes(resumes.map(r => 
        r.id === statusChangeData.resume.id ? updatedResume : r
      ));

      if (sendEmail) {
        // Mock email sending - in a real app, this would call an API
        toast.success(`Status updated and email sent to ${statusChangeData.resume.email}`, {
          description: 'Notification has been sent to the candidate'
        });
      } else {
        toast.success('Status updated successfully');
      }

      setShowEmailDialog(false);
      setStatusChangeData(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Resume Management</h1>
          <p className="text-muted-foreground">Manage candidate resumes and applications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:text-blue-800 shadow-sm"
            onClick={() => setShowManagerDialog(true)}
          >
            <UserCog className="mr-2 h-4 w-4" />
            Hiring Managers
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            onClick={generateUploadLink}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Generate Upload Link
          </Button>
        </div>
      </div>

      <Card className="border-white/50 bg-white/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates, positions, or emails..."
                className="pl-9 bg-white/80 border-blue-100 focus:border-blue-300 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/80 border-blue-100">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('new')}>New</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('reviewed')}>Reviewed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('interviewing')}>Interviewing</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('hired')}>Hired</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('rejected')}>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/80 border-blue-100">
                    <Flag className="mr-2 h-4 w-4" />
                    Visa
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Visa Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus(null)}>All Visa Statuses</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus('citizen')}>US Citizen</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus('greencard')}>Green Card</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus('h1b')}>H1B Visa</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus('f1opt')}>F1 OPT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedVisaStatus('tn')}>TN Visa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 bg-white/40 rounded-lg border border-gray-300">
            <p className="text-muted-foreground">Loading resumes...</p>
          </div>
        ) : filteredResumes.length > 0 ? (
          filteredResumes.map((resume) => (
            <Card key={resume.id} className="overflow-hidden border-white/60 bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row p-6 gap-6 items-start md:items-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{resume.candidateName}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {resume.position}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {resume.experience}
                          </span>
                          {resume.visaStatus && (
                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                              <Flag className="h-3 w-3" /> {getVisaStatusLabel(resume.visaStatus)}
                            </span>
                          )}
                          {resume.resumeFor && resume.resumeFor.length > 0 && (
                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs">
                              <Users className="h-3 w-3" /> 
                              For: {resume.resumeFor.length > 1 ? `${resume.resumeFor[0]} +${resume.resumeFor.length - 1}` : resume.resumeFor[0]}
                            </span>
                          )}
                          {resume.referredBy && (
                            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                              <User className="h-3 w-3" /> Ref: {resume.referredBy}
                            </span>
                          )}
                          <span>{resume.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(resume.status)}
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                          Added {resume.uploadedAt}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {resume.skills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="bg-white/50 text-xs font-normal border-gray-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:self-center self-end mt-4 md:mt-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setViewingResume(resume)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(resume, 'reviewed')}>Mark as Reviewed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(resume, 'interviewing')}>Schedule Interview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(resume, 'hired')}>Offer Job</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(resume, 'rejected')}>Reject Application</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(resume.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white/40 rounded-lg border border-dashed border-gray-300">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No resumes found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              We couldn't find any resumes matching your search criteria.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => {setSearchTerm(''); setSelectedStatus(null); setSelectedVisaStatus(null);}}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>Upload Resume</DialogTitle>
              <DialogDescription>
                Manually upload a candidate's resume and details.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <form id="upload-resume-form" onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input 
                  id="firstName" 
                  placeholder="Jane" 
                  required 
                  value={uploadFormData.firstName}
                  onChange={(e) => setUploadFormData({...uploadFormData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  required 
                  value={uploadFormData.lastName}
                  onChange={(e) => setUploadFormData({...uploadFormData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane.doe@example.com" 
                required 
                value={uploadFormData.email}
                onChange={(e) => setUploadFormData({...uploadFormData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  placeholder="e.g. Frontend Developer" 
                  required 
                  value={uploadFormData.position}
                  onChange={(e) => setUploadFormData({...uploadFormData, position: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input 
                  id="experience" 
                  placeholder="e.g. 5 years" 
                  required 
                  value={uploadFormData.experience}
                  onChange={(e) => setUploadFormData({...uploadFormData, experience: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visaStatus">Visa Status</Label>
                <select
                  id="visaStatus"
                  value={uploadFormData.visaStatus}
                  onChange={(e) => setUploadFormData({...uploadFormData, visaStatus: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <Label htmlFor="requireSponsorship">Req. Sponsorship?</Label>
                <select
                  id="requireSponsorship"
                  value={uploadFormData.requireSponsorship}
                  onChange={(e) => setUploadFormData({...uploadFormData, requireSponsorship: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

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
                  className="pl-9"
                />
              </div>
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillsList.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-800 border-gray-200 px-3 py-1 text-sm font-normal">
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
              <Label>Who is the resume for?</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between font-normal"
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
                value={uploadFormData.referredBy}
                onChange={(e) => setUploadFormData({...uploadFormData, referredBy: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-resume">Resume File</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                <input 
                  type="file" 
                  id="upload-resume" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    {uploadFileName ? <FileText className="h-5 w-5 text-blue-600" /> : <Upload className="h-5 w-5 text-blue-600" />}
                  </div>
                  {uploadFileName ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-600">{uploadFileName}</p>
                      <p className="text-xs text-gray-500">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">Click to upload</p>
                      <p className="text-xs text-gray-500">PDF, DOC or DOCX (MAX. 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            </form>
          </div>
          <div className="p-6 pt-4 border-t mt-auto">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" form="upload-resume-form" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadLinkDialog} onOpenChange={setShowUploadLinkDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Share Upload Link</DialogTitle>
            <DialogDescription>
              Share this link with candidates to upload their resumes directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Link2 className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="upload-link">Upload Link</Label>
              <div className="flex gap-2">
                <Input 
                  id="upload-link"
                  value={uploadLink}
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button 
                  type="button"
                  variant={linkCopied ? "default" : "outline"}
                  onClick={copyUploadLink}
                  className="min-w-[100px]"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Anyone with this link can submit their resume. Share it carefully with the candidates you want to invite.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={openUploadPage}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Open Page
              </Button>
              <Button 
                type="button" 
                onClick={copyUploadLink}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowUploadLinkDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Change Status and Send Email</DialogTitle>
            <DialogDescription>
              Update the candidate's status and send an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Candidate Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane.doe@example.com" 
                required 
                value={statusChangeData?.resume.email || ''}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Input 
                id="status" 
                placeholder="e.g. Reviewed" 
                required 
                value={statusChangeData?.newStatus || ''}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Textarea 
                id="email-template" 
                placeholder="Enter email content here" 
                required 
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="w-full h-40 bg-white/80 border-blue-100 focus:border-blue-300 transition-all p-2"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => confirmStatusChange(false)}>
              Update Status
            </Button>
            <Button type="button" onClick={() => confirmStatusChange(true)}>
              Update Status & Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Hiring Managers</DialogTitle>
            <DialogDescription>
              Add or remove hiring managers from the selection list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter full name..."
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewManager();
                  }
                }}
              />
              <Button onClick={addNewManager} type="button">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {hiringManagers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hiring managers added yet.
                </div>
              ) : (
                hiringManagers.map((manager) => (
                  <div key={manager} className="flex items-center justify-between p-3 hover:bg-slate-50">
                    <span className="text-sm font-medium">{manager}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteManager(manager)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove {manager}</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" onClick={() => setShowManagerDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResumePreviewDialog 
        open={!!viewingResume} 
        onOpenChange={(open) => !open && setViewingResume(null)} 
        resume={viewingResume} 
      />
    </div>
  );
}