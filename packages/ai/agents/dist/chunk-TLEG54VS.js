import { Annotation } from '@langchain/langgraph';

// src/state.ts
var AgentStateAnnotation = Annotation.Root({
  // Conversation messages
  messages: Annotation({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),
  // Current agent status
  status: Annotation({
    reducer: (_, update) => update,
    default: () => "idle"
  }),
  // Active agent type
  currentAgent: Annotation({
    reducer: (_, update) => update,
    default: () => void 0
  }),
  // Tool execution results
  toolResults: Annotation({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),
  // Workflow context
  context: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({})
  }),
  // Error state
  error: Annotation({
    reducer: (_, update) => update,
    default: () => void 0
  }),
  // Completion flag
  completed: Annotation({
    reducer: (_, update) => update,
    default: () => false
  })
});

export { AgentStateAnnotation };
//# sourceMappingURL=chunk-TLEG54VS.js.map
//# sourceMappingURL=chunk-TLEG54VS.js.map