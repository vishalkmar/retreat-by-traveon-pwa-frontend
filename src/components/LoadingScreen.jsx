const LoadingScreen = ({ label = 'Loading…' }) => (
  <div className="flex flex-1 items-center justify-center p-6">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

export default LoadingScreen;
