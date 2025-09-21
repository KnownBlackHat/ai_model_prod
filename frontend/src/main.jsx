import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import "./index.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import Landing from './pages/Landing';
import Pricing from "./pages/Pricing";
import Footer from "./pages/Footer";
import Header from "./pages/Header";
import Login from "./pages/Login";
import CreateAcc from "./pages/CreateAcc";

let router = createHashRouter([
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
        element: <> <Header /> <Landing /> <Pricing /> <Footer /> </>
    },
    {
        path: "/login",
        element: <> <Header />  <Login /> <Footer /> </>
    }, {
        path: "/signup",
        element: <> <Header />  <CreateAcc /> <Footer /> </>
    }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);

