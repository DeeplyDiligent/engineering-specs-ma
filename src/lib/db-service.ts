import { ref, get, set, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { CategoryMeta, PageData, Job } from './types';

declare global {
  interface Window {
    __dbServiceMocks__?: {
      schemas?: Record<string, CategoryMeta>;
      jobs?: Record<string, Job>;
      pages?: Record<string, Record<string, PageData>>;
    };
  }
}

function getMock<T>(path: string[]): T | undefined {
  const mocks = window.__dbServiceMocks__;
  if (!mocks) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = mocks;
  for (const key of path) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[key];
  }
  return node as T;
}

export const dbService = {
  async getSchema(categoryId: string): Promise<CategoryMeta | null> {
    const mock = getMock<CategoryMeta>(['schemas', categoryId]);
    if (mock !== undefined) return mock;
    const schemaRef = ref(db, `schemas/${categoryId}`);
    const snapshot = await get(schemaRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllSchemas(): Promise<Record<string, CategoryMeta>> {
    const mock = getMock<Record<string, CategoryMeta>>(['schemas']);
    if (mock !== undefined) return mock;
    const schemasRef = ref(db, 'schemas');
    const snapshot = await get(schemasRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  async saveSchema(categoryId: string, schema: CategoryMeta): Promise<void> {
    const schemaRef = ref(db, `schemas/${categoryId}`);
    await set(schemaRef, schema);
  },

  async deleteSchema(categoryId: string): Promise<void> {
    const schemaRef = ref(db, `schemas/${categoryId}`);
    await remove(schemaRef);
  },

  async getJob(jobId: string): Promise<Job | null> {
    const mock = getMock<Job>(['jobs', jobId]);
    if (mock !== undefined) return mock;
    const jobRef = ref(db, `jobs/${jobId}`);
    const snapshot = await get(jobRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllJobs(): Promise<Record<string, Job>> {
    const mock = getMock<Record<string, Job>>(['jobs']);
    if (mock !== undefined) return mock;
    const jobsRef = ref(db, 'jobs');
    const snapshot = await get(jobsRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  async saveJob(jobId: string, job: Job): Promise<void> {
    const jobRef = ref(db, `jobs/${jobId}`);
    await set(jobRef, job);
  },

  async deleteJob(jobId: string): Promise<void> {
    const jobRef = ref(db, `jobs/${jobId}`);
    const pagesRef = ref(db, `pages/${jobId}`);
    await remove(pagesRef);
    await remove(jobRef);
  },

  async getPageData(jobId: string, pageNumber: string): Promise<PageData | null> {
    const mock = getMock<PageData>(['pages', jobId, pageNumber]);
    if (mock !== undefined) return mock;
    const pageRef = ref(db, `pages/${jobId}/${pageNumber}`);
    const snapshot = await get(pageRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getJobPages(jobId: string): Promise<Record<string, PageData>> {
    const mock = getMock<Record<string, PageData>>(['pages', jobId]);
    if (mock !== undefined) return mock;
    const pagesRef = ref(db, `pages/${jobId}`);
    const snapshot = await get(pagesRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  async savePageData(jobId: string, pageNumber: string, data: PageData): Promise<void> {
    const pageRef = ref(db, `pages/${jobId}/${pageNumber}`);
    await set(pageRef, data);
  },

  async deletePageData(jobId: string, pageNumber: string): Promise<void> {
    const pageRef = ref(db, `pages/${jobId}/${pageNumber}`);
    await remove(pageRef);
  },

  async uploadFile(path: string, file: File): Promise<string> {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  },

  async deleteFile(path: string): Promise<void> {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
  }
};

