import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  }).onUploadComplete((data) => {
    console.log('✅ Upload complete', data);
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
