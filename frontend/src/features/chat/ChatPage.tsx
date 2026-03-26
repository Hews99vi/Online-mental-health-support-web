/**
 * ChatPage.tsx
 *
 * Top-level route component for the /chat section.
 * - /chat         → ChatLobby (queue up / join)
 * - /chat/:roomId → ChatRoom  (active session)
 *
 * Routing is handled in Router.tsx; this file only re-exports both pages
 * so the Router import stays clean.
 */

export { ChatLobby as ChatPage } from './ChatLobby';
export { ChatRoom } from './ChatRoom';
