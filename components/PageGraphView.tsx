'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import getSupabaseBrowser from '@/lib/supabase-browser';
import * as d3 from 'd3';

interface PageGraphViewProps {
  currentSlug: string;        // Current page slug for highlighting
  currentContent?: string;    // Page content to extract links from
  currentTitle?: string;      // Current page title for display
  updateTrigger?: number;     // Optional trigger that causes graph to update
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  slug: string;
  isCurrent: boolean;
  relationship: 'current' | 'outgoing' | 'incoming';
}

interface GraphLink {
  source: string;
  target: string;
  direction: 'in' | 'out';
}

export default function PageGraphView({ 
  currentSlug, 
  currentContent, 
  currentTitle,
  updateTrigger = 0 
}: PageGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Create a ref to store the interval ID
  const intervalRef = useRef(null);

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
      
      let pageTitle = currentTitle;
      if (!pageTitle) {
        try {
          // Get current page title if not provided
          const { data } = await getSupabaseBrowser()
            .from('pages')
            .select('title')
            .eq('slug', currentSlug)
            .single();
          
          pageTitle = data?.title || currentSlug;
        } catch (error) {
          console.error('Error fetching current page title:', error);
          pageTitle = currentSlug;
        }
      }
      
      // Extract outgoing links
      const outgoingLinks = extractPageLinks(currentContent);
      
      // Get pages that link to current page (incoming links)
      try {
        const { data: allPages } = await getSupabaseBrowser()
          .from('pages')
          .select('id, slug, title, content');
          
        if (!allPages || allPages.length === 0) {
          setGraphData({ nodes: [], links: [] });
          setLoading(false);
          return;
        }
        
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        
        // Add current page node
        const currentPageData = allPages.find(p => p.slug === currentSlug);
        if (currentPageData) {
          nodes.push({
            id: currentPageData.id,
            title: pageTitle,
            slug: currentSlug,
            isCurrent: true,
            relationship: 'current'
          });
          
          // Add outgoing connections
          outgoingLinks.forEach(targetSlug => {
            const targetPage = allPages.find(p => p.slug === targetSlug);
            if (targetPage) {
              // Add target node if not already included
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
                source: currentPageData.id,
                target: targetPage.id,
                direction: 'out'
              });
            }
          });
          
          // Find and add incoming connections
          allPages.forEach(page => {
            if (page.slug !== currentSlug) {
              const pageLinks = extractPageLinks(page.content);
              if (pageLinks.includes(currentSlug)) {
                // Add source node if not already included
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
                  target: currentPageData.id,
                  direction: 'in'
                });
              }
            }
          });
        }
        
        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Error loading graph data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadGraphData();
  }, [currentSlug, currentContent, updateTrigger]); // Update on content changes too
  
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
        router.push(`/${d.slug}`);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => d.isCurrent ? 20 : 15)
      .attr("fill", d => d.isCurrent ? "#7C3AED" : "#A78BFA") // Purple colors
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
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        // Calculate distance and direction
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust end point to stop at circle edge
        const nodeRadius = d.target.isCurrent ? 20 : 15;
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
  }, [graphData, loading, router]);
  
  return (
    <div className="mb-8 overflow-hidden rounded-lg bg-purple-100">
      {loading ? (
        <div className="flex justify-center items-center h-40 bg-purple-100">
          <p className="text-purple-700">Loading connections...</p>
        </div>
      ) : graphData.nodes.length <= 1 ? (
        <div className="flex justify-center items-center h-40 bg-purple-100">
          <p className="text-purple-700">No connected pages yet</p>
        </div>
      ) : (
        <svg 
          ref={svgRef} 
          className="w-full h-52"
          style={{ minHeight: '220px', background: '#F3E8FF' }}
        />
      )}
    </div>
  );
} 