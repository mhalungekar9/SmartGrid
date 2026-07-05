import type { ReactNode } from "react";

interface DemoCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  headerClassName?: string;
  children: ReactNode;
}

export function DemoCard({ title, description, action, headerClassName, children }: DemoCardProps) {
  return (
    <section className="demo-card">
      <div className={`demo-card-header${headerClassName ? ` ${headerClassName}` : ""}`}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action ? <div className="demo-card-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
