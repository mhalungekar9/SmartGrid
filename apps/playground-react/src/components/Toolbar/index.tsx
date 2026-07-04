interface ToolbarProps {
  title: string;
  items: string[];
}

export function Toolbar({ title, items }: ToolbarProps) {
  return (
    <div className="feature-toolbar">
      <strong>{title}</strong>
      <div>
        {items.map((item) => (
          <span className="badge text-bg-secondary" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
