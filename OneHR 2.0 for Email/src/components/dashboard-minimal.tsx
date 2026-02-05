import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { 
  Users, FileText, AlertCircle, CheckCircle2, Clock, 
  Building2, DollarSign, Shield, TrendingUp, Activity,
  FolderOpen, Calendar, UserX, Award, Trash2
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, DashboardPreferences } from '../types';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../lib/auth-context';
import { getRolePermissions } from '../types/auth';
import { DashboardSettings } from './dashboard-settings';
import { HRApprovalWorkflow } from './hr-approval-workflow';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

// Metric display component - no card, just content
function MetricItem({ icon: Icon, label, value, sublabel, iconColor }: any) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${iconColor} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-4xl font-medium text-gray-900">{value}</p>
      {sublabel && <p className="text-sm text-gray-500">{sublabel}</p>}
    </div>
  );
}

export { Dashboard };

