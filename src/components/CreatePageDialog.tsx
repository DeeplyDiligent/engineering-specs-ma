import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  nextPageNumber?: string;
  onPageCreated: (jobId: string, pageNumber: string) => void;
}

export function CreatePageDialog({ 
  open, 
  onOpenChange, 
  preselectedJobId, 
  preselectedCategoryId,
  nextPageNumber,
  onPageCreated 
}: CreatePageDialogProps) {
  const [jobId, setJobId] = useState(preselectedJobId || '');
  const [pageType, setPageType] = useState('');
  const [jobs, setJobs] = useState<Array<{ id: string; categoryId: string }>>([]);
  const [availablePages, setAvailablePages] = useState<PageSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(preselectedCategoryId || '');
  const [computedNextPageNumber, setComputedNextPageNumber] = useState(nextPageNumber || '1');

  useEffect(() => {
    if (open) {
      loadJobs();
      if (preselectedJobId) {
        setJobId(preselectedJobId);
      }
      if (preselectedCategoryId) {
        loadPagesForCategory(preselectedCategoryId);
      }
      if (nextPageNumber) {
        setComputedNextPageNumber(nextPageNumber);
      }
    }
  }, [open, preselectedJobId, preselectedCategoryId, nextPageNumber]);

  useEffect(() => {
    if (jobId && !preselectedCategoryId) {
      loadCategoryForJob(jobId);
    }
    if (jobId && !nextPageNumber) {
      computeNextPageNumber(jobId);
    }
  }, [jobId, preselectedCategoryId, nextPageNumber]);

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

  const computeNextPageNumber = async (jId: string) => {
    try {
      const pagesData = await dbService.getJobPages(jId);
      const pageNums = Object.keys(pagesData).map(n => parseInt(n)).filter(n => !isNaN(n));
      const next = pageNums.length === 0 ? 1 : Math.max(...pageNums) + 1;
      setComputedNextPageNumber(String(next));
    } catch (error) {
      setComputedNextPageNumber('1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId.trim() || !pageType) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Re-compute the next page number at submission time to avoid stale values
      const pagesData = await dbService.getJobPages(jobId);
      const pageNums = Object.keys(pagesData).map(n => parseInt(n)).filter(n => !isNaN(n));
      const pageNumber = String(pageNums.length === 0 ? 1 : Math.max(...pageNums) + 1);

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
        pageSchemaId: selectedPage.id,
        values: initialValues
      });

      toast.success('Page created successfully');
      onOpenChange(false);
      onPageCreated(jobId, pageNumber);
      if (!preselectedJobId) setJobId('');
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
            <Label className="font-mono text-sm">Page Number</Label>
            <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm">
              {computedNextPageNumber}
            </div>
            <p className="text-xs text-muted-foreground">Automatically assigned</p>
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
