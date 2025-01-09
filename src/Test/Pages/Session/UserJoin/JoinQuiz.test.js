import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate, useLocation } from "react-router-dom";
import { useSessionContext } from "../../../../context/sessionContext";
import JoinQuiz from "../../../../pages/Session/UserJoin/JoinQuiz";

// Mock the router hooks
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock the session context
jest.mock("../../../../context/sessionContext", () => ({
  useSessionContext: jest.fn(),
}));

describe("JoinQuiz Component", () => {
  const mockNavigate = jest.fn();
  const mockJoinSession = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ search: "" });
    useSessionContext.mockReturnValue({
      joinSession: mockJoinSession,
      loading: false,
    });
  });

  test("renders join quiz form", () => {
    render(<JoinQuiz />);

    expect(screen.getByText("Ready to join?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Game PIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
    expect(screen.getByText("Game PINs are 6 digits long")).toBeInTheDocument();
  });

  test("shows loading state while joining", () => {
    useSessionContext.mockReturnValue({
      joinSession: mockJoinSession,
      loading: true,
    });

    render(<JoinQuiz />);

    expect(screen.getByText("Joining...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("initializes with code from URL if present", () => {
    useLocation.mockReturnValue({ search: "?code=123456" });

    render(<JoinQuiz />);

    expect(screen.getByPlaceholderText("Game PIN")).toHaveValue("123456");
  });

  test("only allows numeric input and max 6 digits", async () => {
    render(<JoinQuiz />);

    const input = screen.getByPlaceholderText("Game PIN");

    await userEvent.type(input, "abc123def456789");
    expect(input).toHaveValue("123456");
  });

  test("shows error when submitting with empty code after having input", async () => {
    render(<JoinQuiz />);

    // First type a valid code to enable the button
    const input = screen.getByPlaceholderText("Game PIN");
    await userEvent.type(input, "123456");

    // Clear the input
    await userEvent.clear(input);

    // Find the form using test id and submit it
    const form = screen.getByTestId("join-quiz-form");
    fireEvent.submit(form);

    // Look for error message with a more flexible matcher
    expect(
      screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "p" &&
          content.includes("Please enter a Game PIN")
        );
      })
    ).toBeInTheDocument();
  });

  test("handles successful join session", async () => {
    const mockSessionResponse = {
      session: {
        _id: "session123",
      },
    };
    mockJoinSession.mockResolvedValueOnce(mockSessionResponse);

    render(<JoinQuiz />);

    const input = screen.getByPlaceholderText("Game PIN");
    await userEvent.type(input, "123456");

    const submitButton = screen.getByRole("button", { name: "Join" });
    await userEvent.click(submitButton);

    await waitFor(() => expect(mockJoinSession).toHaveBeenCalledWith("123456"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
      "/user-lobby?code=123456&sessionId=session123"
    ));
  });

  test("handles join session error", async () => {
    const mockError = new Error("Invalid Game PIN");
    mockError.response = { data: { message: "Invalid Game PIN" } };
    mockJoinSession.mockRejectedValueOnce(mockError);

    render(<JoinQuiz />);

    const input = screen.getByPlaceholderText("Game PIN");
    await userEvent.type(input, "123456");

    const submitButton = screen.getByRole("button", { name: "Join" });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid Game PIN")).toBeInTheDocument();
    });
  });

  test("handles invalid server response", async () => {
    mockJoinSession.mockResolvedValueOnce({ session: null });

    render(<JoinQuiz />);

    const input = screen.getByPlaceholderText("Game PIN");
    await userEvent.type(input, "123456");

    const submitButton = screen.getByRole("button", { name: "Join" });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invalid response from server")
      ).toBeInTheDocument();
    });
  });

  test("disables submit button when code is less than 6 digits", () => {
    render(<JoinQuiz />);

    const input = screen.getByPlaceholderText("Game PIN");
    const submitButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(input, { target: { value: "12345" } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "123456" } });
    expect(submitButton).not.toBeDisabled();
  });
});
