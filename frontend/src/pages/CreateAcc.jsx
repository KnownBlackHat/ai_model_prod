import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS));

function CreateAcc() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cpassword, setCpassword] = useState('');
    const [err, setErr] = useState('');
    const [succ, setSucc] = useState('');
    const navigate = useNavigate();

    async function handleSignup() {
        return ""
        setErr()
        setSucc()
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKENDADDR}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                setSucc("Account Created!!");
                navigate("/login");
            } else {
                setErr("Account Creation Failed")
            }

        } catch (err) {
            setErr("Account Creation Failed")
        }
    }
    async function OnSuccess(credentialResponse) {
        const { payload } = await jwtVerify(credentialResponse.credential, JWKS);
        const { email, name, picture, sub } = payload
        setErr()
        setSucc()
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKENDADDR}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, sub, name })
            });
            if (response.ok || response.status === 409) {
                setSucc("Account Created!!");
                navigate("/login");
            } else {
                setErr("Account Creation Failed")
            }

        } catch (err) {
            setErr("Account Creation Failed")
        }
    }

    async function OnError() {
        console.log("login failed")
    }


    useEffect(() => {
        if (window.localStorage.getItem("token")) {
            navigate("/chat")
        }
    }, [])

    useEffect(() => {
        if (password !== cpassword) {
            setErr("Password not matched");
        } else {
            setErr('');
        }

    }, [password, cpassword])

    return (
        <section className="text-white bg-black py-24 min-h-screen items-center flex justify-center"
            style={{ backgroundImage: 'url("./bg.png")' }}

        >
            <div className="flex flex-col">
                <h1 className="text-3xl md:text-6xl px-3 text-center">Create Account</h1>
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
                        disabled
                        className="mt-1 w-full p-2 border bg-white/5 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                    />

                    <label htmlFor="cpassword" className="mt-6 block text-sm font-medium  text-white/60">
                        Confirm Password
                    </label>
                    <input
                        type="text"
                        disabled
                        id="cpassword"
                        value={cpassword}
                        onChange={(e) => setCpassword(e.target.value)}
                        className="mt-1 w-full p-2 border bg-white/5 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                    />

                    <div className="flex justify-between mt-8">
                        <button
                            disabled
                            onClick={handleSignup}
                            className="bg-cyan-500 p-2 rounded-lg">Submit</button>
                        <button
                            onClick={() => navigate("/login")}
                            className="underline-offset-4 font-bold underline p-2 rounded-lg">Already have account?</button>
                    </div>
                    <div
                        className="mt-8 w-full flex items-center text-center justify-center"
                    >
                        <GoogleLogin
                            onSuccess={OnSuccess}
                            onError={OnError}
                            size="large"
                            shape="circle"
                            text="signin_with"
                            auto_select={true}

                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CreateAcc
