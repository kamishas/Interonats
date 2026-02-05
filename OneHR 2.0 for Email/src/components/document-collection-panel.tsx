import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  FileText, Upload, Download, Eye, Trash2, CheckCircle2, AlertCircle, 
  Clock, Send, XCircle, FileCheck, FileWarning, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { Employee, EmployeeDocument, DocumentRequest, EmployeeDocumentType } from '../types';
import jsPDF from 'jspdf';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Helper function to generate PDF document
const generatePDFDocument = (doc: EmployeeDocument, employee: Employee) => {
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
    `Employee: ${employee.firstName} ${employee.lastName}`,
    `Upload Date: ${format(new Date(doc.uploadDate), 'PPP')}`,
    `Uploaded By: ${doc.uploadedBy}`,
    doc.expiryDate ? `Expiry Date: ${format(new Date(doc.expiryDate), 'PPP')}` : '',
    `Verification Status: ${(doc.verificationStatus || 'pending').toUpperCase()}`,
    doc.verifiedBy ? `Verified By: ${doc.verifiedBy}` : '',
    `File Name: ${doc.fileName || 'N/A'}`,
    doc.fileSize ? `File Size: ${(doc.fileSize / 1024).toFixed(2)} KB` : '',
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

  // Rejection reason if any
  if (doc.rejectionReason) {
    pdf.setFillColor(248, 215, 218);
    pdf.rect(15, yPos - 5, pageWidth - 30, 20, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(114, 28, 36);
    pdf.text('Rejection Reason:', 20, yPos + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const splitReason = pdf.splitTextToSize(doc.rejectionReason, pageWidth - 40);
    pdf.text(splitReason, 20, yPos + 10);
    pdf.setTextColor(0, 0, 0);
    yPos += 30;
  }

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

interface DocumentCollectionPanelProps {
  employee: Employee;
  onDocumentUpdate?: () => void;
}

const MANDATORY_DOCUMENTS: { type: EmployeeDocumentType; label: string; description: string; blocksOnboarding: boolean }[] = [
  { type: 'Government-issued ID', label: 'Government-issued ID', description: 'Driver\'s License, State ID, or Passport', blocksOnboarding: true },
  { type: 'Address Proof', label: 'Address Proof', description: 'Utility Bill, Lease Agreement, or Bank Statement', blocksOnboarding: true },
  { type: 'Work Authorization', label: 'Work Authorization', description: 'EAD, Visa, Green Card, or I-94', blocksOnboarding: true },
  { type: 'Direct Deposit Form', label: 'Bank Account / Direct Deposit', description: 'Direct deposit authorization form', blocksOnboarding: true },
  { type: 'Emergency Contact', label: 'Emergency Contact', description: 'Emergency contact information form', blocksOnboarding: true },
  { type: 'I-9', label: 'I-9 Form', description: 'Employment Eligibility Verification', blocksOnboarding: true },
  { type: 'W-4', label: 'W-4 Form', description: 'Employee\'s Withholding Certificate', blocksOnboarding: true },
];

const OPTIONAL_DOCUMENTS: { type: EmployeeDocumentType; label: string; description: string }[] = [
  { type: 'Professional Certification', label: 'Professional Certifications', description: 'Industry certifications (if applicable)' },
  { type: 'Social Security Card', label: 'Social Security Card', description: 'Copy of SSN card' },
  { type: 'Resume', label: 'Resume/CV', description: 'Current resume' },
  { type: 'Background Check', label: 'Background Check', description: 'Background check authorization/results' },
];

export function DocumentCollectionPanel({ employee, onDocumentUpdate }: DocumentCollectionPanelProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    documentType: 'Government-issued ID' as EmployeeDocumentType,
    documentName: '',
    expiryDate: '',
    notes: '',
  });

  const [requestForm, setRequestForm] = useState({
    documentType: 'Government-issued ID' as EmployeeDocumentType,
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: '',
    mandatory: true,
  });

  useEffect(() => {
    fetchData();
  }, [employee.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents for employee:', employee.id);
      const [docsRes, requestsRes, workAuthDocsRes] = await Promise.all([
        fetch(`${API_URL}/documents?employeeId=${employee.id}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/document-requests?employeeId=${employee.id}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/employee-documents/${employee.id}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      let allDocuments: EmployeeDocument[] = [];

      if (docsRes.ok) {
        const data = await docsRes.json();
        console.log('Documents received from API:', data.documents);
        allDocuments = data.documents || [];
      } else {
        console.error('Failed to fetch documents:', docsRes.status, await docsRes.text());
      }

      // Fetch work authorization documents and convert to EmployeeDocument format
      if (workAuthDocsRes.ok) {
        const data = await workAuthDocsRes.json();
        console.log('[HR View] Work authorization documents received:', data.documents);
        
        const workAuthDocs = (data.documents || []).map((doc: any) => ({
          id: doc.id,
          employeeId: employee.id,
          documentType: 'Work Authorization' as EmployeeDocumentType,
          documentName: doc.fileName || 'Work Authorization Document',
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          uploadDate: doc.uploadedAt,
          verificationStatus: 'pending' as const,
          status: 'active' as const,
          isWorkAuthDocument: true, // Flag to identify work auth docs
          workAuthDocId: doc.id // Store original ID for download
        }));
        
        allDocuments = [...allDocuments, ...workAuthDocs];
      }

      setDocuments(allDocuments);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        console.log('Document requests received from API:', data.requests);
        setDocumentRequests(data.requests || []);
      } else {
        console.error('Failed to fetch document requests:', requestsRes.status, await requestsRes.text());
      }
    } catch (error) {
      console.error('Error fetching document data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: EmployeeDocument) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
    setLoadingPreview(true);
    setDocumentPreviewUrl(null);
    
    // Try to load the actual file for preview
    try {
      // Check if this is a work authorization document
      const isWorkAuth = (doc as any).isWorkAuthDocument;
      const endpoint = isWorkAuth 
        ? `${API_URL}/employee-documents/${employee.id}/${(doc as any).workAuthDocId}`
        : `${API_URL}/documents/${doc.id}/download-file`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        if (isWorkAuth) {
          // For work auth docs, we get the actual file
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setDocumentPreviewUrl(url);
          console.log('[HR View] Loaded work auth preview');
        } else {
          const { url: signedUrl } = await response.json();
          console.log('Loaded preview URL:', signedUrl);
          setDocumentPreviewUrl(signedUrl);
        }
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
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
    if (!uploadFile || !uploadForm.documentName) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('employeeId', employee.id);
      formData.append('documentType', uploadForm.documentType);
      formData.append('documentName', uploadForm.documentName);
      if (uploadForm.expiryDate) {
        formData.append('expiryDate', uploadForm.expiryDate);
      }
      formData.append('notes', uploadForm.notes);

      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadForm({
        documentType: 'Government-issued ID',
        documentName: '',
        expiryDate: '',
        notes: '',
      });
      fetchData();
      onDocumentUpdate?.();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleRequestDocument = async () => {
    if (!requestForm.dueDate) {
      toast.error('Please set a due date');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/document-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeEmail: employee.email,
          documentType: requestForm.documentType,
          dueDate: requestForm.dueDate,
          priority: requestForm.priority,
          notes: requestForm.notes,
          mandatory: requestForm.mandatory,
          blocksOnboarding: requestForm.mandatory,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Document request sent');
      setShowRequestDialog(false);
      setRequestForm({
        documentType: 'Government-issued ID',
        dueDate: '',
        priority: 'medium',
        notes: '',
        mandatory: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error requesting document:', error);
      toast.error('Failed to send document request');
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      console.log(`Attempting to ${status} document ${docId}`);
      
      const response = await fetch(`${API_URL}/documents/${docId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
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
      fetchData();
      onDocumentUpdate?.();
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

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted');
      fetchData();
      onDocumentUpdate?.();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentStatus = (docType: EmployeeDocumentType): { uploaded: boolean; verified: boolean; doc?: EmployeeDocument } => {
    const doc = documents.find(d => d.documentType === docType && d.status === 'active');
    return {
      uploaded: !!doc,
      verified: doc?.verificationStatus === 'verified',
      doc,
    };
  };

  const calculateCompletionRate = () => {
    const total = MANDATORY_DOCUMENTS.length;
    const completed = MANDATORY_DOCUMENTS.filter(d => {
      const status = getDocumentStatus(d.type);
      return status.uploaded && status.verified;
    }).length;
    return Math.round((completed / total) * 100);
  };

  const getMissingMandatoryDocuments = () => {
    return MANDATORY_DOCUMENTS.filter(d => {
      const status = getDocumentStatus(d.type);
      return !status.uploaded || !status.verified;
    });
  };

  const getPendingRequests = () => {
    return documentRequests.filter(r => r.status === 'pending' || r.status === 'overdue');
  };

  const completionRate = calculateCompletionRate();
  const missingDocs = getMissingMandatoryDocuments();
  const pendingRequests = getPendingRequests();

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {documents.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Debug: Documents Loaded</AlertTitle>
          <AlertDescription className="text-blue-700">
            Found {documents.length} document(s) for employee ID: {employee.id}
            {documents.length > 0 && (
              <div className="mt-2 text-xs">
                <div>Document types: {documents.map(d => d.documentType).join(', ')}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Pending Document Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Document Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-orange-500" />
                      <span>{request.documentType}</span>
                      <Badge variant={request.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                      {request.priority === 'high' || request.priority === 'critical' ? (
                        <Badge variant="destructive" className="text-xs">
                          {request.priority}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {format(new Date(request.dueDate), 'MMM dd, yyyy')}
                      {request.remindersSent > 0 && (
                        <span className="ml-2 text-xs">• {request.remindersSent} reminder{request.remindersSent > 1 ? 's' : ''} sent</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mandatory Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Mandatory Documents</CardTitle>
          <CardDescription>Required for onboarding completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MANDATORY_DOCUMENTS.map(docType => {
              const status = getDocumentStatus(docType.type);
              return (
                <div key={docType.type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {status.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : status.uploaded ? (
                        <Clock className="h-5 w-5 text-orange-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{docType.label}</span>
                          <Badge variant={status.verified ? 'default' : status.uploaded ? 'secondary' : 'destructive'} className="text-xs">
                            {status.verified ? 'Verified' : status.uploaded ? 'Pending Review' : 'Missing'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{docType.description}</p>
                      </div>
                    </div>
                  </div>
                  {status.doc && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(status.doc!)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {status.doc.verificationStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const docId = (status.doc as any).workAuthDocId || status.doc!.id;
                              handleVerifyDocument(docId, 'verified');
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const docId = (status.doc as any).workAuthDocId || status.doc!.id;
                              handleOpenRejectDialog(docId);
                            }}
                            title="Reject document"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optional Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Optional Documents</CardTitle>
          <CardDescription>Additional documents (not required for onboarding)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {OPTIONAL_DOCUMENTS.map(docType => {
              const status = getDocumentStatus(docType.type);
              return (
                <div key={docType.type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {status.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : status.uploaded ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{docType.label}</span>
                          {status.uploaded && (
                            <Badge variant={status.verified ? 'default' : 'secondary'} className="text-xs">
                              {status.verified ? 'Verified' : 'Pending Review'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{docType.description}</p>
                      </div>
                    </div>
                  </div>
                  {status.doc && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(status.doc!)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {status.doc.verificationStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const docId = (status.doc as any).workAuthDocId || status.doc!.id;
                              handleVerifyDocument(docId, 'verified');
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const docId = (status.doc as any).workAuthDocId || status.doc!.id;
                              handleOpenRejectDialog(docId);
                            }}
                            title="Reject document"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Uploaded Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.documentType}</TableCell>
                    <TableCell>{doc.documentName}</TableCell>
                    <TableCell>{format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        doc.verificationStatus === 'verified' ? 'default' :
                        doc.verificationStatus === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {doc.verificationStatus || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.verificationStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const docId = (doc as any).workAuthDocId || doc.id;
                                handleVerifyDocument(docId, 'verified');
                              }}
                              title="Verify document"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const docId = (doc as any).workAuthDocId || doc.id;
                                handleOpenRejectDialog(docId);
                              }}
                              title="Reject document"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {doc.verificationStatus === 'verified' && (
                          <span className="text-xs text-green-600 self-center">✓ Verified</span>
                        )}
                        {doc.verificationStatus === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Delete rejected document"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription id="upload-doc-collection-dialog-description">
              Upload a document for {employee.firstName} {employee.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type *</Label>
              <Select
                value={uploadForm.documentType}
                onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value as EmployeeDocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Government-issued ID">Government-issued ID</SelectItem>
                  <SelectItem value="Drivers License">Driver's License</SelectItem>
                  <SelectItem value="State ID">State ID</SelectItem>
                  <SelectItem value="Passport Copy">Passport Copy</SelectItem>
                  <SelectItem value="Address Proof">Address Proof</SelectItem>
                  <SelectItem value="Utility Bill">Utility Bill</SelectItem>
                  <SelectItem value="Lease Agreement">Lease Agreement</SelectItem>
                  <SelectItem value="Work Authorization">Work Authorization</SelectItem>
                  <SelectItem value="EAD Card">EAD Card</SelectItem>
                  <SelectItem value="Visa Documentation">Visa Documentation</SelectItem>
                  <SelectItem value="Green Card Copy">Green Card Copy</SelectItem>
                  <SelectItem value="I-94 Copy">I-94 Copy</SelectItem>
                  <SelectItem value="Direct Deposit Form">Direct Deposit Form</SelectItem>
                  <SelectItem value="Emergency Contact">Emergency Contact</SelectItem>
                  <SelectItem value="I-9">I-9</SelectItem>
                  <SelectItem value="W-4">W-4</SelectItem>
                  <SelectItem value="Social Security Card">Social Security Card</SelectItem>
                  <SelectItem value="Professional Certification">Professional Certification</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Name *</Label>
              <Input
                value={uploadForm.documentName}
                onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                placeholder="e.g., Driver's License - John Doe"
              />
            </div>
            <div>
              <Label>Select File * (Max 10MB)</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {uploadFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div>
              <Label>Expiry Date (if applicable)</Label>
              <Input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="Additional notes about this document"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Document</DialogTitle>
            <DialogDescription id="request-document-dialog-description">
              Send a document request to {employee.firstName} {employee.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type *</Label>
              <Select
                value={requestForm.documentType}
                onValueChange={(value) => setRequestForm({ ...requestForm, documentType: value as EmployeeDocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANDATORY_DOCUMENTS.map(doc => (
                    <SelectItem key={doc.type} value={doc.type}>{doc.label}</SelectItem>
                  ))}
                  {OPTIONAL_DOCUMENTS.map(doc => (
                    <SelectItem key={doc.type} value={doc.type}>{doc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={requestForm.dueDate}
                onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={requestForm.priority}
                onValueChange={(value) => setRequestForm({ ...requestForm, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                placeholder="Instructions or additional information for the employee"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestDocument}>
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription id="view-doc-collection-dialog-description">
              View detailed information and preview document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
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
                      <p className="text-sm text-gray-500 mb-4">
                        File Type: {selectedDocument.fileName?.split('.').pop()?.toUpperCase() || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
                        File Size: {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                      </p>
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
                            // Check if this is a work authorization document
                            const isWorkAuth = (selectedDocument as any).isWorkAuthDocument;
                            
                            if (isWorkAuth) {
                              // Download work authorization document
                              const downloadResponse = await fetch(`${API_URL}/employee-documents/${employee.id}/${(selectedDocument as any).workAuthDocId}`, {
                                headers: {
                                  'Authorization': `Bearer ${publicAnonKey}`
                                }
                              });
                              
                              if (downloadResponse.ok) {
                                const blob = await downloadResponse.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = selectedDocument.fileName || 'work-authorization-document';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                
                                toast.success(`Downloaded ${selectedDocument.documentName}`);
                                return;
                              }
                            } else {
                              // Try to download the actual file first
                              const downloadResponse = await fetch(`${API_URL}/documents/${selectedDocument.id}/download-file`, {
                                headers: {
                                  'Authorization': `Bearer ${publicAnonKey}`
                                }
                              });
                              
                              if (downloadResponse.ok) {
                                const { url: signedUrl, fileName } = await downloadResponse.json();
                                
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
EMPLOYEE: ${employee.firstName} ${employee.lastName}
UPLOAD DATE: ${format(new Date(selectedDocument.uploadDate), 'PPP')}
${selectedDocument.expiryDate ? `EXPIRY DATE: ${format(new Date(selectedDocument.expiryDate), 'PPP')}` : ''}
VERIFICATION STATUS: ${selectedDocument.verificationStatus || 'pending'}
${selectedDocument.verifiedBy ? `VERIFIED BY: ${selectedDocument.verifiedBy}` : ''}

---
This is a PROTOTYPE document placeholder.
In production, the actual uploaded file would be downloaded here.

Document ID: ${selectedDocument.id}
File Name: ${selectedDocument.fileName || 'N/A'}
Uploaded By: ${selectedDocument.uploadedBy}
${selectedDocument.notes ? `Notes: ${selectedDocument.notes}` : ''}
${selectedDocument.rejectionReason ? `Rejection Reason: ${selectedDocument.rejectionReason}` : ''}
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
    .status-verified { color: #28a745; font-weight: bold; }
    .status-rejected { color: #dc3545; font-weight: bold; }
    .status-pending { color: #ffc107; font-weight: bold; }
  </style>
</head>
<body>
  <div class="document">
    <h1>${selectedDocument.documentName}</h1>
    <div class="metadata">
      <div class="info"><span class="label">Document Type:</span> ${selectedDocument.documentType}</div>
      <div class="info"><span class="label">Employee:</span> ${employee.firstName} ${employee.lastName}</div>
      <div class="info"><span class="label">Upload Date:</span> ${format(new Date(selectedDocument.uploadDate), 'PPP')}</div>
      <div class="info"><span class="label">Uploaded By:</span> ${selectedDocument.uploadedBy}</div>
      ${selectedDocument.expiryDate ? `<div class="info"><span class="label">Expiry Date:</span> ${format(new Date(selectedDocument.expiryDate), 'PPP')}</div>` : ''}
      <div class="info">
        <span class="label">Verification Status:</span> 
        <span class="status-${selectedDocument.verificationStatus || 'pending'}">
          ${(selectedDocument.verificationStatus || 'pending').toUpperCase()}
        </span>
      </div>
      ${selectedDocument.verifiedBy ? `<div class="info"><span class="label">Verified By:</span> ${selectedDocument.verifiedBy}</div>` : ''}
      <div class="info"><span class="label">File Name:</span> ${selectedDocument.fileName || 'N/A'}</div>
      ${selectedDocument.fileSize ? `<div class="info"><span class="label">File Size:</span> ${(selectedDocument.fileSize / 1024).toFixed(2)} KB</div>` : ''}
    </div>
    
    <div class="alert">
      <strong>⚠️ Prototype Mode:</strong> This is a placeholder document view. In production, the actual uploaded file (PDF, image, or other format) would be displayed here with full content.
    </div>
    
    ${selectedDocument.rejectionReason ? `
    <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <strong style="color: #721c24;">Rejection Reason:</strong><br/>
      <div style="margin-top: 5px; color: #721c24;">
        ${selectedDocument.rejectionReason}
      </div>
    </div>
    ` : ''}
    
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
                            
                            // Clean up after a delay
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
                  <Label>Document Type</Label>
                  <p className="mt-1">{selectedDocument.documentType}</p>
                </div>
                <div>
                  <Label>Document Name</Label>
                  <p className="mt-1">{selectedDocument.documentName}</p>
                </div>
                <div>
                  <Label>Upload Date</Label>
                  <p className="mt-1">{format(new Date(selectedDocument.uploadDate), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Uploaded By</Label>
                  <p className="mt-1">{selectedDocument.uploadedBy}</p>
                </div>
                {selectedDocument.expiryDate && (
                  <div>
                    <Label>Expiry Date</Label>
                    <p className="mt-1">{format(new Date(selectedDocument.expiryDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                <div>
                  <Label>Verification Status</Label>
                  <div className="mt-1">
                    <Badge variant={
                      selectedDocument.verificationStatus === 'verified' ? 'default' :
                      selectedDocument.verificationStatus === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {selectedDocument.verificationStatus || 'pending'}
                    </Badge>
                  </div>
                </div>
                {selectedDocument.verifiedBy && (
                  <div>
                    <Label>Verified By</Label>
                    <p className="mt-1">{selectedDocument.verifiedBy}</p>
                  </div>
                )}
              </div>

              {selectedDocument.rejectionReason && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Rejection Reason</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {selectedDocument.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedDocument.notes && (
                <div>
                  <Label>Additional Notes</Label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded border">{selectedDocument.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription id="reject-document-dialog-description">
              Please provide a reason for rejecting this document. The employee will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Document is expired, Image is not clear, Wrong document type uploaded, etc."
                rows={4}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific so the employee knows what to correct when re-uploading.
              </p>
            </div>
          </div>
          <DialogFooter>
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
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
