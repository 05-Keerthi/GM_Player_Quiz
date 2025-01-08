import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Leaderboard from "../../../components/Session/Leaderboard"; // Adjust the path as needed
import { useLeaderboardContext } from "../../../context/leaderboardContext"; // Adjust the path as needed

// Mocking the leaderboard context correctly
jest.mock('../../../context/leaderboardContext', () => {
  return {
    useLeaderboardContext: jest.fn(),
  };
});

describe("Leaderboard Component", () => {
  let mockGetLeaderboard, mockGetUserScore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLeaderboard = jest.fn();
    mockGetUserScore = jest.fn();

    useLeaderboardContext.mockReturnValue({
      getLeaderboard: mockGetLeaderboard,
      getUserScore: mockGetUserScore,
    });
  });

  test("renders leaderboard for admin with data", async () => {
    const leaderboardData = [
      { _id: "1", username: "Player1", score: 100 },
      { _id: "2", username: "Player2", score: 80 },
    ];

    mockGetLeaderboard.mockResolvedValue({ leaderboard: leaderboardData });

    render(<Leaderboard sessionId="session1" isAdmin={true} />);

    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Leaderboard/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Player1")).toBeInTheDocument();
      expect(screen.getByText("Player2")).toBeInTheDocument();
    });

    expect(screen.getByText("100 pts")).toBeInTheDocument();
    expect(screen.getByText("80 pts")).toBeInTheDocument();
  });

  test("renders user score for non-admin", async () => {
    const userScore = { user: { _id: "1", username: "Player1", score: 50 } };

    mockGetUserScore.mockResolvedValue(userScore);

    render(<Leaderboard sessionId="session1" userId="1" isAdmin={false} />);

    expect(screen.getByText("Your Score")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("50")).toBeInTheDocument();
    });
    expect(screen.getByText("Points")).toBeInTheDocument();
  });

  test("handles empty leaderboard for admin", async () => {
    mockGetLeaderboard.mockResolvedValue({ leaderboard: [] });

    render(<Leaderboard sessionId="session1" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.queryByText("No players yet")).not.toBeInTheDocument(); // No message for empty leaderboard
    });
  });

  test("handles zero score for non-admin", async () => {
    const userScore = { user: { _id: "1", username: "Player1", score: 0 } };

    mockGetUserScore.mockResolvedValue(userScore);

    render(<Leaderboard sessionId="session1" userId="1" isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
    expect(screen.getByText("Points")).toBeInTheDocument();
  });

  test("fetches leaderboard data periodically for admin", async () => {
    jest.useFakeTimers();
    const leaderboardData = [
      { _id: "1", username: "Player1", score: 100 },
      { _id: "2", username: "Player2", score: 80 },
    ];

    mockGetLeaderboard.mockResolvedValue({ leaderboard: leaderboardData });

    render(<Leaderboard sessionId="session1" isAdmin={true} />);

    // Fast-forward time by 5 seconds to simulate periodic fetch
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledTimes(2); // Initial + 1 periodic fetch
    });

    jest.useRealTimers();
  });

  test("fetches user score periodically for non-admin", async () => {
    jest.useFakeTimers();
    const userScore = { user: { _id: "1", username: "Player1", score: 50 } };

    mockGetUserScore.mockResolvedValue(userScore);

    render(<Leaderboard sessionId="session1" userId="1" isAdmin={false} />);

    // Fast-forward time by 5 seconds to simulate periodic fetch
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockGetUserScore).toHaveBeenCalledTimes(2); // Initial + 1 periodic fetch
    });

    jest.useRealTimers();
  });

  test("handles errors during data fetching", async () => {
    mockGetLeaderboard.mockRejectedValue(new Error("Failed to fetch leaderboard"));

    render(<Leaderboard sessionId="session1" isAdmin={true} />);

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalled();
    });

    // Since there's an error, no leaderboard data should be rendered
    expect(screen.queryByText("Player1")).not.toBeInTheDocument();
  });
});
