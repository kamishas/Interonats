import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, Mail, MapPin, Phone, Calendar, X } from "lucide-react";

interface Resume {
  id: string;
  candidateName: string;
  email: string;
  position: string;
  skills: string[];
  status: 'new' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
  uploadedAt: string;
  experience: string;
  referredBy?: string;
  resumeFor?: string[];
  visaStatus?: string;
}

interface ResumePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume | null;
}

export function ResumePreviewDialog({ open, onOpenChange, resume }: ResumePreviewDialogProps) {
  if (!resume) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-slate-50">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold">Resume Preview</DialogTitle>
            <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
              {resume.candidateName}.pdf
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div className="w-full max-w-[800px] bg-white shadow-lg min-h-[1000px] p-12 text-slate-800">
            <div className="border-b-2 border-slate-800 pb-6 mb-8">
              <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
                {resume.candidateName}
              </h1>
              <h2 className="text-xl text-slate-600 font-medium mb-4">{resume.position}</h2>
              
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {resume.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  (555) 123-4567
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  San Francisco, CA
                </div>
                {resume.visaStatus && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs border border-slate-300 px-1 rounded">
                      {resume.visaStatus.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">
                    Professional Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Experienced {resume.position} with over {resume.experience} of expertise in building scalable applications. 
                    Strong problem-solving skills and a passion for creating user-centric experiences.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-1">
                    Experience
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="relative pl-4 border-l-2 border-slate-200">
                      <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300"></div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-slate-800">Senior {resume.position.split(' ')[1] || 'Developer'}</h4>
                        <span className="text-xs text-slate-500">2021 - Present</span>
                      </div>
                      <div className="text-sm font-medium text-slate-600 mb-2">TechCorp Solutions</div>
                      <ul className="list-disc list-outside ml-4 text-sm text-slate-600 space-y-1">
                        <li>Led a team to rebuild the core platform architecture.</li>
                        <li>Improved application performance by 40%.</li>
                        <li>Implemented CI/CD pipelines.</li>
                      </ul>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-1">
                    Education
                  </h3>
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-slate-800">Bachelor of Science in Computer Science</h4>
                      <span className="text-xs text-slate-500">2014 - 2018</span>
                    </div>
                    <div className="text-sm text-slate-600">University of Technology</div>
                  </div>
                </section>
              </div>

              <div className="col-span-1 space-y-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm px-2 font-normal text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">
                    Languages
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>English</span>
                      <span className="text-slate-400">Native</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spanish</span>
                      <span className="text-slate-400">Professional</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
