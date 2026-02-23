import { render, screen, waitFor, act } from '@testing-library/react';
import { TestWrapper, createMockSession, mockApiCalls, resetAllMocks } from './test-utils';
import Settings from '../src/pages/settings';

jest.mock('@/library/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((route: string) => {
      if (route === '/settings') {
        return Promise.resolve({ place: '', location: '', count: 0, emptyTags: 0 });
      }
      if (route === '/user/invitations') {
        return Promise.resolve([
          { id: 1, teamId: 1, teamName: 'Team A', role: 'editor' },
        ]);
      }
      if (route === '/user/blocks') {
        return Promise.resolve([
          { teamId: 2, teamName: 'Blocked Team' },
        ]);
      }
      return Promise.resolve({});
    }),
    put: jest.fn(() => Promise.resolve({ message: 'Updated' })),
    post: jest.fn(() => Promise.resolve({ message: 'Success' })),
    delete: jest.fn(() => Promise.resolve({ message: 'Deleted' })),
  },
}));

jest.mock('@/features/user/reducer', () => ({
  getSettings: (state: any) => state?.user?.settings ?? { place: '', location: '', count: 0 },
  getThunkSettings: (token: string) => () => Promise.resolve(),
  setSettings: (payload: any) => ({ type: 'user/setSettings', payload }),
  selectInvitations: (state: any) => state?.user?.invitations ?? [],
  fetchInvitationsIfNeeded: (token: string) => () => Promise.resolve([]),
  clearInvitationsCache: () => ({ type: 'user/clearInvitationsCache' }),
  setToken: () => ({ type: 'user/setToken' }),
  getToken: () => ({ type: 'user/getToken' }),
  setInvitations: (payload: any) => ({ type: 'user/setInvitations', payload }),
  selectInvitationsFetchedAt: (state: any) => state?.user?.invitationsFetchedAt ?? null,
}));

jest.mock('@/features/flash/reducer', () => ({
  setFlashMessage: (payload: any) => ({ type: 'flash/setFlashMessage', payload }),
  setFlash: (payload: any) => ({ type: 'flash/setFlash', payload }),
  selectFlash: (state: any) => state?.flash?.show ?? false,
  selectFlashMessage: (state: any) => state?.flash?.object ?? { message: '', severity: '' },
}));

jest.mock('@/features/ui/reducer', () => ({
  setRedirect: (payload: any) => ({ type: 'ui/setRedirect', payload }),
  setIllustrationEdit: jest.fn(),
  setUpdateUI: jest.fn(),
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

describe('Settings Page', () => {
  beforeEach(() => {
    resetAllMocks();
    mockApiCalls();
  });

  it('renders settings page without crashing', async () => {
    const mockSession = createMockSession();
    
    mockApiCalls({
      '/settings': { place: '', location: '', count: 0, emptyTags: 0 },
      '/user/blocks': [],
      '/user/invitations': [],
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  it('displays settings heading', async () => {
    mockApiCalls({
      '/settings': { place: '', location: '', count: 0, emptyTags: 0 },
      '/user/blocks': [],
      '/user/invitations': [],
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('h1, h2')).toBeInTheDocument();
    });
  });
});
