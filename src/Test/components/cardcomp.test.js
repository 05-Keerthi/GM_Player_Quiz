import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Card from "../../components/CardComp";  // Adjust the import path based on your file structure

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right-icon" />
}));

describe('Card Component', () => {
  const mockProps = {
    icon: <div data-testid="custom-icon">Icon</div>,
    title: 'Card Title',
    description: 'Card Description',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    buttonText: 'Click Here',
    onClick: jest.fn(),
    bgColor: 'bg-blue-500'
  };

  it('renders with all provided props', () => {
    render(<Card {...mockProps} />);
    
    // Check main wrapper classes
    const wrapper = screen.getByText(mockProps.title).closest('div').parentElement;
    expect(wrapper).toHaveClass(
      'relative',
      'p-6',
      'rounded-2xl',
      'shadow-lg',
      'transform',
      'transition-all',
      'duration-300',
      'hover:scale-105',
      'hover:shadow-xl',
      mockProps.bgColor
    );

    // Check icon container
    const iconContainer = screen.getByTestId('custom-icon').parentElement;
    expect(iconContainer).toHaveClass('absolute', 'top-4', 'right-4');

    // Check content container
    const contentContainer = screen.getByText(mockProps.title).parentElement;
    expect(contentContainer).toHaveClass('space-y-4');

    // Check title
    const title = screen.getByText(mockProps.title);
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-white');

    // Check description
    const description = screen.getByText(mockProps.description);
    expect(description).toHaveClass('text-white/80', 'text-sm');

    // Check features list
    const featuresList = screen.getByRole('list');
    expect(featuresList).toHaveClass('space-y-2', 'text-white/90', 'text-sm');

    // Check features and chevron icons
    mockProps.features.forEach(feature => {
      const featureItem = screen.getByText(feature).parentElement;
      expect(featureItem).toHaveClass('flex', 'items-center', 'space-x-2');
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
    const chevrons = screen.getAllByTestId('chevron-right-icon');
    expect(chevrons).toHaveLength(mockProps.features.length);

    // Check button
    const button = screen.getByText(mockProps.buttonText);
    expect(button).toHaveClass(
      'w-full',
      'mt-4',
      'py-3',
      'bg-white/20',
      'hover:bg-white/30',
      'text-white',
      'font-semibold',
      'rounded-lg',
      'transition-colors'
    );
  });

  it('handles click events on button', async () => {
      const mockProps = {
          icon: <div>Icon</div>,
          title: "Test Title",
          description: "Test Description",
          features: ["Feature 1", "Feature 2"],
          buttonText: "Click Me",
          onClick: jest.fn(),
          bgColor: "bg-blue-500"
      };
  
      render(<Card {...mockProps} />);
      
      const button = screen.getByText(mockProps.buttonText);
      await userEvent.click(button);
      
      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without features when empty array is provided', () => {
    render(<Card {...mockProps} features={[]} />);
    
    const chevrons = screen.queryAllByTestId('chevron-right-icon');
    expect(chevrons).toHaveLength(0);
  });

  it('renders without icon when not provided', () => {
    const propsWithoutIcon = { ...mockProps, icon: null };
    render(<Card {...propsWithoutIcon} />);
    
    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
  });

  it('applies custom background color', () => {
    const customBgColor = 'bg-red-500';
    render(<Card {...mockProps} bgColor={customBgColor} />);
    
    const wrapper = screen.getByText(mockProps.title).closest('div').parentElement;
    expect(wrapper).toHaveClass(customBgColor);
  });
});