import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): JSX.Element => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentTableRows: string[] = [];
    let inTable = false;

    const processLine = (line: string, index: number): JSX.Element | null => {
      // Handle tables
      if (line.trim().includes('|') && line.trim() !== '') {
        if (!inTable) {
          inTable = true;
          currentTableRows = [];
        }
        currentTableRows.push(line);
        return null; // We'll process tables later
      } else if (inTable && currentTableRows.length > 0) {
        // End of table, process it
        inTable = false;
        const tableElement = renderTable(currentTableRows, `table-${index}`);
        currentTableRows = [];
        
        // Process the current line after the table
        const currentElement = processNonTableLine(line, index);
        return (
          <React.Fragment key={`fragment-${index}`}>
            {tableElement}
            {currentElement}
          </React.Fragment>
        );
      }

      return processNonTableLine(line, index);
    };

    const processNonTableLine = (line: string, index: number): JSX.Element | null => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-gray-900 mt-4 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-4 mb-3">{line.slice(2)}</h1>;
      }

      // Bullet points
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-gray-800">{processInlineMarkdown(line.slice(2))}</li>;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.*)$/);
        return <li key={index} className="ml-4 text-gray-800 list-decimal">{processInlineMarkdown(match?.[1] || '')}</li>;
      }

      // Empty lines
      if (line.trim() === '') {
        return <br key={index} />;
      }

      // Regular paragraphs
      return <p key={index} className="text-gray-800 leading-relaxed">{processInlineMarkdown(line)}</p>;
    };

    const processInlineMarkdown = (text: string): React.ReactNode => {
      // Bold text
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic text
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Code
      text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    };

    const renderTable = (rows: string[], key: string): JSX.Element => {
      const cleanRows = rows.filter(row => row.trim() !== '');
      if (cleanRows.length === 0) return <div key={key}></div>;

      // Remove separator rows (rows with only |-: characters)
      const dataRows = cleanRows.filter(row => !/^[\s\|:\-]+$/.test(row));
      
      if (dataRows.length === 0) return <div key={key}></div>;

      const parseRow = (row: string): string[] => {
        return row.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');
      };

      const [headerRow, ...bodyRows] = dataRows.map(parseRow);

      return (
        <div key={key} className="my-4 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {headerRow.map((cell, cellIndex) => (
                  <th key={cellIndex} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                    {processInlineMarkdown(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-sm text-gray-800 border-b border-gray-100">
                      {processInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    // Process all lines
    lines.forEach((line, index) => {
      const element = processLine(line, index);
      if (element) {
        elements.push(element);
      }
    });

    // Handle any remaining table at the end
    if (inTable && currentTableRows.length > 0) {
      elements.push(renderTable(currentTableRows, 'final-table'));
    }

    return <div className="space-y-1">{elements}</div>;
  };

  return parseMarkdown(content);
}