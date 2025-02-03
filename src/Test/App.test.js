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

// Mock ProtectedRoute Component
const MockProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

jest.mock("../routes/ProtectedRoute", () => ({
  __esModule: true,
  default: (props) => <MockProtectedRoute {...props} />,
}));

// Enhanced Test Utility Function
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

  describe("Authentication Redirects", () => {
    test("redirects from login to home when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/login",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Home Page")).toBeInTheDocument();
      });
    });

    test("redirects from register to home when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/register",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Home Page")).toBeInTheDocument();
      });
    });
  });

  describe("Protected Routes", () => {
    test("renders profile page when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/user/profile",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Profile Page")).toBeInTheDocument();
      });
    });

    test("redirects to login from profile when not authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/user/profile",
        authState: { isAuthenticated: false },
      });
      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });

    test("renders tenant details page when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/tenants/123",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Tenant Details Page")).toBeInTheDocument();
      });
    });
  });

  describe("Content Routes", () => {
    test("renders quiz category selection page", async () => {
      renderWithRouter(<App />, { route: "/selectQuizCategory" });
      await waitFor(() => {
        expect(screen.getByText("Select Category Page")).toBeInTheDocument();
      });
    });

    test("renders survey category selection page", async () => {
      renderWithRouter(<App />, { route: "/selectSurveyCategory" });
      await waitFor(() => {
        expect(
          screen.getByText("Select Survey Category Page")
        ).toBeInTheDocument();
      });
    });

    test("renders quiz creator page", async () => {
      renderWithRouter(<App />, { route: "/createQuiz/123" });
      await waitFor(() => {
        expect(screen.getByText("Quiz Creator Page")).toBeInTheDocument();
      });
    });

    test("renders survey creator page", async () => {
      renderWithRouter(<App />, { route: "/createSurvey/123" });
      await waitFor(() => {
        expect(screen.getByText("Survey Creator Page")).toBeInTheDocument();
      });
    });

    test("renders quiz list page", async () => {
      renderWithRouter(<App />, { route: "/quiz-list" });
      await waitFor(() => {
        expect(screen.getByText("Unified List Page")).toBeInTheDocument();
      });
    });

    test("renders survey list page", async () => {
      renderWithRouter(<App />, { route: "/survey-list" });
      await waitFor(() => {
        expect(screen.getByText("Unified List Page")).toBeInTheDocument();
      });
    });
  });

  describe("Session Routes", () => {
    test("renders admin lobby", async () => {
      renderWithRouter(<App />, { route: "/lobby" });
      await waitFor(() => {
        expect(screen.getByText("Admin Lobby")).toBeInTheDocument();
      });
    });

    test("renders survey lobby", async () => {
      renderWithRouter(<App />, { route: "/survey-lobby" });
      await waitFor(() => {
        expect(screen.getByText("Survey Lobby")).toBeInTheDocument();
      });
    });

    test("renders user lobby", async () => {
      renderWithRouter(<App />, { route: "/user-lobby" });
      await waitFor(() => {
        expect(screen.getByText("User Lobby")).toBeInTheDocument();
      });
    });

    test("renders play page", async () => {
      renderWithRouter(<App />, { route: "/play" });
      await waitFor(() => {
        expect(screen.getByText("User Play")).toBeInTheDocument();
      });
    });

    test("renders survey play page", async () => {
      renderWithRouter(<App />, { route: "/survey-play" });
      await waitFor(() => {
        expect(screen.getByText("User Survey Play")).toBeInTheDocument();
      });
    });

    test("renders final leaderboard", async () => {
      renderWithRouter(<App />, {
        route: "/leaderboard",
        searchParams: { sessionId: "123", isAdmin: "true" },
        authState: { user: { id: "user123" } },
      });
      await waitFor(() => {
        expect(screen.getByText("Final Leaderboard")).toBeInTheDocument();
      });
    });
  });

  describe("Report and Dashboard Routes", () => {
    test("renders admin dashboard when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/admin-dashboard",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Report Admin Dashboard")).toBeInTheDocument();
      });
    });

    test("renders user dashboard when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/dashboard",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("User Dashboard")).toBeInTheDocument();
      });
    });

    test("renders detailed report dashboard for specific type", async () => {
      renderWithRouter(<App />, {
        route: "/quiz-reports/quiz/123",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Detailed Report Dashboard")
        ).toBeInTheDocument();
      });
    });

    test("renders admin detailed report dashboard", async () => {
      renderWithRouter(<App />, {
        route: "/admin/quiz-reports/quiz/123",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Detailed Admin Report Dashboard")
        ).toBeInTheDocument();
      });
    });

    test("renders session dashboard", async () => {
      renderWithRouter(<App />, {
        route: "/session/quiz/123",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Session Dashboard")).toBeInTheDocument();
      });
    });

    test("renders session details page", async () => {
      renderWithRouter(<App />, {
        route: "/quiz/session/123",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Session Details Page")).toBeInTheDocument();
      });
    });

    test("renders activity log page when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/Activity-log",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Admin Dashboard Page")).toBeInTheDocument();
      });
    });
  });

  describe("Session Handling", () => {
    test("shows session expired toast and resets session state", async () => {
      const { authState } = renderWithRouter(<App />, {
        authState: { sessionExpired: true },
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Your session has expired. Please log in again."
        );
      });

      await waitFor(() => {
        expect(authState.resetSessionState).toHaveBeenCalled();
      });
    });
  });

  describe("Legacy Route Redirects", () => {
    test("renders unified details for quiz-details route", async () => {
      renderWithRouter(<App />, {
        route: "/quiz-details",
        searchParams: { type: "quiz", quizId: "123", hostId: "456" },
      });
      await waitFor(() => {
        expect(screen.getByText("Unified Details Page")).toBeInTheDocument();
      });
    });

    test("renders unified details for survey-details route", async () => {
      renderWithRouter(<App />, {
        route: "/survey-details",
        searchParams: { type: "survey", surveyId: "789", hostId: "456" },
      });
      await waitFor(() => {
        expect(screen.getByText("Unified Details Page")).toBeInTheDocument();
      });
    });
  });
});
