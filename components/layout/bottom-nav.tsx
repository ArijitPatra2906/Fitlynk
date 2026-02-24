"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

const tabs = [
  { id: "home", href: "/dashboard", icon: "home", label: "Home" },
  { id: "exercise", href: "/exercise", icon: "dumbbell", label: "Exercise" },
  { id: "nutrition", href: "/nutrition", icon: "utensils", label: "Nutrition" },
  { id: "progress", href: "/progress", icon: "chart", label: "Progress" },
  { id: "profile", href: "/profile", icon: "user", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex-shrink-0 bg-[#131520]/95 backdrop-blur-xl border-t border-white/5 py-2 pb-safe flex safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              isActive ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <Icon name={tab.icon} size={22} />
            <span className="text-[9px] font-semibold uppercase tracking-wide">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
