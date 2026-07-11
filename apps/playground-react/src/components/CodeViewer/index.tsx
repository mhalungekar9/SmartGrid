import { useState } from "react";

interface CodeViewerProps {
  code: string;
  defaultOpen?: boolean;
  label?: string;
}

const tokenPattern =
  /(".*?"|'.*?'|`[\s\S]*?`|\b(?:import|from|type|interface|class|export|function|const|let|return|new|template|selector|standalone|imports|rows|columns|GridNexa|GridNexaVue|GridNexaAngularComponent|createGridNexa|Component|true|false|undefined|console|log|fetchRows|setSelectedRows)\b|[{}[\]()<>=/!:.]+|\b\d+\b)/g;

function getTokenClass(token: string) {
  if (/^["'`]/.test(token)) {
    return "code-token code-token-string";
  }

  if (/^\d+$/.test(token)) {
    return "code-token code-token-number";
  }

  if (/^[{}[\]()<>=/]+$/.test(token)) {
    return "code-token code-token-punctuation";
  }

  return "code-token code-token-keyword";
}

function highlightCode(code: string) {
  const parts = code.trim().split(tokenPattern);

  return parts.map((part, index) => {
    tokenPattern.lastIndex = 0;

    return tokenPattern.test(part) ? (
      <span className={getTokenClass(part)} key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

export function CodeViewer({ code, defaultOpen = false, label = "Code" }: CodeViewerProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="code-viewer-shell">
      <button
        className={`code-toggle${open ? " active" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <i className="bi bi-code-slash" aria-hidden="true" />
        <span>{open ? "Hide code" : label}</span>
      </button>
      {open ? (
        <pre className="code-viewer">
          <code>{highlightCode(code)}</code>
        </pre>
      ) : null}
    </div>
  );
}
