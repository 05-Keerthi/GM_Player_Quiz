import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTenantContext } from '../../context/TenantContext';
import TenantManagement from '../../components/TenantManagement';

// Mock the required dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../context/TenantContext');
jest.mock('../../models/Tenant/TenantAdminEditModal', () => {
  const MockTenantAddAdminModal = ({ isOpen, onClose, tenant }) =>
    isOpen ? (
      <div data-testid="mock-tenant-add-admin-modal">
        <h2>Add Tenant Admin</h2>
        <p>Tenant Name: {tenant?.name || "Unknown"}</p>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  return MockTenantAddAdminModal;
});


jest.mock('../../models/Tenant/TenantEditModel', () => {
  const MockTenantEditModal = ({ isOpen, onClose, tenant }) =>
    isOpen ? (
      <div data-testid="mock-tenant-edit-modal">
        <h2>Edit Tenant</h2>
        <p>Tenant Name: {tenant.name}</p>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  return MockTenantEditModal;
});


describe('TenantManagement', () => {
  // Setup mock data and functions
  const mockNavigate = jest.fn();
  const mockGetAllTenants = jest.fn();
  const mockDeleteTenant = jest.fn();
  const mockClearError = jest.fn();

  const mockTenants = [
    {
      _id: '1',
      name: 'Test Tenant 1',
      customDomain: 'test1.com',
      logo: 'test1.jpg'
    },
    {
      _id: '2',
      name: 'Test Tenant 2',
      customDomain: 'test2.com',
      logo: 'test2.jpg'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTenantContext.mockReturnValue({
      state: { tenants: mockTenants },
      getAllTenants: mockGetAllTenants,
      deleteTenant: mockDeleteTenant,
      clearError: mockClearError,
      loading: false,
      error: null
    });
  });

  test('handles delete tenant confirmation', async () => {
    render(<TenantManagement />);

    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Check if confirmation modal appears
    expect(screen.getByText('Delete Tenant')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this tenant? This action cannot be undone.')
    ).toBeInTheDocument();
  });

  test('handles successful tenant deletion', async () => {
    mockDeleteTenant.mockResolvedValueOnce();
    
    render(<TenantManagement />);

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Click confirm in modal
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTenant).toHaveBeenCalledWith('1');
      expect(mockGetAllTenants).toHaveBeenCalledTimes(2); // Initial + after deletion
      expect(toast.success).toHaveBeenCalledWith(
        'Tenant deleted successfully!',
        expect.any(Object)
      );
    });
  });

  test('displays loading state', () => {
    useTenantContext.mockReturnValue({
      state: { tenants: [] },
      getAllTenants: mockGetAllTenants,
      loading: true,
      error: null
    });

    render(<TenantManagement />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // test('handles edit modal opening', () => {
  //   render(<TenantManagement />);

  //   // Find and click edit button
  //   const editButtons = screen.getAllByRole('button', { name: /edit/i });
  //   fireEvent.click(editButtons[0]);

  //   // Verify that the edit modal is opened
  //   expect(screen.getByRole('dialog')).toBeInTheDocument();
  // });

  // test('handles add admin modal opening', () => {
  //   render(<TenantManagement />);

  //   // Find and click add admin button
  //   const addAdminButtons = screen.getAllByRole('button', { name: /add admin/i });
  //   fireEvent.click(addAdminButtons[0]);

  //   // Verify that the add admin modal is opened
  //   expect(screen.getByRole('dialog')).toBeInTheDocument();
  // });

  test('handles search functionality', () => {
    render(<TenantManagement />);

    // Get search input
    const searchInput = screen.getByPlaceholderText('Search Tenant');

    // Type into search input
    fireEvent.change(searchInput, { target: { value: 'Test Tenant 1' } });

    // Verify filtered results
    expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
  });
});