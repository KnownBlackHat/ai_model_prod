
function Niva() {
    return (
        <section id="niva" className="relative overflow-hidden bg-black text-white py-24 bg-cover bg-center min-h-screen flex items-center"
            style={{ backgroundImage: 'url("./bg.png")' }}
        >
            {/* background ribbon */}

            <div className="relative mx-auto max-w-7xl px-4 grid gap-10 md:grid-cols-2 items-center">
                {/* Left copy */}
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-md">
                        <span>🔥</span>
                        <span>Virtual chat assistant</span>
                    </div>
                    <h2 className="mt-4 text-4xl md:text-7xl font-semibold leading-[1.1] text-left">
                        <span className="bg-gradient-to-b font-thin from-cyan-300 to-cyan-500 bg-clip-text text-transparent">Meet Niva</span>
                        <br /> unlock the new
                        <br /> way of talking to AI.
                    </h2>
                    <p className="mt-5 text-white/80 text-sm max-w-md">
                        Meet your ultimate AI companion – a smart, speaking, listening model built to solve everything!
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        <a href="/chat" className="rounded-lg bg-blue-600 px-5 py-2 font-semibold">Try Now</a>
                        <a href="/#pricing" className="rounded-lg bg-white/10 px-5 py-2 font-semibold">Buy Now</a>
                    </div>

                    {/* avatars */}
                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {["#fca5a5", "#fde047", "#60a5fa", "#c084fc", "#34d399"].map((c, idx) => (
                                <div key={idx} className="h-8 w-8 rounded-full ring-2 ring-black" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <div className="text-left text-xs">
                            <div className="text-white/80">+ 50 more</div>
                            <div className="text-white/60">trusted clients</div>
                        </div>
                    </div>
                </div>

                {/* Right: avatar container box only */}
                <div className="flex justify-center">
                    <div className="overflow-hidden h-[520px] w-[380px] md:h-[560px] md:w-[420px] rounded-[24px] border border-white/20 bg-black/50 flex items-center justify-center" >
                        <img className="h-[85%]" src="niva.png" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Niva
