import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SurveyJoin from "../../../../pages/Session/UserJoin/SurveyJoin";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";

// Mock the required hooks and modules
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    search: "",
  }),
}));

jest.mock("../../../../context/surveySessionContext", () => ({
  useSurveySessionContext: jest.fn(),
}));

const mockNavigate = jest.fn();

describe("SurveyJoin Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockImplementation(() => mockNavigate);
    useSurveySessionContext.mockImplementation(() => ({
      joinSurveySession: jest.fn(),
      loading: false,
    }));
  });

  describe("Rendering", () => {
    test("renders all required elements", () => {
      render(<SurveyJoin />);

      expect(screen.getByText("Ready to join?")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Game PIN")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
      expect(
        screen.getByText("Game PINs are 6 digits long")
      ).toBeInTheDocument();
    });

    test("input field only accepts numbers and limits to 6 digits", () => {
      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");

      fireEvent.change(input, { target: { value: "abc123def456" } });
      expect(input.value).toBe("123456");

      fireEvent.change(input, { target: { value: "1234567890" } });
      expect(input.value).toBe("123456");
    });

    test("join button is disabled when input length is less than 6", () => {
      render(<SurveyJoin />);
      const button = screen.getByRole("button", { name: /join/i });
      const input = screen.getByPlaceholderText("Game PIN");

      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: "12345" } });
      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: "123456" } });
      expect(button).not.toBeDisabled();
    });

    test("shows loading state when joining", () => {
      useSurveySessionContext.mockImplementation(() => ({
        joinSurveySession: jest.fn(),
        loading: true,
      }));

      render(<SurveyJoin />);
      expect(screen.getByText("Joining...")).toBeInTheDocument();
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });
  });

  describe("URL Parameter Handling", () => {
    test("automatically fills input when code is provided in URL", () => {
      jest
        .spyOn(require("react-router-dom"), "useLocation")
        .mockImplementation(() => ({
          search: "?code=123456",
        }));

      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");
      expect(input.value).toBe("123456");
    });

    test("handles invalid code in URL parameter", () => {
      jest
        .spyOn(require("react-router-dom"), "useLocation")
        .mockImplementation(() => ({
          search: "?code=abc123",
        }));

      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");
      expect(input.value).toBe("123");
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      jest
        .spyOn(require("react-router-dom"), "useLocation")
        .mockImplementation(() => ({
          search: "",
        }));
    });

    test("shows error when submitting empty form", async () => {
      render(<SurveyJoin />);
      const button = screen.getByRole("button", { name: /join/i });

      fireEvent.submit(button);
      expect(screen.getByText("Please enter a Game PIN")).toBeInTheDocument();
    });

    test("successfully joins session and navigates", async () => {
      const mockJoinSurveySession = jest.fn().mockResolvedValue({
        session: { _id: "session123" },
      });

      useSurveySessionContext.mockImplementation(() => ({
        joinSurveySession: mockJoinSurveySession,
        loading: false,
      }));

      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");
      fireEvent.change(input, { target: { value: "123456" } });
      fireEvent.submit(screen.getByRole("button", { name: /join/i }));

      await waitFor(() => {
        expect(mockJoinSurveySession).toHaveBeenCalledWith("123456");
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/survey-user-lobby?code=123456&sessionId=session123"
        );
      });
    });

    test("handles server error response", async () => {
      const mockError = new Error("Server error");
      mockError.response = { data: { message: "Invalid Game PIN" } };

      const mockJoinSurveySession = jest.fn().mockRejectedValue(mockError);
      useSurveySessionContext.mockImplementation(() => ({
        joinSurveySession: mockJoinSurveySession,
        loading: false,
      }));

      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");
      fireEvent.change(input, { target: { value: "123456" } });
      fireEvent.submit(screen.getByRole("button", { name: /join/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid Game PIN")).toBeInTheDocument();
      });
    });

    test("handles generic error response", async () => {
      const mockJoinSurveySession = jest.fn().mockRejectedValue(new Error());
      useSurveySessionContext.mockImplementation(() => ({
        joinSurveySession: mockJoinSurveySession,
        loading: false,
      }));

      render(<SurveyJoin />);
      const input = screen.getByPlaceholderText("Game PIN");
      fireEvent.change(input, { target: { value: "123456" } });
      fireEvent.submit(screen.getByRole("button", { name: /join/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid Game PIN")).toBeInTheDocument();
      });
    });
  });
});
