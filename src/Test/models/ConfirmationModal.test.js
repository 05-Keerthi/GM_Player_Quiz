import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmationModal from '../../models/ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders with custom title and message', () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Title',
      message: 'Custom Message',
    };
    
    render(<ConfirmationModal {...customProps} />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('renders with the correct styles', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    // Check overlay
    expect(screen.getByTestId('modal-overlay')).toHaveClass(
      'fixed',
      'inset-0',
      'bg-gray-500',
      'bg-opacity-50',
      'flex',
      'items-center',
      'justify-center',
      'z-50'
    );

    // Check modal container
    expect(screen.getByTestId('modal-container')).toHaveClass(
      'bg-white',
      'p-6',
      'rounded-lg',
      'shadow-lg',
      'w-full',
      'max-w-md'
    );

    // Check buttons
    expect(screen.getByText('Cancel')).toHaveClass(
      'px-4',
      'py-2',
      'bg-gray-200',
      'rounded',
      'hover:bg-gray-300'
    );
    
    expect(screen.getByText('Confirm')).toHaveClass(
      'px-4',
      'py-2',
      'bg-red-500',
      'text-white',
      'rounded',
      'hover:bg-red-600'
    );
  });
});