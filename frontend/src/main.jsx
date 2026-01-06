import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import "./index.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Footer from "./pages/Footer";
import Header from "./pages/Header";
import Login from "./pages/Login";
import CreateAcc from "./pages/CreateAcc";
import { GoogleOAuthProvider } from "@react-oauth/google";

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://43b3b739106ea12abc96050652a6b7d6@o4510279589625856.ingest.us.sentry.io/4510279591067648",
  integrations: [Sentry.browserTracingIntegration()],
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/niva.cybergenixsecurity\/.com/,
  ],
});

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
    element: (
      <>
        {" "}
        <Header /> <Landing /> <Footer />{" "}
      </>
    ),
  },
  {
    path: "/login",
    element: (
      <>
        {" "}
        <Header /> <Login /> <Footer />{" "}
      </>
    ),
  },
  {
    path: "/signup",
    element: (
      <>
        {" "}
        <Header /> <CreateAcc /> <Footer />{" "}
      </>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="135356168446-nc4dmfkl79lr4kujah9vv3oti5doqtlh.apps.googleusercontent.com">
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </GoogleOAuthProvider>,
);
