import { render, screen, waitFor, act } from '@testing-library/react';
import { TestWrapper, createMockSession, mockApiCalls, resetAllMocks } from './test-utils';
import IllustrationForm from '../src/components/IllustrationForm';
import { illustrationType } from '../src/library/illustrationType';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/',
  }),
}));

jest.mock('@/library/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((route: string) => {
      if (route === '/tags' || route.includes('/tags?')) {
        return Promise.resolve([
          { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
          { id: 2, name: 'tag-2', slug: 'tag-2', user_id: 1, team_id: null },
        ]);
      }
      if (route.startsWith('/illustration/')) {
        const id = route.split('/')[2];
        return Promise.resolve({
          id: parseInt(id),
          title: 'Test Illustration',
          author: 'Test Author',
          source: 'Test Source',
          content: 'Test content',
          user_id: 1,
          team_id: null,
          private: false,
          owner_id: 1,
          tags: [],
          places: [],
          uploads: [],
        });
      }
      return Promise.resolve({});
    }),
    post: jest.fn(() => Promise.resolve({ message: 'Created' })),
    put: jest.fn(() => Promise.resolve({ message: 'Updated' })),
    delete: jest.fn(() => Promise.resolve({ message: 'Deleted' })),
  },
}));

jest.mock('@/features/flash/reducer', () => ({
  setFlashMessage: (payload: any) => ({ type: 'flash/setFlashMessage', payload }),
  setFlash: (payload: any) => ({ type: 'flash/setFlash', payload }),
  selectFlash: (state: any) => state?.flash?.show ?? false,
  selectFlashMessage: (state: any) => state?.flash?.object ?? { message: '', severity: '' },
}));

jest.mock('@/features/ui/reducer', () => ({
  setIllustrationEdit: jest.fn(),
  setUpdateUI: jest.fn(),
  setRedirect: (payload: any) => ({ type: 'ui/setRedirect', payload }),
  selectIllustrationEdit: (state: any) => state?.ui?.illustrationEdit ?? false,
  selectUpdateUI: (state: any) => state?.ui?.updateUI ?? false,
  getRedirect: (state: any) => state?.ui?.redirect ?? '/',
}));

jest.mock('@/features/modal/reducer', () => ({
  selectModal: (state: any) => state?.modal?.show ?? false,
  setModal: (payload: any) => ({ type: 'modal/setModal', payload }),
  setThingToDelete: (payload: any) => ({ type: 'modal/setThingToDelete', payload }),
  thingToDelete: (state: any) => state?.modal?.itemToDelete ?? null,
}));

jest.mock('@/features/tags/reducer', () => ({
  getFormattedTags: (state: any) => state?.tags?.formattedTags ?? [],
  getTags: (state: any) => state?.tags?.tags ?? [],
  setTags: (payload: any) => ({ type: 'tags/setTags', payload }),
  addTag: (payload: any) => ({ type: 'tags/addTag', payload }),
  removeTag: (payload: any) => ({ type: 'tags/removeTag', payload }),
}));

describe('IllustrationForm', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    mockApiCalls();
  });

  it('renders create mode without crashing', async () => {
    mockApiCalls({
      '/tags': [
        { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
      ],
    });

    render(
      <TestWrapper>
        <IllustrationForm />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it('shows privacy checkbox in create mode', async () => {
    mockApiCalls({
      '/tags': [
        { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
      ],
    });

    render(
      <TestWrapper>
        <IllustrationForm />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByText(/Private\/Personal illustration/i)).toBeInTheDocument();
  });

  it('shows privacy checkbox when user owns illustration', async () => {
    const ownedIllustration: illustrationType = {
      id: 1,
      title: 'Test Illustration',
      content: 'Test content',
      author: 'Test Author',
      source: 'Test Source',
      tags: [],
      uploads: [],
      places: [],
      private: false,
      owner_id: 1,
      user_id: 1,
    };

    mockApiCalls({
      '/tags': [
        { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
      ],
      '/illustration/1': ownedIllustration,
    });

    render(
      <TestWrapper>
        <IllustrationForm illustration={ownedIllustration} />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByText(/Private\/Personal illustration/i)).toBeInTheDocument();
  });

  it('shows privacy checkbox in edit mode when user owns illustration', async () => {
    const ownedIllustration: illustrationType = {
      id: 1,
      title: 'Test Illustration',
      content: 'Test content',
      author: 'Test Author',
      source: 'Test Source',
      tags: [],
      uploads: [],
      places: [],
      private: false,
      owner_id: 1,
      user_id: 1,
    };

    mockApiCalls({
      '/tags': [
        { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
      ],
      '/illustration/1': ownedIllustration,
    });

    render(
      <TestWrapper>
        <IllustrationForm illustration={ownedIllustration} />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const privacyCheckbox = screen.getByRole('checkbox');
    expect(privacyCheckbox).toBeInTheDocument();
    expect(privacyCheckbox).toHaveAttribute('id', 'private');
  });
});
