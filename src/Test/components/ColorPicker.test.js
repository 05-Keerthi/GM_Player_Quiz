import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ColorPicker from '../../components/ColorPicker';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Palette: () => <div data-testid="palette-icon" />
}));

describe('ColorPicker Component', () => {
  const defaultProps = {
    color: '#FF6B6B',
    onChange: jest.fn(),
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByLabelText('Open color picker')).toBeInTheDocument();
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
  });

  it('opens color picker on click', async () => {
    render(<ColorPicker {...defaultProps} />);
    const button = screen.getByLabelText('Open color picker');
    await userEvent.click(button);
    expect(screen.getByText('Custom Color')).toBeInTheDocument();
    expect(screen.getByText('Preset Colors')).toBeInTheDocument();
  });

  it('displays predefined colors', async () => {
    render(<ColorPicker {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Open color picker'));
    
    // Check for a few predefined colors
    ['#FF6B6B', '#4ECDC4', '#45B7D1'].forEach(color => {
      const colorButton = screen.getByLabelText(`Select color ${color}`);
      expect(colorButton).toBeInTheDocument();
    });
  });

  it('calls onChange when selecting a predefined color', async () => {
    render(<ColorPicker {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Open color picker'));
    
    const colorButton = screen.getByLabelText('Select color #4ECDC4');
    await userEvent.click(colorButton);
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('#4ECDC4');
  });

  it('displays current color value', async () => {
    render(<ColorPicker {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Open color picker'));
    
    expect(screen.getByText(defaultProps.color.toUpperCase())).toBeInTheDocument();
  });

 it("handles custom color input", async () => {
  render(<ColorPicker {...defaultProps} />);
  await userEvent.click(screen.getByLabelText("Open color picker"));

  const colorInput = screen.getByLabelText("Custom color input");
  fireEvent.change(colorInput, { target: { value: "#123456" } });

  expect(defaultProps.onChange).toHaveBeenCalledWith("#123456");
});


  it('closes on outside click', () => {
    render(<ColorPicker {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open color picker'));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Custom Color')).not.toBeInTheDocument();
  });
});