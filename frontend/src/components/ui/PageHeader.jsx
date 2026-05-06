export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-midnight-900">{title}</h1>
        {subtitle && <p className="text-midnight-500 mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
