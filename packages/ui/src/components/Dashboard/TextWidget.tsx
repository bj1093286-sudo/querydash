import type { ReactNode } from 'react';

export interface TextWidgetProps {
  text: string;
}

// Hand-rolled, dependency-free markdown-lite renderer that builds React nodes
// directly (never dangerouslySetInnerHTML), so untrusted widget text can never
// inject markup.
function renderInline(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(line))) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={`${keyPrefix}-${i++}`} className="rounded bg-qd-neutral-100 px-1 font-qd-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes;
}

export function TextWidget({ text }: TextWidgetProps) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList(key: string) {
    if (listBuffer.length === 0) return;
    const items = listBuffer;
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-5">
        {items.map((item, idx) => (
          <li key={idx}>{renderInline(item, `${key}-${idx}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    flushList(`list-${idx}`);
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={idx} className="text-base font-semibold text-qd-neutral-800">
          {renderInline(trimmed.slice(3), `h3-${idx}`)}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={idx} className="text-lg font-semibold text-qd-neutral-800">
          {renderInline(trimmed.slice(2), `h2-${idx}`)}
        </h2>
      );
    } else if (trimmed.length > 0) {
      blocks.push(
        <p key={idx} className="text-sm text-qd-neutral-700">
          {renderInline(trimmed, `p-${idx}`)}
        </p>
      );
    }
  });
  flushList('list-end');

  return <div className="qd-root space-y-1.5 p-3">{blocks}</div>;
}
