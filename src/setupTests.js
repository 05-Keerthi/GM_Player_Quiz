import "@testing-library/jest-dom";

// Mock CSS modules
jest.mock("react-phone-number-input/style.css", () => ({}));
jest.mock("react-toastify/dist/ReactToastify.css", () => ({}));

// Mock the FontAwesome components
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <div data-testid="password-toggle">Icon</div>,
}));
