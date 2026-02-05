import { Badge } from './ui/badge';

type StatusType = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'approved' | 'rejected' | 'active' | 'expired';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  'pending': 'bg-amber-100 text-amber-700 border-amber-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'completed': 'bg-green-100 text-green-700 border-green-200',
  'blocked': 'bg-red-100 text-red-700 border-red-200',
  'approved': 'bg-green-100 text-green-700 border-green-200',
  'rejected': 'bg-red-100 text-red-700 border-red-200',
  'active': 'bg-green-100 text-green-700 border-green-200',
  'expired': 'bg-gray-100 text-gray-700 border-gray-200',
  'not-started': 'bg-gray-100 text-gray-700 border-gray-200',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  const styleClass = statusStyles[normalizedStatus] || 'bg-gray-50 text-gray-700 border-gray-200';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  
  return (
    <Badge className={`${styleClass} border ${sizeClass} capitalize`} variant="outline">
      {status.replace(/-/g, ' ')}
    </Badge>
  );
}
