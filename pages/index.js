import React, { useState, useEffect } from "react";
import Head from "next/head";

// Lucide icons as inline SVG for simplicity
const Clock = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const Key = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2l-2 2" />
    <path d="M7.5 13.5L9 12l6-6 3 3-6 6-1.5 1.5" />
    <circle cx="7.5" cy="13.5" r="3.5" />
  </svg>
);

const AlertTriangle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const Trash2 = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const Plus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Info = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function Home() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tasks, setTasks] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // NEW: pagination state for tasks list
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25; // how many tasks per page

  // Markdown cleaner (with checkbox handling)
  const cleanMarkdown = (text = "") => {
    return (
      text
        // Remove fenced code blocks
        .replace(/```[\s\S]*?```/g, " ")
        // Inline code `code`
        .replace(/`([^`]*)`/g, "$1")
        // Images ![alt](url)
        .replace(/!\[[^\]]*\]\([^\)]*\)/g, "")
        // Links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
        // Checkbox task lists "- [ ] Task" or "- [x] Task"
        .replace(/^\s{0,3}[-*+]\s+\[[ xX]\]\s+/gm, "")
        // Unordered list markers "- Task"
        .replace(/^\s{0,3}[-*+]\s+/gm, "")
        // Ordered list markers "1. Task"
        .replace(/^\s{0,3}\d+\.\s+/gm, "")
        // Headings "# Heading"
        .replace(/^\s{0,3}#+\s+/gm, "")
        // Blockquotes "> quote"
        .replace(/^>\s+/gm, "")
        // Emphasis / strikethrough characters *, _, ~, #
        .replace(/[\*\_\~\#]/g, "")
        // Strip any HTML tags
        .replace(/<[^>]+>/g, "")
        // Normalize newlines and extra whitespace
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
    );
  };

  // Load saved config + blocks on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("craftApiUrl");
      const savedKey = localStorage.getItem("craftApiKey");
      const savedBlocks = localStorage.getItem("timeBlocks");
      const savedDark = localStorage.getItem("timeBlockerDarkMode");

      if (savedDark === "true") {
        setDarkMode(true);
      }

      if (savedUrl && savedKey) {
        setApiUrl(savedUrl);
        setApiKey(savedKey);
        setIsConfigured(true);
        fetchTasks(savedUrl, savedKey);
      }

      if (savedBlocks) {
        const parsedBlocks = JSON.parse(savedBlocks);
        const sanitizedBlocks = parsedBlocks.map((block) => ({
          ...block,
          taskText: cleanMarkdown(block.taskText || ""),
          isDone: !!block.isDone,
        }));
        setTimeBlocks(sanitizedBlocks);
      }
    }
  }, []);

  // Reset to first page whenever tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  // Persist blocks whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sanitizedBlocks = timeBlocks.map((block) => ({
      ...block,
      taskText: cleanMarkdown(block.taskText || ""),
    }));

    localStorage.setItem("timeBlocks", JSON.stringify(sanitizedBlocks));
  }, [timeBlocks]);

  // Persist dark mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("timeBlockerDarkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  // Fetch tasks from Craft Tasks API
  const fetchTasks = async (url, key) => {
    setLoading(true);
    setError("");
    try {
      const scopes = ["active", "upcoming", "inbox"];

      const results = await Promise.allSettled(
        scopes.map((scope) =>
          fetch(`${url}/tasks?scope=${scope}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${key}`,
            },
          }).then(async (res) => {
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(
                `Failed for scope "${scope}": ${res.status} ${res.statusText}. ${errorText}`
              );
            }
            return res.json();
          })
        )
      );

      let allTasks = [];
      let hasError = false;
      let errorMsg = "";

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const scopeTasks = (result.value.items || []).map((t) => ({
            id: t.id,
            markdown: cleanMarkdown(t.markdown || ""),
            dueDate: t.dueDate || null,
            scope: scopes[index],
          }));
          allTasks = [...allTasks, ...scopeTasks];
        } else {
          hasError = true;
          errorMsg = result.reason?.message || "Unknown API error";
        }
      });

      if (allTasks.length === 0 && hasError) {
        throw new Error(`API Error: ${errorMsg}`);
      }

      const seen = new Set();
      const unique = allTasks.filter((task) => {
        if (seen.has(task.id)) return false;
        seen.add(task.id);
        return true;
      });

      unique.sort((a, b) => {
        const aHasDue = !!a.dueDate;
        const bHasDue = !!b.dueDate;
        if (aHasDue && !bHasDue) return -1;
        if (!aHasDue && bHasDue) return 1;
        if (aHasDue && bHasDue) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        return a.markdown.localeCompare(b.markdown);
      });

      setTasks(unique);

      if (unique.length === 0) {
        setError("No tasks found in Craft. Try creating some tasks first.");
      }
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();

    if (!apiUrl.trim()) {
      setError("Please provide the API base URL.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please provide your API key.");
      return;
    }

    const cleanUrl = apiUrl.trim().replace(/\/$/, "");
    const cleanKey = apiKey.trim();

    if (typeof window !== "undefined") {
      localStorage.setItem("craftApiUrl", cleanUrl);
      localStorage.setItem("craftApiKey", cleanKey);
    }

    setApiUrl(cleanUrl);
    setApiKey(cleanKey);
    setIsConfigured(true);
    setShowSettings(false);
    fetchTasks(cleanUrl, cleanKey);
  };

  const addTimeBlock = (taskId, taskText) => {
    const sanitizedText = cleanMarkdown(taskText);
    const newBlock = {
      id: Date.now(),
      taskId,
      taskText: sanitizedText,
      startTime: "09:00",
      endTime: "10:00",
      date: new Date().toISOString().split("T")[0],
      isDone: false,
    };
    setTimeBlocks((prev) => [...prev, newBlock]);
  };

  const updateTimeBlock = (blockId, field, value) => {
    setTimeBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, [field]: value } : block
      )
    );
  };

  const toggleTimeBlockDone = (blockId) => {
    setTimeBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === blockId ? { ...block, isDone: !block.isDone } : block
      )
    );
  };

  const deleteTimeBlock = (blockId) => {
    setTimeBlocks((prev) => prev.filter((block) => block.id !== blockId));
  };

  const getTodayBlocks = () => {
    const today = new Date().toISOString().split("T")[0];
    return timeBlocks
      .filter((block) => block.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const todayBlocks = getTodayBlocks();

  // Always show all tasks
  const visibleTasks = tasks;

  // Pagination for visibleTasks
  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedTasks = visibleTasks.slice(startIndex, startIndex + pageSize);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <>
      <Head>
        <title>Craft Time Blocker</title>
        <meta name="description" content="Time blocking app for Craft" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
          <div className="p-6 mx-auto max-w-7xl">
            <div className="p-6 mb-6 bg-white shadow-lg rounded-2xl dark:bg-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
                    <Clock />
                    <span>Craft Time Blocker</span>
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                    Pull tasks from your Craft task API and block out your day
                    visually.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDarkMode((prev) => !prev)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-600 dark:hover:bg-indigo-900/60"
                  >
                    <Key />
                    <span className="ml-2">API Settings</span>
                  </button>
                </div>
              </div>
            </div>

            {!isConfigured && (
              <div className="p-4 mb-6 text-sm text-blue-800 border border-blue-200 bg-blue-50 rounded-xl dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900">
                <div className="flex">
                  <Info />
                  <div className="ml-3">
                    <p className="font-medium">
                      Welcome. Add your Craft Tasks API info to begin.
                    </p>
                    <p className="mt-1">
                      You will need your API base URL and an API key with access
                      to your Craft Tasks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 mb-6 text-sm text-red-800 border border-red-200 bg-red-50 rounded-xl dark:bg-red-950/40 dark:text-red-200 dark:border-red-900">
                <div className="flex">
                  <AlertTriangle />
                  <div className="ml-3">
                    <p className="font-medium">Something went wrong.</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {showSettings && (
              <div className="p-6 mb-6 bg-white border border-gray-200 shadow-md rounded-2xl dark:bg-slate-900 dark:border-slate-700">
                <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
                  <Key />
                  <span className="ml-2">Craft API Settings</span>
                </h2>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://connect.craft.do/links/XXXXX/api/v1"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Save and Load Tasks
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Today’s Schedule */}
              <div className="p-6 bg-white shadow-lg rounded-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-slate-100">
                    <Clock />
                    <span className="ml-2">Today&apos;s Schedule</span>
                  </h2>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Clear all time blocks for all days? This cannot be undone."
                        )
                      ) {
                        setTimeBlocks([]);
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("timeBlocks");
                        }
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    Reset all blocks
                  </button>
                </div>
                <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">
                  Add tasks from the right panel, then edit the start and end
                  times. Use the checkbox to mark blocks as done.
                </p>

                {todayBlocks.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                    No time blocks scheduled yet. Add tasks from the right
                    panel.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="p-4 transition-colors border border-gray-200 rounded-lg hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-400 dark:bg-slate-900"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!block.isDone}
                            onChange={() => toggleTimeBlockDone(block.id)}
                            className="mt-1"
                            aria-label={
                              block.isDone ? "Mark as not done" : "Mark as done"
                            }
                          />
                          <div className="flex-1">
                            <div
                              className={
                                "mb-2 font-medium " +
                                (block.isDone
                                  ? "text-gray-400 line-through dark:text-slate-500"
                                  : "text-gray-900 dark:text-slate-100")
                              }
                            >
                              {cleanMarkdown(block.taskText)}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={block.startTime}
                                onChange={(e) =>
                                  updateTimeBlock(
                                    block.id,
                                    "startTime",
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                              />
                              <span className="self-center text-gray-500 dark:text-slate-400">
                                →
                              </span>
                              <input
                                type="time"
                                value={block.endTime}
                                onChange={(e) =>
                                  updateTimeBlock(
                                    block.id,
                                    "endTime",
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTimeBlock(block.id)}
                            className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            title="Remove time block"
                          >
                            <div className="w-4 h-4">
                              <Trash2 />
                            </div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Craft Tasks */}
              <div className="p-6 bg-white shadow-lg rounded-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    Craft Tasks
                  </h2>
                  <button
                    onClick={() => fetchTasks(apiUrl, apiKey)}
                    disabled={loading || !apiUrl || !apiKey}
                    className="px-3 py-1 text-sm text-indigo-700 transition-colors bg-indigo-100 rounded-lg hover:bg-indigo-200 disabled:opacity-50 dark:bg-indigo-900/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
                    <p className="mt-2 text-gray-500 dark:text-slate-400">
                      Loading tasks from Craft.
                    </p>
                  </div>
                ) : error && tasks.length === 0 ? (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Unable to load tasks. Please check your settings.
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                    No tasks found. Make sure your Craft Tasks API has items.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                      {pagedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 transition-colors border border-gray-200 rounded-lg hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-400 dark:bg-slate-900"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="text-sm font-medium text-gray-900 truncate dark:text-slate-100">
                              {cleanMarkdown(task.markdown)}
                            </div>
                            {task.dueDate && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full dark:bg-slate-800 dark:text-slate-300">
                              {task.scope}
                            </span>
                            <button
                              onClick={() =>
                                addTimeBlock(task.id, task.markdown)
                              }
                              className="inline-flex items-center justify-center w-8 h-8 text-white bg-indigo-600 rounded-full hover:bg-indigo-700"
                              title="Add to today"
                            >
                              <div className="w-4 h-4">
                                <Plus />
                              </div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-slate-400">
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            canGoPrev && setCurrentPage((p) => p - 1)
                          }
                          disabled={!canGoPrev}
                          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() =>
                            canGoNext && setCurrentPage((p) => p + 1)
                          }
                          disabled={!canGoNext}
                          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}