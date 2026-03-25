export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[#FAF6F1] px-6 text-center">
      <div className="max-w-sm space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#6B1320]/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B1320"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <div>
          <h1 className="font-serif text-3xl text-[#1A0A05] mb-2">
            You&apos;re offline
          </h1>
          <p className="font-malayalam text-[#C9A84C] text-sm mb-1">
            ഇന്റർനെറ്റ് കണക്ഷൻ ഇല്ല
          </p>
          <p className="text-[#1A0A05]/60 text-sm leading-relaxed mt-3">
            Check your internet connection and try again.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-full bg-[#6B1320] text-[#FAF6F1] text-sm font-semibold tracking-wide"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
