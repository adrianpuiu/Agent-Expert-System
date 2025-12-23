import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, AlertCircle } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid config
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const renderDiagram = async () => {
      if (!code || !containerRef.current) return;
      
      if (mounted) {
        setError(null);
        setSvg(''); 
      }
      
      try {
        // Unique ID for this render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // mermaid.render returns { svg } in v10
        const { svg } = await mermaid.render(id, code);
        
        if (mounted) {
          setSvg(svg);
        }
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        if (mounted) {
          setError(err.message || "Failed to render diagram syntax.");
        }
      }
    };

    renderDiagram();

    return () => {
      mounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center bg-red-50 rounded-lg">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm font-medium">{error}</p>
        <pre className="mt-4 p-4 bg-red-100 rounded text-xs text-left w-full overflow-auto max-h-40 font-mono text-red-800">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Rendering...</span>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-auto p-4 bg-white"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;