"use client";

import "@xyflow/react/dist/style.css";
import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { nodeTypes } from "./flow-node-types";

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

/** Live pipeline canvas — pure presentation, graph comes from buildJobFlow. */
export function FlowCanvas({ nodes, edges }: FlowCanvasProps) {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-xl border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} />
      </ReactFlow>
    </div>
  );
}
