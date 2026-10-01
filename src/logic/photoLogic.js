// Camera + image helpers. Photos are downscaled JPEG data URLs (~40-120KB) so ~30 fit in localStorage.
const MAX_DIM = 960;
const QUALITY = 0.7;

export const cameraSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

export function startCamera() {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
}

export function stopCamera(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

function drawScaled(source, w, h) {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

export const capturePhoto = video => drawScaled(video, video.videoWidth, video.videoHeight);

// Fallback: a File from <input type=file> -> downscaled data URL
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { try { resolve(drawScaled(img, img.naturalWidth, img.naturalHeight)); } catch (e) { reject(e); } URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}
