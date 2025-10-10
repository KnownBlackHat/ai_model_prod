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
import { GoogleOAuthProvider } from "@react-oauth/google";

let router = createHashRouter([
    {
        path: "/chat",
        element: (
            <ChatProvider>
                <App />
            </ChatProvider>
        ),
    },
    {
        path: "/chat/:webChatId",
        element: (
            <ChatProvider>
                <App />
            </ChatProvider>
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
    <GoogleOAuthProvider clientId="135356168446-nc4dmfkl79lr4kujah9vv3oti5doqtlh.apps.googleusercontent.com">
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>
    </GoogleOAuthProvider >
);

