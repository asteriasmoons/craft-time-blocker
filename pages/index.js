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

const Plus = () => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Trash2 = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const Settings = () => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
  </svg>
);

const Calendar = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const Circle = () => (
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
  </svg>
);

const AlertCircle = () => (
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
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

export default function CraftTimeBlocker() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("craftApiUrl");
      const savedKey = localStorage.getItem("craftApiKey");
      const savedBlocks = localStorage.getItem("timeBlocks");

      if (savedUrl && savedKey) {
        setApiUrl(savedUrl);
        setApiKey(savedKey);
        setIsConfigured(true);
        fetchTasks(savedUrl, savedKey);
      }
      if (savedBlocks) {
        setTimeBlocks(JSON.parse(savedBlocks));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && timeBlocks.length > 0) {
      localStorage.setItem("timeBlocks", JSON.stringify(timeBlocks));
    }
  }, [timeBlocks]);

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
                `HTTP ${res.status}: ${res.statusText} - ${errorText}`
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
            ...t,
            scope: scopes[index],
          }));
          allTasks = [...allTasks, ...scopeTasks];
        } else {
          hasError = true;
          errorMsg = result.reason.message;
        }
      });

      if (allTasks.length === 0 && hasError) {
        throw new Error(`API Error: ${errorMsg}`);
      }

      setTasks(allTasks);

      if (allTasks.length === 0) {
        setError("No tasks found in Craft. Try creating some tasks first!");
      }
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    if (!apiUrl.trim()) {
      setError("Please enter a valid Craft API URL");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please enter your API key");
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

  const handleResetConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("craftApiUrl");
      localStorage.removeItem("craftApiKey");
      localStorage.removeItem("timeBlocks");
    }
    setApiUrl("");
    setApiKey("");
    setIsConfigured(false);
    setTasks([]);
    setTimeBlocks([]);
    setShowSettings(false);
    setError("");
  };

  const addTimeBlock = (taskId, taskText) => {
    const newBlock = {
      id: Date.now(),
      taskId,
      taskText,
      startTime: "09:00",
      endTime: "10:00",
      date: new Date().toISOString().split("T")[0],
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const updateTimeBlock = (blockId, field, value) => {
    setTimeBlocks(
      timeBlocks.map((block) =>
        block.id === blockId ? { ...block, [field]: value } : block
      )
    );
  };

  const deleteTimeBlock = (blockId) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== blockId));
  };

  const getTodayBlocks = () => {
    const today = new Date().toISOString().split("T")[0];
    return timeBlocks
      .filter((block) => block.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const cleanMarkdown = (text) => {
    return text.replace(/[\*\_\[\]\(\)\#]/g, "").trim();
  };

  if (!isConfigured || showSettings) {
    return (
      <>
        <Head>
          <title>Craft Time Blocker - Setup</title>
          <meta name="description" content="Time blocking app for Craft" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 text-indigo-600">
                  <Clock />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Craft Time Blocker
                </h1>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Craft Daily Notes API URL
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://connect.craft.do/links/YOUR_LINK/api/v1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-4 h-4">
                      <Key />
                    </div>
                    API Key (Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Your Craft API key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <p className="text-sm text-gray-500">
                  Both credentials are stored locally in your browser and never
                  sent to any external server.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <AlertCircle />
                  </div>
                  <div>{error}</div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save & Connect
                </button>
                {isConfigured && (
                  <>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetConfig}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  How to get your credentials:
                </h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Open Craft app and go to Settings</li>
                  <li>Navigate to Integrations → API</li>
                  <li>Find &quot;Daily Notes & Tasks API&quot;</li>
                  <li>Copy both the API URL and the API Key/Token</li>
                  <li>Paste them above</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const todayBlocks = getTodayBlocks();
  const unscheduledTasks = tasks.filter(
    (task) => !timeBlocks.some((block) => block.taskId === task.id)
  );

  return (
    <>
      <Head>
        <title>Craft Time Blocker</title>
        <meta name="description" content="Time blocking app for Craft" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 text-indigo-600">
                  <Clock />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Craft Time Blocker
                  </h1>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <div className="w-6 h-6 text-gray-600">
                  <Settings />
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 text-indigo-600">
                  <Calendar />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Today&apos;s Schedule
                </h2>
              </div>

              {todayBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No time blocks scheduled yet. Add tasks from the right panel!
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">
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
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-gray-500 self-center">→</span>
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
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTimeBlock(block.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
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

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Craft Tasks</h2>
                <button
                  onClick={() => fetchTasks(apiUrl, apiKey)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="mt-2 text-gray-500">
                    Loading tasks from Craft...
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <AlertCircle />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Error loading tasks</div>
                    <div>{error}</div>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="mt-2 text-indigo-600 hover:text-indigo-700 underline text-sm"
                    >
                      Check API settings
                    </button>
                  </div>
                </div>
              ) : unscheduledTasks.length === 0 && tasks.length > 0 ? (
                <div className="text-center py-8 text-gray-500">
                  All tasks are scheduled! 🎉
                </div>
              ) : unscheduledTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No tasks found in Craft.</p>
                  <p className="text-sm">
                    Create some tasks in your Craft Daily Notes first!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <div className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0">
                              <Circle />
                            </div>
                            <span className="text-gray-900">
                              {cleanMarkdown(task.markdown)}
                            </span>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-500 ml-6">
                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                              {task.scope}
                            </span>
                            {task.taskInfo?.scheduleDate && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {task.taskInfo.scheduleDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addTimeBlock(task.id, task.markdown)}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                          title="Add to schedule"
                        >
                          <div className="w-4 h-4">
                            <Plus />
                          </div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
