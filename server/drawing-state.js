// server/drawing-state.js
let drawingHistory = [];
let redoStack = [];

// A "line" is the only operation
function addLine(line) {
    const newOp = {
        id: new Date().getTime() + Math.random(),
        ...line
    };
    drawingHistory.push(newOp);
    redoStack = [];
    return newOp;
}

function undoOperation() {
    if (drawingHistory.length === 0) return null;
    const lastOp = drawingHistory.pop();
    redoStack.push(lastOp);
    return drawingHistory;
}

function redoOperation() {
    if (redoStack.length === 0) return null;
    const lastUndoneOp = redoStack.pop();
    drawingHistory.push(lastUndoneOp);
    return drawingHistory;
}

function clearHistory() {
    drawingHistory = [];
    redoStack = [];
    return drawingHistory;
}

function getHistory() {
    return drawingHistory;
}

module.exports = {
    addLine,
    undoOperation,
    redoOperation,
    clearHistory,
    getHistory
};