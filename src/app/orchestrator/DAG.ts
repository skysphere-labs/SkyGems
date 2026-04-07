/**
 * DAG Pipeline Data Structure
 * 
 * Defines the Directed Acyclic Graph structure for the multi-agent pipeline
 * Supports parallel nodes, branching, and merge points
 */

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';
export type NodeType = 'agent' | 'merge' | 'parallel' | 'start' | 'end';

export interface DAGNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  agentName?: string;
  description?: string;
  progress?: number; // 0-100
  message?: string;
  metadata?: Record<string, any>;
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  label?: string;
}

export interface DAGGraph {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

/**
 * Build the complete DAG for the jewelry design pipeline
 */
export function buildJewelryDesignDAG(): DAGGraph {
  const nodes: DAGNode[] = [
    // Start
    {
      id: 'start',
      label: 'Start',
      type: 'start',
      status: 'idle',
    },

    // Stage 1: Input
    {
      id: 'brief_normalizer',
      label: 'Brief Normalizer',
      type: 'agent',
      status: 'idle',
      agentName: 'BriefNormalizerAgent',
      description: 'Parse UI input into design spec',
    },

    // Stage 2: Research
    {
      id: 'reference_retriever',
      label: 'Reference Retriever',
      type: 'agent',
      status: 'idle',
      agentName: 'ReferenceRetrieverAgent',
      description: 'Find reference designs',
    },

    // Stage 3: Ideation
    {
      id: 'direction_planner',
      label: 'Direction Planner',
      type: 'agent',
      status: 'idle',
      agentName: 'DirectionPlannerAgent',
      description: 'Plan 5 design directions',
    },

    // Stage 3.5: Multi-Model Routing
    {
      id: 'prompt_classifier',
      label: 'Prompt Classifier',
      type: 'agent',
      status: 'idle',
      agentName: 'PromptClassifierAgent',
      description: 'Classify prompt intent (sketch/realistic/editorial/technical)',
    },

    {
      id: 'model_selection',
      label: 'Model Selection',
      type: 'agent',
      status: 'idle',
      description: 'Select optimal models based on classification',
    },

    {
      id: 'cost_optimizer',
      label: 'Cost Optimizer',
      type: 'agent',
      status: 'idle',
      description: 'Optimize cost vs quality based on budget tier',
    },

    // Stage 4: Generation (Parallel with Multi-Model)
    {
      id: 'generator_group',
      label: 'Generator Workers (Parallel)',
      type: 'parallel',
      status: 'idle',
      description: 'Generate via OpenAI, Stability AI, and alternatives',
      metadata: { workerCount: 3, providers: ['OpenAI', 'Stability AI', 'Flux'] },
    },

    // Merge after generation
    {
      id: 'merge_generated',
      label: 'Merge: Generated Designs',
      type: 'merge',
      status: 'idle',
      description: 'Aggregate generated variants',
    },

    // Stage 4.5: Multi-Model Voting
    {
      id: 'voting_system',
      label: 'Voting System',
      type: 'agent',
      status: 'idle',
      description: 'Score and rank images (clarity, quality, match, uniqueness)',
    },

    // Stage 5: Evaluation (Parallel Critics)
    {
      id: 'critic_council',
      label: 'Critic Council (Parallel)',
      type: 'parallel',
      status: 'idle',
      agentName: 'CriticCouncilAgent',
      description: 'Score across 5 dimensions',
      metadata: { criticCount: 5 },
    },

    // Merge after critics
    {
      id: 'merge_scored',
      label: 'Merge: Scored Designs',
      type: 'merge',
      status: 'idle',
      description: 'Aggregate scores',
    },

    // Ranking Engine
    {
      id: 'ranking_engine',
      label: 'Ranking Engine',
      type: 'agent',
      status: 'idle',
      description: 'Sort and select top designs',
    },

    // Stage 6: Refinement
    {
      id: 'repair',
      label: 'Repair Agent',
      type: 'agent',
      status: 'idle',
      agentName: 'RepairAgent',
      description: 'Refine top designs',
    },

    // Stage 7: Presentation
    {
      id: 'scene',
      label: 'Scene Agent',
      type: 'agent',
      status: 'idle',
      agentName: 'SceneAgent',
      description: 'Create lifestyle renders',
    },

    {
      id: 'inspiration_writer',
      label: 'Inspiration Writer',
      type: 'agent',
      status: 'idle',
      agentName: 'InspirationWriterAgent',
      description: 'Write design narratives',
    },

    // Stage 8: Output
    {
      id: 'technical_pack',
      label: 'Technical Pack',
      type: 'agent',
      status: 'idle',
      agentName: 'TechnicalPackAgent',
      description: 'Generate technical documentation',
    },

    // Stage 9: Learning
    {
      id: 'data_curator',
      label: 'Data Curator',
      type: 'agent',
      status: 'idle',
      agentName: 'DataCuratorAgent',
      description: 'Store results and learn',
    },

    // End
    {
      id: 'end',
      label: 'Complete',
      type: 'end',
      status: 'idle',
    },
  ];

  const edges: DAGEdge[] = [
    // Main pipeline flow
    { id: 'e0-1', source: 'start', target: 'brief_normalizer', animated: false },
    { id: 'e1-2', source: 'brief_normalizer', target: 'reference_retriever', animated: false },
    { id: 'e2-3', source: 'reference_retriever', target: 'direction_planner', animated: false },
    
    // Multi-Model Routing
    { id: 'e3-classify', source: 'direction_planner', target: 'prompt_classifier', animated: false },
    { id: 'e-classify-select', source: 'prompt_classifier', target: 'model_selection', animated: false },
    { id: 'e-select-optimize', source: 'model_selection', target: 'cost_optimizer', animated: false },
    { id: 'e-optimize-gen', source: 'cost_optimizer', target: 'generator_group', animated: false },

    // Generation merge
    { id: 'e4-merge1', source: 'generator_group', target: 'merge_generated', animated: true },

    // Multi-Model Voting
    { id: 'e-merge1-voting', source: 'merge_generated', target: 'voting_system', animated: false },

    // Critics
    { id: 'e-voting-critic', source: 'voting_system', target: 'critic_council', animated: false },

    // Critics merge
    { id: 'e-critic-merge2', source: 'critic_council', target: 'merge_scored', animated: true },

    // Ranking
    { id: 'e-merge2-ranking', source: 'merge_scored', target: 'ranking_engine', animated: false },

    // Repair
    { id: 'e-ranking-repair', source: 'ranking_engine', target: 'repair', animated: false },

    // Parallel presentation (Scene + Inspiration)
    { id: 'e-repair-scene', source: 'repair', target: 'scene', animated: false },
    { id: 'e-repair-inspiration', source: 'repair', target: 'inspiration_writer', animated: false },

    // Technical pack (depends on repair)
    { id: 'e-repair-tech', source: 'repair', target: 'technical_pack', animated: false },

    // Data curator (depends on all presentation stages)
    { id: 'e-scene-curator', source: 'scene', target: 'data_curator', animated: false },
    { id: 'e-inspiration-curator', source: 'inspiration_writer', target: 'data_curator', animated: false },
    { id: 'e-tech-curator', source: 'technical_pack', target: 'data_curator', animated: false },

    // End
    { id: 'e-curator-end', source: 'data_curator', target: 'end', animated: false },
  ];

  return { nodes, edges };
}

/**
 * Update node status in the DAG
 */
export function updateNodeInDAG(graph: DAGGraph, nodeId: string, updates: Partial<DAGNode>): DAGGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
  };
}

/**
 * Get all node IDs in execution order (topological sort)
 */
export function getExecutionOrder(graph: DAGGraph): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Find outgoing edges
    const outgoingEdges = graph.edges.filter((e) => e.source === nodeId);
    outgoingEdges.forEach((edge) => visit(edge.target));

    order.push(nodeId);
  };

  // Start from start node
  visit('start');
  return order.reverse();
}
