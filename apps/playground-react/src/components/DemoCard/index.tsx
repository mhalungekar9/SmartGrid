import type { HTMLAttributes, ReactNode } from "react";

interface DemoCardProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  title: string;
  description: string;
  className?: string;
  action?: ReactNode;
  headerClassName?: string;
  children: ReactNode;
}

export function DemoCard({ id, title, description, className, action, headerClassName, children, ...sectionProps }: DemoCardProps) {
  return (
    <section id={id} className={`demo-card${className ? ` ${className}` : ""}`} {...sectionProps}>
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
