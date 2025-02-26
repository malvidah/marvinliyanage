import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabase';
import * as d3 from 'd3';

interface PageGraphViewProps {
  currentSlug: string;        // Current page slug for highlighting
  currentContent?: string;    // Page content to extract links from
  currentTitle?: string;      // Current page title for display
}

// Define strongly-typed interfaces for D3 simulation
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;          // Unique identifier (page slug)
  title: string;       // Display name for the node
  slug: string;        // URL slug for navigation
  isCurrent: boolean;  // Whether this is the current page
  x?: number;          // Position (set by D3 simulation)
  y?: number;          // Position (set by D3 simulation)
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;  // Source node or ID
  target: string | GraphNode;  // Target node or ID
}

export default function PageGraphView({ currentSlug, currentContent, currentTitle }: PageGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({ 
    nodes: [], 
    links: [] 
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Effect: Load graph data whenever slug or content changes
  useEffect(() => {
    async function loadGraphData() {
      setLoading(true);
      
      // If we don't have a current title, fetch it
      let pageTitle = currentTitle;
      if (!pageTitle) {
        // Fetch current page title if not provided
        const { data: currentPage } = await supabase
          .from('pages')
          .select('title')
          .eq('slug', currentSlug)
          .single();
          
        if (currentPage) {
          pageTitle = currentPage.title;
        }
      }
      
      // 1. Extract page links from current content
      const pageLinks = extractPageLinksFromContent(currentContent);
      
      // 2. Fetch pages linking TO this page (incoming links)
      // Use a more exact pattern match for finding links to this page
      const { data: incomingLinks } = await supabase
        .from('pages')
        .select('slug, title, content')
        .neq('slug', currentSlug)
        .or(`content.ilike.%[${currentSlug}]%`);
      
      console.log("Incoming links:", incomingLinks); // Debugging
      
      // 3. Build graph data using both sets of links
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      
      // Add current page as central node
      nodes.push({ 
        id: currentSlug, 
        title: pageTitle || currentSlug, // Use page title or fallback to slug
        slug: currentSlug,
        isCurrent: true
      });
      
      // Add outgoing links (from current page to others)
      pageLinks.forEach(link => {
        nodes.push({ 
          id: link, 
          title: link, 
          slug: link,
          isCurrent: false 
        });
        links.push({ source: currentSlug, target: link });
      });
      
      // Add incoming links (from other pages to current)
      if (incomingLinks && incomingLinks.length > 0) {
        incomingLinks.forEach(page => {
          // Verify this page actually contains a link to the current page
          const linkRegex = new RegExp(`\\[${currentSlug}\\]`, 'g');
          if (linkRegex.test(page.content)) {
            // Only add node if it doesn't already exist
            if (!nodes.some(node => node.id === page.slug)) {
              nodes.push({ 
                id: page.slug, 
                title: page.title, 
                slug: page.slug,
                isCurrent: false 
              });
            }
            // Add the link
            links.push({ source: page.slug, target: currentSlug });
          }
        });
      }
      
      console.log("Graph data:", { nodes, links }); // Debugging
      setGraphData({ nodes, links });
      setLoading(false);
    }
    
    loadGraphData();
  }, [currentSlug, currentContent, currentTitle]);
  
  // Helper: Extract page links using regex
  function extractPageLinksFromContent(content?: string) {
    if (!content) return [];
    
    // This regex pattern looks for [page-name] style links
    const linkRegex = /\[([^\]]+)\]/g;
    let matches = [...content.matchAll(linkRegex)];
    
    // Extract just the slugs from the matches
    let links = matches.map(match => match[1]);
    
    // Remove duplicates
    links = [...new Set(links)];
    
    return links;
  }
  
  // Effect: Create and update the D3 visualization
  useEffect(() => {
    // Skip if refs aren't ready or data is loading
    if (!svgRef.current || loading || graphData.nodes.length === 0) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = svgRef.current.clientWidth;
    const height = 220; // Height for the graph visualization
    
    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Add gradient background with noise texture
    const defs = svg.append("defs");
    
    // Create noise pattern for texture
    const noise = defs.append("filter")
      .attr("id", "noise")
      .append("feTurbulence")
      .attr("type", "fractalNoise")
      .attr("baseFrequency", "0.65")
      .attr("numOctaves", "3")
      .attr("stitchTiles", "stitch");
    
    // Create gradient definition for background
    const gradient = defs.append("linearGradient")
      .attr("id", "graph-bg-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f3e8ff"); // Light purple
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ffe4e6"); // Light red/pink
      
    // Apply background to the visualization
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#graph-bg-gradient)")
      .attr("filter", "url(#noise)")
      .attr("opacity", "0.15"); // Subtle effect
      
    // Create D3 force simulation for node layout
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(graphData.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id(d => d.id)
        .distance(120)) // Distance between nodes
      .force("charge", d3.forceManyBody().strength(-300)) // Repulsion between nodes
      .force("center", d3.forceCenter(width / 2, height / 2)) // Center the graph
      .force("collision", d3.forceCollide().radius(30)); // Prevent node overlap
      
    // Create arrow markers for directed links
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#d1d1d1") // Arrow color
      .attr("d", "M0,-5L10,0L0,5");
      
    // Draw the links between nodes
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#d1d1d1") // Link color
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrow)");
      
    // Create node groups (clickable)
    const node = svg.append("g")
      .selectAll(".node")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        // Navigate to the page when node is clicked (except current)
        if (!d.isCurrent) {
          router.push(`/${d.slug}`);
        }
      });
      
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => d.isCurrent ? 20 : 15) // Current node is larger
      .attr("fill", d => d.isCurrent ? "#6B46C1" : "#E9D8FD") // Current node is darker
      .attr("opacity", d => d.isCurrent ? 1 : 0.9);
    
    // Add text labels below the nodes
    const nodeText = node.append("text")
      .attr("dy", d => d.isCurrent ? 36 : 30) // Position text below circle
      .attr("text-anchor", "middle")
      .attr("fill", "#4A2D91")
      .attr("font-size", "11px")
      .attr("font-weight", d => d.isCurrent ? "bold" : "normal")
      .attr("pointer-events", "none") // Allow clicking through text
      .attr("opacity", 0.8)
      .text(d => d.title);
      
    // Add interactive hover effects
    node
      .on("mouseover", function(event, d) {
        // Enlarge the node on hover
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d.isCurrent ? 22 : 17);
          
        // Hide the regular label
        d3.select(this).select("text")
          .transition()
          .duration(200)
          .attr("dy", d => d.isCurrent ? 45 : 40)
          .attr("opacity", 0);
          
        // Show enhanced tooltip
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${event.pageX - svgRef.current!.getBoundingClientRect().left}, ${event.pageY - svgRef.current!.getBoundingClientRect().top - 30})`);
          
        tooltip.append("rect")
          .attr("fill", "white")
          .attr("rx", 5) // Rounded corners
          .attr("fill-opacity", 0.95)
          .attr("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");
          
        const text = tooltip.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("fill", "#4A2D91")
          .attr("font-size", "12px")
          .text(d.title);
          
        // Size the tooltip background based on text
        const bbox = text.node()!.getBBox();
        tooltip.select("rect")
          .attr("x", bbox.x - 8)
          .attr("y", bbox.y - 8)
          .attr("width", bbox.width + 16)
          .attr("height", bbox.height + 16);
      })
      .on("mouseout", function() {
        // Return node to normal size
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d => d.isCurrent ? 20 : 15);
          
        // Restore the label
        d3.select(this).select("text")
          .transition()
          .duration(200)
          .attr("dy", d => d.isCurrent ? 36 : 30)
          .attr("opacity", 0.8);
          
        // Remove tooltip
        svg.select(".tooltip").remove();
      });
      
    // Update positions on each simulation tick
    simulation.on("tick", () => {
      // Keep nodes within bounds of SVG
      graphData.nodes.forEach(d => {
        d.x = Math.max(20, Math.min(width - 20, d.x || width/2));
        d.y = Math.max(20, Math.min(height - 30, d.y || height/2)); 
      });
      
      // Update link positions
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => {
          // Calculate position on target circle boundary
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const angle = Math.atan2(dy, dx);
          const r = target.isCurrent ? 20 : 15;
          return target.x! - r * Math.cos(angle);
        })
        .attr("y2", d => {
          // Calculate position on target circle boundary
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const angle = Math.atan2(dy, dx);
          const r = target.isCurrent ? 20 : 15;
          return target.y! - r * Math.sin(angle);
        });
        
      // Update node positions
      node.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
    });
    
    // Make nodes draggable for interactive layout adjustment
    node.call(d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }) as any);
    
    // Clean up simulation on unmount
    return () => {
      simulation.stop();
    };
  }, [graphData, loading, router]);
  
  // Render the component
  return (
    <div className="mb-8 overflow-hidden rounded-lg">
      {loading ? (
        // Loading state
        <div className="flex justify-center items-center h-40 bg-gray-50">
          <span className="text-gray-500">Loading connections...</span>
        </div>
      ) : graphData.nodes.length <= 1 ? (
        // No connections state
        <div className="flex justify-center items-center h-40 bg-gray-50">
          <span className="text-gray-500">No connected pages yet</span>
        </div>
      ) : (
        // Graph visualization
        <svg 
          ref={svgRef} 
          className="w-full h-52"
          style={{ minHeight: '220px' }}
        />
      )}
    </div>
  );
} 