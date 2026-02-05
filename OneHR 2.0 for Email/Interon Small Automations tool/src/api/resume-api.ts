/**
 * Resume API Module
 * Centralized API calls for resume management
 */

export interface Resume {
  id: string;
  candidateName: string;
  email: string;
  position: string;
  skills: string[];
  status: 'new' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
  uploadedAt: string;
  experience: string;
  referredBy?: string;
  resumeFor?: string | string[];
  visaStatus?: string;
  phone?: string;
  requireSponsorship?: string;
}

// Mock data for demonstration
const MOCK_RESUMES: Resume[] = [
  {
    id: '1',
    candidateName: 'Alex Johnson',
    email: 'alex.j@example.com',
    position: 'Senior Frontend Developer',
    skills: ['React', 'TypeScript', 'Tailwind', 'Node.js'],
    status: 'new',
    uploadedAt: '2023-10-24',
    experience: '5 years',
    visaStatus: 'citizen',
    referredBy: 'John Doe',
    resumeFor: ['Alice Freeman', 'Bob Smith']
  },
  {
    id: '2',
    candidateName: 'Sarah Williams',
    email: 'sarah.w@example.com',
    position: 'Product Manager',
    skills: ['Agile', 'Jira', 'User Research', 'SQL'],
    status: 'interviewing',
    uploadedAt: '2023-10-23',
    experience: '7 years',
    visaStatus: 'h1b',
    resumeFor: ['Charlie Davis']
  },
  {
    id: '3',
    candidateName: 'Michael Brown',
    email: 'm.brown@example.com',
    position: 'DevOps Engineer',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    status: 'reviewed',
    uploadedAt: '2023-10-22',
    experience: '4 years',
    visaStatus: 'greencard',
    referredBy: 'Sarah Williams',
    resumeFor: ['Evan Wright']
  },
];

export const resumeApi = {
  // Get all resumes
  list: async (): Promise<Resume[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get from localStorage
    try {
      const storedResumes = localStorage.getItem('mock_resumes');
      if (storedResumes) {
        const parsedResumes = JSON.parse(storedResumes);
        return [...parsedResumes, ...MOCK_RESUMES];
      }
    } catch (error) {
      console.error('Failed to load stored resumes', error);
    }
    
    return MOCK_RESUMES;
  },

  // Add a new resume
  add: async (resume: Omit<Resume, 'id'>): Promise<Resume> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newResume: Resume = {
      ...resume,
      id: `resume-${Date.now()}`,
    };

    try {
      const existingResumesJson = localStorage.getItem('mock_resumes');
      let existingResumes = [];
      if (existingResumesJson) {
        existingResumes = JSON.parse(existingResumesJson);
      }
      
      const updatedResumes = [newResume, ...existingResumes];
      localStorage.setItem('mock_resumes', JSON.stringify(updatedResumes));
    } catch (error) {
      console.error('Failed to save resume', error);
      throw new Error('Failed to save resume');
    }

    return newResume;
  },

  // Delete a resume
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const storedResumesJson = localStorage.getItem('mock_resumes');
      if (storedResumesJson) {
        const storedResumes = JSON.parse(storedResumesJson);
        const filteredStored = storedResumes.filter((r: Resume) => r.id !== id);
        localStorage.setItem('mock_resumes', JSON.stringify(filteredStored));
      }
    } catch (error) {
      console.error('Error deleting resume', error);
      throw new Error('Failed to delete resume');
    }
  },

  // Update resume status
  updateStatus: async (id: string, status: Resume['status']): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const storedResumesJson = localStorage.getItem('mock_resumes');
      if (storedResumesJson) {
        const storedResumes = JSON.parse(storedResumesJson);
        const updatedResumes = storedResumes.map((r: Resume) =>
          r.id === id ? { ...r, status } : r
        );
        localStorage.setItem('mock_resumes', JSON.stringify(updatedResumes));
      }
    } catch (error) {
      console.error('Error updating resume status', error);
      throw new Error('Failed to update resume status');
    }
  },

  // Update entire resume
  update: async (id: string, resume: Resume): Promise<Resume> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const storedResumesJson = localStorage.getItem('mock_resumes');
      if (storedResumesJson) {
        const storedResumes = JSON.parse(storedResumesJson);
        const updatedResumes = storedResumes.map((r: Resume) =>
          r.id === id ? { ...resume, id } : r
        );
        localStorage.setItem('mock_resumes', JSON.stringify(updatedResumes));
        return { ...resume, id };
      }
    } catch (error) {
      console.error('Error updating resume', error);
      throw new Error('Failed to update resume');
    }
    
    return resume;
  },
};