declare module 'react-force-graph' {
  import { Component } from 'react';

  export interface GraphData {
    nodes: Array<{
      id: string;
      name?: string;
      [key: string]: any;
    }>;
    links: Array<{
      source: string;
      target: string;
      [key: string]: any;
    }>;
  }

  export interface ForceGraphProps {
    graphData: GraphData;
    nodeLabel?: string | ((node: any) => string);
    nodeColor?: string | ((node: any) => string);
    linkColor?: string | ((link: any) => string);
    backgroundColor?: string;
    width?: number;
    height?: number;
    onNodeClick?: (node: any, event: MouseEvent) => void;
    [key: string]: any;
  }

  export class ForceGraph2D extends Component<ForceGraphProps> {}
  export class ForceGraph3D extends Component<ForceGraphProps> {}
  export class ForceGraphVR extends Component<ForceGraphProps> {}
  export class ForceGraphAR extends Component<ForceGraphProps> {}
} 