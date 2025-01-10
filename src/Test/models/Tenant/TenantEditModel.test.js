import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import TenantEditModal from './TenantEditModal';
import { useTenantContext } from '../../context/TenantContext';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../context/TenantContext', () => ({
  useTenantContext: jest.fn(),
}));

describe('TenantEditModal', () => {
  const mockUpdateTenant = jest.fn();
  const mockOnClose = jest.fn();
  
  const mockTenant = {
    _id: '123',
    name: 'Test Tenant',
    customDomain: 'test.com',
    theme: 'light',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    fontFamily: 'Arial',
    logo: 'https://example.com/logo.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTenantContext.mockImplementation(() => ({
      updateTenant: mockUpdateTenant,
    }));
  });

  it('should not render when isOpen is false', () => {
    render(
      <TenantEditModal
        isOpen={false}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );
    
    expect(screen.queryByText('Edit Tenant')).not.toBeInTheDocument();
  });

  it('should render with tenant data when opened', () => {
    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );
    
    expect(screen.getByText('Edit Tenant')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockTenant.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockTenant.customDomain)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockTenant.logo)).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const nameInput = screen.getByDisplayValue(mockTenant.name);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Tenant Name');
    
    expect(nameInput).toHaveValue('New Tenant Name');
  });

  it('should handle successful form submission', async () => {
    mockUpdateTenant.mockResolvedValueOnce({ ...mockTenant, name: 'Updated Tenant' });

    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateTenant).toHaveBeenCalledWith(mockTenant._id, expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Tenant updated successfully!');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle validation errors', async () => {
    const errorResponse = {
      response: {
        data: {
          errors: [
            { field: 'name', message: 'Name is required' }
          ]
        }
      }
    };
    mockUpdateTenant.mockRejectedValueOnce(errorResponse);

    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('name: Name is required');
    });
  });

  it('should handle generic error during submission', async () => {
    const errorResponse = {
      response: {
        data: {
          message: 'Something went wrong'
        }
      }
    };
    mockUpdateTenant.mockRejectedValueOnce(errorResponse);

    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  it('should close modal when cancel button is clicked', async () => {
    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable buttons during form submission', async () => {
    mockUpdateTenant.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('should handle theme selection change', async () => {
    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const themeSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(themeSelect, 'dark');

    expect(themeSelect).toHaveValue('dark');
  });

  it('should handle color picker changes', async () => {
    render(
      <TenantEditModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const primaryColorInput = screen.getByDisplayValue(mockTenant.primaryColor);
    fireEvent.input(primaryColorInput, { target: { value: '#ff0000' } });

    expect(primaryColorInput).toHaveValue('#ff0000');
  });
});