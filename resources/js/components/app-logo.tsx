import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#0C7C70] text-white shadow-sm shadow-[#0C7C70]/30 -rotate-2">
                <svg viewBox="0 0 32 32" className="size-5 fill-white" aria-hidden="true">
                    <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                </svg>
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-black text-[#173F3C] text-sm">
                    Klinik Wansha
                </span>
                <span className="truncate text-[11px] text-[#6E817F] font-medium">
                    Antrean &amp; Poli Gigi
                </span>
            </div>
        </>
    );
}
