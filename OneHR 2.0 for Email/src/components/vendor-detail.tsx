import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe, 
  FileText, Users, DollarSign, Star, Calendar, 
  CheckCircle, AlertCircle, Edit, Briefcase, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { Vendor } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface VendorDetailProps {
  vendorId: string;
  onBack: () => void;
  onEdit: (vendor: Vendor) => void;
}

export function VendorDetail({ vendorId, onBack, onEdit }: VendorDetailProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVendorDetails();
    fetchVendorEmployees();
    fetchVendorProjects();
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/vendors`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!response.ok) throw new Error('Failed to fetch vendor');

      const data = await response.json();
      const foundVendor = data.vendors?.find((v: Vendor) => v.id === vendorId);
      if (foundVendor) {
        setVendor(foundVendor);
      } else {
        toast.error('Vendor not found');
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to load vendor details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter employees assigned to this vendor
        const vendorEmployees = data.employees?.filter((emp: any) => emp.vendorId === vendorId) || [];
        setEmployees(vendorEmployees);
      }
    } catch (error) {
      console.error('Error fetching vendor employees:', error);
    }
  };

  const fetchVendorProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter projects for this vendor's client
        const vendorProjects = vendor?.clientId 
          ? data.projects?.filter((proj: any) => proj.clientId === vendor.clientId) || []
          : [];
        setProjects(vendorProjects);
      }
    } catch (error) {
      console.error('Error fetching vendor projects:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Vendor not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{vendor.companyName}</h1>
                <p className="text-sm text-muted-foreground">{vendor.legalName}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(vendor.status)}>{vendor.status}</Badge>
          <Button onClick={() => onEdit(vendor)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Vendor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Assigned contractors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendor Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.rating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {vendor.rating ? 'Out of 5.0' : 'No rating yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            {vendor.hasComplianceIssues ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendor.hasComplianceIssues ? 'Issues' : 'Clean'}
            </div>
            <p className="text-xs text-muted-foreground">
              {vendor.hasComplianceIssues ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Legal Name</p>
                      <p className="text-sm text-muted-foreground">{vendor.legalName}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tax ID (EIN)</p>
                      <p className="text-sm text-muted-foreground">{vendor.taxId}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Vendor Type</p>
                      <p className="text-sm text-muted-foreground">{vendor.vendorType}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Website</p>
                      {vendor.website ? (
                        <a 
                          href={vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Financial */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Financial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.address || 'Not provided'}
                        {vendor.city && `, ${vendor.city}`}
                        {vendor.state && `, ${vendor.state}`}
                        {vendor.zipCode && ` ${vendor.zipCode}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{vendor.country}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment Terms</p>
                      <p className="text-sm text-muted-foreground">{vendor.paymentTerms}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Currency</p>
                      <p className="text-sm text-muted-foreground">{vendor.currency}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Staffing Agency</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.isStaffingAgency ? 'Yes' : 'No'}
                        {vendor.providesContractors && ' • Provides contractors'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Assignment */}
          {vendor.clientName && (
            <Card>
              <CardHeader>
                <CardTitle>Client Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{vendor.clientName}</p>
                    <p className="text-sm text-muted-foreground">Primary client</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {vendor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vendor.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Contacts</CardTitle>
              <CardDescription>
                Key contacts for this vendor relationship
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.contacts && vendor.contacts.length > 0 ? (
                <div className="space-y-4">
                  {vendor.contacts.map((contact, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.name}</p>
                            {contact.isPrimary && (
                              <Badge variant="outline" className="text-xs">Primary</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">{contact.contactType}</Badge>
                          </div>
                          {contact.title && (
                            <p className="text-sm text-muted-foreground">{contact.title}</p>
                          )}
                          <div className="flex flex-col gap-1 mt-2">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < vendor.contacts.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No contacts added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Employees</CardTitle>
              <CardDescription>
                Employees working through this vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Client</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>
                            <Badge variant={employee.onboardingStatus === 'Completed' ? 'default' : 'secondary'}>
                              {employee.onboardingStatus || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.clientName || 'Not assigned'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No employees assigned to this vendor yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Related Projects</CardTitle>
              <CardDescription>
                Projects under {vendor.clientName || 'the assigned client'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.startDate || 'Not set'}</TableCell>
                          <TableCell>{project.endDate || 'Ongoing'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No related projects found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Information</CardTitle>
              <CardDescription>
                Compliance status and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  {vendor.hasComplianceIssues ? (
                    <>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium text-red-700">Compliance Issues Detected</p>
                        <p className="text-sm text-muted-foreground">
                          This vendor requires attention for compliance matters
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700">Compliant</p>
                        <p className="text-sm text-muted-foreground">
                          All compliance requirements are met
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Required Documents</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Tax ID Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Business License</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Insurance Certificate</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
