import * as React from "react";
import { cn } from "./ui/utils";
import { Textarea } from "./ui/textarea";

export interface RichTextEditorProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (value: string | any) => void; // Relaxed type to handle both string and event
}

export function RichTextEditor({
  className,
  value,
  onChange,
  ...props
}: RichTextEditorProps) {
  // Handle both direct string updates and event objects
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    if (typeof e === 'string') {
      onChange(e);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1 border-b pb-2 mb-1">
        <div className="text-xs text-muted-foreground px-2">Plain Text Editor</div>
        {/* Placeholder for toolbar buttons if we were using a real RTE */}
      </div>
      <Textarea
        className={cn(
          "min-h-[150px] resize-y border-0 focus-visible:ring-0 px-0 py-0",
          className
        )}
        value={value}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
