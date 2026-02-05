// Backwards-compat shims for generated MCP client
// Reintroduce `ItemStatus` enum used throughout the application
export enum ItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
