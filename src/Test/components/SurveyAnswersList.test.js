import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { useSurveyAnswerContext } from "../../context/surveyAnswerContext";
import SurveyAnswersList from "../../components/SurveyAnswersList";

jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

jest.mock("../../context/surveyAnswerContext", () => ({
  useSurveyAnswerContext: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockQuestions = [
  {
    _id: "1",
    title: "What is your favorite color?",
    type: "single_select",
    answerOptions: [
      { _id: "opt1", optionText: "Blue" },
      { _id: "opt2", optionText: "Red" },
    ],
  },
  {
    _id: "2",
    title: "Share your thoughts",
    type: "open_ended",
  },
];

const mockAnswers = {
  single_select: [{ answer: "Blue" }, { answer: "Blue" }, { answer: "Red" }],
  open_ended: [
    { answer: "This is my response" },
    { answer: "Another response" },
  ],
};

describe("SurveyAnswersList", () => {
  const mockGetSessionAnswers = jest.fn();
  const mockGetQuestionAnswers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ sessionId: "123" });
    useSurveyAnswerContext.mockReturnValue({
      getSessionAnswers: mockGetSessionAnswers,
      getQuestionAnswers: mockGetQuestionAnswers,
      loading: false,
    });
    mockGetSessionAnswers.mockResolvedValue({ questions: mockQuestions });
  });

  test("renders loading state", () => {
    useSurveyAnswerContext.mockReturnValue({
      getSessionAnswers: mockGetSessionAnswers,
      getQuestionAnswers: mockGetQuestionAnswers,
      loading: true,
    });

    render(<SurveyAnswersList />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("renders list of questions", async () => {
    render(<SurveyAnswersList />);

    await waitFor(() => {
      expect(screen.getByText(/Question 1:/)).toBeInTheDocument();
      expect(
        screen.getByText(/What is your favorite color?/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Question 2:/)).toBeInTheDocument();
      expect(screen.getByText(/Share your thoughts/)).toBeInTheDocument();
    });
  });

  test("opens modal with single select answers", async () => {
    mockGetQuestionAnswers.mockResolvedValue({
      answers: mockAnswers.single_select,
    });

    render(<SurveyAnswersList />);

    await waitFor(() => {
      expect(
        screen.getByText(/What is your favorite color?/)
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/What is your favorite color?/));

    await waitFor(() => {
      // Look for the option text and count separately
      expect(screen.getByText("Blue")).toBeInTheDocument();
      expect(screen.getByText(/\(67%\)/)).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText(/\(33%\)/)).toBeInTheDocument();
    });
  });

  test("opens modal with open-ended answers", async () => {
    mockGetQuestionAnswers.mockResolvedValue({
      answers: mockAnswers.open_ended,
    });

    render(<SurveyAnswersList />);

    await waitFor(() => {
      expect(screen.getByText(/Share your thoughts/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Share your thoughts/));

    await waitFor(() => {
      // Use getByText with exact match for each answer
      expect(
        screen.getByText("This is my response", { exact: true })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Another response", { exact: true })
      ).toBeInTheDocument();
    });
  });

  test("displays error alert when session answers fetch fails", async () => {
    mockGetSessionAnswers.mockRejectedValue(new Error("Failed to fetch"));

    render(<SurveyAnswersList />);

    await waitFor(() => {
      const errorMessage = screen.getByText(
        "Failed to load survey questions. Please try again later."
      );
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });
  });

  test("displays error alert when question answers fetch fails", async () => {
    mockGetQuestionAnswers.mockRejectedValue(new Error("Failed to fetch"));

    render(<SurveyAnswersList />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(/What is your favorite color?/));
    });

    await waitFor(() => {
      const errorMessage = screen.getByText(
        "Failed to load answers. Please try again later."
      );
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });
  });

  test("closes modal when clicking close button", async () => {
    mockGetQuestionAnswers.mockResolvedValue({
      answers: mockAnswers.open_ended,
    });

    render(<SurveyAnswersList />);

    // Wait for questions to load and click to open modal
    const questionButton = await screen.findByText(/Share your thoughts/);
    fireEvent.click(questionButton);

    // Wait for modal to appear and verify it's open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Find and click close button
    const closeButton = screen.getByRole("button", { name: /close modal/i });
    fireEvent.click(closeButton);

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
