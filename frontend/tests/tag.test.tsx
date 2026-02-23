import { render, screen, waitFor, act } from '@testing-library/react';
import { TestWrapper, mockApiCalls, resetAllMocks } from './test-utils';
import TagPage from '../src/pages/tag/[name]';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: { name: 'test-tag' },
    pathname: '/tag/test-tag',
    isReady: true,
  }),
  useParams: () => ({ name: 'test-tag' }),
}));

jest.mock('@/library/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((route: string) => {
      if (route.startsWith('/tag/')) {
        return Promise.resolve({
          id: 1,
          name: 'test-tag',
          illustrations: [
            { id: 1, title: 'Illustration 1', author: 'Author 1', source: '', content: '', user_id: 1, team_id: null, private: false },
            { id: 2, title: 'Illustration 2', author: 'Author 2', source: '', content: '', user_id: 2, team_id: null, private: true },
            { id: 3, title: 'Illustration 3', author: 'Author 3', source: '', content: '', user_id: 1, team_id: null, private: false },
          ],
        });
      }
      return Promise.resolve({});
    }),
    put: jest.fn(() => Promise.resolve({ message: 'Success' })),
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

jest.mock('@/features/tags/reducer', () => ({
  getFormattedTags: (state: any) => state?.tags?.formattedTags ?? [],
  getTags: (state: any) => state?.tags?.tags ?? [],
  setTags: (payload: any) => ({ type: 'tags/setTags', payload }),
  addTag: (payload: any) => ({ type: 'tags/addTag', payload }),
  removeTag: (payload: any) => ({ type: 'tags/removeTag', payload }),
}));

describe('Tag Page', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  it('renders tag page without crashing', async () => {
    mockApiCalls({
      '/tag/test-tag': {
        id: 1,
        name: 'test-tag',
        illustrations: [
          { id: 1, title: 'Illustration 1', author: 'Author 1', source: '', content: '', user_id: 1, team_id: null, private: false },
        ],
      },
    });

    render(
      <TestWrapper>
        <TagPage />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });
});
