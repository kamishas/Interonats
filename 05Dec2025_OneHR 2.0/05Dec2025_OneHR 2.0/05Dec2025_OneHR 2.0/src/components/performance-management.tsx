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
  Award, Plus, Eye, Search, TrendingUp, TrendingDown, 
  Target, CheckCircle2, Star, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { PerformanceReview, ReviewCycle, RatingScale, Employee } from '../types';

const API_URL = API_ENDPOINTS.PERFORMANCE;

export function PerformanceManagement() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewerId: '',
    reviewCycle: 'Annual' as ReviewCycle,
    reviewPeriodStart: '',
    reviewPeriodEnd: '',
    reviewDate: new Date().toISOString().split('T')[0],
    overallRating: 'Meets Expectations' as RatingScale,
    technicalSkills: 'Meets Expectations' as RatingScale,
    communication: 'Meets Expectations' as RatingScale,
    teamwork: 'Meets Expectations' as RatingScale,
    productivity: 'Meets Expectations' as RatingScale,
    initiative: 'Meets Expectations' as RatingScale,
    reliability: 'Meets Expectations' as RatingScale,
    strengths: '',
    areasForImprovement: '',
    accomplishments: '',
    managerComments: '',
    promotionRecommended: false,
    salaryIncreaseRecommended: false,
    salaryIncreasePercentage: 0,
    trainingRecommended: false,
    trainingAreas: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, empsRes] = await Promise.all([
        fetch(`${API_URL}/performance-reviews`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        })
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.performanceReviews || []);
      }

      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!reviewForm.employeeId || !reviewForm.reviewerId || !reviewForm.reviewPeriodStart || !reviewForm.reviewPeriodEnd) {
      toast.error('Please fill in all required fields');
      return;
    }

    const employee = employees.find(e => e.id === reviewForm.employeeId);
    const reviewer = employees.find(e => e.id === reviewForm.reviewerId);

    if (!employee || !reviewer) {
      toast.error('Employee or reviewer not found');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/performance-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          ...reviewForm,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
          goalsLastPeriod: [],
          goalsNextPeriod: [],
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create review');
      }

      const data = await response.json();
      setReviews([...reviews, data.performanceReview]);
      toast.success('Performance review created successfully');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('Failed to create performance review');
    }
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: 'draft' | 'pending-employee' | 'pending-hr' | 'completed') => {
    try {
      const response = await fetch(`${API_URL}/performance-reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setReviews(reviews.map(r => r.id === reviewId ? data.performanceReview : r));
      toast.success('Review status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update review status');
    }
  };

  const resetForm = () => {
    setReviewForm({
      employeeId: '',
      reviewerId: '',
      reviewCycle: 'Annual',
      reviewPeriodStart: '',
      reviewPeriodEnd: '',
      reviewDate: new Date().toISOString().split('T')[0],
      overallRating: 'Meets Expectations',
      technicalSkills: 'Meets Expectations',
      communication: 'Meets Expectations',
      teamwork: 'Meets Expectations',
      productivity: 'Meets Expectations',
      initiative: 'Meets Expectations',
      reliability: 'Meets Expectations',
      strengths: '',
      areasForImprovement: '',
      accomplishments: '',
      managerComments: '',
      promotionRecommended: false,
      salaryIncreaseRecommended: false,
      salaryIncreasePercentage: 0,
      trainingRecommended: false,
      trainingAreas: '',
    });
  };

  const getRatingBadge = (rating: RatingScale) => {
    const variants = {
      'Exceeds Expectations': <Badge className="gap-1 bg-green-600"><Star className="h-3 w-3" /> Exceeds</Badge>,
      'Meets Expectations': <Badge className="gap-1 bg-blue-500"><CheckCircle2 className="h-3 w-3" /> Meets</Badge>,
      'Needs Improvement': <Badge className="gap-1 bg-yellow-500"><TrendingDown className="h-3 w-3" /> Needs Improvement</Badge>,
      'Unsatisfactory': <Badge variant="destructive"><TrendingDown className="h-3 w-3" /> Unsatisfactory</Badge>,
    };
    return variants[rating];
  };

  const getStatusBadge = (status: 'draft' | 'pending-employee' | 'pending-hr' | 'completed') => {
    const variants = {
      draft: <Badge variant="secondary">Draft</Badge>,
      'pending-employee': <Badge className="bg-yellow-500">Pending Employee</Badge>,
      'pending-hr': <Badge className="bg-blue-500">Pending HR</Badge>,
      completed: <Badge className="bg-green-600">Completed</Badge>,
    };
    return variants[status];
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    completed: reviews.filter(r => r.status === 'completed').length,
    pending: reviews.filter(r => r.status === 'pending-employee' || r.status === 'pending-hr').length,
    promotionRecommended: reviews.filter(r => r.promotionRecommended).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Performance Management</h1>
          <p className="text-muted-foreground">Manage employee performance reviews and goals</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Review
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Promotion Recommended</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.promotionRecommended}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-employee">Pending Employee</SelectItem>
                <SelectItem value="pending-hr">Pending HR</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Review Cycle</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No performance reviews found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.employeeName}</TableCell>
                    <TableCell>{review.reviewerName}</TableCell>
                    <TableCell>{review.reviewCycle}</TableCell>
                    <TableCell>{format(new Date(review.reviewDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getRatingBadge(review.overallRating)}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Review Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
            <DialogDescription id="create-review-dialog-description">Conduct a performance review for an employee</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select 
                  value={reviewForm.employeeId} 
                  onValueChange={(value) => setReviewForm(prev => ({ ...prev, employeeId: value }))}
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
                <Label htmlFor="reviewer">Reviewer *</Label>
                <Select 
                  value={reviewForm.reviewerId} 
                  onValueChange={(value) => setReviewForm(prev => ({ ...prev, reviewerId: value }))}
                >
                  <SelectTrigger id="reviewer">
                    <SelectValue placeholder="Select reviewer" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewCycle">Review Cycle *</Label>
                <Select 
                  value={reviewForm.reviewCycle} 
                  onValueChange={(value: ReviewCycle) => setReviewForm(prev => ({ ...prev, reviewCycle: value }))}
                >
                  <SelectTrigger id="reviewCycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Probation">Probation</SelectItem>
                    <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                    <SelectItem value="Ad-Hoc">Ad-Hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewDate">Review Date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={reviewForm.reviewDate}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Review Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={reviewForm.reviewPeriodStart}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewPeriodStart: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodEnd">Review Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={reviewForm.reviewPeriodEnd}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewPeriodEnd: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Performance Ratings</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'overallRating', label: 'Overall Rating' },
                  { field: 'technicalSkills', label: 'Technical Skills' },
                  { field: 'communication', label: 'Communication' },
                  { field: 'teamwork', label: 'Teamwork' },
                  { field: 'productivity', label: 'Productivity' },
                  { field: 'initiative', label: 'Initiative' },
                  { field: 'reliability', label: 'Reliability' },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">{label}</Label>
                    <Select 
                      value={reviewForm[field as keyof typeof reviewForm] as string}
                      onValueChange={(value: RatingScale) => setReviewForm(prev => ({ ...prev, [field]: value }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Exceeds Expectations">Exceeds Expectations</SelectItem>
                        <SelectItem value="Meets Expectations">Meets Expectations</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                        <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea
                id="strengths"
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm(prev => ({ ...prev, strengths: e.target.value }))}
                placeholder="Key strengths demonstrated..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">Areas for Improvement</Label>
              <Textarea
                id="improvements"
                value={reviewForm.areasForImprovement}
                onChange={(e) => setReviewForm(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                placeholder="Areas where employee can improve..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accomplishments">Key Accomplishments</Label>
              <Textarea
                id="accomplishments"
                value={reviewForm.accomplishments}
                onChange={(e) => setReviewForm(prev => ({ ...prev, accomplishments: e.target.value }))}
                placeholder="Major accomplishments during review period..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Manager Comments</Label>
              <Textarea
                id="comments"
                value={reviewForm.managerComments}
                onChange={(e) => setReviewForm(prev => ({ ...prev, managerComments: e.target.value }))}
                placeholder="Additional comments..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Recommendations</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="promotion"
                    checked={reviewForm.promotionRecommended}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, promotionRecommended: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="promotion" className="cursor-pointer">Recommend for Promotion</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="salary"
                    checked={reviewForm.salaryIncreaseRecommended}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, salaryIncreaseRecommended: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="salary" className="cursor-pointer">Recommend Salary Increase</Label>
                </div>

                {reviewForm.salaryIncreaseRecommended && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="salaryPercent">Increase Percentage</Label>
                    <Input
                      id="salaryPercent"
                      type="number"
                      value={reviewForm.salaryIncreasePercentage}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, salaryIncreasePercentage: parseFloat(e.target.value) }))}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="training"
                    checked={reviewForm.trainingRecommended}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, trainingRecommended: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="training" className="cursor-pointer">Recommend Training</Label>
                </div>

                {reviewForm.trainingRecommended && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="trainingAreas">Training Areas</Label>
                    <Textarea
                      id="trainingAreas"
                      value={reviewForm.trainingAreas}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, trainingAreas: e.target.value }))}
                      placeholder="Specify training areas..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview}>
              Create Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Performance Review Details</DialogTitle>
            <DialogDescription id="view-review-dialog-description">
              {selectedReview?.employeeName || 'View detailed performance review information'}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm">{selectedReview.employeeName}</p>
                  </div>
                  <div>
                    <Label>Reviewer</Label>
                    <p className="text-sm">{selectedReview.reviewerName}</p>
                  </div>
                  <div>
                    <Label>Review Cycle</Label>
                    <p className="text-sm">{selectedReview.reviewCycle}</p>
                  </div>
                  <div>
                    <Label>Review Date</Label>
                    <p className="text-sm">{format(new Date(selectedReview.reviewDate), 'PPP')}</p>
                  </div>
                  <div>
                    <Label>Period</Label>
                    <p className="text-sm">
                      {format(new Date(selectedReview.reviewPeriodStart), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(selectedReview.reviewPeriodEnd), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="pt-1">{getStatusBadge(selectedReview.status)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Ratings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Overall Rating</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.overallRating)}</div>
                  </div>
                  <div>
                    <Label>Technical Skills</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.technicalSkills)}</div>
                  </div>
                  <div>
                    <Label>Communication</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.communication)}</div>
                  </div>
                  <div>
                    <Label>Teamwork</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.teamwork)}</div>
                  </div>
                  <div>
                    <Label>Productivity</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.productivity)}</div>
                  </div>
                  <div>
                    <Label>Initiative</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.initiative)}</div>
                  </div>
                  <div>
                    <Label>Reliability</Label>
                    <div className="pt-1">{getRatingBadge(selectedReview.reliability)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Strengths</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedReview.strengths || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Areas for Improvement</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedReview.areasForImprovement || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Key Accomplishments</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedReview.accomplishments || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Manager Comments</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedReview.managerComments || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedReview.promotionRecommended && (
                    <Badge className="gap-1 bg-purple-600">
                      <TrendingUp className="h-3 w-3" /> Promotion Recommended
                    </Badge>
                  )}
                  {selectedReview.salaryIncreaseRecommended && (
                    <Badge className="gap-1 bg-green-600">
                      <TrendingUp className="h-3 w-3" /> Salary Increase: {selectedReview.salaryIncreasePercentage}%
                    </Badge>
                  )}
                  {selectedReview.trainingRecommended && (
                    <div>
                      <Badge className="gap-1 bg-blue-600">
                        <Target className="h-3 w-3" /> Training Recommended
                      </Badge>
                      <p className="text-sm mt-2">{selectedReview.trainingAreas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
