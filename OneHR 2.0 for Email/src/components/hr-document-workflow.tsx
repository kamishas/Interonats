import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { 
  FileText, CheckCircle2, XCircle, Eye, Send, Upload, 
  AlertCircle, Clock, FilePlus, Mail, FileSignature
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { Employee } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

interface HRDocumentWorkflowProps {
  employee: Employee;
  onUpdate: () => void;
}

// Available document types that HR can request
const AVAILABLE_DOCUMENT_TYPES = [
  { id: 'government-id', label: 'Government ID (Driver\'s License, Passport, etc.)', required: true },
  { id: 'proof-of-address', label: 'Proof of Address (Utility Bill, Lease, etc.)', required: true },
  { id: 'social-security-card', label: 'Social Security Card', required: false },
  { id: 'direct-deposit', label: 'Direct Deposit Form (Voided Check)', required: true },
  { id: 'w4', label: 'W-4 Tax Form', required: true },
  { id: 'i9', label: 'I-9 Employment Eligibility Verification', required: true },
  { id: 'emergency-contact', label: 'Emergency Contact Form', required: true },
  { id: 'background-check-consent', label: 'Background Check Consent Form', required: false },
  { id: 'certifications', label: 'Professional Certifications/Licenses', required: false },
  { id: 'education-verification', label: 'Education Verification (Diploma/Degree)', required: false },
];

export function HRDocumentWorkflow({ employee, onUpdate }: HRDocumentWorkflowProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showOfferLetterDialog, setShowOfferLetterDialog] = useState(false);
  const [showNDADialog, setShowNDADialog] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [requestNotes, setRequestNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sendOfferLetterWithRequest, setSendOfferLetterWithRequest] = useState(false);
  const [sendNDAWithRequest, setSendNDAWithRequest] = useState(false);
  const [workAuthDocuments, setWorkAuthDocuments] = useState<any[]>([]);

  // Fetch work authorization documents on mount
  useEffect(() => {
    const fetchWorkAuthDocuments = async () => {
      try {
        const response = await fetch(`${API_URL}/employee-documents/${employee.id}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWorkAuthDocuments(data.documents || []);
        }
      } catch (error) {
        console.error('Error fetching work auth documents:', error);
      }
    };
    fetchWorkAuthDocuments();
  }, [employee.id]);

  const pendingDocuments = employee.onboardingDocuments?.filter(
    (doc: any) => doc.status === 'pending-review'
  ) || [];

  const approvedDocuments = employee.onboardingDocuments?.filter(
    (doc: any) => doc.status === 'approved'
  ) || [];

  const rejectedDocuments = employee.onboardingDocuments?.filter(
    (doc: any) => doc.status === 'rejected'
  ) || [];

  const requestedDocuments = employee.onboardingDocuments?.filter(
    (doc: any) => doc.status === 'not-uploaded' && doc.type !== 'EAD' && 
    doc.type !== 'offer-letter' && doc.type !== 'nda'
  ) || [];

  const handleRequestDocuments = async () => {
    if (selectedDocuments.length === 0 && !sendOfferLetterWithRequest && !sendNDAWithRequest) {
      toast.error('Please select at least one document type or choose to send Offer Letter/NDA');
      return;
    }

    setProcessing(true);
    const actions: string[] = [];
    
    try {
      // Send document request if documents are selected
      if (selectedDocuments.length > 0) {
        const response = await fetch(
          `${API_URL}/employees/${employee.id}/request-documents`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              documentTypes: selectedDocuments,
              notes: requestNotes
            })
          }
        );

        if (response.ok) {
          actions.push(`${selectedDocuments.length} document request(s)`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to request documents');
          setProcessing(false);
          return;
        }
      }

      // Send offer letter if selected
      if (sendOfferLetterWithRequest) {
        const response = await fetch(
          `${API_URL}/employees/${employee.id}/send-offer-letter`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          actions.push('Offer Letter');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to send offer letter');
        }
      }

      // Send NDA if selected
      if (sendNDAWithRequest) {
        const response = await fetch(
          `${API_URL}/employees/${employee.id}/send-nda`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          actions.push('NDA');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to send NDA');
        }
      }

      if (actions.length > 0) {
        toast.success(`Sent: ${actions.join(', ')} to ${employee.firstName}!`);
      }
      
      setShowRequestDialog(false);
      setSelectedDocuments([]);
      setRequestNotes('');
      setSendOfferLetterWithRequest(false);
      setSendNDAWithRequest(false);
      onUpdate();
    } catch (error) {
      console.error('Error in document workflow:', error);
      toast.error('Failed to complete all actions');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendOfferLetter = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `${API_URL}/employees/${employee.id}/send-offer-letter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Offer letter sent successfully!');
        setShowOfferLetterDialog(false);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send offer letter');
      }
    } catch (error) {
      console.error('Error sending offer letter:', error);
      toast.error('Failed to send offer letter');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendNDA = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `${API_URL}/employees/${employee.id}/send-nda`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('NDA sent successfully!');
        setShowNDADialog(false);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send NDA');
      }
    } catch (error) {
      console.error('Error sending NDA:', error);
      toast.error('Failed to send NDA');
    } finally {
      setProcessing(false);
    }
  };

  const eadDocument = employee.onboardingDocuments?.find(
    (doc: any) => doc.type === 'EAD'
  );
  const offerLetterDocument = employee.onboardingDocuments?.find(
    (doc: any) => doc.type === 'offer-letter' || doc.type === 'offer-letter-signed'
  );
  const ndaDocument = employee.onboardingDocuments?.find(
    (doc: any) => doc.type === 'nda' || doc.type === 'nda-signed'
  );

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management Actions</CardTitle>
          <CardDescription>
            Manage document requests and send agreements to {employee.firstName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowRequestDialog(true)}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              <FilePlus className="h-6 w-6" />
              <span>Request Documents</span>
              <span className="text-xs text-muted-foreground">
                Request additional documents from employee
              </span>
            </Button>

            <Button
              onClick={() => setShowOfferLetterDialog(true)}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              disabled={!!offerLetterDocument?.status}
            >
              <Mail className="h-6 w-6" />
              <span>Send Offer Letter</span>
              <span className="text-xs text-muted-foreground">
                {offerLetterDocument?.status === 'sent' ? 'Already sent' : 
                 offerLetterDocument?.status === 'signed' ? 'Signed' : 
                 'Send for employee signature'}
              </span>
            </Button>

            <Button
              onClick={() => setShowNDADialog(true)}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              disabled={!!ndaDocument?.status}
            >
              <FileSignature className="h-6 w-6" />
              <span>Send NDA</span>
              <span className="text-xs text-muted-foreground">
                {ndaDocument?.status === 'sent' ? 'Already sent' : 
                 ndaDocument?.status === 'signed' ? 'Signed' : 
                 'Send for employee signature'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* EAD Status */}
      {employee.eadRequired && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              EAD Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workAuthDocuments.length > 0 ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Work Authorization Document Uploaded</p>
                  <p className="text-sm text-green-700">
                    Employee uploaded {workAuthDocuments.length} work authorization document{workAuthDocuments.length !== 1 ? 's' : ''} on {new Date(workAuthDocuments[0].uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  // Navigate to Documents tab
                  toast.info('Please go to the Documents tab to view the uploaded file');
                }}>
                  View Document{workAuthDocuments.length !== 1 ? 's' : ''}
                </Button>
              </div>
            ) : eadDocument?.status === 'not-uploaded' ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Waiting for Upload</p>
                  <p className="text-sm text-yellow-700">
                    Employee has not uploaded EAD yet
                  </p>
                </div>
              </div>
            ) : !eadDocument ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">EAD Required</p>
                  <p className="text-sm text-yellow-700">
                    Waiting for employee to upload EAD document
                  </p>
                </div>
              </div>
            ) : null}
            
            {eadDocument?.status === 'pending-review' && workAuthDocuments.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Pending Your Review</p>
                  <p className="text-sm text-orange-700">
                    EAD document uploaded on {new Date(eadDocument.uploadedAt!).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  // Navigate to Document Review tab
                  toast.info('Please go to the Document Review tab to approve/reject this document');
                }}>
                  Review Now
                </Button>
              </div>
            )}

            {eadDocument?.status === 'approved' && workAuthDocuments.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Approved</p>
                  <p className="text-sm text-green-700">
                    Approved on {new Date(eadDocument.reviewedAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {eadDocument?.status === 'rejected' && workAuthDocuments.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Rejected</p>
                  <p className="text-sm text-red-700">
                    {eadDocument.reviewNotes || 'Employee needs to re-upload'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{pendingDocuments.length}</div>
              <div className="text-sm text-orange-700">Pending Review</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{approvedDocuments.length}</div>
              <div className="text-sm text-green-700">Approved</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{rejectedDocuments.length}</div>
              <div className="text-sm text-red-700">Rejected</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{requestedDocuments.length}</div>
              <div className="text-sm text-blue-700">Requested</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Documents Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Documents from {employee.firstName}</DialogTitle>
            <DialogDescription>
              Select documents and optionally send Offer Letter or NDA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Send Agreements Section */}
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-blue-600" />
                Send Agreements for Signature
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-2 rounded hover:bg-blue-100">
                  <Checkbox
                    id="send-offer-letter"
                    checked={sendOfferLetterWithRequest}
                    onCheckedChange={(checked) => setSendOfferLetterWithRequest(checked as boolean)}
                    disabled={!!offerLetterDocument?.status}
                  />
                  <div className="flex-1">
                    <Label htmlFor="send-offer-letter" className="cursor-pointer flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Send Offer Letter
                      {offerLetterDocument?.status && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Already Sent
                        </Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sends offer letter to {employee.email} for employee signature
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 rounded hover:bg-blue-100">
                  <Checkbox
                    id="send-nda"
                    checked={sendNDAWithRequest}
                    onCheckedChange={(checked) => setSendNDAWithRequest(checked as boolean)}
                    disabled={!!ndaDocument?.status}
                  />
                  <div className="flex-1">
                    <Label htmlFor="send-nda" className="cursor-pointer flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-blue-600" />
                      Send NDA (Non-Disclosure Agreement)
                      {ndaDocument?.status && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Already Sent
                        </Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sends NDA to {employee.email} for employee signature
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Requests Section */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                Request Additional Documents
              </h4>
              {AVAILABLE_DOCUMENT_TYPES.map((docType) => (
                <div key={docType.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={docType.id}
                    checked={selectedDocuments.includes(docType.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDocuments([...selectedDocuments, docType.id]);
                      } else {
                        setSelectedDocuments(selectedDocuments.filter(id => id !== docType.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={docType.id} className="cursor-pointer flex items-center gap-2">
                      {docType.label}
                      {docType.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions or notes for the employee..."
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRequestDialog(false);
              setSelectedDocuments([]);
              setRequestNotes('');
              setSendOfferLetterWithRequest(false);
              setSendNDAWithRequest(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestDocuments} 
              disabled={processing || (selectedDocuments.length === 0 && !sendOfferLetterWithRequest && !sendNDAWithRequest)}
            >
              <Send className="mr-2 h-4 w-4" />
              {processing ? 'Sending...' : 
                `Send ${[
                  selectedDocuments.length > 0 ? `${selectedDocuments.length} Doc${selectedDocuments.length !== 1 ? 's' : ''}` : '',
                  sendOfferLetterWithRequest ? 'Offer Letter' : '',
                  sendNDAWithRequest ? 'NDA' : ''
                ].filter(Boolean).join(' + ')}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Letter Dialog */}
      <Dialog open={showOfferLetterDialog} onOpenChange={setShowOfferLetterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Offer Letter</DialogTitle>
            <DialogDescription>
              Send the offer letter to {employee.firstName} {employee.lastName} for signature
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                The offer letter will be sent to <strong>{employee.email}</strong>. 
                The employee will be able to review and sign it electronically.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium">Offer Letter Details</h4>
              <div className="text-sm space-y-1">
                <p><strong>Position:</strong> {employee.position || 'Not specified'}</p>
                <p><strong>Department:</strong> {employee.department || 'Not specified'}</p>
                <p><strong>Start Date:</strong> {employee.startDate ? formatDateWithoutTimezone(employee.startDate) : 'Not specified'}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferLetterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendOfferLetter} disabled={processing}>
              <Send className="mr-2 h-4 w-4" />
              Send Offer Letter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send NDA Dialog */}
      <Dialog open={showNDADialog} onOpenChange={setShowNDADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send NDA</DialogTitle>
            <DialogDescription>
              Send the Non-Disclosure Agreement to {employee.firstName} {employee.lastName} for signature
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <FileSignature className="h-4 w-4" />
              <AlertDescription>
                The NDA will be sent to <strong>{employee.email}</strong>. 
                The employee will be able to review and sign it electronically.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNDADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNDA} disabled={processing}>
              <Send className="mr-2 h-4 w-4" />
              Send NDA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
