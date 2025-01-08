import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ContentDisplay from "../../../components/Session/ContentDisplay"; // Adjust the path as needed

describe("ContentDisplay Component", () => {
  let mockSocket;
  const mockOnNext = jest.fn();
  const mockOnSubmitAnswer = jest.fn();
  const mockOnEndQuiz = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };
  });

  test("renders a slide correctly", () => {
    const item = {
      type: "slide",
      title: "Welcome to the Quiz!",
      content: "This is an introductory slide.",
      imageUrl: "slide-image.jpg",
    };

    render(<ContentDisplay item={item} isAdmin={true} />);

    expect(screen.getByText("Welcome to the Quiz!")).toBeInTheDocument();
    expect(screen.getByText("This is an introductory slide.")).toBeInTheDocument();
    expect(screen.getByAltText("Slide")).toBeInTheDocument();
  });

  test("renders an open-ended question correctly", () => {
    const item = {
      type: "open_ended",
      title: "What is your favorite color?",
    };

    render(
      <ContentDisplay
        item={item}
        isAdmin={false}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeLeft={30}
      />
    );

    expect(screen.getByText("What is your favorite color?")).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText("Type your answer here...");
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Blue" } });
    fireEvent.click(screen.getByText("Submit Answer"));

    expect(mockOnSubmitAnswer).toHaveBeenCalledWith({
      type: "open_ended",
      answer: "Blue",
      questionId: undefined, // Assuming no _id is passed in the test case
    });
  });

  test("disables answer submission when time is up", () => {
    const item = {
      type: "open_ended",
      title: "What is your favorite food?",
    };

    render(
      <ContentDisplay
        item={item}
        isAdmin={false}
        timeLeft={0} // Time is up
      />
    );

    const submitButton = screen.getByText("Submit Answer");
    expect(submitButton).toBeDisabled();
  });

  test("renders a multiple-choice question for a user", () => {
    const item = {
      type: "poll",
      title: "Which is the largest planet?",
      options: [
        { _id: "1", text: "Earth" },
        { _id: "2", text: "Jupiter" },
        { _id: "3", text: "Mars" },
      ],
    };

    render(
      <ContentDisplay
        item={item}
        isAdmin={false}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeLeft={30}
      />
    );

    const optionButtons = screen.getAllByRole("button");
    expect(optionButtons).toHaveLength(3);

    fireEvent.click(optionButtons[1]); // Select "Jupiter"

    expect(mockOnSubmitAnswer).toHaveBeenCalledWith({
      _id: "2",
      text: "Jupiter",
    });
  });

  test("renders a multiple-choice question with results for an admin", () => {
    const item = {
      type: "poll",
      title: "Which is the largest planet?",
      options: [
        { _id: "1", text: "Earth", color: "#ff0000" },
        { _id: "2", text: "Jupiter", color: "#00ff00" },
        { _id: "3", text: "Mars", color: "#0000ff" },
      ],
    };

    const passedOptionCounts = { 1: 10, 2: 50, 3: 40 };
    const passedTotalVotes = 100;

    render(
      <ContentDisplay
        item={item}
        isAdmin={true}
        optionCounts={passedOptionCounts}
        totalVotes={passedTotalVotes}
      />
    );

    const percentageTexts = screen.getAllByText(/%/i);
    expect(percentageTexts).toHaveLength(3);
    expect(percentageTexts[1]).toHaveTextContent("50% (50)"); // Jupiter
  });

  test("handles socket events for poll updates", () => {
    const item = {
      type: "poll",
      _id: "123",
      title: "Favorite fruit?",
      options: [
        { _id: "1", text: "Apple" },
        { _id: "2", text: "Banana" },
      ],
    };

    render(<ContentDisplay item={item} socket={mockSocket} isAdmin={false} />);

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "answer-submitted"
    )[1];

    act(() => {
      callback({ answerDetails: { questionId: "123", answer: "Apple" } });
    });

    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  test("renders quiz completion message", () => {
    render(
      <ContentDisplay
        isQuizEnded={true}
        isAdmin={true}
        onEndQuiz={mockOnEndQuiz}
      />
    );

    expect(screen.getByText("Quiz Completed!")).toBeInTheDocument();

    const endQuizButton = screen.getByText("End quiz");
    fireEvent.click(endQuizButton);

    expect(mockOnEndQuiz).toHaveBeenCalled();
  });

  test("renders the next button for admin", () => {
    const item = {
      type: "poll",
      title: "What is the capital of France?",
      options: [{ text: "Paris" }, { text: "Berlin" }],
    };

    render(<ContentDisplay item={item} isAdmin={true} onNext={mockOnNext} />);

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalled();
  });

  test("handles multiple select submission", () => {
    const item = {
      type: "multiple_select",
      title: "Select your favorite programming languages",
      options: [
        { _id: "1", text: "JavaScript" },
        { _id: "2", text: "Python" },
        { _id: "3", text: "Java" },
      ],
    };

    render(
      <ContentDisplay
        item={item}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeLeft={30}
        isAdmin={false}
      />
    );

    const optionButtons = screen.getAllByRole("button");
    fireEvent.click(optionButtons[0]); // Select "JavaScript"
    fireEvent.click(optionButtons[1]); // Select "Python"

    const submitButton = screen.getByText("Submit Selections");
    fireEvent.click(submitButton);

    expect(mockOnSubmitAnswer).toHaveBeenCalledWith({
      type: "multiple_select",
      answer: [0, 1], // Indices
      text: "JavaScript, Python", // Texts
    });
  });
});
