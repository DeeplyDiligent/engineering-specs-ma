import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dbService } from '@/lib/db-service';
import type { CategoryMeta } from '@/lib/types';
import { toast } from 'sonner';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: (jobId: string, categoryId: string) => void;
}

export function CreateJobDialog({ open, onOpenChange, onJobCreated }: CreateJobDialogProps) {
  const [jobId, setJobId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const schemas = await dbService.getAllSchemas();
      setCategories(Object.values(schemas));
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId.trim() || !categoryId) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const existingJob = await dbService.getJob(jobId);
      if (existingJob) {
        toast.error('Job ID already exists');
        setLoading(false);
        return;
      }

      await dbService.saveJob(jobId, {
        id: jobId,
        categoryId,
        createdAt: Date.now()
      });

      toast.success('Job created successfully');
      onOpenChange(false);
      onJobCreated(jobId, categoryId);
      setJobId('');
      setCategoryId('');
    } catch (error) {
      toast.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="job-id" className="font-mono text-sm">Job ID</Label>
            <Input
              id="job-id"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="e.g., JOB-001"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="font-mono text-sm">Job Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
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
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
