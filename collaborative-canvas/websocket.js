// collaborative-canvas/websocket.js
class WebSocketClient {
    constructor(canvasDrawer) {
        this.socket = io();
        this.canvasDrawer = canvasDrawer;
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            this.canvasDrawer.socket = this.socket;
            this.canvasDrawer.socketId = this.socket.id;
        });

        // This event handles all line drawing (brush and eraser)
        this.socket.on('draw', (operation) => {
            this.canvasDrawer.drawOperation(operation);
        });

        // This event re-syncs the entire canvas
        this.socket.on('redraw', (history) => {
            console.log('Received new history, redrawing...');
            this.canvasDrawer.redrawFromHistory(history);
        });

        // This event updates all remote cursors
        this.socket.on('cursorsUpdate', (allCursors) => {
            this.canvasDrawer.drawCursors(allCursors);
        });
    }

    emitUndo() {
        this.socket.emit('undo');
    }

    emitRedo() {
        this.socket.emit('redo');
    }

    emitClear() {
        this.socket.emit('clear');
    }
}