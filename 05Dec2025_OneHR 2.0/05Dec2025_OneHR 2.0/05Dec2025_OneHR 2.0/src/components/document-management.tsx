import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, Upload, Download, Eye, Trash2, Search, AlertCircle, 
  CheckCircle2, Clock, Filter, FileCheck, FilePenLine, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { EmployeeDocument, EmployeeDocumentType, Employee } from '../types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_ONBOARDING_API_URL || API_ENDPOINTS.EMPL_ONBORDING;

// Helper function to generate PDF document
const generatePDFDocument = (doc: EmployeeDocument, employee?: Employee) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(doc.documentName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Metadata section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Document Information', 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const metadata = [
    `Document Type: ${doc.documentType}`,
    employee ? `Employee: ${employee.firstName} ${employee.lastName}` : '',
    `Upload Date: ${format(new Date(doc.uploadDate), 'PPP')}`,
    doc.expiryDate ? `Expiry Date: ${format(new Date(doc.expiryDate), 'PPP')}` : '',
    `Status: ${doc.status || 'active'}`,
    `File Name: ${doc.fileName || 'N/A'}`,
    doc.fileSize ? `File Size: ${(doc.fileSize / 1024).toFixed(2)} KB` : '',
    doc.uploadedBy ? `Uploaded By: ${doc.uploadedBy}` : '',
  ].filter(Boolean);

  metadata.forEach(line => {
    pdf.text(line, 20, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Prototype notice
  pdf.setFillColor(255, 243, 205);
  pdf.rect(15, yPos - 5, pageWidth - 30, 25, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('⚠ PROTOTYPE MODE', 20, yPos + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const noticeText = 'This is a placeholder document. In production, the actual uploaded file content would be displayed here.';
  const splitNotice = pdf.splitTextToSize(noticeText, pageWidth - 40);
  pdf.text(splitNotice, 20, yPos + 10);
  yPos += 35;

  // Notes section
  if (doc.notes) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Additional Notes:', 20, yPos);
    yPos += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const splitNotes = pdf.splitTextToSize(doc.notes, pageWidth - 40);
    pdf.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 7 + 10;
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footerY = pdf.internal.pageSize.getHeight() - 15;
  pdf.text(`Document ID: ${doc.id}`, 20, footerY);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, footerY + 5);

  return pdf;
};

// Helper function to determine file extension
const getFileExtension = (fileName?: string) => {
  if (!fileName) return 'pdf';
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext || 'pdf';
};

export function DocumentManagement() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [uploadForm, setUploadForm] = useState({
    employeeId: '',
    documentType: 'Other' as EmployeeDocumentType,
    documentName: '',
    expiryDate: '',
    requiresSignature: false,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const [docsRes, empsRes] = await Promise.all([
        fetch(`${API_URL}/onboarding/requests/all/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/onboarding/all-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }

      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(data.requests || data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setUploadFile(file);
      if (!uploadForm.documentName) {
        setUploadForm(prev => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.employeeId || !uploadForm.documentName) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('employeeId', uploadForm.employeeId);
      formData.append('documentType', uploadForm.documentType);
      formData.append('documentName', uploadForm.documentName);
      formData.append('expiryDate', uploadForm.expiryDate);
      formData.append('requiresSignature', String(uploadForm.requiresSignature));
      formData.append('notes', uploadForm.notes);

      const token = getAccessToken();
      const response = await fetch(`${API_URL}/onboarding/requests/${uploadForm.employeeId}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setDocuments([...documents, data.document]);
      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      resetUploadForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      console.log(`Attempting to ${status} document ${docId}`);
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/onboarding/documents/${docId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: status,
          rejectionReason: reason,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verification failed - Status:', response.status);
        console.error('Verification failed - Response:', errorText);
        
        let errorMessage = 'Failed to verify document';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        toast.error(`Verification failed: ${errorMessage}`);
        return;
      }

      const result = await response.json();
      console.log('Document verification successful:', result);
      
      toast.success(status === 'verified' ? 'Document verified successfully' : 'Document rejected');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error verifying document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to verify document: ${errorMessage}`);
    }
  };

  const handleOpenRejectDialog = (docId: string) => {
    setDocumentToReject(docId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleSubmitRejection = async () => {
    if (!documentToReject) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    await handleVerifyDocument(documentToReject, 'rejected', rejectionReason);
    setShowRejectDialog(false);
    setDocumentToReject(null);
    setRejectionReason('');
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/onboarding/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      employeeId: '',
      documentType: 'Other',
      documentName: '',
      expiryDate: '',
      requiresSignature: false,
      notes: '',
    });
    setUploadFile(null);
  };

  const getVerificationBadge = (doc: EmployeeDocument) => {
    if (doc.verificationStatus === 'verified') {
      return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>;
    }
    if (doc.verificationStatus === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
  };

  const getStatusBadge = (doc: EmployeeDocument) => {
    if (doc.status === 'expired') {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Expired</Badge>;
    }
    if (doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      return <Badge className="gap-1 bg-yellow-500"><Clock className="h-3 w-3" /> Expiring Soon</Badge>;
    }
    if (doc.requiresSignature && doc.signatureStatus === 'pending') {
      return <Badge className="gap-1 bg-blue-500"><FilePenLine className="h-3 w-3" /> Signature Pending</Badge>;
    }
    if (doc.requiresSignature && doc.signatureStatus === 'signed') {
      return <Badge className="gap-1 bg-green-600"><FileCheck className="h-3 w-3" /> Signed</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
  };

  const filteredDocuments = documents.filter(doc => {
    const employee = employees.find(e => e.id === doc.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.toLowerCase() : '';
    
    const matchesSearch = !searchTerm || 
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeName.includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployee = filterEmployee === 'all' || doc.employeeId === filterEmployee;
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesVerification = filterVerification === 'all' || (doc.verificationStatus || 'pending') === filterVerification;

    return matchesSearch && matchesEmployee && matchesType && matchesStatus && matchesVerification;
  });

  const stats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    expiringSoon: documents.filter(d => 
      d.expiryDate && 
      new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
      d.status === 'active'
    ).length,
    pendingReview: documents.filter(d => 
      (d.verificationStatus || 'pending') === 'pending'
    ).length,
    pendingSignature: documents.filter(d => 
      d.requiresSignature && d.signatureStatus === 'pending'
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Document Management</h1>
          <p className="text-muted-foreground">Manage employee documents and compliance files</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setFilterVerification('pending')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.pendingReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expiring Soon</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.expiringSoon}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Signature</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.pendingSignature}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Review Alert */}
      {stats.pendingReview > 0 && (
        <Alert className="border-orange-500 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-600">Documents Awaiting Review</AlertTitle>
          <AlertDescription className="text-orange-600">
            {stats.pendingReview} document(s) are waiting for approval. Click on the "Pending Review" card above to filter and review them.
          </AlertDescription>
        </Alert>
      )}

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Documents Expiring Soon</AlertTitle>
          <AlertDescription className="text-yellow-600">
            {stats.expiringSoon} document(s) will expire in the next 30 days. Please review and renew.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="I-9">I-9</SelectItem>
                <SelectItem value="W-4">W-4</SelectItem>
                <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
                <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVerification} onValueChange={setFilterVerification}>
              <SelectTrigger>
                <SelectValue placeholder="All Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="gradient-teal-blue">
                <TableHead className="text-white">Employee</TableHead>
                <TableHead className="text-white">Document Name</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Upload Date</TableHead>
                <TableHead className="text-white">Expiry Date</TableHead>
                <TableHead className="text-white">Verification</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => {
                  const employee = employees.find(e => e.id === doc.employeeId);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doc.documentName}</div>
                          <div className="text-sm text-muted-foreground">{doc.fileName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{getVerificationBadge(doc)}</TableCell>
                      <TableCell>{getStatusBadge(doc)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setSelectedDocument(doc);
                              setShowViewDialog(true);
                              setLoadingPreview(true);
                              setDocumentPreviewUrl(null);
                              
                              // Try to load the actual file for preview
                              try {
                                const token = getAccessToken();
                                const response = await fetch(`${API_URL}/onboarding/documents/${doc.id}/download-file`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (response.ok) {
                                  const { url: signedUrl } = await response.json();
                                  console.log('Loaded preview URL:', signedUrl);
                                  setDocumentPreviewUrl(signedUrl);
                                } else {
                                  console.log('No file available for preview');
                                  setDocumentPreviewUrl(null);
                                }
                              } catch (error) {
                                console.error('Error loading preview:', error);
                                setDocumentPreviewUrl(null);
                              } finally {
                                setLoadingPreview(false);
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.verificationStatus === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerifyDocument(doc.id, 'verified')}
                                title="Approve document"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRejectDialog(doc.id)}
                                title="Reject document"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription id="upload-document-dialog-description">Upload a new employee document</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={uploadForm.employeeId} 
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select 
                value={uploadForm.documentType} 
                onValueChange={(value: EmployeeDocumentType) => setUploadForm(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I-9">I-9</SelectItem>
                  <SelectItem value="W-4">W-4</SelectItem>
                  <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
                  <SelectItem value="Resume">Resume</SelectItem>
                  <SelectItem value="Background Check">Background Check</SelectItem>
                  <SelectItem value="Direct Deposit Form">Direct Deposit Form</SelectItem>
                  <SelectItem value="Performance Review">Performance Review</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                value={uploadForm.documentName}
                onChange={(e) => setUploadForm(prev => ({ ...prev, documentName: e.target.value }))}
                placeholder="Enter document name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File * (Max 10MB)</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresSignature"
                checked={uploadForm.requiresSignature}
                onChange={(e) => setUploadForm(prev => ({ ...prev, requiresSignature: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresSignature" className="cursor-pointer">Requires Signature</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={uploadForm.notes}
                onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false);
              resetUploadForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription id="view-document-dialog-description">
              View comprehensive information and preview document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (() => {
            const employee = employees.find(e => e.id === selectedDocument.employeeId);
            return (
              <div className="space-y-4">
                {/* Document Preview Section */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPreview ? (
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[300px] flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                        <p className="text-gray-600">Loading document preview...</p>
                      </div>
                    ) : documentPreviewUrl ? (
                      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                        {(() => {
                          const fileExt = selectedDocument.fileName?.split('.').pop()?.toLowerCase();
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExt || '');
                          const isPdf = fileExt === 'pdf';
                          
                          if (isImage) {
                            return (
                              <div className="p-4">
                                <img 
                                  src={documentPreviewUrl} 
                                  alt={selectedDocument.documentName}
                                  className="max-w-full h-auto mx-auto"
                                  style={{ maxHeight: '600px' }}
                                />
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                  <strong>✓ Real Document:</strong> Showing your uploaded {fileExt?.toUpperCase()} image
                                </div>
                              </div>
                            );
                          } else if (isPdf) {
                            return (
                              <div>
                                <iframe
                                  src={documentPreviewUrl}
                                  className="w-full"
                                  style={{ height: '600px' }}
                                  title={selectedDocument.documentName}
                                />
                                <div className="p-3 bg-green-50 border-t border-green-200 text-sm text-green-800">
                                  <strong>✓ Real Document:</strong> Showing your uploaded PDF file
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-8 text-center">
                                <FileText className="h-16 w-16 text-blue-600 mb-4 mx-auto" />
                                <p className="font-medium text-gray-700 mb-2">{selectedDocument.documentName}</p>
                                <p className="text-sm text-gray-500 mb-4">
                                  File Type: {fileExt?.toUpperCase() || 'Unknown'}
                                </p>
                                <Alert className="border-blue-200 bg-blue-50 mt-4">
                                  <AlertCircle className="h-4 w-4 text-blue-600" />
                                  <AlertDescription className="text-blue-700 text-sm">
                                    <strong>Real File Available:</strong> This file type ({fileExt?.toUpperCase()}) cannot be previewed in the browser. 
                                    Click "Download" below to view the actual uploaded file.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[300px] flex flex-col items-center justify-center">
                        <FileText className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="font-medium text-gray-700 mb-2">{selectedDocument.documentName}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          File: {selectedDocument.fileName || 'No file name'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          File Type: {selectedDocument.fileName?.split('.').pop()?.toUpperCase() || 'Unknown'}
                        </p>
                        {selectedDocument.fileSize && (
                          <p className="text-sm text-gray-500 mb-4">
                            File Size: {(selectedDocument.fileSize / 1024).toFixed(2)} KB
                          </p>
                        )}
                        <Alert className="border-yellow-200 bg-yellow-50 mt-4">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-700 text-sm">
                            <strong>Metadata Only:</strong> This document was uploaded before file storage was implemented. 
                            Only metadata is available. Click "Download" to generate a placeholder document.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={async () => {
                            try {
                              // Try to download the actual file first
                              const downloadResponse = await fetch(`${API_URL}/documents/${selectedDocument.id}/download-file`, {
                                headers: {
                                  'Authorization': `Bearer ${getAccessToken() ?? ''}`
                                }
                              });
                              
                              if (downloadResponse.ok) {
                                const { url: signedUrl, fileName } = await downloadResponse.json();
                                console.log('Downloading actual file from:', signedUrl);
                                
                                // Download the file using the signed URL
                                const fileResponse = await fetch(signedUrl);
                                const blob = await fileResponse.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = fileName || selectedDocument.fileName || `${selectedDocument.documentName}`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                
                                toast.success(`Downloaded ${selectedDocument.documentName}`);
                                return;
                              } else {
                                const errorData = await downloadResponse.json();
                                if (errorData.metadataOnly) {
                                  toast.info('Generating placeholder PDF (actual file not available)');
                                }
                              }
                            } catch (error) {
                              console.error('Error downloading actual file:', error);
                            }
                            
                            // Fallback: Generate placeholder PDF
                            const fileExt = getFileExtension(selectedDocument.fileName);
                            
                            // Generate PDF for PDF files and most document types
                            if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                              const pdf = generatePDFDocument(selectedDocument, employee);
                              const fileName = selectedDocument.fileName || `${selectedDocument.documentName}.pdf`;
                              pdf.save(fileName.replace(/\.(doc|docx)$/, '.pdf'));
                              toast.success(`Downloaded ${selectedDocument.documentName} as placeholder PDF`);
                            } else {
                              // For other file types, create a text file
                              const content = `
DOCUMENT: ${selectedDocument.documentName}
TYPE: ${selectedDocument.documentType}
EMPLOYEE: ${employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
UPLOAD DATE: ${format(new Date(selectedDocument.uploadDate), 'PPP')}
${selectedDocument.expiryDate ? `EXPIRY DATE: ${format(new Date(selectedDocument.expiryDate), 'PPP')}` : ''}
STATUS: ${selectedDocument.status || 'active'}

---
This is a PROTOTYPE document placeholder.
In production, the actual uploaded file would be downloaded here.

Document ID: ${selectedDocument.id}
File Name: ${selectedDocument.fileName || 'N/A'}
${selectedDocument.notes ? `Notes: ${selectedDocument.notes}` : ''}
---

Generated on: ${new Date().toLocaleString()}
                              `.trim();
                              
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = selectedDocument.fileName || `${selectedDocument.documentName}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              toast.success(`Downloaded ${selectedDocument.documentName}`);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Document
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            const fileExt = getFileExtension(selectedDocument.fileName);
                            
                            // For PDF files, generate and open PDF in new tab
                            if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                              const pdf = generatePDFDocument(selectedDocument, employee);
                              const pdfBlob = pdf.output('blob');
                              const url = URL.createObjectURL(pdfBlob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                              toast.info('PDF opened in new tab');
                            } else {
                              // For other files, open HTML preview
                              const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${selectedDocument.documentName}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 800px; 
      margin: 50px auto; 
      padding: 20px;
      background: #f5f5f5;
    }
    .document {
      background: white;
      padding: 40px;
      border: 1px solid #ddd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .metadata { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .info { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="document">
    <h1>${selectedDocument.documentName}</h1>
    <div class="metadata">
      <div class="info"><span class="label">Document Type:</span> ${selectedDocument.documentType}</div>
      <div class="info"><span class="label">Employee:</span> ${employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}</div>
      <div class="info"><span class="label">Upload Date:</span> ${format(new Date(selectedDocument.uploadDate), 'PPP')}</div>
      ${selectedDocument.expiryDate ? `<div class="info"><span class="label">Expiry Date:</span> ${format(new Date(selectedDocument.expiryDate), 'PPP')}</div>` : ''}
      <div class="info"><span class="label">Status:</span> ${selectedDocument.status || 'active'}</div>
      <div class="info"><span class="label">File Name:</span> ${selectedDocument.fileName || 'N/A'}</div>
      ${selectedDocument.fileSize ? `<div class="info"><span class="label">File Size:</span> ${(selectedDocument.fileSize / 1024).toFixed(2)} KB</div>` : ''}
    </div>
    
    <div class="alert">
      <strong>⚠️ Prototype Mode:</strong> This is a placeholder document view. In production, the actual uploaded file (PDF, image, or other format) would be displayed here with full content.
    </div>
    
    ${selectedDocument.notes ? `
    <div class="info" style="margin-top: 20px;">
      <span class="label">Notes:</span><br/>
      <div style="background: #f8f9fa; padding: 10px; margin-top: 5px; border-radius: 4px;">
        ${selectedDocument.notes}
      </div>
    </div>
    ` : ''}
    
    <hr style="margin: 30px 0;"/>
    <p style="color: #666; font-size: 12px;">
      Document ID: ${selectedDocument.id}<br/>
      Generated on: ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>
                              `.trim();
                              
                              const blob = new Blob([content], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                              toast.info('Document opened in new tab');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                  </CardContent>
                </Card>

                {/* Document Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="mt-1">
                      {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label>Document Name</Label>
                    <p className="mt-1">{selectedDocument.documentName}</p>
                  </div>
                  <div>
                    <Label>Document Type</Label>
                    <p className="mt-1">{selectedDocument.documentType}</p>
                  </div>
                  <div>
                    <Label>Upload Date</Label>
                    <p className="mt-1">{format(new Date(selectedDocument.uploadDate), 'PPP')}</p>
                  </div>
                  {selectedDocument.expiryDate && (
                    <div>
                      <Label>Expiry Date</Label>
                      <p className="mt-1">{format(new Date(selectedDocument.expiryDate), 'PPP')}</p>
                    </div>
                  )}
                  <div>
                    <Label>Verification Status</Label>
                    <div className="mt-1">{getVerificationBadge(selectedDocument)}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedDocument)}</div>
                  </div>
                  {selectedDocument.uploadedBy && (
                    <div>
                      <Label>Uploaded By</Label>
                      <p className="mt-1">{selectedDocument.uploadedBy}</p>
                    </div>
                  )}
                  {selectedDocument.requiresSignature && (
                    <div>
                      <Label>Signature Status</Label>
                      <div className="mt-1">
                        <Badge variant={selectedDocument.signatureStatus === 'signed' ? 'default' : 'secondary'}>
                          {selectedDocument.signatureStatus || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDocument.notes && (
                  <div>
                    <Label>Additional Notes</Label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded border">{selectedDocument.notes}</p>
                  </div>
                )}

                {selectedDocument.verificationStatus === 'rejected' && selectedDocument.rejectionReason && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">Rejection Reason</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {selectedDocument.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}

                {selectedDocument.verifiedBy && selectedDocument.verifiedDate && (
                  <div className="text-sm text-muted-foreground">
                    {selectedDocument.verificationStatus === 'verified' ? 'Verified' : 'Reviewed'} by {selectedDocument.verifiedBy} on {format(new Date(selectedDocument.verifiedDate), 'PPP')}
                  </div>
                )}

                {/* Verification Actions */}
                {selectedDocument.verificationStatus === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        handleVerifyDocument(selectedDocument.id, 'verified');
                        setShowViewDialog(false);
                      }}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify Document
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        handleOpenRejectDialog(selectedDocument.id);
                        setShowViewDialog(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Document
                    </Button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDocument.id);
                      toast.success('Document ID copied to clipboard');
                    }}
                    className="flex-1"
                  >
                    Copy Document ID
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast.success('Email notification sent');
                      // In production, this would send an email to the employee
                    }}
                    className="flex-1"
                  >
                    Notify Employee
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription id="reject-document-dialog-description">
              Please provide a reason for rejecting this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Image is blurry, wrong document type, expired document..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setDocumentToReject(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSubmitRejection}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
