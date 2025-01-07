import "@testing-library/jest-dom";

// Mock CSS modules
jest.mock("react-phone-number-input/style.css", () => ({}));

// Mock the FontAwesome components
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <div data-testid="password-toggle">Icon</div>,
}));
