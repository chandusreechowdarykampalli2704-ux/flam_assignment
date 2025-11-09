# Application Architecture: Real-Time Canvas

This document outlines the architecture for the collaborative drawing application. The primary design goal is a robust, real-time, and consistent experience for all users, built with vanilla technologies.

## 1. Core Concepts

This application is built on two fundamental principles:

1.  **Server as the Single Source of Truth:** The Node.js server is the only authority on the state of the drawing. It holds the complete `drawingHistory` of all operations. Clients are "dumb" renders; they only display the state given to them by the server. This design prevents desynchronization and is the key to making Global Undo possible.

2.  **Dual-Canvas System:** The client uses two `<canvas>` elements stacked on top of each other. This is a critical performance optimization.
    * **`drawingCanvas` (Bottom):** This canvas holds the permanent artwork. It is re-drawn *only* when the entire history changes (e.g., on Undo, Redo, or when a new user joins).
    * **`cursorCanvas` (Top):** This is a temporary, "non-precious" canvas. It is cleared and re-drawn on almost *every frame* to show live user cursors. This separation prevents us from having to re-draw the entire complex artwork just to move a cursor, which would be very slow.

## 2. System Components

* **`server/server.js` (The "Broker"):** The main server file. It handles user connections, listens for WebSocket events (like `'draw'` or `'undo'`), and broadcasts new information to other clients.
* **`server/drawing-state.js` (The "Database"):** An in-memory database. It contains the `drawingHistory` and `redoStack` arrays. It exposes all the logic for state management (`addLine()`, `undoOperation()`, etc.) so the server file stays clean.
* **`client/canvas.js` (The "Renderer"):** The client-side brain. It manages both canvas elements, handles all user input (mouse/touch), and contains all the logic for drawing lines, cursors, and the history.
* **`client/websocket.js` (The "Messenger"):** Manages the Socket.io connection. It listens for messages from the server (like `'redraw'`) and sends messages to the server (like `'draw'`).

## 3. Data Flow: A Single Brush Stroke

This is the step-by-step lifecycle of one drawing action:

1.  **User A** presses their mouse and moves it.
2.  `main.js` detects the `mousemove` event and calls `canvasDrawer.drawOnMove()`.
3.  `canvas.js` creates a "line" object: `{ x0, y0, x1, y1, color, width }`.
4.  `canvas.js` **immediately** draws this line on User A's *own* canvas. (This is **Client-Side Prediction**, which makes the app feel fast and responsive).
5.  `canvas.js` then tells `websocket.js` to `socket.emit('draw', ...)` with the line object.
6.  The **Server** receives the `'draw'` event. It passes the line object to `drawing-state.js`.
7.  `drawing-state.js` adds the line to the `drawingHistory` array.
8.  The **Server** then *broadcasts* this line object to all *other* clients: `socket.broadcast.emit('draw', ...)`.
9.  **User B**'s `websocket.js` hears the `'draw'` event.
10. It calls `canvasDrawer.drawOperation()` on User B's machine, which draws the line on their canvas.

## 4. State Management: The Global Undo

This was a key requirement. Here is how I solved it:

1.  A user clicks "Undo." `main.js` calls `wsClient.emitUndo()`.
2.  The **Server** receives the `'undo'` message.
3.  It calls `drawing-state.undoOperation()`. This function `pop()`s the last operation from `drawingHistory` and `push()`es it onto the `redoStack`. It then returns the *entire, new, shorter* `drawingHistory`.
4.  The **Server** then broadcasts this new, shorter history to **ALL** clients (including the one who clicked undo): `io.emit('redraw', newHistory)`.
5.  **Every client** on the network receives the `'redraw'` event.
6.  Each client's `canvas.js` clears its *entire* canvas and re-draws *all* operations from the new history.

This "full redraw" approach is extremely robust. It guarantees that all users are looking at the exact same state, which prevents desync errors.