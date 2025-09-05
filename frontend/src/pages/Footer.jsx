
function Footer() {
    return (
        <footer id="contact" className="relative bg-black text-white pt-16 pb-10 overflow-hidden">
            <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[36rem] w-[60rem] rounded-full " />
            <div className="mx-auto max-w-7xl px-4 grid gap-10 md:grid-cols-4 relative">
                <div>
                    <img className="rounded  mb-3" src='logo.png' />
                    <p className="text-white/70 text-sm max-w-xs">Robust cybersecurity engineering for modern product teams.</p>
                </div>
                <div>
                    <div className="font-semibold mb-2">Resources</div>
                    <ul className="text-white/70 text-sm space-y-1">
                        <li>Blog</li>
                        <li>Case Studies</li>
                        <li>Careers</li>
                    </ul>
                </div>
                <div>
                    <div className="font-semibold mb-2">Company</div>
                    <ul className="text-white/70 text-sm space-y-1">
                        <li>About</li>
                        <li>Privacy</li>
                        <li>Legal</li>
                    </ul>
                </div>
                <div>
                    <div className="font-semibold mb-2">Get in touch</div>
                    <form className="flex gap-2">
                        <input className="flex-1 rounded-md bg-white/10 px-3 py-2 placeholder-white/50 outline-none" placeholder="Enter your email" />
                        <button className="rounded-md bg-white text-black px-4">Send</button>
                    </form>
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 mt-10 text-white/50 text-xs">© {new Date().getFullYear()} CyberSec. All rights reserved.</div>
        </footer>
    )
}

export default Footer



