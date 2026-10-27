// Webcam access: getUserMedia + <video> setup with friendly error codes.

export class CameraError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Starts the front camera and plays it into `video`.
 * Resolves with the real stream size (the browser may not honour the ideal size).
 */
export async function startCamera(video, { width, height, frameRate }) {
  if (!window.isSecureContext) {
    throw new CameraError(
      'insecure',
      'The camera only works on https:// or http://localhost. Serve the folder with `npx serve .` and open the localhost URL.'
    );
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('unsupported', 'This browser does not support camera access (getUserMedia).');
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: frameRate },
      },
    });
  } catch (err) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        throw new CameraError(
          'denied',
          'Camera permission was denied. Click the camera icon in the address bar, allow access, then reload.'
        );
      case 'NotFoundError':
      case 'OverconstrainedError':
        throw new CameraError('notfound', 'No webcam was found. Connect a camera and reload.');
      case 'NotReadableError':
        throw new CameraError('busy', 'The webcam is in use by another app (Zoom, Teams, OBS...). Close it and reload.');
      default:
        throw new CameraError('unknown', `Could not start the camera: ${err.message || err.name}`);
    }
  }

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  if (video.readyState < 1) {
    await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
  }
  await video.play();
  return { stream, width: video.videoWidth, height: video.videoHeight };
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}
