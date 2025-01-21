import React, { useState, useEffect } from "react";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../../components/NavbarComp";

const COLORS = [
  "#2563eb", // Royal Blue
  "#f97316", // Orange
  "#16a34a", // Green
  "#8b5cf6", // Purple
  "#0891b2", // Cyan
  "#ea580c", // Dark Orange
  "#059669", // Emerald
  "#6366f1", // Indigo
  "#0284c7", // Sky Blue
];

// Helper function to get last 7 days data
const getLast7DaysData = (activityData) => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(
      date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }

  // Initialize data with all days
  const activityMap = new Map();
  dates.forEach((date) => {
    activityMap.set(date, {
      date,
      login: 0,
      quiz: {
        draft: 0,
        active: 0,
        closed: 0,
      },
      quiz_session: {
        waiting: 0,
        in_progress: 0,
        completed: 0,
      },
      survey: {
        draft: 0,
        active: 0,
        closed: 0,
      },
      survey_session: {
        waiting: 0,
        in_progress: 0,
        completed: 0,
      },
    });
  });

  // Add actual activity data
  activityData?.activityLogs.forEach((entry) => {
    const entryDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (activityMap.has(entryDate)) {
      const currentData = activityMap.get(entryDate);

      // Update the appropriate counters based on activity type
      if (entry.activityType === "login") {
        currentData.login += 1;
      } else if (entry.activityType.startsWith("quiz_")) {
        // Update quiz-related counters
        if (entry.status) {
          currentData.quiz[entry.status] =
            (currentData.quiz[entry.status] || 0) + 1;
        }
      } else if (entry.activityType.startsWith("survey_")) {
        // Update survey-related counters
        if (entry.status) {
          currentData.survey[entry.status] =
            (currentData.survey[entry.status] || 0) + 1;
        }
      }

      activityMap.set(entryDate, currentData);
    }
  });

  return Array.from(activityMap.values());
};

const CustomSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={onChange}
    className="px-3 py-1 border border-gray-200 rounded-full text-sm bg-white"
  >
    <option value="week">Day</option>
    <option value="month">Week</option>
    <option value="year">Month</option>
  </select>
);

/* Stats Card Update */

const StatsCard = ({ counts }) => {
  const getTotalQuizzes = () => {
    return (
      (counts?.quiz_status?.draft || 0) +
      (counts?.quiz_status?.active || 0) +
      (counts?.quiz_status?.closed || 0)
    );
  };

  const getTotalSurveys = () => {
    const surveyCount =
      (counts?.survey_status?.survey?.draft || 0) +
      (counts?.survey_status?.survey?.active || 0) +
      (counts?.survey_status?.survey?.closed || 0);
    const artPulseCount =
      (counts?.survey_status?.ArtPulse?.draft || 0) +
      (counts?.survey_status?.ArtPulse?.active || 0) +
      (counts?.survey_status?.ArtPulse?.closed || 0);
    return surveyCount + artPulseCount;
  };

  return (
    <div className="bg-white p-6 rounded-[50px] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm">Total Quizzes / Surveys</h3>
        <CustomSelect value="week" onChange={() => {}} />
      </div>
      <div className="space-y-6 text-center">
        <div>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-2xl font-semibold">{getTotalQuizzes()}</span>
            <span className="flex items-center text-green-500 text-sm">
              ↑ 12%
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Total Quizzes</p>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-2xl font-semibold">{getTotalSurveys()}</span>
            <span className="flex items-center text-red-500 text-sm">↓ 8%</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Total Surveys</p>
        </div>
      </div>
    </div>
  );
};

const ProgressBars = ({ counts }) => (
  <div className="bg-white p-6 rounded-[50px] shadow-sm">
    <h3 className="text-gray-500 text-sm mb-4">Total quiz / Survey Session</h3>
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Quiz</span>
          <span>
            {(
              ((counts?.quiz_session_status?.completed || 0) /
                ((counts?.quiz_session_status?.waiting || 0) +
                  (counts?.quiz_session_status?.in_progress || 0) +
                  (counts?.quiz_session_status?.completed || 0))) *
              100
            ).toFixed(0)}
            %
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-purple-500 rounded-full"
            style={{
              width: `${
                ((counts?.quiz_session_status?.completed || 0) /
                  ((counts?.quiz_session_status?.waiting || 0) +
                    (counts?.quiz_session_status?.in_progress || 0) +
                    (counts?.quiz_session_status?.completed || 0))) *
                100
              }%`,
            }}
          ></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Survey</span>
          <span>
            {(
              ((counts?.survey_session_status?.completed || 0) /
                ((counts?.survey_session_status?.waiting || 0) +
                  (counts?.survey_session_status?.in_progress || 0) +
                  (counts?.survey_session_status?.completed || 0))) *
              100
            ).toFixed(0)}
            %
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-orange-400 rounded-full"
            style={{
              width: `${
                ((counts?.survey_session_status?.completed || 0) /
                  ((counts?.survey_session_status?.waiting || 0) +
                    (counts?.survey_session_status?.in_progress || 0) +
                    (counts?.survey_session_status?.completed || 0))) *
                100
              }%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);

const SmallChart = ({ counts }) => {
  const formatData = () => {
    const data = [
      {
        name: "Waiting",
        Quiz: counts?.quiz_session_status?.waiting || 0,
        Survey: counts?.survey_session_status?.waiting || 0,
      },
      {
        name: "In Progress",
        Quiz: counts?.quiz_session_status?.in_progress || 0,
        Survey: counts?.survey_session_status?.in_progress || 0,
      },
      {
        name: "Completed",
        Quiz: counts?.quiz_session_status?.completed || 0,
        Survey: counts?.survey_session_status?.completed || 0,
      },
    ];
    return data;
  };

  return (
    <div className="bg-white p-6 rounded-[50px] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm">Session Status Overview</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formatData()}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorQuiz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorSurvey" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffa07a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffa07a" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="Quiz"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorQuiz)"
              strokeWidth={2}
              dot={{ r: 4, fill: "#8884d8" }}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="Survey"
              stroke="#ffa07a"
              fillOpacity={1}
              fill="url(#colorSurvey)"
              strokeWidth={2}
              dot={{ r: 4, fill: "#ffa07a" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([14, 25, 28]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  return (
    <div className="bg-white p-6 rounded-[50px] shadow-sm">
      <div className="flex justify-center items-center mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="text-orange-500 text-xl" />
        </button>
        <h3 className="text-gray-500 text-sm capitalize mx-2">
          {currentDate.toLocaleString("default", { month: "long" })}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="text-orange-500 text-xl" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day} className="text-xs text-gray-500 text-center">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="text-center py-2"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isSelected = selectedDates.includes(day);
          return (
            <div
              key={day}
              className={`text-center py-1 text-sm rounded-full ${
                isSelected ? "text-white" : "text-gray-700"
              } ${
                isSelected && day === 14
                  ? "bg-purple-500"
                  : isSelected
                  ? "bg-orange-400"
                  : "hover:bg-gray-100"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Filter activity logs based on selected filter
  const getFilteredData = (data) => {
    if (selectedFilter === "all") return data;

    return data.map((day) => ({
      ...day,
      [selectedFilter]: day[selectedFilter],
      // Set all other values to 0
      login: selectedFilter === "login" ? day.login : 0,
      quiz_create: selectedFilter === "quiz_create" ? day.quiz_create : 0,
      quiz_play: selectedFilter === "quiz_play" ? day.quiz_play : 0,
      quiz_status: selectedFilter === "quiz_status" ? day.quiz_status : 0,
      quiz_session_status:
        selectedFilter === "quiz_session_status" ? day.quiz_session_status : 0,
      survey_create: selectedFilter === "survey_create" ? day.survey_create : 0,
      survey_play: selectedFilter === "survey_play" ? day.survey_play : 0,
      survey_status: selectedFilter === "survey_status" ? day.survey_status : 0,
      survey_session_status:
        selectedFilter === "survey_session_status"
          ? day.survey_session_status
          : 0,
    }));
  };

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/activity-logs",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activity logs");
        }

        const data = await response.json();
        setActivityData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  const rawChartData = getLast7DaysData(activityData);
  const chartData = getFilteredData(rawChartData);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-blue-200 p-8">
        <div className="max-w-8xl mx-auto">
          {/* Filter Dropdown */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-xl font-semibold text-red-700">
              Admin Dashboard
            </div>
            <div className="relative">
              <select
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 pr-10 pl-4 appearance-none cursor-pointer"
                onChange={(e) => setSelectedFilter(e.target.value)}
                value={selectedFilter}
              >
                <option value="all">All Activities</option>
                <option value="login">Login</option>
                <option value="quiz_create">Quiz Create</option>
                <option value="quiz_play">Quiz Play</option>
                <option value="quiz_status">Quiz Status</option>
                <option value="quiz_session_status">Quiz Session Status</option>
                <option value="survey_create">Survey Create</option>
                <option value="survey_play">Survey Play</option>
                <option value="survey_status">Survey Status</option>
                <option value="survey_session_status">
                  Survey Session Status
                </option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard counts={activityData?.counts} />
            <CustomCalendar />
            <ProgressBars counts={activityData?.counts} />
            <SmallChart counts={activityData?.counts} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart */}
            <div className="bg-white p-6 rounded-[50px] shadow-sm">
              <h3 className="text-gray-500 text-sm mb-4">
                Activity Overview (Line)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="login"
                      stroke={COLORS[0]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz.draft"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz.active"
                      stroke={COLORS[2]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz.closed"
                      stroke={COLORS[3]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz_session.waiting"
                      stroke={COLORS[4]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz_session.in_progress"
                      stroke={COLORS[5]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quiz_session.completed"
                      stroke={COLORS[6]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-[50px] shadow-sm">
              <h3 className="text-gray-500 text-sm mb-4">
                Quiz vs Survey Overview
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Draft",
                        Quiz: activityData?.counts.quiz_status?.draft || 0,
                        Survey:
                          (activityData?.counts.survey_status?.survey?.draft ||
                            0) +
                          (activityData?.counts.survey_status?.ArtPulse
                            ?.draft || 0),
                      },
                      {
                        name: "Active",
                        Quiz: activityData?.counts.quiz_status?.active || 0,
                        Survey:
                          (activityData?.counts.survey_status?.survey?.active ||
                            0) +
                          (activityData?.counts.survey_status?.ArtPulse
                            ?.active || 0),
                      },
                      {
                        name: "Closed",
                        Quiz: activityData?.counts.quiz_status?.closed || 0,
                        Survey:
                          (activityData?.counts.survey_status?.survey?.closed ||
                            0) +
                          (activityData?.counts.survey_status?.ArtPulse
                            ?.closed || 0),
                      },
                      {
                        name: "Sessions Waiting",
                        Quiz:
                          activityData?.counts.quiz_session_status?.waiting ||
                          0,
                        Survey:
                          activityData?.counts.survey_session_status?.waiting ||
                          0,
                      },
                      {
                        name: "Sessions In Progress",
                        Quiz:
                          activityData?.counts.quiz_session_status
                            ?.in_progress || 0,
                        Survey:
                          activityData?.counts.survey_session_status
                            ?.in_progress || 0,
                      },
                      {
                        name: "Sessions Completed",
                        Quiz:
                          activityData?.counts.quiz_session_status?.completed ||
                          0,
                        Survey:
                          activityData?.counts.survey_session_status
                            ?.completed || 0,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="Quiz"
                      fill="#8884d8"
                      barSize={20}
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      dataKey="Survey"
                      fill="#ffa07a"
                      barSize={20}
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-[50px] shadow-sm">
              <h3 className="text-gray-500 text-sm mb-4">
                Activity Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Login",
                          value: activityData?.counts.login || 0,
                        },
                        {
                          name: "Quiz Create",
                          value: activityData?.counts.quiz_create || 0,
                        },
                        {
                          name: "Quiz Play",
                          value: activityData?.counts.quiz_play || 0,
                        },
                        {
                          name: "Quiz Status",
                          value: activityData?.counts.quiz_status || 0,
                        },
                        {
                          name: "Survey Create",
                          value: activityData?.counts.survey_create || 0,
                        },
                        {
                          name: "Survey Play",
                          value: activityData?.counts.survey_play || 0,
                        },
                        {
                          name: "Survey Status",
                          value: activityData?.counts.survey_status || 0,
                        },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {activityData?.activityLogs.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
