import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const safeContent =
    typeof content === 'string' && content.trim() && content.trim() !== 'undefined' && content.trim() !== 'null'
      ? content
      : '';

  if (!safeContent) {
    return null;
  }

  return (
    <div className={`text-sm leading-relaxed text-slate-200 space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-slate-50 pt-2 pb-1 border-b border-slate-800/80">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-slate-100 pt-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-indigo-200 pt-1">{children}</h3>
          ),
          p: ({ children }) => <p className="text-slate-200/95 leading-7">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 text-slate-200/95">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 text-slate-200/95">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="rounded-lg bg-slate-900/70 border border-indigo-500/20 px-4 py-3 text-slate-300 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-900/90 text-slate-200">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold border-b border-slate-800">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-b border-slate-800/60 text-slate-300">{children}</td>,
          code: ({ className: codeClass, children }) => {
            const isBlock = Boolean(codeClass);
            if (!isBlock) {
              return (
                <code className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/70 text-indigo-200">
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto rounded-lg bg-[#050814] border border-slate-800 p-4 font-mono text-xs text-slate-200 leading-6">
                <code>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            >
              {children}
            </a>
          ),
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
