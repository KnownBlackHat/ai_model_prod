import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import "./index.css";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

let router = createBrowserRouter([
    {
        path: "/chat",
        element: (
            <React.StrictMode>
                <ChatProvider>
                    <App />
                </ChatProvider>
            </React.StrictMode>
        ),
    },
    {
        path: "/chat/:webChatId",
        element: (
            <React.StrictMode>
                <ChatProvider>
                    <App />
                </ChatProvider>
            </React.StrictMode>
        ),
    },
    {
        path: "/",
        element: <Navigate to="/chat" replace />
    }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);

