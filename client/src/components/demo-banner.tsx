export default function DemoBanner() {
  return (
    <div
      className="shrink-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-white text-xs sm:text-sm font-body"
      style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)",
      }}
    >
      <span className="truncate">
        &#9733; DEMO VERSION &mdash; data resets on refresh &middot; phone reminders are a full-version feature
      </span>
      <a
        href="https://www.etsy.com/listing/4487743018/medical-records-keeper-app"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 text-xs font-semibold text-white whitespace-nowrap"
      >
        Get the Full Version &rarr;
      </a>
    </div>
  );
}
