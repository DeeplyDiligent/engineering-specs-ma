import { ref, get, set, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { CategoryMeta, PageData, Job } from './types';

export const dbService = {
  async getSchema(categoryId: string): Promise<CategoryMeta | null> {
    const schemaRef = ref(db, `schemas/${categoryId}`);
    const snapshot = await get(schemaRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllSchemas(): Promise<Record<string, CategoryMeta>> {
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
    const jobRef = ref(db, `jobs/${jobId}`);
    const snapshot = await get(jobRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllJobs(): Promise<Record<string, Job>> {
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
    const pageRef = ref(db, `pages/${jobId}/${pageNumber}`);
    const snapshot = await get(pageRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getJobPages(jobId: string): Promise<Record<string, PageData>> {
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
