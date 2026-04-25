import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  PencilSimple, 
  FloppyDisk, 
  ArrowLeft, 
  Copy, 
  Check, 
  Download 
} from '@phosphor-icons/react';
import { QRCodeCanvas } from 'qrcode.react';
import type { PageSchema, PageData, Block } from '@/lib/types';
import { dbService } from '@/lib/db-service';
import { toast } from 'sonner';

export function PageDetail() {
  const { jobId, pageNumber } = useParams<{ jobId: string; pageNumber: string }>();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [pageSchema, setPageSchema] = useState<PageSchema | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const pageUrl = `${window.location.origin}/page/${jobId}/${pageNumber}`;

  useEffect(() => {
    if (jobId && pageNumber) {
      loadPageData();
    }
  }, [jobId, pageNumber]);

  const loadPageData = async () => {
    if (!jobId || !pageNumber) return;

    try {
      const data = await dbService.getPageData(jobId, pageNumber);
      if (!data) {
        toast.error('Page not found');
        navigate('/');
        return;
      }

      const schema = await dbService.getSchema(data.categoryId);
      if (!schema) {
        toast.error('Schema not found');
        navigate('/');
        return;
      }

      const foundPageSchema = schema.pages.find(p => {
        const pageDataBlocks = Object.keys(data.values);
        return p.blocks.some(b => pageDataBlocks.includes(b.id));
      });

      if (!foundPageSchema) {
        toast.error('Page schema not found');
        navigate('/');
        return;
      }

      setPageData(data);
      setPageSchema(foundPageSchema);
      setValues(data.values);
    } catch (error) {
      toast.error('Failed to load page');
      navigate('/');
    }
  };

  const handleSave = async () => {
    if (!jobId || !pageNumber || !pageData) return;
    
    setLoading(true);
    try {
      await dbService.savePageData(jobId, pageNumber, {
        ...pageData,
        values
      });
      toast.success('Changes saved successfully');
      setIsEditing(false);
      loadPageData();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (blockId: string, file: File) => {
    if (!jobId || !pageNumber) return;
    
    setUploading(prev => new Set(prev).add(blockId));
    try {
      const path = `${jobId}/${pageNumber}/${blockId}/${file.name}`;
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${jobId}-${pageNumber}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded');
    });
  };

  if (!pageData || !pageSchema) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const sortedBlocks = [...pageSchema.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-8 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2 -ml-2 mb-2"
          >
            <ArrowLeft /> Back to Search
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{pageSchema.name}</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {jobId} / Page {pageNumber}
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
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <Card className="p-6 space-y-6 mb-8">
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

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Share This Page</h3>
          <Separator className="mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Direct Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={pageUrl}
                    readOnly
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="gap-2"
                  >
                    {copied ? <Check className="text-green-500" /> : <Copy />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">QR Code</Label>
                <div className="flex flex-col items-center gap-4">
                  <div ref={qrRef} className="p-4 bg-white rounded-lg">
                    <QRCodeCanvas
                      value={pageUrl}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <Button
                    onClick={handleDownloadQR}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download /> Download QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
