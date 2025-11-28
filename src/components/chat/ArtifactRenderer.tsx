import React from "react";

interface ArtifactRendererProps {
  content: string;
}

// Enhanced Markdown renderer for artifacts
export function ArtifactRenderer({ content }: ArtifactRendererProps) {
  const lines = content.split("\n");
  const tableRows: string[][] = [];
  let isInTable = false;
  let tableHeaders: string[] = [];

  // Process inline markdown (bold, italic, etc.)
  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Handle bold text **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // First pass: identify tables
  const processedContent: Array<{ type: string; content: any; index: number }> =
    [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("## ")) {
      processedContent.push({
        type: "header",
        content: line.replace("## ", ""),
        index: i,
      });
    }
    // Table detection
    else if (line.includes("|") && !line.includes("---")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);
      if (cells.length > 1) {
        const nextLine = lines[i + 1];
        const isHeader = nextLine?.includes("---");

        if (isHeader) {
          tableHeaders = cells;
          isInTable = true;
        } else if (isInTable || tableRows.length > 0) {
          tableRows.push(cells);
        }

        // Check if table ended
        const nextNonTableLine = lines[i + 1];
        if (!nextNonTableLine?.includes("|") && tableRows.length > 0) {
          processedContent.push({
            type: "table",
            content: { headers: tableHeaders, rows: [...tableRows] },
            index: i,
          });
          tableRows.length = 0;
          tableHeaders = [];
          isInTable = false;
        }
      }
    }
    // Skip table separator lines
    else if (line.includes("---") && line.includes("|")) {
      continue;
    }
    // Bullet points
    else if (line.startsWith("- ")) {
      processedContent.push({
        type: "bullet",
        content: line.replace("- ", ""),
        index: i,
      });
    }
    // Regular text
    else if (line.trim()) {
      processedContent.push({
        type: "text",
        content: line,
        index: i,
      });
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 mt-2 space-y-4">
      {processedContent.map((item, index) => {
        switch (item.type) {
          case "header":
            return (
              <h3
                key={index}
                className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2"
              >
                {item.content}
              </h3>
            );

          case "table":
            return (
              <div
                key={index}
                className="overflow-hidden border border-slate-200 rounded-lg"
              >
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {item.content.headers.map(
                        (header: string, headerIndex: number) => (
                          <th
                            key={headerIndex}
                            className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200"
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {item.content.rows.map(
                      (row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-slate-50">
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-sm text-slate-700"
                            >
                              {processInlineMarkdown(cell)}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );

          case "bullet":
            return (
              <div key={index} className="flex items-start gap-3 py-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-slate-700 leading-relaxed">
                  {processInlineMarkdown(item.content)}
                </span>
              </div>
            );

          case "text":
            return (
              <p key={index} className="text-sm text-slate-700 leading-relaxed">
                {processInlineMarkdown(item.content)}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
