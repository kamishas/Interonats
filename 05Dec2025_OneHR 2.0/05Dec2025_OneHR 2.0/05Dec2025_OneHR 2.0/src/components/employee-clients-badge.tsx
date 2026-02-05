import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Building2, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import type { ProjectAssignment } from "../types";

const API_URL = API_ENDPOINTS.CLIENT;

interface EmployeeClientsBadgeProps {
  employeeId: string;
}

export function EmployeeClientsBadge({ employeeId }: EmployeeClientsBadgeProps) {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch(
          `${API_URL}/project-assignments/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAssignments(data.assignments || []);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [employeeId]);

  const activeAssignments = assignments.filter(a => a.status === "active");
  const uniqueClients = Array.from(
    new Set(activeAssignments.map(a => a.clientName))
  );

  if (loading) {
    return (
      <span className="text-sm text-muted-foreground">Loading...</span>
    );
  }

  if (uniqueClients.length === 0) {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Building2 className="h-3 w-3" />
        No active projects
      </span>
    );
  }

  if (uniqueClients.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{uniqueClients[0]}</span>
        <Badge variant="outline" className="text-xs">
          {activeAssignments.length} {activeAssignments.length === 1 ? 'project' : 'projects'}
        </Badge>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <Briefcase className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{uniqueClients.length} Clients</span>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {activeAssignments.length} projects
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium text-xs mb-2">Active Projects:</p>
            {activeAssignments.map((assignment, idx) => (
              <div key={idx} className="text-xs border-l-2 border-blue-400 pl-2 py-1">
                <div className="font-medium">{assignment.clientName}</div>
                <div className="text-muted-foreground">
                  {assignment.projectName} • {assignment.allocation}%
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
