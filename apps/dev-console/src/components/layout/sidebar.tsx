"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Bot,
    Server,
    Activity,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "MCP Servers", href: "/mcp", icon: Server },
    { name: "Traces", href: "/traces", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`${
                collapsed ? "w-16" : "w-64"
            } flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                {!collapsed && (
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        AI Dev Console
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors`}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon
                                className={`${
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                                } ${collapsed ? "" : "mr-3"} h-5 w-5 flex-shrink-0`}
                            />
                            {!collapsed && item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {!collapsed && (
                    <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            System Ready
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
