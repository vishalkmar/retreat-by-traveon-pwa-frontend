const EmptyState = ({ icon: Icon, title, detail, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    {Icon && (
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={24} />
      </div>
    )}
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
