import Link from "next/link";
import { SovereignTricolorRibbon, AshokaEmblem } from "@/components/ashoka-emblem";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-900 flex flex-col antialiased">
      <SovereignTricolorRibbon height="h-2" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-md w-full space-y-5">
          <AshokaEmblem size="md" variant="navy" showMotto={true} />
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded uppercase">
              Error 404 · Page Not Found
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-3">
              Government Resource Not Found
            </h1>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed pt-1">
              The requested national governance intelligence portal route or LGD geography is unavailable or has been relocated.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Return to National Overview Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
