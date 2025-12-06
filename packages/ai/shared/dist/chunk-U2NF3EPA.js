// src/utils.ts
function generateId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
function createMessage(role, content, options) {
  return { role, content, ...options };
}
function createAgentEvent(type, content, agentType) {
  return {
    type,
    content,
    agentType,
    timestamp: /* @__PURE__ */ new Date()
  };
}
function safeJsonParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1e3 } = options;
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}
function truncate(text, maxLength, suffix = "...") {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export { createAgentEvent, createMessage, delay, generateId, retry, safeJsonParse, truncate };
//# sourceMappingURL=chunk-U2NF3EPA.js.map
//# sourceMappingURL=chunk-U2NF3EPA.js.map