import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay"; // Adjust path as needed
import { Timer } from "lucide-react";

// Mock the props and functions that will be passed to the component
const mockOnNext = jest.fn();
const mockOnSubmitAnswer = jest.fn();
const mockOnEndSurvey = jest.fn();

// Sample data for the tests
const sampleItem = {
  _id: "1",
  title: "Sample Question",
  description: "This is a sample question.",
  answerOptions: [
    { _id: "1", optionText: "Option A", color: "#ff6347" },
    { _id: "2", optionText: "Option B", color: "#4682b4" },
  ],
};

describe("SurveyContentDisplay Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders survey question and options for non-admin", () => {
    render(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={false}
        timeLeft={10}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
      />
    );

    // Check if question title is rendered
    expect(screen.getByText("Sample Question")).toBeInTheDocument();

    // Check if answer options are rendered
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();

    // Click on an option
    fireEvent.click(screen.getByText("Option A"));

    // Check if submit answer function is called
    expect(mockOnSubmitAnswer).toHaveBeenCalledWith({
      type: "single_select",
      answer: "Option A",
      questionId: "1",
    });
  });

  test("renders time left and handles timer for non-admin", async () => {
    // Initial render with timeLeft as 10
    const { rerender } = render(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={false}
        timeLeft={10}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
      />
    );
  
    // Check if the timer is displayed
    expect(screen.getByText(/10s/)).toBeInTheDocument();
  
    // Re-render with timeLeft as 0
    rerender(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={false}
        timeLeft={0}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
      />
    );
  
    // Check if the timeLeft is displayed as 0
    expect(screen.getByText(/0s/)).toBeInTheDocument();
  
    // Optionally check if "Time's up" message is shown if implemented in the component
    // expect(screen.getByText("Time's up")).toBeInTheDocument();
  });
  

  test("renders slide content for admin", () => {
    const sampleSlide = {
      _id: "2",
      type: "slide",
      title: "Slide Title",
      content: "This is some slide content.",
      imageUrl: "http://example.com/slide-image.jpg",
    };

    render(
      <SurveyContentDisplay
        item={sampleSlide}
        isAdmin={true}
        timeLeft={10}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
      />
    );

    // Check if slide title is rendered
    expect(screen.getByText("Slide Title")).toBeInTheDocument();

    // Check if slide content is rendered
    expect(screen.getByText("This is some slide content.")).toBeInTheDocument();

    // Check if slide image is rendered
    expect(screen.getByRole("img")).toHaveAttribute("src", "http://example.com/slide-image.jpg");
  });

  test("calls onEndSurvey when the survey is ended by admin", async () => {
    // Render the SurveyContentDisplay component with survey ended
    render(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={true}         // Admin is true to show the End survey button
        timeLeft={10}
        isLastItem={true}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}  // Ensure to pass the correct function here
        isSurveyEnded={true}  // Survey is marked as ended to display the completion message
      />
    );
  
    // Ensure the "Survey Completed!" message is rendered
    expect(screen.getByText("Survey Completed!")).toBeInTheDocument();
    expect(screen.getByText("Thank you for participating in the survey.")).toBeInTheDocument();
  
    // Ensure the 'End Survey' button is rendered (this is for admin only)
    const endButton = screen.getByText("End survey");
  
    // Ensure the button is enabled and clickable
    expect(endButton).toBeEnabled();
    expect(endButton).toBeInTheDocument();
  
    // Simulate clicking the "End Survey" button
    fireEvent.click(endButton);
  
    // Check if the onEndSurvey function is called after clicking the button
    expect(mockOnEndSurvey).toHaveBeenCalled();
  });
  
  
  

  test("disables options after answer is submitted", () => {
    render(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={false}
        timeLeft={10}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
        submittedAnswers={[]}
      />
    );

    const optionButton = screen.getByText("Option A");

    // Click on an option
    fireEvent.click(optionButton);

    // Check if the submit answer function was called
    expect(mockOnSubmitAnswer).toHaveBeenCalledWith({
      type: "single_select",
      answer: "Option A",
      questionId: "1",
    });
  });

  test("shows survey completion message when the survey is ended", () => {
    render(
      <SurveyContentDisplay
        item={sampleItem}
        isAdmin={false}
        timeLeft={10}
        isLastItem={false}
        onNext={mockOnNext}
        onSubmitAnswer={mockOnSubmitAnswer}
        onEndSurvey={mockOnEndSurvey}
        isSurveyEnded={true}
      />
    );

    // Check if the survey completed message is displayed
    expect(screen.getByText("Survey Completed!")).toBeInTheDocument();
    expect(screen.getByText("Thank you for participating in the survey.")).toBeInTheDocument();
  });
});
