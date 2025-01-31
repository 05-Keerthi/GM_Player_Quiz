import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  MemoryRouter,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSessionContext } from "../../../../context/sessionContext";
import AdminLobby from "../../../../pages/Session/Lobby/AdminLobby";
import io from "socket.io-client";

// Mock the required modules
jest.mock("socket.io-client");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("../../../../context/sessionContext");
jest.mock("../../../../components/NavbarComp", () => {
  return function DummyNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});
jest.mock("../../../../models/InviteModal", () => {
  return function DummyModal({ isOpen, onClose, onInvite }) {
    return isOpen ? (
      <div data-testid="invite-modal">
        <button onClick={() => onInvite([{ _id: "test-user" }])}>
          Invite Users
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe("AdminLobby", () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockSessionData = {
    _id: "test-session",
    joinCode: "123456",
    players: [],
    quiz: { _id: "quiz-id" },
    qrCodeImageUrl: "test-url.png",
  };

  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    io.mockReturnValue(mockSocket);
    useSearchParams.mockReturnValue([
      new URLSearchParams({ quizId: "test-id" }),
    ]);
    useLocation.mockReturnValue({ state: { sessionData: mockSessionData } });
    useNavigate.mockReturnValue(mockNavigate);
    useSessionContext.mockReturnValue({
      startSession: jest.fn().mockResolvedValue({
        questions: [],
        slides: [],
        session: { quiz: { _id: "quiz-id" } },
      }),
      loading: false,
    });
  });

  it("renders loading state initially", () => {
    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    expect(screen.getByTestId("loading-title")).toBeInTheDocument();
    expect(screen.getByTestId("loading-status")).toBeInTheDocument();
  });

  it("shows game PIN after loading", async () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("pin-label")).toBeInTheDocument();
    });

    await waitFor(() => {
      const pinElement = screen.getByTestId("pin-value");
      expect(pinElement).toHaveTextContent("123456");
    });

    jest.useRealTimers();
  });

  it("initializes socket connection and creates session", async () => {
    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("create-session", {
        sessionId: mockSessionData._id,
        joinCode: mockSessionData.joinCode,
      });
    });
  });

  it("handles new players joining", async () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const handlePlayerJoined = mockSocket.on.mock.calls.find(
      (call) => call[0] === "player-joined"
    )[1];

    act(() => {
      handlePlayerJoined({
        user: {
          _id: "player1",
          username: "TestPlayer",
          email: "test@example.com",
        },
      });
    });

    await waitFor(() => {
      const playerElements = screen.getAllByText(/TestPlayer/i);
      expect(playerElements.length).toBeGreaterThan(0);
    });

    jest.useRealTimers();
  });

  it("handles start session button click", async () => {
    jest.useFakeTimers();
    const { startSession } = useSessionContext();

    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const handlePlayerJoined = mockSocket.on.mock.calls.find(
      (call) => call[0] === "player-joined"
    )[1];

    act(() => {
      handlePlayerJoined({
        user: {
          _id: "player1",
          username: "TestPlayer",
          email: "test@example.com",
        },
      });
    });

    const startButton = await screen.findByText("Start Game");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(startSession).toHaveBeenCalledWith(
        mockSessionData.joinCode,
        mockSessionData._id
      );
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "session-started",
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("/start")
      );
    });

    jest.useRealTimers();
  });

  it("handles invite modal interactions", async () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const inviteButton = screen.getByRole("button", { name: /^invite$/i });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
    });

    const inviteUsersButton = screen.getByText("Invite Users");
    fireEvent.click(inviteUsersButton);

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "invite-user",
      expect.objectContaining({
        sessionId: mockSessionData._id,
        userId: "test-user",
        joinCode: mockSessionData.joinCode,
      })
    );

    jest.useRealTimers();
  });

  it("cleans up socket connection on unmount", () => {
    const { unmount } = render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("handles errors during session start", async () => {
    jest.useFakeTimers();

    const mockError = new Error("Failed to start session");
    useSessionContext.mockReturnValue({
      startSession: jest.fn().mockRejectedValue(mockError),
      loading: false,
    });

    render(
      <MemoryRouter>
        <AdminLobby />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Add a player so the start button becomes enabled
    const handlePlayerJoined = mockSocket.on.mock.calls.find(
      (call) => call[0] === "player-joined"
    )[1];

    act(() => {
      handlePlayerJoined({
        user: {
          _id: "player1",
          username: "TestPlayer",
          email: "test@example.com",
        },
      });
    });

    const startButton = screen.getByText("Start Game");
    fireEvent.click(startButton);

    await waitFor(() => {
      const errorElement = screen.getByTestId("error-message");
      expect(errorElement).toHaveTextContent(
        "Failed to start session. Please try again."
      );
    });

    jest.useRealTimers();
  });
});
