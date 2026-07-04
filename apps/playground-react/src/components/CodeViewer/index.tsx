interface CodeViewerProps {
  code: string;
}

const tokenPattern =
  /(".*?"|'.*?'|`[\s\S]*?`|\b(?:const|let|return|rows|columns|GridNexa|true|false|undefined|console|log|fetchRows|setSelectedRows)\b|[{}[\]()<>=/]+|\b\d+\b)/g;

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

export function CodeViewer({ code }: CodeViewerProps) {
  return (
    <pre className="code-viewer">
      <code>{highlightCode(code)}</code>
    </pre>
  );
}
