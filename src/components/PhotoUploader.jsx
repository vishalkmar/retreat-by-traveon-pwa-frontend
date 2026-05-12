import { useEffect, useRef, useState } from 'react';
import { Camera, X, Video } from 'lucide-react';

// Live camera capture only. Auditors should capture evidence from the device
// camera instead of importing existing images from storage.

const PhotoUploader = ({ existing = [], pending = [], onAdd, onRemoveExisting, onRemovePending, max = 10 }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const slotsLeft = max - existing.length - pending.length;

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera is not available in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch {
        setCameraError('Camera permission is required for live capture.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || slotsLeft <= 0) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `live-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onAdd([file]);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-950">
        {cameraError ? (
          <div className="grid aspect-[4/3] place-items-center p-4 text-center text-sm text-white">
            <div>
              <Video className="mx-auto mb-2" size={24} />
              {cameraError}
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full object-cover"
            playsInline
            muted
          />
        )}
      </div>

      <button
        type="button"
        disabled={!cameraReady || slotsLeft <= 0}
        onClick={capture}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
      >
        <Camera size={16} /> Live capture
      </button>

      <p className="mt-2 text-[11px] text-slate-500">
        {slotsLeft} of {max} slots remaining.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {existing.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {pending.map((file, idx) => (
          <div key={`${file.name}-${idx}`} className="relative aspect-square overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">new</span>
            <button
              type="button"
              onClick={() => onRemovePending(idx)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUploader;
