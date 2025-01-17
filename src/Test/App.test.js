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

// Mock all page components
jest.mock("../pages/LoginPage", () => () => <div>Login Page</div>);
jest.mock("../pages/RegisterPage", () => () => <div>Register Page</div>);
jest.mock("../pages/Home", () => () => <div>Home Page</div>);
jest.mock("../pages/NotFoundPage", () => () => <div>404 Page</div>);
jest.mock("../pages/ProfilePage", () => () => <div>Profile Page</div>);
jest.mock("../pages/TenantDetailsPage", () => () => (
  <div>Tenant Details Page</div>
));
jest.mock("../pages/Report/Report", () => () => <div>Reports Page</div>);
jest.mock("../pages/Report/UserReport", () => () => (
  <div>User Report Page</div>
));
jest.mock("../pages/Activity/ActivityLog", () => () => (
  <div>Activity Log Page</div>
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

// Create MockProtectedRoute
const MockProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Mock ProtectedRoute
jest.mock("../routes/ProtectedRoute", () => ({
  __esModule: true,
  default: (props) => <MockProtectedRoute {...props} />,
}));

// Test utility function
const renderWithRouter = (ui, { route = "/", authState = {} } = {}) => {
  const defaultAuthState = {
    user: null,
    isAuthenticated: false,
    sessionExpired: false,
    resetSessionState: jest.fn(),
    ...authState,
  };

  useAuthContext.mockImplementation(() => defaultAuthState);

  return {
    ...render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>),
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

    test("renders reports page when authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/reports",
        authState: { isAuthenticated: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Reports Page")).toBeInTheDocument();
      });
    });

    test("redirects to login from reports when not authenticated", async () => {
      renderWithRouter(<App />, {
        route: "/reports",
        authState: { isAuthenticated: false },
      });
      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
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
        route: "/quiz-details?type=quiz&quizId=123&hostId=456",
      });
      await waitFor(() => {
        expect(screen.getByText("Unified Details Page")).toBeInTheDocument();
      });
    });

    test("renders unified details for survey-details route", async () => {
      renderWithRouter(<App />, {
        route: "/survey-details?type=survey&surveyId=789&hostId=456",
      });
      await waitFor(() => {
        expect(screen.getByText("Unified Details Page")).toBeInTheDocument();
      });
    });
  });
});
