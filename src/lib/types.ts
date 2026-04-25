export type BlockType = 'file' | 'markdown' | 'checkbox';

export interface Block {
  id: string;
  type: BlockType;
  label: string;
  order: number;
}

export interface PageSchema {
  id: string;
  name: string;
  blocks: Block[];
}

export interface CategoryMeta {
  id: string;
  name: string;
  pages: PageSchema[];
}

export interface PageData {
  jobId: string;
  pageNumber: string;
  categoryId: string;
  values: Record<string, any>;
}

export interface Job {
  id: string;
  categoryId: string;
  createdAt: number;
}
