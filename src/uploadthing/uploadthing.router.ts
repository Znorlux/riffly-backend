import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  zipUploader: f({
    blob: {
      maxFileSize: '8GB',
      maxFileCount: 1,
    },
  }).onUploadComplete(({ file }) => {
    const allowedMimeTypes = ['application/zip', 'application/x-zip-compressed'];
    const allowedExtensions = ['.zip'];

    const isMimeOk = allowedMimeTypes.includes(file.type);
    const isExtOk = allowedExtensions.some(ext => file.name.endsWith(ext));

    if (!isMimeOk || !isExtOk) {
      console.warn('❌ Archivo no permitido:', {
        name: file.name,
        type: file.type,
      });
      return;
    }

    console.log('✅ Archivo .zip válido recibido:', {
      name: file.name,
      url: file.ufsUrl,
    });
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
