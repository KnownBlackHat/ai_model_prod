import { useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { FaMicrophoneAlt, FaMicrophoneAltSlash, FaBars } from "react-icons/fa";
import { IoSendSharp } from "react-icons/io5";
import CompanyLogo from "../assets/cybergenix.png";
import { motion, AnimatePresence } from "framer-motion";

const WAKE_WORD = ["niva", " va ", "liva"];

export const UI = ({ hidden, meta_ui }) => {
    const input = useRef();
    const [audioState, setaudioState] = useState("idle");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { chat, loading, message } = useChat();

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
            console.log(speech);
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

    const sendMessage = () => {
        meta_ui.setAnimation("Thinking_0");
        const text = input.current.value;
        if (!loading && !message) {
            chat(text);
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
                        className="fixed top-0 left-0 h-full w-64 bg-black border-blue-700 border-r-2  shadow-2xl z-20 p-6 flex flex-col gap-6"
                    >
                        <h2 className="text-white text-2xl font-bold border-b border-gray-600 pb-2">
                            Chats
                        </h2>
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
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <FaBars size={22} />
                    </button>
                    <button
                        onClick={() => window.location.href = "https://forms.gle/3c8m9bTjW7v4kW5f9"}
                        className="bg-black/70 border-2 border-blue-700 hover:bg-blue-500/70 text-white p-3 rounded-xl transition-all"
                    >
                        Get one for your business
                    </button>
                </div>

                {/* Company Logo */}
                <img src={CompanyLogo} alt="Company Logo"
                    className="fixed bg-black bottom-0 border-0 right-5 w-36 h-36 shadow-xl" />

                {/* Chat UI */}
                <div>
                    <div className="flex items-center justify-center">
                        <span className="text-white p-2 px-4 rounded-full text-center m-2 bg-black/70 text-xl mb-8 shadow-lg" id="caption">
                            Captions....
                        </span>
                    </div>

                    <div className="flex justify-center items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
                        {audioState === "idle" && (
                            <input
                                className="w-full border-2 border-white placeholder:text-gray-500 placeholder:italic p-4 rounded-xl bg-white/20 text-white backdrop-blur-md focus:outline-none"
                                placeholder="Ask from Niva..."
                                ref={input}
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

                    <div className="flex items-center justify-center">
                        <div className="bg-black/80 p-2 mt-4 rounded-xl border-blue-700 border-2 shadow-lg">
                            <span className="text-gray-200 p-2 px-4 text-center m-2 rounded-full">
                                Upgrade Your Plan
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

