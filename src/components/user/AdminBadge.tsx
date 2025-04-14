
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

interface AdminBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AdminBadge: React.FC<AdminBadgeProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  };
  
  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-1 bg-primary/20 text-primary hover:bg-primary/30 ${sizeClasses[size]} ${className || ''}`}
    >
      <ShieldCheck className="w-3 h-3" />
      <span>Admin</span>
    </Badge>
  );
};

export default AdminBadge;
