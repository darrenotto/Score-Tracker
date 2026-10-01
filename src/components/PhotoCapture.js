import { h, clear, openOverlay, toast } from '../dom.js';
import { cameraSupported, startCamera, stopCamera, capturePhoto, fileToDataUrl } from '../logic/photoLogic.js';

// Opens an in-app camera. Calls onSave(dataUrl) when the user confirms a photo.
// Falls back to the device's file/camera picker if getUserMedia is unavailable or denied.
export function openPhotoCapture(onSave) {
  let stream = null;
  const body = h('div', { class: 'camera' });
  const ov = openOverlay('Take photo', body, 950);
  const closeAll = () => { stopCamera(stream); ov.close(); };
  // the overlay's own ✕ button removes the layer; make sure the camera stops too
  ov.body.parentNode.querySelector('.overlay-bar button').addEventListener('click', () => stopCamera(stream));

  const filePicker = () => h('label', { class: 'button-like' }, '📁 Choose / take photo',
    h('input', {
      type: 'file', accept: 'image/*', capture: 'environment', hidden: true,
      onchange: e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        fileToDataUrl(f).then(showPreview).catch(() => toast('Could not read that image'));
      },
    }));

  function showPreview(dataUrl) {
    stopCamera(stream); stream = null;
    clear(body);
    body.append(
      h('img', { class: 'preview', src: dataUrl, alt: 'Photo preview' }),
      h('div', { class: 'row' },
        h('button', { onclick: live }, '↺ Retake'),
        h('button', { class: 'primary', onclick: () => { onSave(dataUrl); closeAll(); } }, '✓ Use photo')));
  }

  function fallback(msg) {
    clear(body);
    body.append(h('p', { class: 'muted' }, msg), filePicker());
  }

  function live() {
    clear(body);
    if (!cameraSupported()) return fallback('Camera not available in this browser.');
    const video = h('video', { autoplay: true, playsInline: true, muted: true });
    video.setAttribute('playsinline', '');
    video.muted = true;
    body.append(video, h('div', { class: 'row' },
      h('button', { class: 'shutter', 'aria-label': 'Capture', onclick: () => video.videoWidth && showPreview(capturePhoto(video)) }, '● Capture'),
      filePicker()));
    startCamera().then(s => {
      if (!document.body.contains(video)) { stopCamera(s); return; }   // overlay closed while permission prompt was open
      stream = s; video.srcObject = s; video.play();
    }).catch(() => fallback('Camera permission denied or unavailable. You can pick a photo instead.'));
  }

  live();
}
