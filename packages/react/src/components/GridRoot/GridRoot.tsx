import type { PropsWithChildren } from "react";
import "./GridRoot.css";

export function GridRoot({ children }: PropsWithChildren) {
  return <div className="sg-grid-root">{children}</div>;
}
