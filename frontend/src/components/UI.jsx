import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { FaMicrophoneAlt, FaMicrophoneAltSlash, FaBars } from "react-icons/fa";
import { TbHistory } from "react-icons/tb";
import { TbHistoryOff } from "react-icons/tb";
import { IoSendSharp } from "react-icons/io5";
import CompanyLogo from "../assets/cybergenix.png";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdAddCircleOutline } from "react-icons/io";
import { Link, redirect, useNavigate } from "react-router";


const WAKE_WORD = ["niva", " va ", "liva"];

export const UI = ({ hidden, meta_ui }) => {
    const input = useRef();
    const [audioState, setaudioState] = useState("idle");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toggleContextHistory, setToggleContextHistory] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const { chat, loading, message, chatId } = useChat();
    const [chatIds, setChatIds] = useState([]);
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    async function handleChatCreation(store = false) {
        const resp = await fetch(
            `//${import.meta.env.VITE_BACKENDADDR}/tejas/ids/create`
        )
        const res = await resp.json();
        setChatIds(ids => [...ids, res.id]);
        if (store) {
            window.localStorage.setItem("route_his", input.current.value);
        }
        navigate(`/chat/${res.id}`);
    }

    useEffect(() => {
        async function main() {
            const resp = await fetch(
                `//${import.meta.env.VITE_BACKENDADDR}/tejas/ids`
            )
            const res = await resp.json()
            setChatIds(res)

            const route_his = window.localStorage.getItem("route_his");
            if (route_his) {
                window.localStorage.removeItem("route_his");
                input.current.value = route_his;
                await sendMessage();
            }
        }

        main();
    }, [])

    useEffect(() => {
        if (message) {
            setChatHistory(his => [
                ...his,
                {
                    date: Date.now(),
                    user: null,
                    assistant: JSON.stringify([message])
                }
            ]);
        }
    }, [message]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
        }
    }, [chatHistory]);

    useEffect(() => {
        async function load_data() {
            const resp = await fetch(`//${import.meta.env.VITE_BACKENDADDR}/history/${chatId}`);
            const json_resp = await resp.json()
            setChatHistory(json_resp);
        };
        if (chatId !== 0) load_data();

    }, []);

    const MicStop = () => {
        window.micd = true;
        window.rec.abort();
        meta_ui.setAnimation("Idle");
        setaudioState("idle");
        window.rec.stop();
    };

    const speechReconCleanup = (text = null) => {
        meta_ui.setAnimation("Idle");
        sendAudio(text);
    };

    const speechRecon = () => {
        window.micd = false;
        let speech = "";
        const recApi = window?.webkitSpeechRecognition || window?.SpeechRecognition;
        if (!recApi) {
            alert("SpeechRecognition won't work for you");
            return;
        }

        window.rec = new recApi();
        window.rec.lang = "en-IN";
        window.rec.interimResults = true;

        window.rec.onresult = (e) => {
            speech = Array.from(e.results).map((result) => result[0].transcript).join("");
            meta_ui.setAnimation("Listening_1");
        };

        window.rec.start();
        setaudioState("listen");

        window.rec.addEventListener("end", () => {
            if (WAKE_WORD.some((word) => speech.toLowerCase().includes(word))) {
                speechReconCleanup(speech);
                speech = "";
                window.rec.stop();
            } else {
                meta_ui.setAnimation("Idle");
                window?.micd ? null : window.rec.start();
            }
        });
    };

    async function sendMessage() {
        if (chatId === 0) await handleChatCreation(true);
        meta_ui.setAnimation("Thinking_0");
        const text = input.current.value;

        if (!loading && !message && text.trim() !== "") {
            chat(text);

            setChatHistory(his => [
                ...his,
                {
                    date: Date.now(),
                    user: text,
                    assistant: null
                }
            ]);

            input.current.value = "";
        }
    };

    const sendAudio = (text) => {
        meta_ui.setAnimation("Thinking_0");
        if (!loading && !message) {
            chat(text);
        }
    };

    if (hidden) return null;

    return (
        <>
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 h-full w-1/4 bg-black border-blue-700 border-r-2  shadow-2xl z-20 p-2 flex flex-col gap-6"
                    >
                        <h2 className="text-white text-2xl font-bold border-b border-gray-600 pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    Chats
                                </div>
                                <button onClick={handleChatCreation}>

                                    <IoMdAddCircleOutline />
                                </button>
                            </div>
                        </h2>

                        {chatIds.map((value) =>
                            <div className="bg-slate-700 p-2 rounded-xl">
                                <Link to={`/chat/${value}`}> {value}</Link>


                            </div>
                        )}

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="mt-auto bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl"
                        >
                            Close
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
                {/* Sidebar Toggle Button */}
                <div
                    className="pointer-events-auto bg-black/70 flex justify-between text-white p-3 rounded-xl shadow-lg  transition-all"
                >
                    <div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <FaBars size={22} />
                        </button>
                        <button
                            onClick={() => setToggleContextHistory(prev => !prev)}
                            className="bg-black/70 border-2 border-blue-700 hover:bg-blue-500/70 text-white p-2 rounded-xl ml-4 text-xl"
                        >
                            {toggleContextHistory ? <TbHistoryOff /> : <TbHistory />}
                        </button>
                    </div>
                    <button
                        onClick={() => window.location.href = "https://forms.gle/3c8m9bTjW7v4kW5f9"}
                        className="bg-black/70 border-2 border-blue-700 hover:bg-blue-500/70 text-white p-3 rounded-xl transition-all"
                    >
                        Get one for your business
                    </button>
                </div>
                {toggleContextHistory &&
                    <div ref={chatEndRef} className="bg-gray-900 opacity-90 border-blue-400 border-2 shadow-[0_0_5px_#60A5FA,0_0_5px_#60A5FA,0_0_10px_#3B82F6,0_0_30px_#2563EB]  h-[60%] w-[30%] fixed left-16 bottom-[20%] text-center rounded-xl overflow-scroll pointer-events-auto">
                        <div className="text-white p-2 mb-2 sticky top-0 bg-blue-800 border-b-2 border-white">
                            Chat History-{chatId}
                        </div>

                        {chatHistory.map((item, idx) => {
                            return <div key={idx}>
                                {item.user &&
                                    <div className="flex text-white justify-between overflow-scroll">
                                        <div className="text-right m-2 bg-slate-800" />
                                        <div className="text-right m-2 bg-slate-700 p-2 rounded-lg flex-col">
                                            <div>
                                                {item.user}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {(new Date(item.date)).getHours()}:
                                                {(new Date(item.date)).getMinutes()}
                                            </div>
                                        </div>
                                    </div>
                                }

                                {item.assistant &&
                                    <div className="flex justify-between text-white overflow-scroll ">
                                        <div className="text-left m-2 bg-slate-700 p-2 rounded-lg">
                                            {item.assistant && JSON.parse(item.assistant).map(item => item.text).join("\n")}
                                        </div>
                                        <div className="text-right m-2 bg-slate-800" />
                                    </div>
                                }
                            </div>
                        })}

                    </div>
                }

                {/* Company Logo */}
                <img src={CompanyLogo} alt="Company Logo"
                    className="fixed bg-black bottom-0 border-0 right-5 w-36 h-36 shadow-xl" />

                {/* Chat UI */}
                <div>

                    <div className="flex justify-center items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
                        {audioState === "idle" && (
                            <textarea
                                className="w-full border-2 border-white placeholder:text-gray-500 placeholder:italic p-4 rounded-xl bg-white/20 text-white backdrop-blur-md focus:outline-none"
                                placeholder="Ask from Niva..."
                                ref={input}
                                maxLength={500}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                        )}

                        {(window?.webkitSpeechRecognition || window?.SpeechRecognition) && (
                            <>
                                {audioState === "idle" ? (
                                    <button
                                        className="text-2xl bg-black/80 border-2 border-white text-white p-4 px-10 font-semibold uppercase rounded-xl shadow-lg hover:bg-black/90"
                                        onClick={speechRecon}
                                    >
                                        <FaMicrophoneAlt />
                                    </button>
                                ) : (
                                    <button
                                        className="text-2xl bg-red-500 border-2 border-white text-white p-4 px-10 font-semibold uppercase rounded-xl shadow-lg hover:bg-red-600"
                                        onClick={MicStop}
                                    >
                                        <FaMicrophoneAltSlash />
                                    </button>
                                )}
                            </>
                        )}

                        {audioState === "idle" && (
                            <button
                                disabled={loading || message}
                                onClick={sendMessage}
                                className={`text-2xl bg-blue-600/80 border-2 border-white text-white p-4 px-10 font-semibold uppercase rounded-xl shadow-lg hover:bg-blue-400/80 transition-all ${loading || message ? "cursor-not-allowed bg-gray-500 opacity-30" : ""
                                    }`}
                            >
                                <IoSendSharp />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-center mt-6">
                        <div className="relative inline-block">
                            {/* Button Background */}
                            <div className="px-8 py-3 rounded-2xl bg-black/60 text-blue-200 font-medium relative z-10">
                                Upgrade Your Plan
                            </div>

                            {/* Laser Border Overlay */}
                            <svg
                                className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
                                viewBox="0 0 240 70"
                                preserveAspectRatio="none"
                            >
                                <rect
                                    x="2"
                                    y="2"
                                    width="236"
                                    height="66"
                                    rx="16"
                                    ry="16"
                                    fill="none"
                                    stroke="url(#blueLaser)"
                                    strokeWidth="3"
                                    strokeDasharray="120 600"
                                    strokeDashoffset="0"
                                >
                                    <animate
                                        attributeName="stroke-dashoffset"
                                        from="0"
                                        to="-660"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </rect>

                                <defs>
                                    <linearGradient id="blueLaser" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="50%" stopColor="#60a5fa" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

