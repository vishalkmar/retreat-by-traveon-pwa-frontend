import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload, X, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const FIVE_MB = 5 * 1024 * 1024;

const blobToImage = (blob) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    resolve(img);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Could not read image'));
  };
  img.src = url;
});

const canvasToBlob = (canvas, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, 'image/jpeg', quality);
});

const compressImage = async (file) => {
  if (file.size <= FIVE_MB) return file;

  const img = await blobToImage(file);
  const canvas = document.createElement('canvas');
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

  let blob = null;
  for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
    blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= FIVE_MB) break;
  }
  if (!blob) return file;
  return new File([blob], file.name, { type: 'image/jpeg' });
};

const PhotoUploader = ({
  existing = [],
  pending = [],
  onAdd,
  onRemoveExisting,
  onRemovePending,
  max = 10,
  minimum = 3,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [captured, setCaptured] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const slotsLeft = max - existing.length - pending.length - captured.length;
  const uploadedCount = existing.length + pending.length;
  const needed = Math.max(0, minimum - uploadedCount);

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

  const previews = useMemo(() => pending.map((file) => URL.createObjectURL(file)), [pending]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

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
      const previewUrl = URL.createObjectURL(file);
      setCaptured((items) => [...items, { file, previewUrl }]);
    }, 'image/jpeg', 0.95);
  };

  const uploadCaptured = async (idx) => {
    const item = captured[idx];
    if (!item) return;
    setUploadingIndex(idx);
    try {
      const file = await compressImage(item.file);
      onAdd([file]);
      URL.revokeObjectURL(item.previewUrl);
      setCaptured((items) => items.filter((_, i) => i !== idx));
      toast.success(file.size < item.file.size ? 'Compressed and added' : 'Photo added');
    } catch {
      toast.error('Could not prepare image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeCaptured = (idx) => {
    setCaptured((items) => {
      const item = items[idx];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return items.filter((_, i) => i !== idx);
    });
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
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
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
        {slotsLeft} of {max} slots remaining. Minimum required: {minimum}. {needed > 0 ? `${needed} more uploaded photo${needed > 1 ? 's' : ''} needed.` : 'Minimum met.'}
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
            <img src={previews[idx]} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">ready</span>
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
        {captured.map((item, idx) => (
          <div key={item.previewUrl} className="relative aspect-square overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeCaptured(idx)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={() => uploadCaptured(idx)}
              disabled={uploadingIndex === idx}
              className="absolute inset-x-1 bottom-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-brand-700 shadow disabled:opacity-60"
            >
              {uploadingIndex === idx ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Upload size={12} />
              )}
              Upload
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUploader;
