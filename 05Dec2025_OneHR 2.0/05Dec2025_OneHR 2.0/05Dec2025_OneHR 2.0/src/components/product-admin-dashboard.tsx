import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  Settings,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  CreditCard,
  Ban,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const API_URL = API_ENDPOINTS.PRODUCT_ADMIN;

interface PlatformMetrics {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalEmployees: number;
  totalClients: number;
  totalProjects: number;
  totalRevenue: number;
  monthlyRevenue: number;
}



interface OrganizationData {
  id: string;
  name: string;
  subscriptionPlan: string;
  userCount: number;
  employeeCount: number;
  status: string;
  createdAt: string;
  monthlyRevenue: number;
  phone?: string;
  industry?: string;
  companySize?: string;
}

interface SubscriptionMetrics {
  free: number;
  starter: number;
  professional: number;
  enterprise: number;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
};

export function ProductAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPlatformMetrics(),
        fetchOrganizations(),
        fetchSubscriptionMetrics(),
      ]);
      setLastRefresh(new Date());
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatformMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/platform-metrics`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching platform metrics:", error);
    }
  };



  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API_URL}/organizations`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const fetchSubscriptionMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/subscription-metrics`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching subscription metrics:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "active":
        return "bg-green-500";
      case "degraded":
      case "trial":
        return "bg-yellow-500";
      case "down":
      case "suspended":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleViewDetails = (org: OrganizationData) => {
    setSelectedOrg(org);
    setIsDetailsOpen(true);
  };

  const handleManage = (org: OrganizationData) => {
    setSelectedOrg(org);
    setIsManageOpen(true);
  };

  const handleSuspendOrganization = async () => {
    if (!selectedOrg) return;
    
    setIsSuspending(true);
    try {
      const response = await fetch(`${API_URL}/organizations/${selectedOrg.id}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });

      if (response.ok) {
        toast.success(`Organization "${selectedOrg.name}" has been suspended`);
        setIsManageOpen(false);
        fetchOrganizations(); // Refresh the list
      } else {
        throw new Error('Failed to suspend organization');
      }
    } catch (error) {
      console.error('Error suspending organization:', error);
      toast.error('Failed to suspend organization');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleActivateOrganization = async () => {
    if (!selectedOrg) return;
    
    setIsActivating(true);
    try {
      const response = await fetch(`${API_URL}/organizations/${selectedOrg.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });

      if (response.ok) {
        toast.success(`Organization "${selectedOrg.name}" has been activated`);
        setIsManageOpen(false);
        fetchOrganizations(); // Refresh the list
      } else {
        throw new Error('Failed to activate organization');
      }
    } catch (error) {
      console.error('Error activating organization:', error);
      toast.error('Failed to activate organization');
    } finally {
      setIsActivating(false);
    }
  };

  const handleUpdateSubscription = async (newPlan: string) => {
    if (!selectedOrg) return;
    
    try {
      const response = await fetch(`${API_URL}/organizations/${selectedOrg.id}/subscription`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscriptionPlan: newPlan }),
      });

      if (response.ok) {
        toast.success(`Subscription updated to ${newPlan}`);
        fetchOrganizations(); // Refresh the list
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const subscriptionChartData = subscriptionMetrics
    ? [
        { name: "Free", value: subscriptionMetrics.free, color: COLORS.primary },
        { name: "Starter", value: subscriptionMetrics.starter, color: COLORS.success },
        { name: "Professional", value: subscriptionMetrics.professional, color: COLORS.purple },
        { name: "Enterprise", value: subscriptionMetrics.enterprise, color: COLORS.teal },
      ]
    : [];

  if (isLoading && !metrics) {
    return (
      <div className="py-12 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading platform analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Product Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Platform-wide analytics and organization management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {format(lastRefresh, "MMM d, yyyy HH:mm:ss")}
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>



      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metrics?.totalOrganizations || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active business accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metrics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.activeUsers || 0} active in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metrics?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all organizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(metrics?.totalRevenue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{metrics?.totalClients || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{metrics?.totalProjects || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Distribution */}
          {subscriptionMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Organizations by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={subscriptionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriptionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                {organizations.length} organizations using the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{org.name}</h4>
                        <Badge variant={org.status === "active" ? "default" : "secondary"}>
                          {org.subscriptionPlan}
                        </Badge>
                        <Badge
                          className={
                            org.status === "active"
                              ? "bg-green-500"
                              : org.status === "trial"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }
                        >
                          {org.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                        <span>{org.userCount} users</span>
                        <span>{org.employeeCount} employees</span>
                        {org.industry && <span>• {org.industry}</span>}
                        {org.companySize && <span>• {org.companySize}</span>}
                        <span>• {formatCurrency(org.monthlyRevenue)}/month</span>
                        <span>• Joined {format(new Date(org.createdAt), "MMM yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(org)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleManage(org)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Free Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-blue-900">{subscriptionMetrics?.free || 0}</div>
                <p className="text-sm text-blue-700 mt-1">Organizations</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Starter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-green-900">{subscriptionMetrics?.starter || 0}</div>
                <p className="text-sm text-green-700 mt-1">Organizations</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-900">Professional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-purple-900">{subscriptionMetrics?.professional || 0}</div>
                <p className="text-sm text-purple-700 mt-1">Organizations</p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 bg-teal-50">
              <CardHeader>
                <CardTitle className="text-teal-900">Enterprise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-teal-900">{subscriptionMetrics?.enterprise || 0}</div>
                <p className="text-sm text-teal-700 mt-1">Organizations</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage Global Subscription Settings</CardTitle>
              <CardDescription>Configure pricing and feature limits across all tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Open Subscription Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Growth Metrics</CardTitle>
              <CardDescription>Coming soon: Historical trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced analytics and reporting will be available in the next release</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrg && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Basic Information</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedOrg.status === "active" ? "default" : "secondary"}>
                      {selectedOrg.subscriptionPlan}
                    </Badge>
                    <Badge
                      className={
                        selectedOrg.status === "active"
                          ? "bg-green-500"
                          : selectedOrg.status === "trial"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {selectedOrg.status}
                    </Badge>
                  </div>
                </div>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Organization Name</Label>
                    <p className="font-medium">{selectedOrg.name}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Organization ID</Label>
                    <p className="font-mono text-sm">{selectedOrg.id}</p>
                  </div>
                  
                  {selectedOrg.phone && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone
                      </Label>
                      <p>{selectedOrg.phone}</p>
                    </div>
                  )}
                  
                  {selectedOrg.industry && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Industry
                      </Label>
                      <p>{selectedOrg.industry}</p>
                    </div>
                  )}
                  
                  {selectedOrg.companySize && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> Company Size
                      </Label>
                      <p>{selectedOrg.companySize}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Joined Date
                    </Label>
                    <p>{format(new Date(selectedOrg.createdAt), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="space-y-4">
                <h3 className="font-medium">Usage Statistics</h3>
                <Separator />
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl">{selectedOrg.userCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl">{selectedOrg.employeeCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl">{formatCurrency(selectedOrg.monthlyRevenue)}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Subscription Details</h3>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Current Plan
                    </Label>
                    <p className="font-medium text-lg">{selectedOrg.subscriptionPlan.toUpperCase()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium text-lg capitalize">{selectedOrg.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsDetailsOpen(false);
                  handleManage(selectedOrg);
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Organization
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Organization Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Organization</DialogTitle>
            <DialogDescription>
              Update settings and manage {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrg && (
            <div className="space-y-6">
              {/* Organization Status */}
              <div className="space-y-4">
                <h3 className="font-medium">Organization Status</h3>
                <Separator />
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Current Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Organization is currently <strong className="capitalize">{selectedOrg.status}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedOrg.status !== 'suspended' ? (
                      <Button 
                        variant="destructive" 
                        onClick={handleSuspendOrganization}
                        disabled={isSuspending}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {isSuspending ? 'Suspending...' : 'Suspend'}
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        onClick={handleActivateOrganization}
                        disabled={isActivating}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {isActivating ? 'Activating...' : 'Activate'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Management */}
              <div className="space-y-4">
                <h3 className="font-medium">Subscription Management</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscription-plan">Change Subscription Plan</Label>
                    <Select 
                      defaultValue={selectedOrg.subscriptionPlan}
                      onValueChange={handleUpdateSubscription}
                    >
                      <SelectTrigger id="subscription-plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Changes take effect immediately and will be reflected in the organization's next billing cycle
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Plan:</span>
                      <Badge>{selectedOrg.subscriptionPlan}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Revenue:</span>
                      <span className="font-medium">{formatCurrency(selectedOrg.monthlyRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Member Since:</span>
                      <span className="font-medium">{format(new Date(selectedOrg.createdAt), "MMM yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h3 className="font-medium">Quick Statistics</h3>
                <Separator />
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Total Users</Label>
                    <p className="text-xl font-medium mt-1">{selectedOrg.userCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Total Employees</Label>
                    <p className="text-xl font-medium mt-1">{selectedOrg.employeeCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="text-xl font-medium mt-1 capitalize">{selectedOrg.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsManageOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsManageOpen(false);
                  handleViewDetails(selectedOrg);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
