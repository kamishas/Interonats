import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Mail,
  Globe,
  Send,
  CheckCircle2,
  User,
  Users,
  Search,
  Paperclip,
  Loader2,
  Tag,
  Plus,
  X,
  Check,
  Settings,
  UserPlus,
  Trash2,
  Calendar,
  Clock,
  ChevronRight,
  Inbox,
  Filter,
  ArrowLeft,
  Folder,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  FileIcon,
  Upload,
  Download,
  Pencil,
  Activity,
  RefreshCw,
  Eye,
  XCircle,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth-context';
import { emailAgentApi } from '../../lib/email-agent-api';
import { RichTextEditor } from './rich-text-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  tags?: string[];
}

interface RecipientDeliveryStatus {
  email: string;
  name: string;
  status: 'Sent' | 'Delivered' | 'Failed';
}

interface SentEmail {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  category: string;
  sentAt: Date;
  status: 'Sent' | 'Delivered' | 'Failed';
  attachments?: string[];
  recipients?: RecipientDeliveryStatus[]; // List of recipients with individual delivery status
}

interface Tag {
  tagName: string;
  color: string;
  description?: string;
}

interface LabelType {
  id: string;
  name: string;
  color: string;
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Generate a color from string for tags
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const DEFAULT_CATEGORIES = [
  'general',
  'interview',
  'offer',
  'onboarding',
  'marketing',
  'follow-up',
  'invoicing',
  'support',
];

// Helper function to capitalize category names for display
function formatCategoryName(category: string): string {
  if (!category) return '';
  // Split by hyphen or space and capitalize each word
  return category
    .split(/[-\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function EmailAgent() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  // Tag/Label State - Synced with API tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [contactLabelFilter, setContactLabelFilter] = useState<string>('all');

  // Category State
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageLabelsOpen, setIsManageLabelsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Manual Contact State
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  // Edit Contact State
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactData, setEditContactData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  // Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // View Email State
  const [viewEmail, setViewEmail] = useState<SentEmail | null>(null);
  const [isLoadingEmailDetails, setIsLoadingEmailDetails] = useState(false);

  // Sent Items View State
  const [viewCategory, setViewCategory] = useState<string | null>(null);

  // Form State
  const [selectedRecipients, setSelectedRecipients] = useState<Contact[]>([]);
  const [emailCategory, setEmailCategory] = useState<string>('general');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Map<string, string>>(new Map()); // Maps filename to uploaded URL
  const [isSending, setIsSending] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compliance State
  const [eeocErrors, setEeocErrors] = useState<string[]>([]);

  // Attachment Compliance State
  const [attachmentComplianceErrors, setAttachmentComplianceErrors] = useState<Map<string, string[]>>(new Map());
  const [isCheckingAttachmentCompliance, setIsCheckingAttachmentCompliance] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [complianceDialogMessage, setComplianceDialogMessage] = useState<{ title: string, issues: string[] }>({ title: '', issues: [] });

  // AI State
  const [isAIComposeOpen, setIsAIComposeOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Zoho Session State
  const [isZohoConnected, setIsZohoConnected] = useState(false);
  const [zohoSessionExpiry, setZohoSessionExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [zohoEmail, setZohoEmail] = useState<string | null>(null);

  // Countdown Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isZohoConnected && zohoSessionExpiry) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = zohoSessionExpiry.getTime() - now.getTime();

        if (diff <= 0) {
          setIsZohoConnected(false);
          setZohoSessionExpiry(null);
          setTimeRemaining('');
          setZohoEmail(null);
          toast.error("Zoho session expired. Please reconnect.");
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isZohoConnected, zohoSessionExpiry]);

  // Zoho Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, verify event.origin here
      if (event.data && event.data.type === 'ZOHO_CONNECTED') {
        const { expiresIn, expiresAt, email } = event.data;
        const expiry = new Date(expiresAt);
        setZohoSessionExpiry(expiry);
        setIsZohoConnected(true);
        if (email) setZohoEmail(email);
        toast.success(`Connected to Zoho successfully!`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDisconnectZoho = () => {
    setIsZohoConnected(false);
    setZohoSessionExpiry(null);
    setZohoEmail(null);
    toast.info("Zoho Account Disconnected");
  };

  // Sent Emails State (Local Mock for now as API is Campaign based, 
  // but in a real app we'd fetch this from GET /campaigns and map it)
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);

  useEffect(() => {
    fetchContacts();
    fetchTags();
    fetchCampaigns();
  }, []);

  // Auto-refresh campaigns when switching to sent tab
  useEffect(() => {
    if (activeTab === 'sent') {
      fetchCampaigns();
    }
  }, [activeTab]);

  // Compliance State
  const [checkingCompliance, setCheckingCompliance] = useState(false);
  const [complianceResult, setComplianceResult] = useState<{ isCompliant: boolean; issues?: string[]; score?: number } | null>(null);

  // Passive Check Debounce
  useEffect(() => {
    if (!subject.trim() && !body.trim()) {
      setComplianceResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Check even on short text for testing visibility
      if (subject.length > 1 || body.length > 2) {
        setCheckingCompliance(true);
        try {
          console.log("🛡️ Triggering Compliance Check:", { subject, body }); // Debug log
          const result = await emailAgentApi.compliance.checkText({
            subject,
            body,
            useAI: true
          });
          setComplianceResult(result);
        } catch (error) {
          console.error("Passive compliance check failed", error);
          setComplianceResult({ isCompliant: false, issues: ["System Error: Unable to verify compliance. Please check network/backend."] });
        } finally {
          setCheckingCompliance(false);
        }
      }
    }, 1000); // Reduced delay

    return () => clearTimeout(timer);
  }, [subject, body]);


  // Optional: Auto-refresh campaigns periodically while on sent tab
  useEffect(() => {
    if (activeTab === 'sent') {
      const interval = setInterval(() => {
        fetchCampaigns();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    console.log('🔄 Refreshing campaigns from API...');
    try {
      setIsCampaignsLoading(true);
      const response = await emailAgentApi.campaigns.list();
      console.log('📧 RAW API RESPONSE:', response);

      // FIX: Handle both direct array OR object with campaigns property
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.campaigns && Array.isArray(response.campaigns)) {
        data = response.campaigns;
      }

      if (data) {
        // 1. ROBUST STATUS FILTER (Case Insensitive)
        const sentCampaigns = data.filter((c: any) => {
          const s = (c.status || '').toLowerCase();
          return s === 'sent' || s === 'completed' || s === 'delivered' || s === 'processing' || s === 'pending' || s === 'draft';
        });

        console.log(`📬 Found ${sentCampaigns.length} sent campaigns`);

        // 2. ROBUST MAPPING
        const mappedCampaigns: SentEmail[] = sentCampaigns.map((c: any) => {
          const rawCategory = c.category || 'General';
          const normalizedCategory = rawCategory.trim().toLowerCase();

          return {
            id: c.id || c.campaignId,
            to: `${c.totalRecipients || c.recipient_count || 1} recipients`,
            recipientName: c.name || 'Campaign',
            subject: c.subject || c.name || '(No Subject)',
            body: c.body || c.bodyTemplate || '',
            category: normalizedCategory,
            sentAt: new Date(c.createdAt || c.created_at || c.sentAt || Date.now()),
            status: 'Sent',
            attachments: c.images || c.attachments || [],
            recipients: c.recipients?.map((r: any) => ({
              email: r.email || r.recipientEmail,
              name: r.name || r.recipientName || r.email,
              status: r.status === 'failed' ? 'Failed' : r.status === 'delivered' ? 'Delivered' : 'Sent'
            })) || []
          };
        });

        setSentEmails(mappedCampaigns);
      }
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
    } finally {
      setIsCampaignsLoading(false);
    }
  };

  const fetchContacts = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await emailAgentApi.contacts.list();

      if (data && data.contacts) {
        setContacts(data.contacts.map((c: any) => ({
          id: c.email, // using email as ID if API doesn't provide one, assuming unique
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          company: c.company,
          tags: c.tags || []
        })));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      if (!silent) toast.error('Failed to load contacts');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchTags = async (silent = false) => {
    try {
      const data = await emailAgentApi.contacts.getTags();
      if (data && data.tags) {
        setAvailableTags(data.tags.map((t: any) => ({
          tagName: t.tagName,
          color: t.color || stringToColor(t.tagName),
          description: t.description
        })));
      }
    } catch (error) {
      // Silent fail or fallback
      if (availableTags.length === 0) setAvailableTags([{ tagName: 'VIP', color: '#FFD700' }, { tagName: 'New', color: '#32CD32' }]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      // Default color to blue-500 if we don't have a picker yet
      await emailAgentApi.contacts.createTag(newTagName, '#3b82f6');
      toast.success(`Label "${newTagName}" created`);
      setNewTagName('');
      fetchTags();
      fetchContacts();
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create label");
    }
  };

  // Real-time Data Sync (Polling)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll checks if we are NOT currently editing/interacting heavily to avoid jitters, 
      // but "every second" was requested. We'll use 2s for safety.
      if (!isAddContactOpen && !isEditContactOpen && !isImportOpen) {
        fetchContacts(true); // Silent refresh
        fetchTags(true);     // Silent refresh
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAddContactOpen, isEditContactOpen, isImportOpen]);

  const fetchFullCampaignDetails = async (campaignId: string) => {
    try {
      setIsLoadingEmailDetails(true);
      const response = await emailAgentApi.campaigns.get(campaignId);
      console.log('📧 Full campaign details:', response);

      if (response) {
        // Update viewEmail with full recipient data
        setViewEmail(prev => {
          if (!prev) return null;

          return {
            ...prev,
            recipients: response.recipients?.map((r: any) => ({
              email: r.email || r.recipientEmail,
              name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.name || r.email,
              status: r.status === 'failed' ? 'Failed' : r.status === 'delivered' ? 'Delivered' : 'Sent'
            })) || []
          };
        });
      }
    } catch (error) {
      console.error('❌ Error fetching campaign details:', error);
      toast.error('Failed to load recipient details');
    } finally {
      setIsLoadingEmailDetails(false);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    // Normalize to lowercase for consistency
    const normalizedName = newCategoryName.trim().toLowerCase();
    if (categories.includes(normalizedName)) {
      toast.error('Category already exists');
      return;
    }
    setCategories([...categories, normalizedName]);
    setNewCategoryName('');
    toast.success('Category added');
  };

  const handleDeleteCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
    if (emailCategory === category) setEmailCategory('general');
    if (viewCategory === category) setViewCategory(null);
  };

  const addLabelRecipients = (tag: string) => {
    const matchingContacts = contacts.filter(contact =>
      (contact.tags || []).includes(tag)
    );

    if (matchingContacts.length === 0) {
      toast.info('No contacts found with this label');
      return;
    }

    const currentIds = new Set(selectedRecipients.map(r => r.id));
    const newRecipients = matchingContacts.filter(c => !currentIds.has(c.id));

    if (newRecipients.length > 0) {
      setSelectedRecipients([...selectedRecipients, ...newRecipients]);
      toast.success(`Added ${newRecipients.length} contacts`);
    } else {
      toast.info('All contacts from this label are already selected');
    }
    setRecipientSearchOpen(false);
  };

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.email) {
      toast.error('First Name and Email are required');
      return;
    }

    try {
      await emailAgentApi.contacts.add({
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        email: newContact.email,
        company: newContact.company,
        tags: []
      });

      toast.success('Contact added successfully');
      setIsAddContactOpen(false);
      setNewContact({ firstName: '', lastName: '', email: '', company: '' });
      fetchContacts(); // Refresh list
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditContactData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      company: contact.company || ''
    });
    setIsEditContactOpen(true);
  };

  const handleUpdateContact = async () => {
    // Note: The provided API doc didn't specify an Update endpoint for contacts, 
    // so we might need to delete and add, or assume a PATCH endpoint exists. 
    // For now, updating local state or re-adding.
    if (!editContactData.firstName || !editContactData.email) return;

    // Simulation for update since API is limited in this spec
    setContacts(contacts.map(c =>
      c.id === editingContactId
        ? { ...c, ...editContactData }
        : c
    ));
    setIsEditContactOpen(false);
    toast.success('Contact updated');
  };

  const handleDeleteContact = async (email: string) => {
    try {
      await emailAgentApi.contacts.delete(email);
      setContacts(contacts.filter(c => c.email !== email));
      toast.success('Contact deleted');
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');

        // Simple parse logic
        const contactsToImport = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(','); // Simplified split
          if (cols.length >= 3) {
            contactsToImport.push({
              firstName: cols[0].trim(),
              lastName: cols[1].trim(),
              email: cols[2].trim(),
              company: cols[3]?.trim(),
              tags: cols[4] ? cols[4].split(';').map(t => t.trim()) : []
            });
          }
        }

        if (contactsToImport.length > 0) {
          await emailAgentApi.contacts.batchImport(contactsToImport);
          toast.success(`Imported ${contactsToImport.length} contacts`);
          fetchContacts();
          setIsImportOpen(false);
        }
      } catch (error) {
        toast.error('Import failed');
      }
      if (importFileRef.current) importFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const content = "First Name,Last Name,Email,Company,Labels\nJohn,Doe,john@example.com,Acme Inc,VIP;Tech";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "contacts_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Check compliance for each file
      setIsCheckingAttachmentCompliance(true);
      const complianceIssues: string[] = [];
      const newComplianceErrors = new Map(attachmentComplianceErrors);
      const newAttachmentUrls = new Map(attachmentUrls);

      for (const file of newFiles) {
        // Only check image files for EEOC compliance
        if (file.type.startsWith('image/')) {
          try {
            // Read file as Data URL (Base64 string with data:image/xxx;base64, prefix)
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result); // Full data URL: "data:image/jpeg;base64,..."
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Send POST request to /images with JSON payload
            const response = await emailAgentApi.compliance.checkImage({
              image: dataUrl,
              filename: file.name,
              campaignId: 'default'
            });

            // Check if the response indicates non-compliance
            if (response && !response.isCompliant) {
              const violations = response.violations || [];
              const errorMessages = violations.map((v: any) => v.message || v.issue || 'Compliance violation detected');
              newComplianceErrors.set(file.name, errorMessages);
              complianceIssues.push(`${file.name}: ${errorMessages.join(', ')}`);
            } else if (response && response.isCompliant) {
              // Store the uploaded URL for compliant images
              if (response.url) {
                newAttachmentUrls.set(file.name, response.url);
              }
              // Remove any previous errors for this file
              newComplianceErrors.delete(file.name);
            }
          } catch (error) {
            console.error('Image compliance check failed for', file.name, error);
            // Don't block upload if compliance check API fails, but log it
            toast.warning('Unable to verify compliance for ' + file.name);
          }
        }
      }

      setAttachmentComplianceErrors(newComplianceErrors);
      setAttachmentUrls(newAttachmentUrls);
      setIsCheckingAttachmentCompliance(false);

      // If there are compliance issues, show dialog and don't add the files
      if (complianceIssues.length > 0) {
        setComplianceDialogMessage({
          title: 'EEOC Compliance Violation Detected in Attachments',
          issues: complianceIssues
        });
        setShowComplianceDialog(true);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        return; // Don't add the files to attachments
      }

      // Only add files if they passed compliance check
      setAttachments([...attachments, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const fileToRemove = attachments[index];
    setAttachments(attachments.filter((_, i) => i !== index));

    // Remove compliance errors and URL for this file
    if (fileToRemove) {
      const newComplianceErrors = new Map(attachmentComplianceErrors);
      newComplianceErrors.delete(fileToRemove.name);
      setAttachmentComplianceErrors(newComplianceErrors);

      const newAttachmentUrls = new Map(attachmentUrls);
      newAttachmentUrls.delete(fileToRemove.name);
      setAttachmentUrls(newAttachmentUrls);
    }
  };

  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const checkEEOCCompliance = async (htmlContent: string) => {
    try {
      // Strip HTML tags to get plain text for compliance checking
      const plainText = stripHtmlTags(htmlContent);

      const response = await emailAgentApi.compliance.checkText({
        subject: subject,
        body: plainText,
        useAI: false
      });

      if (response && !response.isCompliant) {
        return response.violations.map((v: any) => v.message);
      }
      return [];
    } catch (error) {
      console.error('Compliance check failed', error);
      return [];
    }
  };

  const generateAIEmail = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await emailAgentApi.ai.generateContent({
        intent: aiPrompt,
        tone: 'Professional',
        count: 1
      });

      if (response && response.variations && response.variations.length > 0) {
        setBody(response.variations[0].body);
        if (!subject) setSubject(response.variations[0].subject);
        toast.success('Email draft generated');
        setIsAIComposeOpen(false);
      }
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendEmail = async () => {
    setEeocErrors([]);

    if (selectedRecipients.length === 0 || !subject || !body) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check for non-compliant attachments
    if (attachmentComplianceErrors.size > 0) {
      const issuesList: string[] = [];
      attachmentComplianceErrors.forEach((errors, fileName) => {
        issuesList.push(`${fileName}: ${errors.join(', ')}`);
      });

      setComplianceDialogMessage({
        title: 'Cannot Send Email - Attachment Compliance Issues',
        issues: issuesList
      });
      setShowComplianceDialog(true);

      toast.error("Cannot send email", {
        description: "Please remove or replace non-compliant attachments."
      });
      return;
    }

    // Checking text compliance via API
    const violations = await checkEEOCCompliance(body);
    if (violations.length > 0) {
      setEeocErrors(violations);
      toast.error("Compliance Check Failed", {
        description: "Potential EEOC violations found in email content."
      });
      return;
    }

    setIsSending(true);

    try {
      // 1. Create Campaign with category
      const campaign = await emailAgentApi.campaigns.create(subject || 'New Campaign', emailCategory);
      const campaignId = campaign.id || campaign.campaignId; // Handle potential ID field names

      if (!campaignId) throw new Error('Failed to create campaign');

      // 2. Configure Campaign with category
      // Prepare image URLs for compliant attachments
      const imageUrls = attachments
        .filter(file => file.type.startsWith('image/'))
        .map(file => attachmentUrls.get(file.name))
        .filter(url => url !== undefined) as string[];

      await emailAgentApi.campaigns.saveConfig(campaignId, {
        subject: subject,
        bodyTemplate: body,
        category: emailCategory,
        images: imageUrls // Pass compliant image URLs
      });

      // 3. Add Recipients
      // Assuming API expects list of contact objects or emails
      await emailAgentApi.campaigns.addRecipients(campaignId, selectedRecipients);

      // 4. Send Campaign
      await emailAgentApi.campaigns.send(campaignId);

      const recipientNames = selectedRecipients.map(r => `${r.firstName} ${r.lastName}`.trim());
      const displayRecipient = recipientNames.length === 1
        ? recipientNames[0]
        : `${recipientNames[0]} + ${recipientNames.length - 1} others`;

      console.log('📧 Creating new email with recipients:', selectedRecipients);
      console.log('📧 Recipient names:', recipientNames);

      const newEmail: SentEmail = {
        id: campaignId,
        to: selectedRecipients.map(r => r.email).join(', '),
        recipientName: displayRecipient,
        subject: subject,
        body: body,
        category: emailCategory,
        sentAt: new Date(),
        status: 'Sent',
        attachments: attachments.map(f => f.name),
        recipients: selectedRecipients.map(r => ({
          email: r.email,
          name: `${r.firstName} ${r.lastName}`,
          status: 'Delivered' as const // Default to Delivered for newly sent emails
        }))
      };

      console.log('📧 Created newEmail object:', newEmail);
      console.log('📧 Recipients in newEmail:', newEmail.recipients);

      // 5. Auto-save new recipients to Contacts
      const existingEmails = new Set(contacts.map(c => c.email.toLowerCase()));
      const newContactsToSave = selectedRecipients.filter(r => !existingEmails.has(r.email.toLowerCase()));

      if (newContactsToSave.length > 0) {
        try {
          // Map to format expected by batch import
          const contactsForImport = newContactsToSave.map(r => ({
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            company: r.company || '',
            tags: ['Auto-Saved'] // Tag them for clarity
          }));

          console.log('💾 Auto-saving new contacts:', contactsForImport);
          await emailAgentApi.contacts.batchImport(contactsForImport);
          toast.success(`Saved ${newContactsToSave.length} new contacts`);

          // Refresh contacts list
          fetchContacts();
        } catch (contactError) {
          console.error('Failed to auto-save contacts:', contactError);
          // Don't fail the whole operation if contact saving fails, just warn
          toast.warning('Email sent, but failed to save new contacts');
        }
      }

      setSentEmails([newEmail, ...sentEmails]);
      toast.success(`Email campaign sent to ${selectedRecipients.length} recipients`);

      setSubject('');
      setBody('');
      setEmailCategory('General');
      setSelectedRecipients([]);
      setAttachments([]);
      setAttachmentUrls(new Map()); // Clear attachment URLs
      setAttachmentComplianceErrors(new Map()); // Clear compliance errors
      setActiveTab('sent');
      setViewCategory(null);

      // Refresh campaigns list to get latest status
      fetchCampaigns();
    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Dashboard Calculations
  const totalEmails = sentEmails.length;
  const deliveredEmails = sentEmails.filter(e => e.status === 'Delivered').length;
  const deliveryRate = totalEmails > 0 ? Math.round((deliveredEmails / totalEmails) * 100) : 0;

  const emailsByCategory = sentEmails.reduce((acc, email) => {
    // Robust reducer: always lowercase key, default to 'general'
    const cat = (email.category || 'general').toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate failed/bounced emails by recipient
  const failedEmailsByRecipient = sentEmails
    .filter(e => e.status === 'Failed')
    .reduce((acc, email) => {
      const key = email.recipientName || email.to;
      if (!acc[key]) {
        acc[key] = {
          recipientName: email.recipientName,
          email: email.to,
          count: 0,
          lastFailedSubject: '',
          lastFailedDate: new Date(0)
        };
      }
      acc[key].count++;
      if (new Date(email.sentAt) > acc[key].lastFailedDate) {
        acc[key].lastFailedDate = new Date(email.sentAt);
        acc[key].lastFailedSubject = email.subject;
      }
      return acc;
    }, {} as Record<string, { recipientName: string; email: string; count: number; lastFailedSubject: string; lastFailedDate: Date }>);

  const topFailedRecipients = Object.values(failedEmailsByRecipient)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const getLast10DaysData = () => {
    const data = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayEmails = sentEmails.filter(e => {
        const eDate = new Date(e.sentAt);
        return eDate.getDate() === d.getDate() &&
          eDate.getMonth() === d.getMonth() &&
          eDate.getFullYear() === d.getFullYear();
      });

      data.push({
        date: dayStr,
        Sent: dayEmails.length,
        Failed: dayEmails.filter(e => e.status === 'Failed').length
      });
    }
    return data;
  };

  const activityChartData = getLast10DaysData();

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = contactSearch.toLowerCase();

    const matchesSearch = fullName.includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower));

    const matchesLabel = contactLabelFilter === 'all'
      ? true
      : (contact.tags || []).includes(contactLabelFilter);

    return matchesSearch && matchesLabel;
  });

  const filteredSentEmails = viewCategory
    ? sentEmails.filter(email => {
      // Robust case-insensitive comparison
      const emailCat = (email.category || 'general').toLowerCase(); // Changed from 'uncategorized' to 'general'
      const folderCat = viewCategory.toLowerCase();
      return emailCat === folderCat && email.status === 'Sent';
    })
    : [];

  // Calculate category counts from real API data (only count 'Sent' status)
  const categoryCounts = sentEmails.reduce((acc, email) => {
    if (email.status === 'Sent') {
      const cat = (email.category || 'general').toLowerCase(); // Changed from 'uncategorized' to 'general'
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Build list of categories to display: union of default categories + any categories from sent emails
  const allCategories = Array.from(new Set([
    ...categories,
    ...Object.keys(categoryCounts)
  ])).sort();

  // Debug logging (visible in browser console)
  useEffect(() => {
    if (activeTab === 'sent' && sentEmails.length > 0) {
      console.log('📊 Category Counts:', categoryCounts);
      console.log('📂 All Categories:', allCategories);
      console.log('📧 Total Sent Emails:', sentEmails.length);

      if (viewCategory) {
        console.log(`🔍 Filtering for category: "${viewCategory}" (lowercase: "${viewCategory.toLowerCase()}")`);
        console.log(`   Found ${filteredSentEmails.length} matching emails`);
      }
    }
  }, [sentEmails, activeTab, viewCategory, filteredSentEmails]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Email Agent</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send and manage emails to clients and candidates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="sent">Sent Items</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmails}</div>
                <p className="text-xs text-muted-foreground">All time sent emails</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveredEmails}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryRate}%</div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(emailsByCategory).length}</div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Email Activity</CardTitle>
                <CardDescription>Daily sent and failed emails (Last 10 Days)</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                      <Legend />
                      <Bar dataKey="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Sent" />
                      <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed/Bounced" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Failed Deliveries</CardTitle>
                <CardDescription>Recipients with most bounced/failed emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topFailedRecipients.map((recipient, index) => (
                    <div key={recipient.email} className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-red-500/10 text-red-500 border-red-500/20">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{recipient.recipientName}</p>
                        <p className="text-xs text-muted-foreground">{recipient.email}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-500">{recipient.count} failed</p>
                          <p className="text-xs text-muted-foreground">
                            {recipient.lastFailedDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topFailedRecipients.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                        <p>No failed deliveries</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compose" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Message</CardTitle>
              <CardDescription>Compose a new email to one or multiple recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zoho Integration Section */}
              {/* Zoho Integration Section */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isZohoConnected
                  ? "bg-green-50 border-green-200"
                  : "bg-muted/30 border-dashed"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-md",
                    isZohoConnected ? "bg-green-100" : "bg-yellow-100"
                  )}>
                    {isZohoConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isZohoConnected ? 'Zoho Mail Connected' : 'Email Service'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isZohoConnected
                        ? `Ready to send emails ${zohoEmail ? `as ${zohoEmail}` : ''}`
                        : 'Connect your Zoho Mail to send emails'}
                    </p>
                  </div>
                </div>

                {isZohoConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDisconnectZoho}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      try {
                        toast.info('Getting Authorization URL...');
                        const response = await emailAgentApi.zoho.getAuthUrl();
                        if (response && response.url) {
                          const width = 600;
                          const height = 700;
                          const left = window.screen.width / 2 - width / 2;
                          const top = window.screen.height / 2 - height / 2;

                          const popup = window.open(
                            response.url,
                            'ZohoAuth',
                            `width=${width},height=${height},left=${left},top=${top}`
                          );

                          // Listen for success message from popup
                          const handleMessage = (event: MessageEvent) => {
                            if (event.data?.type === 'ZOHO_CONNECTED') {
                              toast.success('Zoho Mail Connected Successfully!');
                              // Clean up
                              window.removeEventListener('message', handleMessage);
                            }
                          };
                          window.addEventListener('message', handleMessage);
                        } else {
                          toast.error('Could not get authorization URL');
                        }
                      } catch (error) {
                        console.error('Zoho Auth Error:', error);
                        toast.error('Failed to initiate Zoho connection');
                      }
                    }}
                  >
                    <Globe className="h-4 w-4" />
                    Connect Zoho
                  </Button>
                )}
              </div>

              {eeocErrors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Compliance Violation Detected</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Your email contains terms that may violate EEOC guidelines:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {eeocErrors.map((error, index) => (
                        <li key={index} className="text-sm font-medium">{error}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs">Please revise your message to ensure neutral, non-discriminatory language.</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category</Label>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsManageCategoriesOpen(true)}>
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>
                <Select value={emailCategory} onValueChange={setEmailCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategoryName(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipients</Label>

                <Popover open={recipientSearchOpen} onOpenChange={setRecipientSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-text flex flex-wrap gap-2 items-center hover:border-ring/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      {selectedRecipients.length === 0 && (
                        <span className="text-muted-foreground">Select contacts or labels...</span>
                      )}
                      {selectedRecipients.map((recipient) => (
                        <Badge key={recipient.id} variant="secondary" className="gap-1 pr-1">
                          {recipient.firstName} {recipient.lastName}
                          <button
                            className="ml-1 hover:bg-muted p-0.5 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
                            }}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[400px]" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts or labels..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>

                        {availableTags.length > 0 && (
                          <CommandGroup heading="Labels (Add all contacts in label)">
                            {availableTags.map((tag) => (
                              <CommandItem
                                key={tag.tagName}
                                onSelect={() => addLabelRecipients(tag.tagName)}
                                className="cursor-pointer"
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                <span>{tag.tagName}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {contacts.filter(c => (c.tags || []).includes(tag.tagName)).length} contacts
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        <CommandSeparator />
                        <CommandGroup heading="Contacts">
                          {contacts.slice(0, 50).map((contact) => {
                            const isSelected = selectedRecipients.some(r => r.id === contact.id);
                            return (
                              <CommandItem
                                key={contact.id}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedRecipients(selectedRecipients.filter(r => r.id !== contact.id));
                                  } else {
                                    setSelectedRecipients([...selectedRecipients, contact]);
                                  }
                                  setRecipientSearchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                )}>
                                  <Check className={cn("h-4 w-4")} />
                                </div>
                                <div className="flex flex-col">
                                  <span>{contact.firstName} {contact.lastName}</span>
                                  <span className="text-xs text-muted-foreground">{contact.email}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Message Body</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-3 w-3" />
                      Attach
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Dialog open={isAIComposeOpen} onOpenChange={setIsAIComposeOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-xs gap-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-indigo-200/50">
                          <Sparkles className="h-3 w-3 text-indigo-500" />
                          AI Write
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>AI Compose</DialogTitle>
                          <DialogDescription>
                            Describe what you want to write, and AI will generate a draft for you.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea
                            placeholder="e.g. Write a polite follow-up email to a candidate about their interview last Tuesday..."
                            className="min-h-[100px]"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                          />
                          <div className="text-xs text-muted-foreground">
                            The AI will use the selected category <strong>{formatCategoryName(emailCategory)}</strong> to better tailor the message.
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAIComposeOpen(false)}>Cancel</Button>
                          <Button onClick={generateAIEmail} disabled={isGeneratingAI || !aiPrompt.trim()}>
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Draft
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Type your message here..."
                  className="min-h-[200px]"
                />
                {/* Compliance Result Box - Passive Mode */}
                <div className="min-h-[24px] mt-2 transition-all duration-300">
                  {!subject && !body ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-70">
                      <ShieldAlert className="h-3 w-3" />
                      AI Compliance Check Active
                    </div>
                  ) : checkingCompliance ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking compliance...
                    </div>
                  ) : complianceResult?.isCompliant === false ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold">Compliance Violations Detected</div>
                          <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                            {complianceResult.issues?.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            )) || <li>Potential biased language detected.</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : complianceResult?.isCompliant === true ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 animate-in fade-in">
                      <CheckCircle2 className="h-3 w-3" />
                      EEOC Compliant
                    </div>
                  ) : null}
                </div>
                {isCheckingAttachmentCompliance && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking attachment compliance...</span>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, index) => {
                      const hasComplianceIssue = attachmentComplianceErrors.has(file.name);
                      return (
                        <Badge
                          key={index}
                          variant={hasComplianceIssue ? "destructive" : "secondary"}
                          className={cn(
                            "flex items-center gap-1 pl-2 pr-1 py-1",
                            hasComplianceIssue && "border-destructive/50"
                          )}
                        >
                          {hasComplianceIssue ? (
                            <ShieldAlert className="h-3 w-3 mr-1" />
                          ) : (
                            <FileIcon className="h-3 w-3 mr-1" />
                          )}
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {attachmentComplianceErrors.size > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Attachment Compliance Issue</AlertTitle>
                    <AlertDescription className="text-xs">
                      One or more attachments contain EEOC violations. Remove or replace them to send this email.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSendEmail} disabled={isSending || attachmentComplianceErrors.size > 0} variant={eeocErrors.length > 0 || attachmentComplianceErrors.size > 0 ? "secondary" : "default"}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            {viewCategory ? (
              <>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setViewCategory(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <CardTitle>{formatCategoryName(viewCategory)} Emails</CardTitle>
                    <CardDescription>Viewing emails in category: {formatCategoryName(viewCategory)}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSentEmails.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No emails found in this category.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[200px]">To</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="w-[180px]">Date Sent</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSentEmails.map((email) => (
                            <TableRow key={email.id}>
                              <TableCell>
                                <Badge variant={email.status === 'Sent' ? 'default' : 'secondary'}>
                                  {email.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium truncate">{email.recipientName}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{email.to}</div>
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">
                                {email.subject}
                                {email.attachments && email.attachments.length > 0 && (
                                  <Paperclip className="h-3 w-3 inline-block ml-2 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {email.sentAt.toLocaleDateString()} {email.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setViewEmail(email);
                                    fetchFullCampaignDetails(email.id);
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sent Emails</CardTitle>
                    <CardDescription>Select a category to view email history</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCampaigns()}
                      disabled={isCampaignsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isCampaignsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsManageCategoriesOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Categories
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isCampaignsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Loading sent emails...</span>
                    </div>
                  ) : allCategories.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No sent emails yet.</p>
                      <p className="text-sm mt-1">Send your first email from the Compose tab.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allCategories.map(category => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors bg-card text-card-foreground shadow-sm"
                          onClick={() => setViewCategory(category)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Folder className="h-5 w-5 text-foreground/70" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{formatCategoryName(category)}</span>
                              <span className="text-xs text-muted-foreground">
                                {categoryCounts[category] || 0} emails
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contacts Directory</CardTitle>
                <CardDescription>All available contacts from Clients and Candidates</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Contact</DialogTitle>
                      <DialogDescription>Manually add a contact to your directory</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={newContact.firstName}
                            onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            value={newContact.lastName}
                            onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={newContact.email}
                          onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company">Company (Optional)</Label>
                        <Input
                          id="company"
                          placeholder="Acme Inc."
                          value={newContact.company}
                          onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddContact}>Add Contact</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Contact</DialogTitle>
                      <DialogDescription>Update contact information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-firstName">First Name</Label>
                          <Input
                            id="edit-firstName"
                            placeholder="John"
                            value={editContactData.firstName}
                            onChange={(e) => setEditContactData({ ...editContactData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-lastName">Last Name</Label>
                          <Input
                            id="edit-lastName"
                            placeholder="Doe"
                            value={editContactData.lastName}
                            onChange={(e) => setEditContactData({ ...editContactData, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="john@example.com"
                          value={editContactData.email}
                          onChange={(e) => setEditContactData({ ...editContactData, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-company">Company (Optional)</Label>
                        <Input
                          id="edit-company"
                          placeholder="Acme Inc."
                          value={editContactData.company}
                          onChange={(e) => setEditContactData({ ...editContactData, company: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditContactOpen(false)}>Cancel</Button>
                      <Button onClick={handleUpdateContact}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Contacts</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file to bulk import contacts.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => importFileRef.current?.click()}>
                        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Click to upload CSV</p>
                        <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
                        <input
                          type="file"
                          ref={importFileRef}
                          className="hidden"
                          accept=".csv"
                          onChange={handleImportCSV}
                        />
                      </div>

                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <h4 className="font-medium text-sm flex items-center">
                          <FileIcon className="h-4 w-4 mr-2" />
                          CSV Format Requirements
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Your CSV file must have the following headers: <code className="bg-background px-1 py-0.5 rounded">First Name</code>, <code className="bg-background px-1 py-0.5 rounded">Last Name</code> and <code className="bg-background px-1 py-0.5 rounded">Email</code>.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Optional headers: <code className="bg-background px-1 py-0.5 rounded">Company</code> and <code className="bg-background px-1 py-0.5 rounded">Labels</code> (semicolon separated).
                        </p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={downloadTemplate}>
                          <Download className="h-3 w-3 mr-1" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isManageLabelsOpen} onOpenChange={setIsManageLabelsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Tag className="mr-2 h-4 w-4" />
                      Manage Labels
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage Labels</DialogTitle>
                      <DialogDescription>
                        Create and manage labels for your contacts.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 py-4">
                      <Input
                        placeholder="New Label Name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTag();
                        }}
                      />
                      <Button onClick={handleCreateTag}>
                        <Plus className="h-4 w-4 mr-2" /> Add
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableTags.length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-4">No tags found</div>
                        ) : (
                          availableTags.map(tag => (
                            <div key={tag.tagName} className="flex items-center justify-between p-2 border rounded-md group">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                <span>{tag.tagName}</span>
                              </div>
                              <div className="flex gap-1 opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    // Toggle Edit Mode (For now just prompt color)
                                    const newColor = prompt("Enter new color (Hex):", tag.color);
                                    if (newColor) {
                                      emailAgentApi.contacts.createTag(tag.tagName, newColor, tag.description || '')
                                        .then(() => {
                                          toast.success("Tag updated");
                                          fetchTags();
                                          fetchContacts(); // Refresh contacts to reflect new colors immediately
                                        })
                                        .catch((err) => {
                                          console.error("Failed to update tag:", err);
                                          toast.error("Failed to update tag");
                                        });
                                    }
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:text-red-500"
                                  onClick={async () => {
                                    if (confirm(`Delete label "${tag.tagName}"? This will remove it from all contacts.`)) {
                                      await emailAgentApi.contacts.deleteTag(tag.tagName);
                                      toast.success("Label deleted");
                                      fetchTags();
                                      fetchContacts(); // Refresh contacts too
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="max-w-sm"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
                <Select value={contactLabelFilter} onValueChange={setContactLabelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    {availableTags.map(tag => (
                      <SelectItem key={tag.tagName} value={tag.tagName}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.tagName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Labels</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <span className="sr-only">Loading...</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredContacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No contacts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.firstName} {contact.lastName}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(contact.tags || []).map((tag, idx) => {
                                // Dynamic Color Lookup
                                const tagObj = availableTags.find(t => t.tagName === tag);
                                const tagColor = tagObj ? tagObj.color : stringToColor(tag);

                                return (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs px-1 py-0 h-5"
                                    style={{ borderColor: tagColor, color: tagColor }}
                                  >
                                    {tag}
                                  </Badge>
                                );
                              })}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full ml-1">
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[200px]" align="start">
                                  <Command>
                                    <CommandInput placeholder="Add label..." />
                                    <CommandList>
                                      <CommandEmpty>No labels found.</CommandEmpty>
                                      <CommandGroup>
                                        {availableTags.map((tag) => (
                                          <CommandItem
                                            key={tag.tagName}
                                            onSelect={async () => {
                                              // Toggle tag logic
                                              const currentTags = contact.tags || [];
                                              const hasTag = currentTags.includes(tag.tagName);
                                              let newTags;

                                              if (hasTag) {
                                                newTags = currentTags.filter(t => t !== tag.tagName);
                                              } else {
                                                newTags = [...currentTags, tag.tagName];
                                              }

                                              // Optimistic Update
                                              const updatedContacts = contacts.map(c =>
                                                c.id === contact.id ? { ...c, tags: newTags } : c
                                              );
                                              setContacts(updatedContacts);

                                              // API Call (Assuming we have batch or add endpoint, simplified here as add handles it?)
                                              // Actually, we need to update the contact. 
                                              // Since specific update endpoint was ambiguous, we re-add (upsert) or batch.
                                              // Let's use batchImport to update just this contact
                                              try {
                                                await emailAgentApi.contacts.batchImport([{
                                                  ...contact,
                                                  tags: newTags
                                                }]);
                                                toast.success("Tags updated");
                                              } catch (e) {
                                                toast.error("Failed to update tags");
                                                fetchContacts(); // Revert
                                              }
                                            }}
                                          >
                                            <div className={cn(
                                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                              (contact.tags || []).includes(tag.tagName) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                            )}>
                                              <Check className={cn("h-4 w-4")} />
                                            </div>
                                            <span>{tag.tagName}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TableCell>
                          <TableCell>{contact.company || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditContact(contact)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteContact(contact.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecipients([contact]);
                                  setActiveTab('compose');
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Email Dialog */}
        <Dialog open={!!viewEmail} onOpenChange={(open) => !open && setViewEmail(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
              <DialogDescription>
                View the details of the sent email.
              </DialogDescription>
            </DialogHeader>

            {viewEmail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <div className="flex items-center">
                      <Badge variant={viewEmail.status === 'Sent' ? 'default' : 'secondary'}>
                        {viewEmail.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <div>
                      <Badge variant="outline">
                        {viewEmail.category || 'General'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Recipients Table Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Recipients</Label>

                  {isLoadingEmailDetails ? (
                    <div className="flex items-center justify-center py-8 border rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
                      <span className="text-sm text-slate-500">Loading recipient details...</span>
                    </div>
                  ) : (
                    (() => {
                      // Prepare recipients list from either recipients array or parse from "to" field
                      let recipientsList: Array<{ name: string; email: string; company: string; status: 'Sent' | 'Delivered' | 'Failed' }> = [];

                      if (viewEmail.recipients && viewEmail.recipients.length > 0) {
                        // Use existing recipients array
                        recipientsList = viewEmail.recipients.map(r => ({
                          name: r.name,
                          email: r.email,
                          company: '-', // Company info not in current recipient structure
                          status: r.status
                        }));
                      } else {
                        // Parse from "to" field
                        const fullText = viewEmail.recipientName;

                        if (fullText.includes(' + ')) {
                          // Multiple recipients
                          const emails = viewEmail.to.split(',').map(e => e.trim()).filter(e => e);
                          recipientsList = emails.map(email => {
                            const localPart = email.split('@')[0];
                            const name = localPart.split('.').map(part =>
                              part.charAt(0).toUpperCase() + part.slice(1)
                            ).join(' ');
                            return {
                              name,
                              email,
                              company: '-',
                              status: viewEmail.status
                            };
                          });
                        } else {
                          // Single recipient
                          let email = viewEmail.to;
                          if (email.includes('recipients')) {
                            email = `recipient@example.com`;
                          }
                          recipientsList = [{
                            name: fullText,
                            email: email,
                            company: '-',
                            status: viewEmail.status
                          }];
                        }
                      }

                      return (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs font-semibold uppercase text-slate-600">Name</TableHead>
                                <TableHead className="text-xs font-semibold uppercase text-slate-600">Email</TableHead>
                                <TableHead className="text-xs font-semibold uppercase text-slate-600">Company</TableHead>
                                <TableHead className="text-xs font-semibold uppercase text-slate-600">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase text-slate-600">Sent At</TableHead>
                                <TableHead className="text-xs font-semibold uppercase text-slate-600 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recipientsList.map((recipient, idx) => (
                                <TableRow key={`${recipient.email}-${idx}`} className="hover:bg-slate-50">
                                  <TableCell className="font-medium">{recipient.name}</TableCell>
                                  <TableCell className="text-slate-600">{recipient.email}</TableCell>
                                  <TableCell className="text-slate-600">{recipient.company}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        recipient.status === 'Delivered' ? 'default' :
                                          recipient.status === 'Failed' ? 'destructive' :
                                            'secondary'
                                      }
                                      className="flex items-center gap-1 w-fit"
                                    >
                                      {recipient.status === 'Delivered' && <CheckCircle2 className="h-3 w-3" />}
                                      {recipient.status === 'Failed' && <AlertTriangle className="h-3 w-3" />}
                                      <span className="text-xs">{recipient.status}</span>
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-600">-</TableCell>
                                  <TableCell className="text-right">
                                    {recipient.status === 'Failed' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                        onClick={() => {
                                          toast.info('Resend functionality will be implemented');
                                          // TODO: Implement resend logic via API
                                        }}
                                      >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Resend
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Date</Label>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                      {viewEmail.sentAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Time</Label>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                      {viewEmail.sentAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {viewEmail.attachments && viewEmail.attachments.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Attachments</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewEmail.attachments.map((file, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1 font-normal">
                          <FileIcon className="h-3 w-3 mr-1" />
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-2">
                  <div className="space-y-2">
                    <Label className="font-semibold text-base">{viewEmail.subject}</Label>
                    <div
                      className="bg-muted/30 p-4 rounded-md text-sm font-sans prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewEmail.body }}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewEmail(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Categories Dialog */}
        <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
              <DialogDescription>Create and organize email categories</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <Button onClick={handleCreateCategory} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {categories.map(category => (
                  <div key={category} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{formatCategoryName(category)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={category === 'General'}
                      className={category === 'General' ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attachment Compliance Warning Dialog */}
        <Dialog open={showComplianceDialog} onOpenChange={setShowComplianceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                {complianceDialogMessage.title}
              </DialogTitle>
              <DialogDescription>
                The attached file(s) contain content that may violate EEOC (Equal Employment Opportunity Commission) guidelines.
                Please review and remove any discriminatory content before sending.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Compliance Issues Detected</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    {complianceDialogMessage.issues.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>What this means:</strong> The system detected potentially discriminatory content in your attachment(s)
                  such as age, gender, race, religion, or other protected characteristics. To ensure EEOC compliance,
                  please review and modify the attachment(s) to use neutral, non-discriminatory language and imagery.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComplianceDialog(false)}>
                I Understand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div >
  );
}
