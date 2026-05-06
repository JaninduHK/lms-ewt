import api from './api';

// Direct browser → Cloudinary upload using a signature minted by our backend.
// Bypasses Vercel's 4.5 MB request body limit entirely.
export async function uploadToCloudinary(file, folder, onProgress) {
  if (!file) throw new Error('No file provided');

  const sigRes = await api.post('/uploads/sign', { folder });
  const { timestamp, signature, cloudName, apiKey, folder: folderPath } = sigRes.data;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folderPath);

  // XHR (rather than fetch) so we can report progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    xhr.upload.addEventListener('progress', (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          bytes: data.bytes,
          format: data.format,
          resourceType: data.resource_type,
          originalFilename: data.original_filename,
        });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.send(formData);
  });
}
