import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { 
  Upload, FileText, CheckCircle2, Clock, AlertCircle, XCircle, 
  FileCheck, FileWarning, Download, Eye, Calendar, Edit2, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { Employee, EmployeeDocument, DocumentRequest, EmployeeDocumentType } from '../types';
import jsPDF from 'jspdf';
import { useAuth } from '../lib/auth-context';

const API_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || API_ENDPOINTS.EMPL_ONBORDING;

// Helper function to generate PDF document
const generatePDFDocument = (doc: EmployeeDocument) => {
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
    `Upload Date: ${format(new Date(doc.uploadDate), 'PPP')}`,
    doc.expiryDate ? `Expiry Date: ${format(new Date(doc.expiryDate), 'PPP')}` : '',
    `Verification Status: ${doc.verificationStatus === 'verified' ? 'VERIFIED' : doc.verificationStatus === 'rejected' ? 'REJECTED' : 'UNDER REVIEW'}`,
    doc.verifiedBy && doc.verifiedDate ? `Verified By: ${doc.verifiedBy} on ${format(new Date(doc.verifiedDate), 'PPP')}` : '',
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
  pdf.text('⚠ PREVIEW MODE', 20, yPos + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const noticeText = 'This is a placeholder document. In production, your actual uploaded file content would be displayed here.';
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

interface EmployeeDocumentUploadProps {
  employee: Employee;
  user?: any;
}

export function EmployeeDocumentUpload({ employee }: EmployeeDocumentUploadProps) {
  const { user, userPermissions: permissions } = useAuth();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [uploadForm, setUploadForm] = useState({
    documentType: 'Government-issued ID' as EmployeeDocumentType,
    documentName: '',
    expiryDate: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    documentName: '',
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [employee.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[Employee View] Fetching documents for employee:', employee.id);
      const token = getAccessToken();
      
      // Perform fetches in parallel: 
      // 1. Regular onboarding documents
      // 2. Immigration/Specific document requests
      const [docsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/employee/${employee.id}/documents`, {
          headers: { 'Authorization': `Bearer ${token ?? ''}` }
        }),
        fetch(`${API_URL}/employee/${employee.id}/document-requests`, {
          headers: { 'Authorization': `Bearer ${token ?? ''}` }
        })
      ]);

      let allDocuments: EmployeeDocument[] = [];

      if (docsRes.ok) {
        const data = await docsRes.json();
        console.log('[Employee View] Raw documents received:', data.documents);
        
        // Map backend snake_case to frontend camelCase and set expected statuses
        const mappedDocs = (data.documents || []).map((doc: any) => ({
          id: doc.document_id || doc.id,
          onboardingId: doc.onboarding_id,
          documentType: doc.doc_type || doc.documentType || 'Other',
          documentName: doc.document_name || doc.file_name || doc.documentName || 'Untitled Document',
          fileName: doc.file_name || doc.fileName,
          storageUrl: doc.storage_url || doc.storageUrl,
          uploadDate: doc.created_at || doc.uploadDate || new Date().toISOString(),
          expiryDate: doc.expiry_date || doc.expiryDate,
          verificationStatus: doc.status === 'approved' ? 'verified' : (doc.status?.toLowerCase() === 'pending-review' || doc.status?.toLowerCase() === 'pending' ? 'pending' : (doc.status || 'pending')),
          status: 'active', // Ensure it passes the filter
          notes: doc.notes,
          rejectionReason: doc.status === 'rejected' ? doc.notes : undefined,
          uploadedBy: doc.uploaded_by || doc.uploadedBy,
          isWorkAuthDocument: doc.doc_type === 'ead' || doc.doc_type === 'work_authorization'
        }));
        
        allDocuments = mappedDocs;
      }

      setDocuments(allDocuments);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        const rawRequests = data.documentRequests || data.requests || [];
        console.log('[Employee View] Raw document requests received:', rawRequests);
        
      // Map backend snake_case to frontend camelCase
        const requests = rawRequests.map((req: any) => {
          // Log keys to debug mapping
          if (rawRequests.indexOf(req) === 0) console.log('First request keys:', Object.keys(req));
          
          return {
            id: req.id,
            employeeId: req.employee_id || req.employeeId,
            documentType: req.document_type || req.documentType || req.doc_type || 'General Document',
            description: req.description,
            status: req.status,
            dueDate: req.due_date || req.dueDate,
            requestedBy: req.requested_by || req.requestedBy,
            requestedByName: req.requested_by_name || req.requestedByName,
            requestedAt: req.created_at || req.requestedAt,
            notes: req.notes,
            mandatory: true // Default to true if not specified
          };
        });
        
        console.log('[Employee View] Mapped document requests:', requests);
        setDocumentRequests(requests);
      }
    } catch (error) {
      console.error('[Employee View] Error fetching document data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
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
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    if (!uploadForm.documentName) {
      toast.error('Please enter a document name');
      return;
    }
    
    // Guard against undefined document type
    const safeDocType = uploadForm.documentType || 'Other';
    console.log('DEBUG CHECK - uploadForm.documentType:', uploadForm.documentType, 'safeDocType:', safeDocType);

    try {
      const uploadData = {
        employeeId: employee.id,
        documentType: safeDocType,
        documentName: uploadForm.documentName,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        expiryDate: uploadForm.expiryDate,
        notes: uploadForm.notes,
        uploadedBy: `${employee.firstName} ${employee.lastName}`,
      };
      
      console.log('[Employee View] Uploading document metadata:', uploadData);
      
      const token = getAccessToken();
      
      // Pass metadata as query params and file in form data
      const typeParam = encodeURIComponent(safeDocType.toLowerCase().replace(/\s+/g, '_'));
      const nameParam = encodeURIComponent(uploadForm.documentName);
      const requestIdParam = selectedRequest?.id ? `&request_id=${selectedRequest.id}` : '';
      
      const fileFormData = new FormData();
      fileFormData.append('file', uploadFile);
      
      console.log('[Employee View] Uploading document to:', `${API_URL}/onboarding/requests/${employee.id}/documents/upload?doc_type=${typeParam}&document_name=${nameParam}${requestIdParam}`);
      
      const fileUploadResponse = await fetch(`${API_URL}/employee/${employee.id}/documents?doc_type=${typeParam}&document_name=${nameParam}${requestIdParam}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token ?? ''}`,
        },
        body: fileFormData,
      });

      if (!fileUploadResponse.ok) {
        const error = await fileUploadResponse.text();
        console.error('[Employee View] Upload failed:', error);
        toast.error('Upload failed: ' + error);
      } else {
        const fileResult = await fileUploadResponse.json();
        console.log('[Employee View] Upload successful:', fileResult);
        toast.success(`Document "${uploadForm.documentName}" uploaded successfully!`);
        setShowUploadDialog(false);
        setUploadFile(null);
        setUploadForm({
          documentType: 'Government-issued ID',
          documentName: '',
          expiryDate: '',
          notes: '',
        });
        setSelectedRequest(null);
        fetchData();
      }


      setShowUploadDialog(false);
      setUploadFile(null);
      setSelectedRequest(null);
      setUploadForm({
        documentType: 'Government-issued ID',
        documentName: '',
        expiryDate: '',
        notes: '',
      });
      
      // Refresh the documents list and notify parent component
      await fetchData();
      window.dispatchEvent(new CustomEvent('refreshEmployeeData'));
    } catch (error) {
      console.error('[Employee View] Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  // Helper to normalize backend document types to frontend display types
  const normalizeDocType = (type: string): EmployeeDocumentType => {
      const t = (type || 'other').toLowerCase().trim().replace(/_/g, '-');
      
      if (t === 'ead' || t === 'work-authorization') return 'Work Authorization';
      if (t === 'government-id' || t === 'government-issued-id' || t === 'driver-license' || t === 'passport') return 'Government-issued ID';
      if (t === 'proof-of-address' || t === 'address-proof') return 'Address Proof';
      if (t === 'direct-deposit' || t === 'bank-account') return 'Direct Deposit Form';
      if (t === 'emergency-contact') return 'Emergency Contact';
      if (t === 'i9' || t === 'i-9') return 'I-9';
      if (t === 'w4' || t === 'w-4') return 'W-4';
      if (t === 'social-security-card') return 'Social Security Card';
      if (t === 'professional-certification') return 'Professional Certification';
      if (t === 'resume' || t === 'cv') return 'Resume';
      if (t === 'bank-statement') return 'Bank Statement';
      
      return (type || 'Other') as EmployeeDocumentType;
  };

  const handleUploadForRequest = (request: DocumentRequest) => {
    console.log('[Employee View] handleUploadForRequest:', request);
    setSelectedRequest(request);
    const safeType = normalizeDocType(request.documentType);
    setUploadForm({
      documentType: safeType,
      documentName: '',
      expiryDate: '',
      notes: request.documentType ? `Uploaded in response to request: ${request.documentType}` : 'Uploaded document',
    });
    setShowUploadDialog(true);
  };

  const handleEditDocument = (doc: EmployeeDocument) => {
    setSelectedDocument(doc);
    setEditForm({
      documentName: doc.documentName,
      expiryDate: doc.expiryDate || '',
      notes: doc.notes || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument || !editForm.documentName) {
      toast.error('Please provide a document name');
      return;
    }

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/onboarding/requests/${employee.id}/documents/${selectedDocument.id}/metadata`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName: editForm.documentName,
          expiryDate: editForm.expiryDate,
          notes: editForm.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Document updated successfully');
      setShowEditDialog(false);
      setSelectedDocument(null);
      setEditForm({
        documentName: '',
        expiryDate: '',
        notes: '',
      });
      
      // Refresh the documents list and notify parent component
      await fetchData();
      window.dispatchEvent(new CustomEvent('refreshEmployeeData'));
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  const handleDeleteDocument = async (doc: EmployeeDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.documentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/onboarding/requests/${employee.id}/documents/${doc.id}`, {
        method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token ?? ''}` },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Document deleted successfully');
      
      // Refresh the documents list and notify parent component
      await fetchData();
      window.dispatchEvent(new CustomEvent('refreshEmployeeData'));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      console.log(`[HR Action] Attempting to ${status} document ${docId}`);
      
      const token = getAccessToken();
      const backendStatus = status === 'verified' ? 'approved' : 'rejected';
      
      const response = await fetch(`${API_URL}/onboarding/requests/${employee.id}/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: backendStatus,
          notes: reason || "",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verification failed:', response.status, errorText);
        toast.error(`Verification failed: ${errorText}`);
        return;
      }

      toast.success(status === 'verified' ? 'Document approved successfully' : 'Document rejected');
      fetchData();
      window.dispatchEvent(new CustomEvent('refreshEmployeeData'));
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document');
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

  const calculateCompletionRate = () => {
    // Count required onboarding documents that haven't been uploaded
    const pendingOnboardingDocs = employee?.onboardingDocuments?.filter(
      (doc: any) => doc && doc.status === 'not-uploaded' && doc.required && 
      doc.type !== 'EAD' && doc.type !== 'offer-letter' && doc.type !== 'nda'
    ) || [];
    
    // Count mandatory document requests
    const mandatoryRequests = documentRequests.filter(r => r.mandatory);
    
    // If there are pending onboarding documents, completion is not 100%
    if (pendingOnboardingDocs.length > 0) {
      const totalRequired = pendingOnboardingDocs.length + mandatoryRequests.length;
      const completed = mandatoryRequests.filter(
        r => r.status === 'verified' || r.status === 'uploaded'
      ).length;
      return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;
    }
    
    // If no pending onboarding docs, check mandatory requests
    if (mandatoryRequests.length === 0) return 100;

    const completed = mandatoryRequests.filter(
      r => r.status === 'verified' || r.status === 'uploaded'
    ).length;

    return Math.round((completed / mandatoryRequests.length) * 100);
  };

  const getPendingRequests = () => {
    // Filter by status first
    const pendingByStatus = documentRequests.filter(r => 
      r.status === 'pending' || r.status === 'overdue' || r.status === 'requested' || r.status === 'requested_review'
    );

    // Further filter out requests if we already have a document of that type uploaded
    return pendingByStatus.filter(request => {
      const isAlreadyUploaded = documents.some(doc => {
        // If the document is rejected, treat it as not uploaded so the request remains pending
        if (doc.verificationStatus === 'rejected') return false;

        // Robust fuzzy matching: remove all special chars and compare lowercase
        const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, '');
        const docType = normalize(doc.documentType || "");
        const reqType = normalize(request.documentType || "");
        return docType === reqType && docType.length > 0;
      });
      return !isAlreadyUploaded;
    });
  };

  const getUploadedDocuments = () => {
    // Filter active documents first
    // Create a copy to sort without mutating original state
    const sortedDocs = [...documents]
      .filter(d => d.status === 'active')
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    const seenValidTypes = new Set<string>();
    const filteredDocs: EmployeeDocument[] = [];

    for (const doc of sortedDocs) {
      // Normalize type name for comparison
      const docType = (doc.documentType || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      
      // If it's verified or pending, it counts as a more recent valid version
      const isStatusValid = doc.verificationStatus === 'verified' || doc.verificationStatus === 'pending' || doc.verificationStatus === 'pending-review';
      
      if (isStatusValid) {
        seenValidTypes.add(docType);
        filteredDocs.push(doc);
      } 
      else if (doc.verificationStatus === 'rejected') {
        // Only show rejected if we haven't seen a newer valid version of this type
        if (!seenValidTypes.has(docType)) {
             filteredDocs.push(doc);
        }
      }
      else {
        // Fallback for other statuses
        filteredDocs.push(doc);
      }
    }
    
    return filteredDocs;
  };

  const completionRate = calculateCompletionRate();
  const pendingRequests = getPendingRequests();
  const uploadedDocuments = getUploadedDocuments();

  if (renderError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Documents</AlertTitle>
        <AlertDescription>
          {renderError.message}
          <Button 
            onClick={() => {
              setRenderError(null);
              fetchData();
            }}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  console.log('[Employee Document Upload] Rendering with employee:', employee);
  console.log('[Employee Document Upload] Onboarding documents:', employee.onboardingDocuments);

  return (
    <div className="space-y-6">
      {/* Onboarding Document Requests from HR */}
      {(() => {
        try {
          if (!employee || !Array.isArray(employee.onboardingDocuments)) {
            console.log('[Employee Document Upload] No onboarding documents array found');
            return null;
          }
          
          const onboardingDocs = employee.onboardingDocuments.filter(
            (doc: any) => doc && doc.status === 'not-uploaded' && doc.type !== 'EAD' && 
            doc.type !== 'offer-letter' && doc.type !== 'nda'
          );
          
          console.log('[Employee Document Upload] Filtered onboarding docs to show:', onboardingDocs);
          
          if (onboardingDocs.length === 0) return null;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-orange-500" />
                Documents Requested by HR
              </CardTitle>
              <CardDescription>
                Please upload the following documents to continue your onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onboardingDocs.map((doc: any) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">
                            {doc.type === 'government-id' ? 'Government ID' :
                             doc.type === 'proof-of-address' ? 'Proof of Address' :
                             doc.type === 'social-security-card' ? 'Social Security Card' :
                             doc.type === 'direct-deposit' ? 'Direct Deposit Form' :
                             doc.type === 'w4' ? 'W-4 Tax Form' :
                             doc.type === 'i9' ? 'I-9 Form' :
                             doc.type === 'emergency-contact' ? 'Emergency Contact Form' :
                             doc.type === 'background-check-consent' ? 'Background Check Consent' :
                             doc.type === 'certifications' ? 'Professional Certifications' :
                             doc.type === 'education-verification' ? 'Education Verification' :
                             doc.type}
                          </span>
                          {doc.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        {doc.requestedAt && (
                          <p className="text-sm text-gray-600 mb-2">
                            Requested: {format(new Date(doc.requestedAt), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {doc.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={async () => {
                        // Set loading state for this specific document
                        setUploadingDocId(doc.id);
                        
                        try {
                          // Upload using onboarding document endpoint
                          const file = await new Promise<File | null>((resolve) => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.jpg,.jpeg,.png';
                            input.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              resolve(target.files?.[0] || null);
                            };
                            input.click();
                          });
                          
                          if (!file) {
                            setUploadingDocId(null);
                            return;
                          }
                          
                          toast.info(`Uploading ${file.name}...`);
                          
                          const token = getAccessToken();
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          // Use doc_type in query string
                          const docType = (doc.type || 'document').toLowerCase().replace(/\s+/g, '_');
                          const response = await fetch(
                            `${API_URL}/onboarding/requests/${employee.id}/documents/upload?doc_type=${docType}`,
                            {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${getAccessToken() ?? ''}`
                              },
                              body: formData
                            }
                          );

                          if (response.ok) {
                            toast.success('Document uploaded successfully! It will be reviewed by HR.');
                            await fetchData();
                            window.dispatchEvent(new CustomEvent('refreshEmployeeData'));
                          } else {
                            const error = await response.json();
                            toast.error(error.error || 'Failed to upload document');
                          }
                        } catch (error) {
                          console.error('Error uploading document:', error);
                          toast.error('Failed to upload document. Please try again.');
                        } finally {
                          setUploadingDocId(null);
                        }
                      }}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload This Document
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
        } catch (error) {
          console.error('Error rendering onboarding document requests:', error);
          return null;
        }
      })()}

      {/* Pending Document Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-500" />
              Immigration Document Requests
            </CardTitle>
            <CardDescription>
              HR has requested the following documents - please upload as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map(request => {
                const isOverdue = request.dueDate && new Date(request.dueDate) < new Date();
                return (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{request.documentType}</span>
                          {request.mandatory && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                        {request.description && (
                          <p className="text-sm text-gray-700 mb-2">
                            {request.description}
                          </p>
                        )}
                        {request.dueDate && (
                          <p className="text-sm text-gray-600 mb-2">
                            Due: {format(new Date(request.dueDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {request.requestedByName && (
                          <p className="text-xs text-gray-500">
                            Requested by: {request.requestedByName}
                          </p>
                        )}
                        {request.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                            <strong>Note:</strong> {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleUploadForRequest(request)}
                      className="w-full"
                      variant={isOverdue ? 'destructive' : 'default'}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload This Document
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}





      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Your Uploaded Documents ({uploadedDocuments.length})
          </CardTitle>
          <CardDescription>
            You can edit or delete documents that are pending review or rejected. Verified documents cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Upload your documents to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedDocuments.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {doc.verificationStatus === 'verified' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : doc.verificationStatus === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-medium">
                          {['ead', 'work_authorization', 'ead_card'].includes((doc.documentType || '').toLowerCase()) 
                            ? 'Work Authorization Document' 
                            : doc.documentType}
                        </span>
                        <Badge variant={
                          doc.verificationStatus === 'verified' ? 'default' :
                          doc.verificationStatus === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {doc.verificationStatus === 'verified' ? 'Verified' :
                           doc.verificationStatus === 'rejected' ? 'Rejected' :
                           'Under Review'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{doc.documentName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Uploaded: {format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</span>
                        {doc.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                      {doc.verificationStatus === 'rejected' && doc.rejectionReason && (
                        <Alert className="mt-2 border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertTitle className="text-red-800 text-sm">Rejection Reason</AlertTitle>
                          <AlertDescription className="text-red-700 text-sm">
                            {doc.rejectionReason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          console.log('=== DOCUMENT CLICKED ===');
                          console.log('Document ID:', doc.id);
                          console.log('Document Name:', doc.documentName);
                          console.log('Document Type:', doc.documentType);
                          console.log('File Name:', doc.fileName);
                          console.log('Upload Date:', doc.uploadDate);
                          console.log('Full document object:', doc);
                          console.log('========================');
                          setSelectedDocument(doc);
                          setShowViewDialog(true);
                          setLoadingPreview(true);
                          setDocumentPreviewUrl(null);
                          
                          // Try to load the actual file for preview
                          try {
                            const response = await fetch(
                              `${API_URL}/onboarding/requests/${employee.id}/documents/${doc.id}/download?preview=true`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${getAccessToken() ?? ''}`
                                }
                              }
                            );
                            
                            if (response.ok) {
                              const { presigned_url } = await response.json();
                              console.log('[Employee View] Loaded preview URL:', presigned_url);
                              setDocumentPreviewUrl(presigned_url);
                            } else {
                              console.log('[Employee View] No file available for preview');
                              setDocumentPreviewUrl(null);
                            }
                          } catch (error) {
                            console.error('[Employee View] Error loading preview:', error);
                            setDocumentPreviewUrl(null);
                          } finally {
                            setLoadingPreview(false);
                          }
                        }}
                        title="View document details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {permissions?.canAccessEmployeeManagement && (doc.verificationStatus === 'pending' || doc.verificationStatus === 'pending-review') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyDocument(doc.id, 'verified')}
                            title="Approve document"
                            className="bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRejectDialog(doc.id)}
                            title="Reject document"
                            className="bg-red-50 hover:bg-red-100 border-red-200"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}

                      {!(doc as any).isWorkAuthDocument && (doc.verificationStatus === 'pending' || doc.verificationStatus === 'rejected') && (user?.role !== 'hr') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDocument(doc)}
                            title="Edit document details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDocument(doc)}
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {doc.verificationStatus === 'verified' && (
                        <span className="text-xs text-gray-500 self-center ml-2">
                          ✓ Verified (cannot edit)
                        </span>
                      )}
                    </div>
                  </div>
                  {doc.verificationStatus === 'rejected' && (
                    <Button
                      onClick={() => handleUploadForRequest({
                        id: '',
                        employeeId: employee.id,
                        employeeName: '',
                        employeeEmail: '',
                        documentType: doc.documentType,
                        requestedBy: '',
                        requestedDate: '',
                        dueDate: '',
                        status: 'pending',
                        priority: 'high',
                        remindersSent: 0,
                        notes: `Re-uploading after rejection: ${doc.rejectionReason}`,
                        mandatory: true,
                        blocksOnboarding: true,
                      } as DocumentRequest)}
                      className="w-full mt-3"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Re-upload Document
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription id="upload-employee-doc-dialog-description">
              {selectedRequest 
                ? `Upload your ${selectedRequest.documentType}` 
                : 'Upload a document for your onboarding'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type *</Label>
              <Select
                value={uploadForm.documentType}
                onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value as EmployeeDocumentType })}
                disabled={!!selectedRequest}
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
                  <SelectItem value="Bank Statement">Bank Statement</SelectItem>
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
                  <SelectItem value="Resume">Resume</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Name *</Label>
              <Input
                value={uploadForm.documentName}
                onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                placeholder="e.g., Driver's License - Front"
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
              <Label>Notes (optional)</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="Any additional information about this document"
                rows={3}
              />
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Your document will be reviewed by HR. You'll be notified once it's verified.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription id="view-employee-doc-dialog-description">
              View detailed information and preview your document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              {/* Debug Info - Current Document */}

              
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
                        const isText = fileExt === 'txt';
                        
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
                                <strong>✓ Real Document:</strong> Showing your uploaded image file
                              </div>
                            </div>
                          );
                        } else if (isPdf || isText) {
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
                              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <p className="font-medium text-gray-700 mb-2">{selectedDocument.documentName}</p>
                              <p className="text-sm text-gray-500 mb-4">
                                File Type: {fileExt?.toUpperCase() || 'Unknown'}
                              </p>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                <strong>Preview not available for this file type.</strong> Click Download to view the file.
                              </div>
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
                      <Alert className="border-orange-200 bg-orange-50 mt-4">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700 text-sm">
                          <strong>No preview available:</strong> This document was uploaded but the file is not accessible for preview. 
                          Click "Download" to access your file.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {/* Download Button - Always shown */}
                  <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={async () => {
                          console.log('=== DOWNLOAD CLICKED ===');
                          console.log('Selected Document at download time:');
                          console.log('Document ID:', selectedDocument.id);
                          console.log('Document Name:', selectedDocument.documentName);
                          console.log('Document Type:', selectedDocument.documentType);
                          console.log('File Name:', selectedDocument.fileName);
                          console.log('Upload Date:', selectedDocument.uploadDate);
                          console.log('Full object:', selectedDocument);
                          console.log('File Path:', (selectedDocument as any).filePath);
                          console.log('========================');
                          
                          try {
                            const token = getAccessToken();
                            const fileName = selectedDocument.fileName || selectedDocument.documentName || 'document';
                            const downloadResponse = await fetch(
                              `${API_URL}/onboarding/requests/${employee.id}/documents/${selectedDocument.id}/download?filename=${encodeURIComponent(fileName)}`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${token ?? ''}`
                                }
                              }
                            );
                            
                            if (downloadResponse.ok) {
                              const { presigned_url, file_name } = await downloadResponse.json();
                              console.log('Downloading file from presigned URL:', presigned_url);
                              
                              // Download directly using presigned URL
                              const a = document.createElement('a');
                              a.href = presigned_url;
                              document.body.appendChild(a); 
                              a.click();
                              document.body.removeChild(a);
                              
                              toast.success(`Download started for ${selectedDocument.documentName}`);
                              return;
                            }
                          } catch (error) {
                            console.error('Error downloading actual file:', error);
                            console.log('Falling back to placeholder PDF generation');
                          }
                          
                          // Fallback: Generate placeholder PDF
                          const fileExt = getFileExtension(selectedDocument.fileName);
                          
                          // Generate PDF for PDF files and most document types
                          if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                            const pdf = generatePDFDocument(selectedDocument);
                            const fileName = selectedDocument.fileName || `${selectedDocument.documentName}.pdf`;
                            pdf.save(fileName.replace(/\.(doc|docx)$/, '.pdf'));
                            toast.success(`Downloaded ${selectedDocument.documentName} as placeholder PDF`);
                          } else {
                            // For other file types, create a text file
                            const content = `
DOCUMENT: ${selectedDocument.documentName}
TYPE: ${selectedDocument.documentType}
UPLOAD DATE: ${format(new Date(selectedDocument.uploadDate), 'PPP')}
${selectedDocument.expiryDate ? `EXPIRY DATE: ${format(new Date(selectedDocument.expiryDate), 'PPP')}` : ''}
VERIFICATION STATUS: ${selectedDocument.verificationStatus || 'pending'}
${selectedDocument.verifiedBy && selectedDocument.verifiedDate ? `VERIFIED BY: ${selectedDocument.verifiedBy} on ${format(new Date(selectedDocument.verifiedDate), 'PPP')}` : ''}

---
This is a PROTOTYPE document placeholder.
In production, the actual uploaded file would be downloaded here.

Document ID: ${selectedDocument.id}
File Name: ${selectedDocument.fileName || 'N/A'}
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
                      
                      {permissions?.canAccessEmployeeManagement && selectedDocument.verificationStatus === 'pending' && (
                        <div className="flex gap-2 ml-auto">
                           <Button
                            onClick={() => handleVerifyDocument(selectedDocument.id, 'verified')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleOpenRejectDialog(selectedDocument.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (documentPreviewUrl) {
                            window.open(documentPreviewUrl, '_blank');
                            toast.info('Document opened in new tab');
                            return;
                          }

                          const fileExt = getFileExtension(selectedDocument.fileName);
                          
                          // For PDF files, generate and open PDF in new tab
                          if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                            const pdf = generatePDFDocument(selectedDocument);
                            const pdfBlob = pdf.output('blob');
                            const url = URL.createObjectURL(pdfBlob);
                            window.open(url, '_blank');
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                            toast.info('Placeholder PDF opened in new tab');
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
      <div class="info"><span class="label">Upload Date:</span> ${format(new Date(selectedDocument.uploadDate), 'PPP')}</div>
      ${selectedDocument.expiryDate ? `<div class="info"><span class="label">Expiry Date:</span> ${format(new Date(selectedDocument.expiryDate), 'PPP')}</div>` : ''}
      <div class="info">
        <span class="label">Verification Status:</span> 
        <span class="status-${selectedDocument.verificationStatus || 'pending'}">
          ${selectedDocument.verificationStatus === 'verified' ? 'VERIFIED' : selectedDocument.verificationStatus === 'rejected' ? 'REJECTED' : 'UNDER REVIEW'}
        </span>
      </div>
      ${selectedDocument.verifiedBy && selectedDocument.verifiedDate ? `<div class="info"><span class="label">Verified By:</span> ${selectedDocument.verifiedBy} on ${format(new Date(selectedDocument.verifiedDate), 'PPP')}</div>` : ''}
      <div class="info"><span class="label">File Name:</span> ${selectedDocument.fileName || 'N/A'}</div>
      ${selectedDocument.fileSize ? `<div class="info"><span class="label">File Size:</span> ${(selectedDocument.fileSize / 1024).toFixed(2)} KB</div>` : ''}
    </div>
    
    <div class="alert">
      <strong>⚠️ Preview Mode:</strong> This is a placeholder document view. In production, your actual uploaded file (PDF, image, or other format) would be displayed here with full content.
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
                      {selectedDocument.verificationStatus === 'verified' ? 'Verified' :
                       selectedDocument.verificationStatus === 'rejected' ? 'Rejected' :
                       'Under Review'}
                    </Badge>
                  </div>
                </div>
                {selectedDocument.verifiedBy && selectedDocument.verifiedDate && (
                  <div>
                    <Label>Verified By</Label>
                    <p className="mt-1">{selectedDocument.verifiedBy} on {format(new Date(selectedDocument.verifiedDate), 'MMM dd, yyyy')}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription id="edit-employee-document-dialog-description">
              Update document details for {selectedDocument?.documentType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Input
                value={selectedDocument?.documentType || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Document type cannot be changed</p>
            </div>
            <div>
              <Label>Document Name *</Label>
              <Input
                value={editForm.documentName}
                onChange={(e) => setEditForm({ ...editForm, documentName: e.target.value })}
                placeholder="e.g., Driver's License - Front"
              />
            </div>
            <div>
              <Label>Expiry Date (if applicable)</Label>
              <Input
                type="date"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Any additional information about this document"
                rows={3}
              />
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You can only edit document details. To change the file, please delete this document and upload a new one.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setSelectedDocument(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDocument}>
              <Edit2 className="h-4 w-4 mr-2" />
              Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="e.g., Document is expired, image is blurry, incorrect document type uploaded..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmitRejection}
              disabled={!rejectionReason.trim()}
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
