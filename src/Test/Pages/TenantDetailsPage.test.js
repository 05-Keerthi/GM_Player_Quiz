// File: TenantDetailsPage.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import { useTenantContext } from '../../context/TenantContext';
import TenantDetailsPage from '../../pages/TenantDetailsPage';
import { toast } from 'react-toastify';

// Mock all required dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}));

jest.mock('../../context/TenantContext', () => ({
  useTenantContext: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock Navbar component
jest.mock('../../components/NavbarComp', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

// Mock modal components
jest.mock('../../models/Tenant/TenantEditModel', () => {
    return function MockTenantEditModal({ isOpen, ...props }) {
      if (!isOpen) return null;
      return <div data-testid="edit-tenant-modal" {...props}>Edit Modal</div>;
    };
  });
  
  jest.mock('../../models/Tenant/TenantAddAdminModal', () => {
    return function MockTenantAddAdminModal({ isOpen, ...props }) {
      if (!isOpen) return null;
      return <div data-testid="add-admin-modal" {...props}>Add Admin Modal</div>;
    };
  });
  
  jest.mock('../../models/Tenant/TenantAdminEditModal', () => {
    return function MockTenantAdminEditModal({ isOpen, ...props }) {
      if (!isOpen) return null;
      return <div data-testid="edit-admin-modal" {...props}>Edit Admin Modal</div>;
    };
  });
  
  jest.mock('../../models/ConfirmationModal', () => {
    return function MockConfirmationModal({ isOpen, onConfirm, ...props }) {
      if (!isOpen) return null;
      return (
        <div data-testid="confirmation-modal" {...props}>
          Confirmation Modal
          <button data-testid="confirm-delete-button" onClick={onConfirm}>
            Confirm Delete
          </button>
        </div>
      );
    };
  });
  
  const mockTenant = {
    _id: '123',
    name: 'Test Tenant',
    logo: 'test-logo.png',
    customDomain: 'test.domain.com',
    description: 'Test Description',
    contactEmail: 'test@test.com',
    plan: 'Premium',
    createdAt: '2024-01-01T00:00:00.000Z',
  };
  
  const mockAdmins = [
    {
      _id: 'admin1',
      username: 'Admin One',
      email: 'admin1@test.com',
    },
    {
      _id: 'admin2',
      username: 'Admin Two',
      email: 'admin2@test.com',
    },
  ];
  
  // Create a wrapper component that provides router context
  const TestWrapper = ({ children }) => {
    return <BrowserRouter>{children}</BrowserRouter>;
  };
  
  describe('TenantDetailsPage', () => {
    const user = userEvent.setup();
    const mockNavigate = jest.fn();
    
    beforeEach(() => {
      useParams.mockReturnValue({ id: '123' });
      useNavigate.mockReturnValue(mockNavigate);
      useTenantContext.mockReturnValue({
        getTenantById: jest.fn().mockResolvedValue(mockTenant),
        getTenantAdmins: jest.fn().mockResolvedValue(mockAdmins),
        deleteTenantAdmin: jest.fn().mockResolvedValue(),
        error: null,
        loading: false,
        clearError: jest.fn(),
      });
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    const renderWithRouter = (component) => {
      return render(component, { wrapper: TestWrapper });
    };
  
    describe('Loading States', () => {
      test('displays loading spinner when loading is true', () => {
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          loading: true,
        });
  
        renderWithRouter(<TenantDetailsPage />);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
  
      test('fetches and displays tenant details successfully', async () => {
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
        });
  
        expect(screen.getByTestId('tenant-domain')).toHaveTextContent('test.domain.com');
        expect(screen.getByTestId('tenant-description')).toHaveTextContent('Test Description');
        expect(screen.getByTestId('tenant-email')).toHaveTextContent('test@test.com');
      });
    });
  
    describe('Admin Management', () => {
      test('displays list of admins', async () => {
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('admins-list')).toBeInTheDocument();
        });
  
        const adminItems = screen.getAllByTestId(/^admin-item-/);
        expect(adminItems).toHaveLength(2);
        expect(adminItems[0]).toHaveTextContent('Admin One');
        expect(adminItems[1]).toHaveTextContent('Admin Two');
      });
  
      test('opens add admin modal when clicking add button', async () => {
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('add-admin-button')).toBeInTheDocument();
        });
  
        await user.click(screen.getByTestId('add-admin-button'));
        
        await waitFor(() => {
          expect(screen.getByTestId('add-admin-modal')).toBeInTheDocument();
        });
      });
  
      test('opens edit admin modal when clicking edit button', async () => {
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('admins-list')).toBeInTheDocument();
        });
  
        await user.click(screen.getByTestId('edit-admin-button-admin1'));
        
        await waitFor(() => {
          expect(screen.getByTestId('edit-admin-modal')).toBeInTheDocument();
        });
      });
  
      test('opens and handles delete confirmation modal', async () => {
        const deleteTenantAdmin = jest.fn().mockResolvedValue();
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          deleteTenantAdmin,
        });
  
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('admins-list')).toBeInTheDocument();
        });
  
        await user.click(screen.getByTestId('delete-admin-button-admin1'));
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
  
        await user.click(screen.getByTestId('confirm-delete-button'));
        expect(deleteTenantAdmin).toHaveBeenCalledWith('123', 'admin1');
        expect(toast.success).toHaveBeenCalledWith('Admin deleted successfully');
      });
    });
  
    describe('Error Handling', () => {
      test('displays error toast when tenant fetch fails', async () => {
        const getTenantById = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          getTenantById,
          getTenantAdmins: jest.fn().mockResolvedValue([]),
        });
  
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to fetch tenant details');
        });
      });
  
      test('displays error toast when admin deletion fails', async () => {
        const deleteTenantAdmin = jest.fn().mockRejectedValue(new Error('Failed to delete'));
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          deleteTenantAdmin,
        });
  
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('admins-list')).toBeInTheDocument();
        });
  
        await user.click(screen.getByTestId('delete-admin-button-admin1'));
        await user.click(screen.getByTestId('confirm-delete-button'));
  
        expect(toast.error).toHaveBeenCalledWith('Failed to delete admin');
      });
  
      test('displays error from context', async () => {
        const mockClearError = jest.fn();
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          error: 'Context error message',
          clearError: mockClearError,
        });
      
        renderWithRouter(<TenantDetailsPage />);
      
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            'Context error message',
            expect.objectContaining({
              onClose: expect.any(Function)
            })
          );
        });
      });
    });
  
    describe('Tenant Information Display', () => {
      test('displays all tenant information correctly', async () => {
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('tenant-details-page')).toBeInTheDocument();
        });
  
        expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
        expect(screen.getByTestId('tenant-domain')).toHaveTextContent('test.domain.com');
        expect(screen.getByTestId('tenant-description')).toHaveTextContent('Test Description');
        expect(screen.getByTestId('tenant-email')).toHaveTextContent('test@test.com');
        expect(screen.getByTestId('tenant-plan')).toHaveTextContent('Premium');
        expect(screen.getByTestId('creation-date')).toHaveTextContent('1/1/2024');
        expect(screen.getByTestId('tenant-status')).toHaveTextContent('Active');
      });
  
      test('handles missing optional tenant information', async () => {
        const tenantWithMissingInfo = {
          ...mockTenant,
          description: null,
          plan: null,
        };
  
        useTenantContext.mockReturnValue({
          ...useTenantContext(),
          getTenantById: jest.fn().mockResolvedValue(tenantWithMissingInfo),
        });
  
        renderWithRouter(<TenantDetailsPage />);
  
        await waitFor(() => {
          expect(screen.getByTestId('tenant-details-page')).toBeInTheDocument();
        });
  
        expect(screen.getByTestId('tenant-description')).toHaveTextContent('No description available');
        expect(screen.getByTestId('tenant-plan')).toHaveTextContent('No Plan');
      });
    });
  });