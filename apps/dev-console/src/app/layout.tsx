import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
    title: "AI Dev Console",
    description: "Development console for AI agents, MCP servers, and flows",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans antialiased">
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
