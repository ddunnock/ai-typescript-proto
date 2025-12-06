"use client";

import { useState } from "react";
import { Settings, Key, Server, Palette, Save, CheckCircle2 } from "lucide-react";

interface ProviderConfig {
    openaiApiKey: string;
    anthropicApiKey: string;
    googleApiKey: string;
    ollamaBaseUrl: string;
}

export default function SettingsPage() {
    const [config, setConfig] = useState<ProviderConfig>({
        openaiApiKey: "",
        anthropicApiKey: "",
        googleApiKey: "",
        ollamaBaseUrl: "http://localhost:11434",
    });
    const [saved, setSaved] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

    const handleSave = () => {
        // TODO: Persist to localStorage or backend
        localStorage.setItem("ai-dev-console-config", JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Configure your AI Dev Console preferences
                </p>
            </div>

            {/* API Keys */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            API Keys
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Configure your LLM provider API keys
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={config.openaiApiKey}
                            onChange={(e) =>
                                setConfig({ ...config, openaiApiKey: e.target.value })
                            }
                            placeholder="sk-..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Anthropic API Key
                        </label>
                        <input
                            type="password"
                            value={config.anthropicApiKey}
                            onChange={(e) =>
                                setConfig({ ...config, anthropicApiKey: e.target.value })
                            }
                            placeholder="sk-ant-..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Google AI API Key
                        </label>
                        <input
                            type="password"
                            value={config.googleApiKey}
                            onChange={(e) =>
                                setConfig({ ...config, googleApiKey: e.target.value })
                            }
                            placeholder="AIza..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </section>

            {/* Local Provider */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Local Provider (Ollama)
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Configure local LLM settings
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ollama Base URL
                    </label>
                    <input
                        type="text"
                        value={config.ollamaBaseUrl}
                        onChange={(e) =>
                            setConfig({ ...config, ollamaBaseUrl: e.target.value })
                        }
                        placeholder="http://localhost:11434"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Make sure Ollama is running locally for this to work
                    </p>
                </div>
            </section>

            {/* Appearance */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <Palette className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Appearance
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Customize the console look and feel
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                    </label>
                    <div className="flex gap-3">
                        {(["light", "dark", "system"] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => setTheme(option)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                                    theme === option
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {saved ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
