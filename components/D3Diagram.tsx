import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Loader2 } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface D3DiagramProps {
  data: { nodes: any[]; links: any[] } | null;
  isLoading: boolean;
}

const D3Diagram: React.FC<D3DiagramProps> = ({ data, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Clear previous svg
    d3.select(containerRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const nodes: GraphNode[] = data.nodes.map(d => ({ ...d }));
    const links: GraphLink[] = data.links.map(d => ({ ...d }));

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(["1", "2"])
        .range(["#f97316", "#6366f1"]); // Orange (Main) and Indigo (Detail)

    // Simulation setup
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(30));

    // SVG container
    const svg = d3.select(containerRef.current)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Add lines for links
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

    // Add groups for nodes
    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
        .attr("r", (d) => d.group === 1 ? 12 : 8)
        .attr("fill", (d: any) => color(String(d.group)) as string);

    // Add labels
    node.append("text")
        .text((d) => d.id)
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "#333")
        .attr("stroke", "none")
        .attr("font-size", (d) => d.group === 1 ? "12px" : "10px")
        .attr("font-weight", (d) => d.group === 1 ? "bold" : "normal")
        .style("pointer-events", "none");

    // Ticker
    simulation.on("tick", () => {
        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Cleanup
    return () => {
        simulation.stop();
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 relative z-10" />
        </div>
        <p className="text-sm font-medium">Analyzing Mental Model...</p>
        <p className="text-xs opacity-70">Computing D3 Force Layout</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No graph data available.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-white overflow-hidden cursor-move" />
  );
};

export default D3Diagram;