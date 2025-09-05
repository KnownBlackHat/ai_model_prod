function Header() {
    return (
        <header className="w-full fixed top-0 left-0 z-50  items-center justify-center flex">

            <div className="py-3 w-full flex items-center mx-6 justify-between text-white">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2">
                    <img className="rounded-full size-20" src='logo.png' />
                </a>


                <div className="px-8 space-x-16">
                    <span className="hover:border-b-2 hover: border-blue-700"> Home</span>
                    <span className="hover:border-b-2 hover: border-blue-700"> Pricing </span>
                </div>
            </div>

        </header>
    )
}

export default Header
