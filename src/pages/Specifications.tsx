import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Plus, Gear, MagnifyingGlass, X, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { CreatePageDialog } from '@/components/CreatePageDialog';
import { dbService } from '@/lib/db-service';
import { initializeSeedData } from '@/lib/seed-data';
import type { PageData, CategoryMeta, PageSchema } from '@/lib/types';
import { toast } from 'sonner';

interface PageInfo {
  pageNumber: string;
  pageName: string;
  pageData: PageData;
}

export function Specifications() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Array<{ id: string; categoryId: string }>>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [pages, setPages] = useState<PageInfo[]>([]);
  
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

  const loadPagesForJob = useCallback(async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId) || await dbService.getJob(jobId);
      if (!job) {
        setPages([]);
        return;
      }

      const pagesData = await dbService.getJobPages(jobId);
      const schema = await dbService.getSchema(job.categoryId);
      
      const pageInfos: PageInfo[] = Object.entries(pagesData)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([pageNum, pageData]) => {
          const pageName = resolvePageName(pageData, schema);
          return {
            pageNumber: pageNum,
            pageName,
            pageData
          };
        });
      
      setPages(pageInfos);
    } catch (error) {
      toast.error('Failed to load pages');
      setPages([]);
    }
  }, [jobs]);

  useEffect(() => {
    if (selectedJobId) {
      loadPagesForJob(selectedJobId);
    } else {
      setPages([]);
    }
  }, [selectedJobId, loadPagesForJob]);

  const resolvePageName = (pageData: PageData, schema: CategoryMeta | null): string => {
    if (!schema) return 'Unknown';
    const pageDataBlocks = Object.keys(pageData.values);
    const foundPage = schema.pages.find((p: PageSchema) => 
      p.blocks.some(b => pageDataBlocks.includes(b.id))
    );
    return foundPage?.name || 'Unknown';
  };

  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return jobs;
    const query = jobSearchQuery.toLowerCase();
    return jobs.filter(job => 
      job.id.toLowerCase().includes(query) || 
      job.categoryId.toLowerCase().includes(query)
    );
  }, [jobs, jobSearchQuery]);

  const filteredPages = useMemo(() => {
    if (!pageSearchQuery.trim()) return pages;
    const query = pageSearchQuery.toLowerCase();
    return pages.filter(page => 
      page.pageNumber.toLowerCase().includes(query) ||
      page.pageName.toLowerCase().includes(query)
    );
  }, [pages, pageSearchQuery]);

  const loadJobs = async () => {
    try {
      const jobsData = await dbService.getAllJobs();
      setJobs(Object.values(jobsData));
    } catch (error) {
      toast.error('Failed to load jobs');
    }
  };

  const handleViewPage = (pageNumber: string) => {
    navigate(`/page/${selectedJobId}/${pageNumber}`);
  };

  const handleJobCreated = (jobId: string, categoryId: string) => {
    loadJobs();
    setSelectedJobId(jobId);
    setCreatePagePreselect({ jobId, categoryId });
    setCreatePageOpen(true);
  };

  const handlePageCreated = (jobId: string, _pageNumber: string) => {
    loadJobs();
    setSelectedJobId(jobId);
    loadPagesForJob(jobId);
    setCreatePagePreselect({});
  };

  const handleDeletePage = async (pageNumber: string) => {
    if (!selectedJobId) return;
    
    const confirmed = window.confirm(`Delete page ${pageNumber}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await dbService.deletePageData(selectedJobId, pageNumber);
      toast.success('Page deleted successfully');
      await loadPagesForJob(selectedJobId);
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const handleReorderPage = async (pageNumber: string, direction: 'up' | 'down') => {
    if (!selectedJobId) return;

    const currentIndex = pages.findIndex(p => p.pageNumber === pageNumber);
    if (currentIndex === -1) return;
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= pages.length) return;

    const pageA = pages[currentIndex];
    const pageB = pages[swapIndex];

    try {
      const newPageAData: PageData = { ...pageA.pageData, pageNumber: pageB.pageNumber };
      const newPageBData: PageData = { ...pageB.pageData, pageNumber: pageA.pageNumber };

      await dbService.savePageData(selectedJobId, pageB.pageNumber, newPageAData);
      await dbService.savePageData(selectedJobId, pageA.pageNumber, newPageBData);

      toast.success('Pages reordered');
      await loadPagesForJob(selectedJobId);
    } catch (error) {
      toast.error('Failed to reorder pages');
    }
  };

  const getNextPageNumber = (): string => {
    if (pages.length === 0) return '1';
    const maxNum = Math.max(...pages.map(p => parseInt(p.pageNumber) || 0));
    return String(maxNum + 1);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Specifications</h1>
              <p className="text-sm text-muted-foreground mt-1">Engineering CMS</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCreateJobOpen(true)}
                className="gap-2 bg-action text-action-foreground hover:bg-action/90"
              >
                <Plus /> New Job
              </Button>
              <Button
                onClick={() => navigate('/schema-editor')}
                variant="outline"
                className="gap-2"
              >
                <Gear /> Schema Editor
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <Card className="p-6 space-y-6 mb-8">
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
        </Card>

        {selectedJobId ? (
          <Card className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Pages</h2>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {selectedJobId} {selectedJob ? `· ${selectedJob.categoryId}` : ''}
                </p>
              </div>
              <Button
                onClick={() => {
                  const job = jobs.find(j => j.id === selectedJobId);
                  setCreatePagePreselect({ 
                    jobId: selectedJobId, 
                    categoryId: job?.categoryId 
                  });
                  setCreatePageOpen(true);
                }}
                className="gap-2 bg-action text-action-foreground hover:bg-action/90"
              >
                <Plus /> Add Page
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="page-search" className="font-mono text-sm">Page</Label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="page-search"
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="pl-9 font-mono text-sm"
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
            </div>

            <div className="space-y-2">
              {filteredPages.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {pages.length === 0 
                      ? 'No pages yet. Click "Add Page" to create one.' 
                      : 'No pages match your search.'}
                  </p>
                </div>
              ) : (
                filteredPages.map((page, index) => {
                  const originalIndex = pages.findIndex(p => p.pageNumber === page.pageNumber);
                  return (
                    <Card 
                      key={page.pageNumber} 
                      className="p-4 hover:border-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderPage(page.pageNumber, 'up')}
                            disabled={originalIndex === 0}
                            className="h-7 w-7 p-0"
                          >
                            <ArrowUp size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderPage(page.pageNumber, 'down')}
                            disabled={originalIndex === pages.length - 1}
                            className="h-7 w-7 p-0"
                          >
                            <ArrowDown size={14} />
                          </Button>
                        </div>

                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => handleViewPage(page.pageNumber)}
                        >
                          <p className="font-mono text-sm font-medium">
                            {page.pageNumber} - {page.pageName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPage(page.pageNumber)}
                            className="gap-1"
                          >
                            <Eye size={14} /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePage(page.pageNumber)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Select a job to view and manage its pages
            </p>
          </Card>
        )}
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
        nextPageNumber={getNextPageNumber()}
        onPageCreated={handlePageCreated}
      />
    </div>
  );
}
