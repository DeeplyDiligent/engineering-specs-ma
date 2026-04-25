import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Eye, Plus, Gear, MagnifyingGlass, X } from '@phosphor-icons/react';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { CreatePageDialog } from '@/components/CreatePageDialog';
import { dbService } from '@/lib/db-service';
import { initializeSeedData } from '@/lib/seed-data';
import { toast } from 'sonner';

export function Specifications() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Array<{ id: string; categoryId: string }>>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedPageNumber, setSelectedPageNumber] = useState('');
  const [pageNumbers, setPageNumbers] = useState<string[]>([]);
  
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [createPageOpen, setCreatePageOpen] = useState(false);
  const [createPagePreselect, setCreatePagePreselect] = useState<{ jobId?: string; categoryId?: string }>({});
  
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');

  useEffect(() => {
    const init = async () => {
      await initializeSeedData();
      loadJobs();
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadPageNumbers(selectedJobId);
    } else {
      setPageNumbers([]);
      setSelectedPageNumber('');
    }
  }, [selectedJobId]);

  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return jobs;
    const query = jobSearchQuery.toLowerCase();
    return jobs.filter(job => 
      job.id.toLowerCase().includes(query) || 
      job.categoryId.toLowerCase().includes(query)
    );
  }, [jobs, jobSearchQuery]);

  const filteredPageNumbers = useMemo(() => {
    if (!pageSearchQuery.trim()) return pageNumbers;
    const query = pageSearchQuery.toLowerCase();
    return pageNumbers.filter(page => 
      page.toLowerCase().includes(query)
    );
  }, [pageNumbers, pageSearchQuery]);

  const loadJobs = async () => {
    try {
      const jobsData = await dbService.getAllJobs();
      setJobs(Object.values(jobsData));
    } catch (error) {
      toast.error('Failed to load jobs');
    }
  };

  const loadPageNumbers = async (jobId: string) => {
    try {
      const pages = await dbService.getJobPages(jobId);
      setPageNumbers(Object.keys(pages).sort((a, b) => parseInt(a) - parseInt(b)));
    } catch (error) {
      toast.error('Failed to load pages');
    }
  };

  const handleViewPage = async () => {
    if (!selectedJobId || !selectedPageNumber) {
      toast.error('Please select both Job ID and Page Number');
      return;
    }

    navigate(`/page/${selectedJobId}/${selectedPageNumber}`);
  };

  const handleJobCreated = (jobId: string, categoryId: string) => {
    loadJobs();
    setCreatePagePreselect({ jobId, categoryId });
    setCreatePageOpen(true);
  };

  const handlePageCreated = (jobId: string, pageNumber: string) => {
    loadJobs();
    setSelectedJobId(jobId);
    setSelectedPageNumber(pageNumber);
    setCreatePagePreselect({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Specifications</h1>
              <p className="text-sm text-muted-foreground mt-1">Engineering CMS</p>
            </div>
            <Button
              onClick={() => navigate('/schema-editor')}
              variant="outline"
              className="gap-2 w-full md:w-auto"
            >
              <Gear /> Schema Editor
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <Card className="p-6 space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-id" className="font-mono text-sm">Job ID</Label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="job-search"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="pl-9 font-mono text-sm mb-2"
                />
                {jobSearchQuery && (
                  <button
                    onClick={() => setJobSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger id="job-id">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {filteredJobs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No jobs found
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <SelectItem key={job.id} value={job.id} className="font-mono">
                        {job.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-number" className="font-mono text-sm">Page Number</Label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="page-search"
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="pl-9 font-mono text-sm mb-2"
                />
                {pageSearchQuery && (
                  <button
                    onClick={() => setPageSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <Select value={selectedPageNumber} onValueChange={setSelectedPageNumber}>
                <SelectTrigger id="page-number">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPageNumbers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No pages found
                    </div>
                  ) : (
                    filteredPageNumbers.map((num) => (
                      <SelectItem key={num} value={num} className="font-mono">
                        {num}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleViewPage}
              disabled={!selectedJobId || !selectedPageNumber}
              className="gap-2 self-end bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Eye /> View Page
            </Button>

            <div className="flex gap-2 self-end">
              <Button
                onClick={() => setCreateJobOpen(true)}
                variant="outline"
                className="gap-2 flex-1"
              >
                <Plus /> Job
              </Button>
              <Button
                onClick={() => {
                  setCreatePagePreselect({});
                  setCreatePageOpen(true);
                }}
                variant="outline"
                className="gap-2 flex-1"
              >
                <Plus /> Page
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Select a job and page number, then click "View Page" to get started
          </p>
        </Card>
      </main>

      <CreateJobDialog
        open={createJobOpen}
        onOpenChange={setCreateJobOpen}
        onJobCreated={handleJobCreated}
      />

      <CreatePageDialog
        open={createPageOpen}
        onOpenChange={setCreatePageOpen}
        preselectedJobId={createPagePreselect.jobId}
        preselectedCategoryId={createPagePreselect.categoryId}
        onPageCreated={handlePageCreated}
      />
    </div>
  );
}
