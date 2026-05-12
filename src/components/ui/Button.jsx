const variants = {
  primary: 'bg-brand-700 hover:bg-brand-800 text-white shadow-sm',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  ghost: 'text-brand-700 hover:bg-brand-50',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
  block: 'w-full px-4 py-3 text-base rounded-xl',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) => (
  <button
    type={type}
    disabled={loading || disabled}
    className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    {...rest}
  >
    {loading && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);

export default Button;
