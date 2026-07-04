import type { ReactNode } from "react";

interface DemoCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DemoCard({ title, description, action, children }: DemoCardProps) {
  return (
    <section className="demo-card">
      <div className="demo-card-header">
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
