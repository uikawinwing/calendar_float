type ShowdownConverterConstructor = new (options?: Record<string, unknown>) => { makeHtml(input: string): string };

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createMarkdownConverter(hostWindow: Window & typeof globalThis): { makeHtml(input: string): string } | null {
  const maybeShowdown = (
    hostWindow as unknown as {
      showdown?: {
        Converter?: ShowdownConverterConstructor;
      };
    }
  ).showdown;
  const converterCtor = maybeShowdown?.Converter ?? null;
  return converterCtor
    ? new converterCtor({
        simpleLineBreaks: true,
        strikethrough: true,
        tables: true,
        ghCompatibleHeaderId: true,
        openLinksInNewWindow: true,
      })
    : null;
}

function stripDangerousMarkdownHtml(html: string): string {
  return html
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function renderBasicMarkdownContent(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);
  if (!blocks.length) {
    return '<p>（暂无内容）</p>';
  }
  return blocks
    .map(block => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 6);
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      const lines = block
        .split(/\n/)
        .map(line => line.trim())
        .filter(Boolean);
      if (lines.length && lines.every(line => /^[-*+]\s+/.test(line))) {
        return `<ul>${lines.map(line => `<li>${escapeHtml(line.replace(/^[-*+]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (lines.length && lines.every(line => /^\d+[.)]\s+/.test(line))) {
        return `<ol>${lines.map(line => `<li>${escapeHtml(line.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      }
      if (lines.length && lines.every(line => /^>\s?/.test(line))) {
        return `<blockquote>${lines.map(line => escapeHtml(line.replace(/^>\s?/, ''))).join('<br>')}</blockquote>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

export function createRenderMarkdownContent(
  hostWindow: Window & typeof globalThis,
  scriptName: string,
): (markdown: string) => string {
  const markdownConverter = createMarkdownConverter(hostWindow);
  return (markdown: string): string => {
    const text = String(markdown || '').trim();
    if (!text) {
      return '<p>（暂无内容）</p>';
    }

    if (markdownConverter) {
      try {
        return stripDangerousMarkdownHtml(markdownConverter.makeHtml(text));
      } catch (error) {
        console.warn(`[${scriptName}] showdown Markdown 渲染失败`, error);
      }
    }

    return renderBasicMarkdownContent(text);
  };
}
