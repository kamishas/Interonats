import { useState } from "react";
import { Button } from "./ui/button";
import { Edit } from "lucide-react";
import { ImmigrationEmployeeForm } from "./immigration-employee-form";
import type { ImmigrationRecord } from "../types";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";

interface ImmigrationEditWrapperProps {
  employee: ImmigrationRecord;
  onUpdate: () => void;
}

export function ImmigrationEditWrapper({ employee, onUpdate }: ImmigrationEditWrapperProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleUpdateEmployee = async (data: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b/immigration/employees/${employee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        toast.success("Employee immigration record updated");
        setShowEditDialog(false);
        onUpdate();
      } else {
        const error = await response.text();
        toast.error(`Failed to update record: ${error}`);
      }
    } catch (error) {
      console.error("Error updating employee immigration record:", error);
      toast.error("Failed to update employee record");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowEditDialog(true)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>

      <ImmigrationEmployeeForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleUpdateEmployee}
        initialData={employee}
        mode="edit"
      />
    </>
  );
}

