import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dbService } from '@/lib/db-service';
import type { CategoryMeta, PageSchema } from '@/lib/types';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedJobId?: string;
  preselectedCategoryId?: string;
  onPageCreated: (jobId: string, pageNumber: string) => void;
}

export function CreatePageDialog({ 
  open, 
  onOpenChange, 
  preselectedJobId, 
  preselectedCategoryId,
  onPageCreated 
}: CreatePageDialogProps) {
  const [jobId, setJobId] = useState(preselectedJobId || '');
  const [pageNumber, setPageNumber] = useState('');
  const [pageType, setPageType] = useState('');
  const [jobs, setJobs] = useState<Array<{ id: string; categoryId: string }>>([]);
  const [availablePages, setAvailablePages] = useState<PageSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(preselectedCategoryId || '');

  useEffect(() => {
    if (open) {
      loadJobs();
      if (preselectedJobId) {
        setJobId(preselectedJobId);
      }
      if (preselectedCategoryId) {
        loadPagesForCategory(preselectedCategoryId);
      }
    }
  }, [open, preselectedJobId, preselectedCategoryId]);

  useEffect(() => {
    if (jobId && !preselectedCategoryId) {
      loadCategoryForJob(jobId);
    }
  }, [jobId, preselectedCategoryId]);

  const loadJobs = async () => {
    try {
      const jobsData = await dbService.getAllJobs();
      setJobs(Object.values(jobsData));
    } catch (error) {
      toast.error('Failed to load jobs');
    }
  };

  const loadCategoryForJob = async (jId: string) => {
    try {
      const job = await dbService.getJob(jId);
      if (job) {
        setCategoryId(job.categoryId);
        await loadPagesForCategory(job.categoryId);
      }
    } catch (error) {
      toast.error('Failed to load category');
    }
  };

  const loadPagesForCategory = async (catId: string) => {
    try {
      const schema = await dbService.getSchema(catId);
      if (schema) {
        setAvailablePages(schema.pages);
      }
    } catch (error) {
      toast.error('Failed to load page types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId.trim() || !pageNumber.trim() || !pageType) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const existingPage = await dbService.getPageData(jobId, pageNumber);
      if (existingPage) {
        toast.error('Page number already exists for this job');
        setLoading(false);
        return;
      }

      const selectedPage = availablePages.find(p => p.id === pageType);
      if (!selectedPage) {
        toast.error('Invalid page type');
        setLoading(false);
        return;
      }

      const initialValues: Record<string, any> = {};
      selectedPage.blocks.forEach(block => {
        if (block.type === 'checkbox') {
          initialValues[block.id] = false;
        } else {
          initialValues[block.id] = '';
        }
      });

      await dbService.savePageData(jobId, pageNumber, {
        jobId,
        pageNumber,
        categoryId,
        values: initialValues
      });

      toast.success('Page created successfully');
      onOpenChange(false);
      onPageCreated(jobId, pageNumber);
      if (!preselectedJobId) setJobId('');
      setPageNumber('');
      setPageType('');
    } catch (error) {
      toast.error('Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="page-job-id" className="font-mono text-sm">Job ID</Label>
            <Select 
              value={jobId} 
              onValueChange={setJobId}
              disabled={!!preselectedJobId}
            >
              <SelectTrigger id="page-job-id">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id} className="font-mono">
                    {job.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-number" className="font-mono text-sm">Page Number</Label>
            <Input
              id="page-number"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="e.g., 1, 2, 3"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-type" className="font-mono text-sm">Page Type</Label>
            <Select value={pageType} onValueChange={setPageType}>
              <SelectTrigger id="page-type">
                <SelectValue placeholder="Select page type" />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-action text-action-foreground hover:bg-action/90">
              {loading ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
