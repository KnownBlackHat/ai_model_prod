function Pricing() {
  return (
    <section className="relative text-white py-24 min-h-screen min-w-screen items-center">
      <div
        className="absolute inset-0 overflow-hidden bg-black text-white min-h-screen min-w-screen bg-cover  bg-center -z-10 rotate-180"
        style={{ backgroundImage: 'url("./bg.png")' }}
      />

      <section
        id="pricing"
        className="text-white py-24 min-h-screen items-center flex"
      >
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl md:text-6xl font-extrabold">
            Simple, transparent pricing
          </h2>

          <div className="mt-10 grid gap-20 md:grid-cols-2">
            {[
              {
                name: "Custom Plan",
                price: "$20",
                features: ["Priority support", "Advanced tools"],
              },
              {
                name: "Subscription Plan",
                price: "$10",
                features: ["Community support", "Basic usage"],
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-l-white/10 border-t-white/10 bg-white/5 p-6 text-left"
              >
                <div className="text-xl font-semibold">{t.name}</div>
                <div className="mt-2 text-3xl font-bold">{t.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  {t.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <button className="mt-6 w-full rounded-full bg-white text-black py-2 font-semibold">
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default Pricing;
