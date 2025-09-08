import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [succ, setSucc] = useState('');
    const navigate = useNavigate();

    async function handleLogin() {
        setErr()
        setSucc()
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKENDADDR}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token)
                setSucc("Authorized");
                navigate("/chat")
            } else {
                setErr("Login Failed")
            }

        } catch (err) {
            setErr("Login Failed")
        }
    }

    useEffect(() => {
        if (window.localStorage.getItem("token")) {
            navigate("/chat")
        }
    }, [])

    return (
        <section className="text-white bg-black py-24 min-h-screen items-center flex justify-center"
            style={{ backgroundImage: 'url("./bg.png")' }}

        >
            <div className="flex flex-col">
                <h1 className="text-3xl md:text-6xl px-3 text-center">Login</h1>
                <div className="bg-white/15 px-12 pt-12 pb-6 rounded-xl mt-4">
                    <div className="text-red-600 mb-4 ">{err}</div>
                    <div className="text-green-600 mb-4 ">{succ}</div>

                    <label htmlFor="username" className="block text-sm font-medium text-white/60">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 w-full p-2 border bg-white/5 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your username"
                    />


                    <label htmlFor="password" className="mt-6 block text-sm font-medium  text-white/60">
                        Password
                    </label>
                    <input
                        type="text"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full p-2 border bg-white/5 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                    />
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={handleLogin}
                            className="bg-cyan-500 p-2 rounded-lg">Submit</button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="underline-offset-4 font-bold underline p-2 rounded-lg">Create Account</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Login
