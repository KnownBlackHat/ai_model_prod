import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";

const backendUrl = `${import.meta.env.VITE_BACKENDADDR}`;

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const navigate = useNavigate();
  const chat = async (message) => {
    setLoading(false);
    const data = await fetch(`${backendUrl}/chat/${chatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ message }),
    });
    if (data.status === 401 || data.status == 403) {
      navigate("/login");
    }
    if (data.status === 402) {
      return false;
    }
    const resp = (await data.json()).messages;
    setMessages((messages) => [...messages, ...resp]);
    setLoading(false);
    return true;
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [chatId, setChatId] = useState(0);
  const [stopChat, setStopChat] = useState(false);
  const onMessagePlayed = () => {
    if (stopChat) {
      setMessages([]);
      setMessage(null);
      return;
    }
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (stopChat) {
      setMessages([]);
      setMessage(null);
      return;
    }
  }, [stopChat]);

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
        chatId,
        setChatId,
        stopChat,
        setStopChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
