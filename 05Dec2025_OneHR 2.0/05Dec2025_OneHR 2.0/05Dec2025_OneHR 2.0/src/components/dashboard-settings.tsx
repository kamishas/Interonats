import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { Settings, LayoutDashboard } from 'lucide-react';
import type { DashboardPreferences } from '../types';

interface DashboardSettingsProps {
  preferences: DashboardPreferences;
  onSave: (preferences: DashboardPreferences) => Promise<void>;
}

export function DashboardSettings({ preferences, onSave }: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<DashboardPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(localPreferences);
      toast.success('Dashboard preferences saved successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save dashboard preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPreferences: DashboardPreferences = {
      userId: preferences.userId,
      sections: {
        quickActions: true,
        keyMetrics: true,
        additionalMetrics: true,
        workflowCharts: true,
      },
      keyMetrics: {
        totalEmployees: true,
        activeOnboarding: true,
        immigrationCases: true,
        criticalAlerts: true,
      },
      additionalMetrics: {
        activeClients: true,
        businessLicenses: true,
        pendingTimesheets: true,
        leaveRequests: true,
        activeOffboarding: true,
        pendingReviews: true,
        expiringDocuments: true,
        pendingSignatures: true,
      },
    };
    setLocalPreferences(defaultPreferences);
    toast.info('Preferences reset to defaults');
  };

  const updateSection = (section: keyof DashboardPreferences['sections'], value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: value,
      },
    }));
  };

  const updateKeyMetric = (metric: keyof DashboardPreferences['keyMetrics'], value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      keyMetrics: {
        ...prev.keyMetrics,
        [metric]: value,
      },
    }));
  };

  const updateAdditionalMetric = (metric: keyof DashboardPreferences['additionalMetrics'], value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      additionalMetrics: {
        ...prev.additionalMetrics,
        [metric]: value,
      },
    }));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/20"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              Dashboard Preferences
            </DialogTitle>
            <DialogDescription id="dashboard-settings-description">
              Customize which sections and metrics appear on your dashboard
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Main Sections */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Main Sections</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex-1">
                    <Label htmlFor="quickActions" className="cursor-pointer font-medium text-gray-900">
                      Quick Actions
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Add Employee, Add Client, View Alerts, Reports buttons
                    </p>
                  </div>
                  <Switch
                    id="quickActions"
                    checked={localPreferences.sections.quickActions}
                    onCheckedChange={(value) => updateSection('quickActions', value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                  <div className="flex-1">
                    <Label htmlFor="keyMetrics" className="cursor-pointer font-medium text-gray-900">
                      Key Metrics
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Primary metrics: Employees, Onboarding, Immigration, Alerts
                    </p>
                  </div>
                  <Switch
                    id="keyMetrics"
                    checked={localPreferences.sections.keyMetrics}
                    onCheckedChange={(value) => updateSection('keyMetrics', value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex-1">
                    <Label htmlFor="additionalMetrics" className="cursor-pointer font-medium text-gray-900">
                      Additional Metrics
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Extended metrics: Clients, Licenses, Timesheets, Leave, etc.
                    </p>
                  </div>
                  <Switch
                    id="additionalMetrics"
                    checked={localPreferences.sections.additionalMetrics}
                    onCheckedChange={(value) => updateSection('additionalMetrics', value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
                  <div className="flex-1">
                    <Label htmlFor="workflowCharts" className="cursor-pointer font-medium text-gray-900">
                      Workflow Analytics Charts
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Visual charts for workflow stages and classifications
                    </p>
                  </div>
                  <Switch
                    id="workflowCharts"
                    checked={localPreferences.sections.workflowCharts}
                    onCheckedChange={(value) => updateSection('workflowCharts', value)}
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Key Metrics Detail */}
            {localPreferences.sections.keyMetrics && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Key Metrics - Individual Cards</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-gray-100">
                    <Label htmlFor="totalEmployees" className="cursor-pointer text-sm font-medium text-gray-700">
                      Total Employees
                    </Label>
                    <Switch
                      id="totalEmployees"
                      checked={localPreferences.keyMetrics.totalEmployees}
                      onCheckedChange={(value) => updateKeyMetric('totalEmployees', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-gray-100">
                    <Label htmlFor="activeOnboarding" className="cursor-pointer text-sm font-medium text-gray-700">
                      Active Onboarding
                    </Label>
                    <Switch
                      id="activeOnboarding"
                      checked={localPreferences.keyMetrics.activeOnboarding}
                      onCheckedChange={(value) => updateKeyMetric('activeOnboarding', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 border border-gray-100">
                    <Label htmlFor="immigrationCases" className="cursor-pointer text-sm font-medium text-gray-700">
                      Immigration Cases
                    </Label>
                    <Switch
                      id="immigrationCases"
                      checked={localPreferences.keyMetrics.immigrationCases}
                      onCheckedChange={(value) => updateKeyMetric('immigrationCases', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-red-50/50 to-rose-50/50 border border-gray-100">
                    <Label htmlFor="criticalAlerts" className="cursor-pointer text-sm font-medium text-gray-700">
                      Critical Alerts
                    </Label>
                    <Switch
                      id="criticalAlerts"
                      checked={localPreferences.keyMetrics.criticalAlerts}
                      onCheckedChange={(value) => updateKeyMetric('criticalAlerts', value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {localPreferences.sections.keyMetrics && <Separator className="bg-gray-200" />}

            {/* Additional Metrics Detail */}
            {localPreferences.sections.additionalMetrics && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Additional Metrics - Individual Cards</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="activeClients" className="cursor-pointer text-sm font-medium text-gray-700">
                      Active Clients
                    </Label>
                    <Switch
                      id="activeClients"
                      checked={localPreferences.additionalMetrics.activeClients}
                      onCheckedChange={(value) => updateAdditionalMetric('activeClients', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="businessLicenses" className="cursor-pointer text-sm font-medium text-gray-700">
                      Business Licenses
                    </Label>
                    <Switch
                      id="businessLicenses"
                      checked={localPreferences.additionalMetrics.businessLicenses}
                      onCheckedChange={(value) => updateAdditionalMetric('businessLicenses', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="pendingTimesheets" className="cursor-pointer text-sm font-medium text-gray-700">
                      Pending Timesheets
                    </Label>
                    <Switch
                      id="pendingTimesheets"
                      checked={localPreferences.additionalMetrics.pendingTimesheets}
                      onCheckedChange={(value) => updateAdditionalMetric('pendingTimesheets', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="leaveRequests" className="cursor-pointer text-sm font-medium text-gray-700">
                      Leave Requests
                    </Label>
                    <Switch
                      id="leaveRequests"
                      checked={localPreferences.additionalMetrics.leaveRequests}
                      onCheckedChange={(value) => updateAdditionalMetric('leaveRequests', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="activeOffboarding" className="cursor-pointer text-sm font-medium text-gray-700">
                      Active Offboarding
                    </Label>
                    <Switch
                      id="activeOffboarding"
                      checked={localPreferences.additionalMetrics.activeOffboarding}
                      onCheckedChange={(value) => updateAdditionalMetric('activeOffboarding', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="pendingReviews" className="cursor-pointer text-sm font-medium text-gray-700">
                      Pending Reviews
                    </Label>
                    <Switch
                      id="pendingReviews"
                      checked={localPreferences.additionalMetrics.pendingReviews}
                      onCheckedChange={(value) => updateAdditionalMetric('pendingReviews', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="expiringDocuments" className="cursor-pointer text-sm font-medium text-gray-700">
                      Expiring Documents
                    </Label>
                    <Switch
                      id="expiringDocuments"
                      checked={localPreferences.additionalMetrics.expiringDocuments}
                      onCheckedChange={(value) => updateAdditionalMetric('expiringDocuments', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Label htmlFor="pendingSignatures" className="cursor-pointer text-sm font-medium text-gray-700">
                      Pending Signatures
                    </Label>
                    <Switch
                      id="pendingSignatures"
                      checked={localPreferences.additionalMetrics.pendingSignatures}
                      onCheckedChange={(value) => updateAdditionalMetric('pendingSignatures', value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center border-t border-gray-200 pt-6">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-xl"
            >
              Reset to Defaults
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSaving}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
