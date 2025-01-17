import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import App from "../App";

// Mock the necessary components and functions
jest.mock("../pages/LoginPage", () => () => <div>Login Page</div>);
jest.mock("../pages/RegisterPage", () => () => <div>Register Page</div>);
jest.mock("../pages/Home", () => () => <div>Home Page</div>);
jest.mock("../pages/ProfilePage", () => () => <div>Profile Page</div>);
jest.mock("../pages/TenantDetailsPage", () => () => (
  <div>Tenant Details Page</div>
));
jest.mock("../pages/SelectCategoryPage", () => () => (
  <div>Select Category Page</div>
));
jest.mock("../pages/SelectSurveyCategory", () => () => (
  <div>Select Survey Category</div>
));
jest.mock("../pages/quizCreator", () => () => <div>Quiz Creator</div>);
jest.mock("../pages/SurveyCreator", () => () => <div>Survey Creator</div>);
jest.mock("../pages/UnifiedList", () => () => <div>Unified List</div>);
jest.mock("../pages/UnifiedDetails", () => () => <div>Unified Details</div>);
jest.mock("../pages/Preview", () => () => <div>Preview Page</div>);
jest.mock("../pages/SurveyPreview", () => () => <div>Survey Preview Page</div>);
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
jest.mock("./pages/Session/Play/UserSurveyPlay", () => () => (
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
jest.mock("../pages/Report/Report", () => () => <div>Reports</div>);
jest.mock("../pages/Report/UserReport", () => () => <div>User Report</div>);
jest.mock("../pages/Activity/ActivityLog", () => () => (
  <div>Activity Log Page</div>
));

describe("App", () => {
  const renderWithRouter = (ui, { route = "/" } = {}) => {
    window.history.pushState({}, "Test page", route);
    return render(ui, { wrapper: MemoryRouter });
  };

  test("renders LoginPage when not authenticated", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: false }}>
        <App />
      </AuthContext.Provider>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("renders RegisterPage when not authenticated and on /register route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: false }}>
        <App />
      </AuthContext.Provider>,
      { route: "/register" }
    );
    expect(screen.getByText("Register Page")).toBeInTheDocument();
  });

  test("renders HomePage when authenticated", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>
    );
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders ProfilePage when authenticated and on /user/profile route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>,
      { route: "/user/profile" }
    );
    expect(screen.getByText("Profile Page")).toBeInTheDocument();
  });

  test("renders TenantDetailsPage when authenticated and on /tenants/:id route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>,
      { route: "/tenants/123" }
    );
    expect(screen.getByText("Tenant Details Page")).toBeInTheDocument();
  });

  test("renders SelectCategoryPage when on /selectQuizCategory route", () => {
    renderWithRouter(<App />, { route: "/selectQuizCategory" });
    expect(screen.getByText("Select Category Page")).toBeInTheDocument();
  });

  test("renders SelectSurveyCategory when on /selectSurveyCategory route", () => {
    renderWithRouter(<App />, { route: "/selectSurveyCategory" });
    expect(screen.getByText("Select Survey Category")).toBeInTheDocument();
  });

  test("renders QuizCreator when on /createQuiz/:quizId route", () => {
    renderWithRouter(<App />, { route: "/createQuiz/123" });
    expect(screen.getByText("Quiz Creator")).toBeInTheDocument();
  });

  test("renders SurveyCreator when on /createSurvey/:surveyId route", () => {
    renderWithRouter(<App />, { route: "/createSurvey/123" });
    expect(screen.getByText("Survey Creator")).toBeInTheDocument();
  });

  test("renders UnifiedList with quiz type when on /quiz-list route", () => {
    renderWithRouter(<App />, { route: "/quiz-list" });
    expect(screen.getByText("Unified List")).toBeInTheDocument();
  });

  test("renders UnifiedList with survey type when on /survey-list route", () => {
    renderWithRouter(<App />, { route: "/survey-list" });
    expect(screen.getByText("Unified List")).toBeInTheDocument();
  });

  test("renders UnifiedDetails when on /details route", () => {
    renderWithRouter(<App />, { route: "/details" });
    expect(screen.getByText("Unified Details")).toBeInTheDocument();
  });

  test("renders PreviewPage when on /preview/:quizId route", () => {
    renderWithRouter(<App />, { route: "/preview/123" });
    expect(screen.getByText("Preview Page")).toBeInTheDocument();
  });

  test("renders SurveyPreviewPage when on /surveyPreview/:surveyId route", () => {
    renderWithRouter(<App />, { route: "/surveyPreview/123" });
    expect(screen.getByText("Survey Preview Page")).toBeInTheDocument();
  });

  test("renders AdminLobby when on /lobby route", () => {
    renderWithRouter(<App />, { route: "/lobby" });
    expect(screen.getByText("Admin Lobby")).toBeInTheDocument();
  });

  test("renders SurveyLobby when on /survey-lobby route", () => {
    renderWithRouter(<App />, { route: "/survey-lobby" });
    expect(screen.getByText("Survey Lobby")).toBeInTheDocument();
  });

  test("renders UnifiedJoin with quiz type when authenticated and on /join route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>,
      { route: "/join" }
    );
    expect(screen.getByText("Unified Join")).toBeInTheDocument();
  });

  test("renders UnifiedJoin with survey type when on /joinsurvey route", () => {
    renderWithRouter(<App />, { route: "/joinsurvey" });
    expect(screen.getByText("Unified Join")).toBeInTheDocument();
  });

  test("renders UserLobby when on /user-lobby route", () => {
    renderWithRouter(<App />, { route: "/user-lobby" });
    expect(screen.getByText("User Lobby")).toBeInTheDocument();
  });

  test("renders SurveyUserLobby when on /survey-user-lobby route", () => {
    renderWithRouter(<App />, { route: "/survey-user-lobby" });
    expect(screen.getByText("Survey User Lobby")).toBeInTheDocument();
  });

  test("renders AdminStart when on /start route", () => {
    renderWithRouter(<App />, { route: "/start" });
    expect(screen.getByText("Admin Start")).toBeInTheDocument();
  });

  test("renders AdminSurveyStart when on /start-survey route", () => {
    renderWithRouter(<App />, { route: "/start-survey" });
    expect(screen.getByText("Admin Survey Start")).toBeInTheDocument();
  });

  test("renders UserPlay when on /play route", () => {
    renderWithRouter(<App />, { route: "/play" });
    expect(screen.getByText("User Play")).toBeInTheDocument();
  });

  test("renders UserSurveyPlay when on /survey-play route", () => {
    renderWithRouter(<App />, { route: "/survey-play" });
    expect(screen.getByText("User Survey Play")).toBeInTheDocument();
  });

  test("renders FinalLeaderboard when on /leaderboard route", () => {
    renderWithRouter(<App />, { route: "/leaderboard" });
    expect(screen.getByText("Final Leaderboard")).toBeInTheDocument();
  });

  test("renders SurveyResults when on /results/:sessionId route", () => {
    renderWithRouter(<App />, { route: "/results/123" });
    expect(screen.getByText("Survey Results")).toBeInTheDocument();
  });

  test("renders QuestionDetailsResult when on /question-details/:sessionId/:questionId route", () => {
    renderWithRouter(<App />, { route: "/question-details/123/456" });
    expect(screen.getByText("Question Details Result")).toBeInTheDocument();
  });

  test("renders Reports when authenticated and on /reports route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>,
      { route: "/reports" }
    );
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  test("renders UserReport when authenticated and on /userreports/:userId route", () => {
    renderWithRouter(
      <AuthContext.Provider value={{ isAuthenticated: true }}>
        <App />
      </AuthContext.Provider>,
      { route: "/userreports/123" }
    );
    expect(screen.getByText("User Report")).toBeInTheDocument();
  });

  test("renders ActivityLogPage when on /Activity-log route", () => {
    renderWithRouter(<App />, { route: "/Activity-log" });
    expect(screen.getByText("Activity Log Page")).toBeInTheDocument();
  });

  test("redirects legacy /quiz-details route to /details with correct search params", () => {
    renderWithRouter(<App />, { route: "/quiz-details?id=123" });
    expect(window.location.pathname).toBe("/details");
    expect(window.location.search).toBe("?type=quiz&id=123");
  });

  test("redirects legacy /survey-details route to /details with correct search params", () => {
    renderWithRouter(<App />, { route: "/survey-details?id=123" });
    expect(window.location.pathname).toBe("/details");
    expect(window.location.search).toBe("?type=survey&id=123");
  });

  test("displays error toast when session expires", () => {
    const resetSessionState = jest.fn();
    render(
      <AuthContext.Provider value={{ sessionExpired: true, resetSessionState }}>
        <App />
      </AuthContext.Provider>
    );
    expect(resetSessionState).toHaveBeenCalled();
    expect(
      screen.getByText("Your session has expired. Please log in again.")
    ).toBeInTheDocument();
  });
});
