const FOOTER_LINK_GROUPS = [
  {
    title: "Company",
    links: ["About", "Events", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service"],
  },
];

export function LandingFooter() {
  return (
    <footer id="contact" className="rounded-t-[22px] bg-[#f5f4f2] px-6 py-12 md:px-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="grid gap-10 md:grid-cols-[2.1fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <h3 className="text-[28px] font-semibold text-[#2f745f]">ApnaHealer</h3>
            <p className="max-w-[330px] text-sm text-[#6d7573]">
              Bridging the gap between peer support and professional care in a
              digital space designed for your soul.
            </p>
          </div>

          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#263430]">
                {group.title}
              </p>
              <div className="space-y-2 text-sm text-[#6d7573]">
                {group.links.map((link) => (
                  <p key={link}>{link}</p>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#263430]">
              Our App
            </p>
            <p className="text-sm text-[#6d7573]">Healing on the go.</p>
            <button className="w-full rounded-lg bg-[#252a2d] px-4 py-2 text-left text-sm font-semibold text-white">
              Download on the App Store
            </button>
            <button className="w-full rounded-lg bg-[#252a2d] px-4 py-2 text-left text-sm font-semibold text-white">
              Get it on Google Play
            </button>
          </div>
        </div>

        <div className="mt-10 border-t border-[#deded9] pt-8">
          <div className="rounded-2xl border border-[#f0d9d3] bg-[#fbefec] px-4 py-3 text-xs italic text-[#9d756d]">
            Crisis Disclaimer: If you need urgent help, contact local emergency
            services or a crisis hotline immediately.
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9c9f9d]">
            <p>© 2024 ApnaHealer. All rights reserved.</p>
            <p>Built with empathy. v2.4.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
