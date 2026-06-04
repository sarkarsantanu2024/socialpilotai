export function PageHeader({
  title,
  subtitle,
  phase,
  actions,
}: {
  title: string;
  subtitle?: string;
  phase?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {phase && (
          <span className="chip bg-brand-50 text-brand-700 mb-2">{phase}</span>
        )}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
