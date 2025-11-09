# My Real-Time Drawing App

This is a project I built to create a live, multi-user drawing canvas. My goal was to build a full-stack application from scratch, focusing on the challenges of state synchronization and a responsive, professional UI.

This project uses Node.js for the server and pure, vanilla JavaScript on the frontend. I did not use any frameworks or canvas libraries, as required by the assignment, to demonstrate my understanding of the core technologies.

## Key Features
* **Real-time Collaboration:** Users can draw on the same canvas and see each other's work instantly.
* **Core Tools:** A "Brush" tool and an "Eraser" tool are implemented.
* **Live Cursors:** You can see other users' cursors move in real-time with their chosen color.
* **Global Undo/Redo:** The server maintains a complete history, so undo/redo is synced for all users.
* **Touch & Mobile Ready:** The app works on both desktop and mobile/tablet devices.

## How I Built It
The most important part was the server. The server keeps the "master list" of every drawing.
* When a user draws, it sends a message to the server.
* The server adds this drawing to its list.
* Then, the server tells *all other* users to draw that same thing.
* This keeps everyone's screen in sync.

The "Eraser" is implemented as a brush that draws with a white color. This is very efficient and works perfectly with the server's history.

## How to Run This Project
1.  **Install the parts:**
    ```bash
    npm install
    ```

2.  **Start the server:**
    ```bash
    npm start
    ```

3.  **Open the app:**
    Go to `http://localhost:3000` in your web browser.

You can open it in two browser windows (or on your computer and your phone) to see it work.
