const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/library/api', () => {
  return jest.fn().mockImplementation((url: string) => {
    if (url === '/team') {
      return Promise.resolve({
        id: 1,
        name: 'My Team',
        inviteCode: 'ABC12345',
        role: 'owner',
        members: [],
      });
    }
    if (url === '/team/memberships') {
      return Promise.resolve([]);
    }
    return Promise.resolve({});
  });
});

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/settings',
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/settings',
  }),
}));

jest.mock('next-auth/react', () => {
  return {
    useSession: () => ({
      data: {
        accessToken: 'mock-token',
      },
      status: 'authenticated',
    }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('@/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({}),
}));

jest.mock('@/features/flash/reducer', () => ({
  setFlashMessage: jest.fn(),
}));

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export default mockApi;
