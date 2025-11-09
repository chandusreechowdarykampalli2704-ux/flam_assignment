// collaborative-canvas/main.js
document.addEventListener('DOMContentLoaded', () => {
    const canvasDrawer = new CanvasDrawer('drawingCanvas');
    const wsClient = new WebSocketClient(canvasDrawer);

    // --- Tool Selection ---
    const toolButtons = document.querySelectorAll('.tool-button[data-tool]');
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            toolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            canvasDrawer.tool = button.dataset.tool;
        });
    });

    // --- Property Selection ---
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('change', (e) => {
        canvasDrawer.strokeColor = e.target.value;
    });

    const strokeWidth = document.getElementById('strokeWidth');
    strokeWidth.addEventListener('input', (e) => {
        canvasDrawer.strokeWidth = e.target.value;
    });

    // --- Action Buttons ---
    document.getElementById('undoButton').addEventListener('click', () => {
        wsClient.emitUndo();
    });
    document.getElementById('redoButton').addEventListener('click', () => {
        wsClient.emitRedo();
    });
    document.getElementById('clearButton').addEventListener('click', () => {
        wsClient.emitClear();
    });

    // --- Canvas Event Listeners (Mouse and Touch) ---
    const container = document.getElementById('canvasContainer');
    
    // Mouse Events
    container.addEventListener('mousedown', (e) => canvasDrawer.startDrawing(e));
    container.addEventListener('mouseup', () => canvasDrawer.stopDrawing());
    container.addEventListener('mouseout', () => canvasDrawer.stopDrawing());
    container.addEventListener('mousemove', (e) => canvasDrawer.drawOnMove(e));

    // Touch Events
    // { passive: false } is CRITICAL to prevent the page from scrolling on iOS
    container.addEventListener('touchstart', (e) => canvasDrawer.startDrawing(e), { passive: false });
    container.addEventListener('touchend', () => canvasDrawer.stopDrawing());
    container.addEventListener('touchcancel', () => canvasDrawer.stopDrawing());
    container.addEventListener('touchmove', (e) => canvasDrawer.drawOnMove(e), { passive: false });
});