import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TestWrapper, resetAllMocks } from './test-utils';
import IllustrationForm from '../src/components/IllustrationForm';
import api from '@/library/api';
import { setFlashMessage } from '@/features/flash/reducer';

/**
 * 2. MODULE MOCKS
 * Note: next/router is mocked in test-utils.tsx with back/push/replace
 */

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test User' }, userId: 1, accessToken: 'token-123' },
    status: 'authenticated',
  }),
}));

jest.mock('@/library/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn(() => Promise.resolve({ message: 'Success', id: 50 })),
    put: jest.fn(() => Promise.resolve({ message: 'Updated', illustration: { id: 1 } })),
    postMultipart: jest.fn(() => Promise.resolve({ message: 'File uploaded successfully' })),
  },
}));

jest.mock('@/features/flash/reducer', () => ({
  setFlashMessage: jest.fn((payload) => ({ type: 'flash/setFlashMessage', payload })),
}));

// Mock UI actions to avoid dispatch errors
jest.mock('@/features/ui/reducer', () => ({
  setIllustrationEdit: jest.fn(() => ({ type: 'ui/setIllustrationEdit' })),
  setUpdateUI: jest.fn(() => ({ type: 'ui/setUpdateUI' })),
}));

/**
 * 3. TEST SUITE
 */
describe('IllustrationForm', () => {
  const mockOwnedIllustration = {
    id: 1,
    title: 'Test Illustration',
    content: 'Test content',
    author: 'Test Author',
    source: 'Test Source',
    tags: [],
    uploads: [],
    places: [],
    private: false,
    userId: '1', // Matches session userId
  };

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  it('renders correctly in create mode', () => {
    render(
      <TestWrapper>
        <IllustrationForm />
      </TestWrapper>
    );
    expect(screen.getByText(/New Illustration/i)).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(
      <TestWrapper>
        <IllustrationForm />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('dispatches error when file size exceeds 20MB', async () => {
    render(
      <TestWrapper>
        <IllustrationForm illustration={mockOwnedIllustration as any} />
      </TestWrapper>
    );

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const largeFile = new File([''], 'too_big.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 21 * 1024 * 1024 }); // 21MB

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(setFlashMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'danger',
        message: expect.stringContaining('not exceed 20MB'),
      })
    );
  });

  it('hides privacy checkbox in edit mode if user does NOT own it', () => {
    const foreignIllustration = { ...mockOwnedIllustration, userId: '999' };

    render(
      <TestWrapper>
        <IllustrationForm illustration={foreignIllustration as any} />
      </TestWrapper>
    );

    expect(screen.queryByLabelText(/Private\/Personal illustration/i)).not.toBeInTheDocument();
  });
});