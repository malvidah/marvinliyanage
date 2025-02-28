'use client'

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import getSupabaseBrowser from '@/lib/supabase-browser';
import * as d3 from 'd3';

interface PageGraphViewProps {
  currentSlug: string;        // Current page slug for highlighting
  currentContent?: string;    // Page content to extract links from
  currentTitle?: string;      // Current page title for display
  updateTrigger?: number;     // Optional trigger that causes graph to update
  isAdmin?: boolean;          // Add this prop
  selectedNodes?: string[];    // Add this prop
  setSelectedNodes?: (nodes: string[]) => void; // Add this prop
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  slug: string;
  isCurrent: boolean;
  relationship: 'current' | 'outgoing' | 'incoming';
  x?: number;
  y?: number;
}

interface GraphLink {
  source: GraphNode | string;
  target: GraphNode | string;
  direction: 'in' | 'out';
}

export default function PageGraphView({ 
  currentSlug, 
  currentContent, 
  currentTitle,
  updateTrigger = 0,
  isAdmin = false,
  selectedNodes = [],
  setSelectedNodes = () => {} 
}: PageGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Create a ref to store the interval ID
  const intervalRef = useRef(null);

  const [isPending, startTransition] = useTransition();

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Helper function to extract links from content
  function extractPageLinks(content?: string): string[] {
    if (!content) return [];
    const linkRegex = /\[([^\]]+)\]/g;
    const matches = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  }

  // Load graph data when current slug changes
  useEffect(() => {
    async function loadGraphData() {
      setLoading(true);
      
      try {
        // Get all pages in one query for better performance
        const { data: allPages } = await getSupabaseBrowser()
          .from('pages')
          .select('id, slug, title, content');
          
        // First find the current page
        const currentPage = allPages.find(p => p.slug === currentSlug);
        
        if (!currentPage) {
          console.error('Current page not found in database');
          setGraphData({ nodes: [], links: [] });
          setLoading(false);
          return;
        }
        
        // Create a map of slug to page for quick lookups
        const pageMap = new Map();
        allPages.forEach(page => {
          pageMap.set(page.slug, page);
        });
        
        const nodes = [];
        const links = [];
        
        // Add current page node
        nodes.push({
          id: currentPage.id,
          title: currentPage.title || currentSlug,
          slug: currentSlug,
          isCurrent: true,
          relationship: 'current'
        });
        
        // Find outgoing links in current page content
        const outgoingLinks = extractPageLinks(currentPage.content);
        
        // Add nodes and links for pages the current page links to
        outgoingLinks.forEach(targetSlug => {
          const targetPage = pageMap.get(targetSlug);
          
          if (targetPage) {
            // Add target node if not already in nodes
            if (!nodes.some(node => node.id === targetPage.id)) {
              nodes.push({
                id: targetPage.id,
                title: targetPage.title,
                slug: targetPage.slug,
                isCurrent: false,
                relationship: 'outgoing'
              });
            }
            
            // Add link
            links.push({
              source: currentPage.id,
              target: targetPage.id,
              direction: 'out'
            });
          }
        });
        
        // Find incoming links - pages that link to the current page
        allPages.forEach(page => {
          if (page.id !== currentPage.id) {
            const pageLinks = extractPageLinks(page.content);
            
            if (pageLinks.includes(currentSlug)) {
              // Add source node if not already in nodes
              if (!nodes.some(node => node.id === page.id)) {
                nodes.push({
                  id: page.id,
                  title: page.title,
                  slug: page.slug,
                  isCurrent: false,
                  relationship: 'incoming'
                });
              }
              
              // Add link
              links.push({
                source: page.id,
                target: currentPage.id,
                direction: 'in'
              });
            }
          }
        });
        
        // Use transition for smoother UI updates
        startTransition(() => {
          setGraphData({ nodes, links });
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading graph data:', error);
        setLoading(false);
      }
    }
    
    loadGraphData();
  }, [currentSlug, currentContent, currentTitle, updateTrigger]);
  
  // Render the graph visualization
  useEffect(() => {
    if (loading || !svgRef.current || graphData.nodes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = svg.node().getBoundingClientRect().width;
    const height = 220;
    
    // Create a simulation with desired forces
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));
    
    // Create links with markers for direction
    const link = svg.append("g")
      .selectAll("path")
      .data(graphData.links)
      .enter().append("path")
      .attr("stroke", "#e9d5ff")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");
    
    // Define arrowhead marker - make smaller and better positioned
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -3 6 6")  // Smaller viewBox
      .attr("refX", 15)  // Position closer to node edge
      .attr("markerWidth", 6)  // Smaller marker
      .attr("markerHeight", 6)  // Smaller marker
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L6,0L0,3")  // Simpler arrow shape
      .attr("fill", "#e9d5ff");
    
    // Create node groups with drag behavior
    const node = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter().append("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        if (isAdmin) {
          event.stopPropagation();
          
          // Check if the node is already selected
          const isCurrentlySelected = selectedNodes.includes(d.id);
          
          // Update visual appearance immediately
          d3.select(event.currentTarget)
            .select('circle')
            .attr('fill', isCurrentlySelected ? 
              (d.isCurrent ? "#7C3AED" : "#A78BFA") : 
              "#EF4444")
            .attr('stroke', isCurrentlySelected ? 'none' : '#B91C1C')
            .attr('stroke-width', isCurrentlySelected ? 0 : 3);
          
          // Update React state
          setSelectedNodes(prev => {
            if (isCurrentlySelected) {
              return prev.filter(id => id !== d.id);
            } else {
              return [...prev, d.id];
            }
          });
        } else {
          // Navigate to page when non-admin clicks
          router.push(`/${d.slug}`);
        }
      })
      .call((d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)) as any);
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => d.isCurrent ? 20 : 15)
      .attr("fill", d => {
        // Apply correct color based on selection state
        if (selectedNodes.includes(d.id)) {
          return "#EF4444"; // Selected color (red)
        }
        return d.isCurrent ? "#7C3AED" : "#A78BFA"; // Default colors
      })
      .attr("stroke", d => selectedNodes.includes(d.id) ? '#B91C1C' : 'none')
      .attr("stroke-width", d => selectedNodes.includes(d.id) ? 3 : 0)
      .style("cursor", "pointer");
      
    // Add labels
    node.append("text")
      .text(d => d.title)
      .attr("text-anchor", "middle")
      .attr("dy", d => d.isCurrent ? 35 : 30)
      .attr("font-size", d => d.isCurrent ? "12px" : "10px")
      .attr("fill", "#4B5563");
    
    // Update positions on each simulation tick
    simulation.on("tick", () => {
      // Update link paths with straight lines and proper arrow positioning
      link.attr("d", d => {
        // Get source and target nodes (handle both string and object references)
        const source = typeof d.source === 'string' ? graphData.nodes.find(n => n.id === d.source) : d.source;
        const target = typeof d.target === 'string' ? graphData.nodes.find(n => n.id === d.target) : d.target;
        
        const sourceX = source.x || 0;
        const sourceY = source.y || 0;
        const targetX = target.x || 0;
        const targetY = target.y || 0;
        
        // Calculate distance and direction
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust end point to stop at circle edge
        const nodeRadius = source.isCurrent ? 20 : 15;
        const scale = (dr - nodeRadius) / dr;
        const endX = sourceX + (dx * scale);
        const endY = sourceY + (dy * scale);
        
        // Generate straight line path
        return `M ${sourceX} ${sourceY} L ${endX} ${endY}`;
      });
      
      // Update node positions with containment
      node.attr("transform", d => {
        const x = Math.max(20, Math.min(width - 20, d.x));
        const y = Math.max(20, Math.min(height - 20, d.y));
        return `translate(${x}, ${y})`;
      });
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Reset fixed positions to allow natural movement
      d.fx = null;
      d.fy = null;
    }
    
    // Animation for continuous gentle movement
    simulation.on("end", () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Create new interval for gentle movement
      intervalRef.current = setInterval(() => {
        simulation.alpha(0.1).restart();
      }, 2000);
    });
  }, [graphData, loading, router, isAdmin, selectedNodes, setSelectedNodes]);
  
  return (
    <div className="mb-8 overflow-hidden rounded-lg bg-purple-100" style={{ height: '220px' }}>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-purple-700">Loading connections...</p>
        </div>
      ) : graphData.nodes.length <= 1 ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-purple-700">No connected pages yet</p>
        </div>
      ) : (
        <svg 
          ref={svgRef} 
          className="w-full h-full"
          style={{ background: '#F3E8FF' }}
        />
      )}
    </div>
  );
} 