// src/App.test.js
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthContext } from "../context/AuthContext";
import App from "../App";

// Mock CSS imports
jest.mock("react-toastify/dist/ReactToastify.css", () => ({}));

// Mock dependencies
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
  ToastContainer: () => null,
}));

jest.mock("../context/AuthContext");

// Mock Core Components
jest.mock("../pages/LoginPage", () => () => <div>Login Page</div>);
jest.mock("../pages/RegisterPage", () => () => <div>Register Page</div>);
jest.mock("../pages/Home", () => () => <div>Home Page</div>);
jest.mock("../pages/NotFoundPage", () => () => <div>404 Page</div>);
jest.mock("../pages/ProfilePage", () => () => <div>Profile Page</div>);
jest.mock("../pages/TenantDetailsPage", () => () => (
  <div>Tenant Details Page</div>
));

// Mock Content Route Components
jest.mock("../pages/SelectCategoryPage", () => () => (
  <div>Select Category Page</div>
));
jest.mock("../pages/SelectSurveyCategory", () => () => (
  <div>Select Survey Category Page</div>
));
jest.mock("../pages/quizCreator", () => () => <div>Quiz Creator Page</div>);
jest.mock("../pages/SurveyCreator", () => () => <div>Survey Creator Page</div>);
jest.mock("../pages/UnifiedList", () => () => <div>Unified List Page</div>);
jest.mock("../pages/UnifiedDetails", () => () => (
  <div>Unified Details Page</div>
));
jest.mock("../pages/Preview", () => () => <div>Preview Page</div>);
jest.mock("../pages/SurveyPreview", () => () => <div>Survey Preview Page</div>);

// Mock Session Route Components
jest.mock("../pages/Session/Lobby/AdminLobby", () => () => (
  <div>Admin Lobby</div>
));
jest.mock("../pages/Session/Lobby/SurveyLobby", () => () => (
  <div>Survey Lobby</div>
));
jest.mock("../pages/Session/UserLobby/UserLobby", () => () => (
  <div>User Lobby</div>
));
jest.mock("../pages/Session/UserLobby/SurveyUserLobby", () => () => (
  <div>Survey User Lobby</div>
));
jest.mock("../pages/Session/Start/AdminStart", () => () => (
  <div>Admin Start</div>
));
jest.mock("../pages/Session/Start/AdminSurveyStart", () => () => (
  <div>Admin Survey Start</div>
));
jest.mock("../pages/Session/Play/UserPlay", () => () => <div>User Play</div>);
jest.mock("../pages/Session/Play/UserSurveyPlay", () => () => (
  <div>User Survey Play</div>
));
jest.mock("../pages/Session/UserJoin/UnifiedJoin", () => () => (
  <div>Unified Join</div>
));
jest.mock("../pages/Session/FinalLeaderboard", () => () => (
  <div>Final Leaderboard</div>
));
jest.mock("../pages/Session/Start/SurveyResults", () => () => (
  <div>Survey Results</div>
));
jest.mock("../pages/Session/Start/QuestionDetailsResult", () => () => (
  <div>Question Details Result</div>
));

// Mock Report and Dashboard Components
jest.mock("../pages/Activity/AdminDashboard", () => () => (
  <div>Admin Dashboard Page</div>
));
jest.mock("../pages/Report/UserDashboard/DetailedReport", () => () => (
  <div>Detailed Report Dashboard</div>
));
jest.mock("../pages/Report/UserDashboard/SessionDashboard", () => () => (
  <div>Session Dashboard</div>
));
jest.mock("../pages/Report/UserDashboard/Dashboard", () => () => (
  <div>User Dashboard</div>
));
jest.mock("../pages/Report/AdminDashboard/ReportAdminDashboard", () => () => (
  <div>Report Admin Dashboard</div>
));
jest.mock(
  "../pages/Report/AdminDashboard/DetailedAdminReportDashboard",
  () => () => <div>Detailed Admin Report Dashboard</div>
);
jest.mock("../pages/Report/AdminDashboard/SessionDetails", () => () => (
  <div>Session Details Page</div>
));

// Create MockProtectedRoute component
const MockProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Mock ProtectedRoute Component
jest.mock("../routes/ProtectedRoute", () => ({
  __esModule: true,
  default: function ProtectedRoute(props) {
    return <MockProtectedRoute {...props} />;
  },
}));

const renderWithRouter = (
  ui,
  { route = "/", authState = {}, searchParams = {} } = {}
) => {
  const queryString = new URLSearchParams(searchParams).toString();
  const fullRoute = queryString ? `${route}?${queryString}` : route;

  const defaultAuthState = {
    user: null,
    isAuthenticated: false,
    sessionExpired: false,
    resetSessionState: jest.fn(),
    ...authState,
  };

  useAuthContext.mockImplementation(() => defaultAuthState);

  return {
    ...render(<MemoryRouter initialEntries={[fullRoute]}>{ui}</MemoryRouter>),
    authState: defaultAuthState,
  };
};

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Public Routes", () => {
    test("renders home page at root route", () => {
      renderWithRouter(<App />);
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    test("renders login page for unauthenticated users", () => {
      renderWithRouter(<App />, { route: "/login" });
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    test("renders register page for unauthenticated users", () => {
      renderWithRouter(<App />, { route: "/register" });
      expect(screen.getByText("Register Page")).toBeInTheDocument();
    });

    test("renders 404 page for unknown routes", () => {
      renderWithRouter(<App />, { route: "/unknown-route" });
      expect(screen.getByText("404 Page")).toBeInTheDocument();
    });
  });

  describe("Protected Routes", () => {
    const protectedRoutes = [
      { path: "/user/profile", component: "Profile Page" },
      { path: "/tenants/123", component: "Tenant Details Page" },
      { path: "/selectQuizCategory", component: "Select Category Page" },
      {
        path: "/selectSurveyCategory",
        component: "Select Survey Category Page",
      },
      { path: "/createQuiz/123", component: "Quiz Creator Page" },
      { path: "/createSurvey/123", component: "Survey Creator Page" },
      { path: "/quiz-list", component: "Unified List Page" },
      { path: "/survey-list", component: "Unified List Page" },
      { path: "/preview/123", component: "Preview Page" },
      { path: "/surveyPreview/123", component: "Survey Preview Page" },
      { path: "/join", component: "Unified Join" },
      { path: "/joinsurvey", component: "Unified Join" },
      { path: "/lobby", component: "Admin Lobby" },
      { path: "/survey-lobby", component: "Survey Lobby" },
      { path: "/start", component: "Admin Start" },
      { path: "/start-survey", component: "Admin Survey Start" },
      { path: "/play", component: "User Play" },
      { path: "/results/123", component: "Survey Results" },
      {
        path: "/question-details/123/456",
        component: "Question Details Result",
      },
      { path: "/admin-dashboard", component: "Report Admin Dashboard" },
      { path: "/dashboard", component: "User Dashboard" },
      { path: "/Activity-log", component: "Admin Dashboard Page" },
    ];

    protectedRoutes.forEach(({ path, component }) => {
      test(`renders ${component} when authenticated for ${path}`, async () => {
        renderWithRouter(<App />, {
          route: path,
          authState: { isAuthenticated: true },
        });
        await waitFor(() => {
          expect(screen.getByText(component)).toBeInTheDocument();
        });
      });

      test(`redirects to login from ${path} when not authenticated`, async () => {
        renderWithRouter(<App />, {
          route: path,
          authState: { isAuthenticated: false },
        });
        await waitFor(() => {
          expect(screen.getByText("Login Page")).toBeInTheDocument();
        });
      });
    });
  });

  describe("Public Session Routes", () => {
    const publicSessionRoutes = [
      { path: "/user-lobby", component: "User Lobby" },
      { path: "/survey-user-lobby", component: "Survey User Lobby" },
      { path: "/survey-play", component: "User Survey Play" },
    ];

    publicSessionRoutes.forEach(({ path, component }) => {
      test(`renders ${component} without authentication for ${path}`, async () => {
        renderWithRouter(<App />, { route: path });
        await waitFor(() => {
          expect(screen.getByText(component)).toBeInTheDocument();
        });
      });
    });
  });

  describe("Dynamic Report Routes", () => {
    const reportRoutes = [
      {
        path: "/quiz-reports/quiz/123",
        component: "Detailed Report Dashboard",
      },
      {
        path: "/admin/quiz-reports/quiz/123",
        component: "Detailed Admin Report Dashboard",
      },
      { path: "/session/quiz/123", component: "Session Dashboard" },
      { path: "/quiz/session/123", component: "Session Details Page" },
    ];

    reportRoutes.forEach(({ path, component }) => {
      test(`renders ${component} for ${path}`, async () => {
        renderWithRouter(<App />, {
          route: path,
          authState: { isAuthenticated: true },
        });
        await waitFor(() => {
          expect(screen.getByText(component)).toBeInTheDocument();
        });
      });
    });
  });
});
