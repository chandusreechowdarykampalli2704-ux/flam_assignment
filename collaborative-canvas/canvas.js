// collaborative-canvas/canvas.js
class CanvasDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.cursorCanvas = document.getElementById('cursorCanvas');
        this.cursorCtx = this.cursorCanvas.getContext('2d');
        
        this.container = document.getElementById('canvasContainer');

        this.isDrawing = false;
        this.currentHistory = [];
        
        // --- State ---
        this.tool = 'brush'; // 'brush' or 'eraser'
        this.strokeColor = '#000000';
        this.strokeWidth = 5;
        this.lastX = 0;
        this.lastY = 0;

        this.socket = null;
        this.socketId = null;

        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.redrawFromHistory(this.currentHistory);
        });
    }

    resizeCanvas() {
        // This is now guaranteed to work because the container has a real height
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.canvas.width = width;
        this.canvas.height = height;
        this.cursorCanvas.width = width;
        this.cursorCanvas.height = height;
    }

    // --- Core Drawing Logic ---
    // This draws a single line operation onto the MAIN canvas
    drawOperation(op) {
        const ctx = this.ctx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(op.x0, op.y0);
        ctx.lineTo(op.x1, op.y1);
        ctx.strokeStyle = op.color;
        ctx.lineWidth = op.width;
        ctx.stroke();
        ctx.closePath();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    clearCursorCanvas() {
        this.cursorCtx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
    }

    // Redraws the entire history onto the MAIN canvas
    redrawFromHistory(history) {
        this.currentHistory = history;
        this.clearCanvas();
        history.forEach(op => this.drawOperation(op));
    }

    // Draws all cursors onto the CURSOR canvas
    drawCursors(allCursors) {
        this.clearCursorCanvas();
        
        for (const id in allCursors) {
            if (id === this.socketId) continue;
            
            const cursor = allCursors[id];
            const ctx = this.cursorCtx;
            
            ctx.beginPath();
            ctx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2, true);
            ctx.fillStyle = cursor.color || '#007bff';
            ctx.fill();
            ctx.font = '12px Arial';
            ctx.fillText(id.substring(0, 5), cursor.x + 8, cursor.y + 4);
        }
    }

    // --- Event Handlers (Mouse and Touch) ---
    getEventCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    // Called on mousedown or touchstart
    startDrawing(e) {
        e.preventDefault();
        this.isDrawing = true;
        const coords = this.getEventCoords(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    // Called on mouseup or touchend
    stopDrawing() {
        this.isDrawing = false;
    }

    // Called on mousemove or touchmove
    drawOnMove(e) {
        e.preventDefault();
        const coords = this.getEventCoords(e);

        // Always emit our cursor position
        if (this.socket) {
            this.socket.emit('cursorMove', { x: coords.x, y: coords.y, color: this.strokeColor });
        }

        if (!this.isDrawing) return;

        // --- Tool-based drawing logic ---
        const op = {
            x0: this.lastX,
            y0: this.lastY,
            x1: coords.x,
            y1: coords.y,
            color: (this.tool === 'eraser' ? '#FFFFFF' : this.strokeColor), // Eraser is just a white line
            width: this.strokeWidth
        };
        
        this.drawOperation(op); // Draw locally on main canvas
        this.socket.emit('draw', op); // Send to server
        
        // Update start for the next line segment
        this.lastX = coords.x;
        this.lastY = coords.y;
    }
}