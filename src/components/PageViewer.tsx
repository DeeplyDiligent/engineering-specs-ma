import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PencilSimple, FloppyDisk } from '@phosphor-icons/react';
import type { PageSchema, PageData, Block } from '@/lib/types';
import { dbService } from '@/lib/db-service';
import { toast } from 'sonner';

interface PageViewerProps {
  pageData: PageData;
  pageSchema: PageSchema;
  onUpdate: () => void;
}

export function PageViewer({ pageData, pageSchema, onUpdate }: PageViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState(pageData.values);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    setLoading(true);
    try {
      await dbService.savePageData(pageData.jobId, pageData.pageNumber, {
        ...pageData,
        values
      });
      toast.success('Changes saved successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (blockId: string, file: File) => {
    setUploading(prev => new Set(prev).add(blockId));
    try {
      const path = `${pageData.jobId}/${pageData.pageNumber}/${blockId}/${file.name}`;
      const url = await dbService.uploadFile(path, file);
      setValues(prev => ({ ...prev, [blockId]: url }));
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(prev => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  };

  const sortedBlocks = [...pageSchema.blocks].sort((a, b) => a.order - b.order);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{pageSchema.name}</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {pageData.jobId} / Page {pageData.pageNumber}
          </p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="gap-2"
            variant="outline"
          >
            <PencilSimple /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setValues(pageData.values);
                setIsEditing(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="gap-2 bg-action text-action-foreground hover:bg-action/90"
            >
              <FloppyDisk /> {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-6">
        {sortedBlocks.map((block: Block) => (
          <div key={block.id} className="space-y-2">
            <Label className="font-mono text-sm font-medium">{block.label}</Label>
            
            {block.type === 'file' && (
              <div className="space-y-2">
                {isEditing ? (
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(block.id, file);
                    }}
                    disabled={uploading.has(block.id)}
                  />
                ) : null}
                {values[block.id] && (
                  <div className="p-3 bg-muted rounded-md">
                    <a 
                      href={values[block.id]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      View File
                    </a>
                  </div>
                )}
                {!values[block.id] && !isEditing && (
                  <p className="text-sm text-muted-foreground">No file uploaded</p>
                )}
              </div>
            )}

            {block.type === 'markdown' && (
              isEditing ? (
                <Textarea
                  value={values[block.id] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [block.id]: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="p-4 bg-muted rounded-md min-h-[100px] whitespace-pre-wrap">
                  {values[block.id] || <span className="text-muted-foreground">No content</span>}
                </div>
              )
            )}

            {block.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={values[block.id] || false}
                  onCheckedChange={(checked) => 
                    isEditing && setValues(prev => ({ ...prev, [block.id]: checked }))
                  }
                  disabled={!isEditing}
                  id={block.id}
                />
                <label 
                  htmlFor={block.id}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {values[block.id] ? 'Checked' : 'Unchecked'}
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
