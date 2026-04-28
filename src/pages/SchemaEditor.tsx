import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash, ArrowUp, ArrowDown, FileArrowUp, TextAa, CheckSquare, ArrowLeft } from '@phosphor-icons/react';
import { dbService } from '@/lib/db-service';
import type { CategoryMeta, PageSchema, Block, BlockType } from '@/lib/types';
import { toast } from 'sonner';

export function SchemaEditor() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [editingPage, setEditingPage] = useState<PageSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'categories' | 'pages' | 'editPage' | 'newCategory' | 'newPage'>('categories');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPageName, setNewPageName] = useState('');
  const [newPageId, setNewPageId] = useState('');

  const selectedCategory = useMemo(() =>
    categories.find(c => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const schemas = await dbService.getAllSchemas();
      setCategories(Object.values(schemas));
    } catch (error) {
      toast.error('Failed to load schemas');
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategoryId(categoryId);
      setView('pages');
    }
  };

  const handleSelectPage = (pageId: string) => {
    const page = selectedCategory?.pages.find(p => p.id === pageId);
    if (page) {
      setSelectedPageId(pageId);
      setEditingPage(JSON.parse(JSON.stringify(page)));
      setView('editPage');
    }
  };

  const handleAddBlock = (type: BlockType) => {
    if (!editingPage) return;
    
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      label: `New ${type} field`,
      order: editingPage.blocks.length
    };
    
    setEditingPage({
      ...editingPage,
      blocks: [...editingPage.blocks, newBlock]
    });
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<Block>) => {
    if (!editingPage) return;
    
    setEditingPage({
      ...editingPage,
      blocks: editingPage.blocks.map(b => 
        b.id === blockId ? { ...b, ...updates } : b
      )
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!editingPage) return;
    
    setEditingPage({
      ...editingPage,
      blocks: editingPage.blocks.filter(b => b.id !== blockId)
    });
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!editingPage) return;
    
    const blocks = [...editingPage.blocks];
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }
    
    blocks.forEach((block, idx) => {
      block.order = idx;
    });
    
    setEditingPage({
      ...editingPage,
      blocks
    });
  };

  const handleSavePage = async () => {
    if (!editingPage || !selectedCategory) return;
    
    setLoading(true);
    try {
      const updatedPages = selectedCategory.pages.map(p => 
        p.id === editingPage.id ? editingPage : p
      );
      
      await dbService.saveSchema(selectedCategoryId, {
        ...selectedCategory,
        pages: updatedPages
      });
      
      toast.success('Page schema saved successfully');
      await loadCategories();
      setView('pages');
    } catch (error) {
      toast.error('Failed to save page schema');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryId.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const newCategory: CategoryMeta = {
        id: newCategoryId,
        name: newCategoryName,
        pages: []
      };
      
      await dbService.saveSchema(newCategoryId, newCategory);
      toast.success('Category created successfully');
      await loadCategories();
      setNewCategoryName('');
      setNewCategoryId('');
      setView('categories');
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageName.trim() || !newPageId.trim() || !selectedCategory) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const newPage: PageSchema = {
        id: newPageId,
        name: newPageName,
        blocks: []
      };
      
      const updatedCategory = {
        ...selectedCategory,
        pages: [...selectedCategory.pages, newPage]
      };
      
      await dbService.saveSchema(selectedCategoryId, updatedCategory);
      toast.success('Page created successfully');
      await loadCategories();
      setNewPageName('');
      setNewPageId('');
      setView('pages');
    } catch (error) {
      toast.error('Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = window.confirm('Delete this category? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      const allJobs = await dbService.getAllJobs();
      const jobList = Object.values(allJobs);

      const hasJobs = jobList.some(j => j.categoryId === categoryId);
      if (hasJobs) {
        toast.error('Cannot delete: there are jobs in this category');
        return;
      }

      const allJobPages = await Promise.all(jobList.map(job => dbService.getJobPages(job.id)));
      const hasPages = allJobPages.some(jobPages =>
        Object.values(jobPages).some(p => p.categoryId === categoryId)
      );
      if (hasPages) {
        toast.error('Cannot delete: there are pages created for this category');
        return;
      }

      await dbService.deleteSchema(categoryId);
      toast.success('Category deleted successfully');
      await loadCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePageSchema = async (pageId: string) => {
    if (!selectedCategory) return;

    const confirmed = window.confirm('Delete this page schema? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      const allJobs = await dbService.getAllJobs();
      const jobList = Object.values(allJobs);
      const allJobPages = await Promise.all(jobList.map(job => dbService.getJobPages(job.id)));
      const hasPages = allJobPages.some(jobPages =>
        Object.values(jobPages).some(p => p.pageSchemaId === pageId)
      );
      if (hasPages) {
        toast.error('Cannot delete: there are pages created for this page schema');
        return;
      }

      const updatedPages = selectedCategory.pages.filter(p => p.id !== pageId);
      await dbService.saveSchema(selectedCategoryId, { ...selectedCategory, pages: updatedPages });
      toast.success('Page schema deleted successfully');
      await loadCategories();
    } catch (error) {
      toast.error('Failed to delete page schema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Schema Editor</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage categories, pages, and blocks</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <Card className="p-8">
          {view === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <p className="text-muted-foreground">Select a category to edit its pages</p>
                <Button onClick={() => setView('newCategory')} className="gap-2 bg-action text-action-foreground hover:bg-action/90 w-full md:w-auto">
                  <Plus /> New Category
                </Button>
              </div>
              <div className="grid gap-4">
                {categories.map(cat => (
                  <Card 
                    key={cat.id} 
                    className="p-6 cursor-pointer hover:border-accent transition-colors"
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{cat.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono mt-1">{cat.id}</p>
                        <p className="text-sm text-muted-foreground mt-2">{cat.pages.length} pages</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {view === 'newCategory' && (
            <div className="space-y-6">
              <Button variant="outline" onClick={() => setView('categories')} className="gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="cat-id" className="font-mono text-sm">Category ID</Label>
                  <Input
                    id="cat-id"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    placeholder="e.g., engineering_projects"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Category Name</Label>
                  <Input
                    id="cat-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Engineering Projects"
                  />
                </div>
                <Button 
                  onClick={handleCreateCategory} 
                  disabled={loading}
                  className="w-full bg-action text-action-foreground hover:bg-action/90"
                >
                  {loading ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </div>
          )}

          {view === 'pages' && selectedCategory && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setView('categories')} className="gap-2">
                  <ArrowLeft size={16} /> Back to Categories
                </Button>
                <Button onClick={() => setView('newPage')} className="gap-2 bg-action text-action-foreground hover:bg-action/90">
                  <Plus /> New Page
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-xl">{selectedCategory.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">{selectedCategory.id}</p>
              </div>
              <Separator />
              <div className="grid gap-4">
                {selectedCategory.pages.map(page => (
                  <Card 
                    key={page.id} 
                    className="p-6 cursor-pointer hover:border-accent transition-colors"
                    onClick={() => handleSelectPage(page.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{page.name}</h4>
                        <p className="text-sm text-muted-foreground font-mono mt-1">{page.id}</p>
                        <p className="text-sm text-muted-foreground mt-2">{page.blocks.length} blocks</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDeletePageSchema(page.id); }}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {view === 'newPage' && selectedCategory && (
            <div className="space-y-6">
              <Button variant="outline" onClick={() => setView('pages')} className="gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="page-id" className="font-mono text-sm">Page ID</Label>
                  <Input
                    id="page-id"
                    value={newPageId}
                    onChange={(e) => setNewPageId(e.target.value)}
                    placeholder="e.g., site_plan"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-name">Page Name</Label>
                  <Input
                    id="page-name"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="e.g., Site Plan"
                  />
                </div>
                <Button 
                  onClick={handleCreatePage} 
                  disabled={loading}
                  className="w-full bg-action text-action-foreground hover:bg-action/90"
                >
                  {loading ? 'Creating...' : 'Create Page'}
                </Button>
              </div>
            </div>
          )}

          {view === 'editPage' && editingPage && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setView('pages')} className="gap-2">
                  <ArrowLeft size={16} /> Back to Pages
                </Button>
                <Button 
                  onClick={handleSavePage} 
                  disabled={loading}
                  className="bg-action text-action-foreground hover:bg-action/90"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              
              <div>
                <h3 className="font-semibold text-xl">{editingPage.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{editingPage.id}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Blocks</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAddBlock('file')} className="gap-2">
                      <FileArrowUp size={16} /> File
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddBlock('markdown')} className="gap-2">
                      <TextAa size={16} /> Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddBlock('checkbox')} className="gap-2">
                      <CheckSquare size={16} /> Checkbox
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {editingPage.blocks.sort((a, b) => a.order - b.order).map((block, index) => (
                    <Card key={block.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveBlock(block.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveBlock(block.id, 'down')}
                            disabled={index === editingPage.blocks.length - 1}
                          >
                            <ArrowDown size={16} />
                          </Button>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            {block.type === 'file' && <FileArrowUp size={20} className="text-muted-foreground" />}
                            {block.type === 'markdown' && <TextAa size={20} className="text-muted-foreground" />}
                            {block.type === 'checkbox' && <CheckSquare size={20} className="text-muted-foreground" />}
                            <span className="text-sm font-mono text-muted-foreground">{block.type}</span>
                          </div>
                          
                          <Input
                            value={block.label}
                            onChange={(e) => handleUpdateBlock(block.id, { label: e.target.value })}
                            placeholder="Field label"
                            className="font-mono"
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {editingPage.blocks.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No blocks yet. Add a block to get started.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
