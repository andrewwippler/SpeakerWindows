import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

export interface MockTeam {
  id: number;
  name: string;
  inviteCode: string;
  role?: string;
  members?: MockTeamMember[];
}

export interface MockTeamMember {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface MockMembership {
  teamId: number;
  teamName: string;
  role: string;
}

export interface MockSession {
  accessToken: string;
  userId?: number;
  team: MockTeam | null;
  memberships: MockMembership[];
}

const mockInitialState = {
  flash: { show: false, object: { message: '', severity: '' } },
  ui: { illustrationEdit: false, updateUI: false, redirect: '/' },
  user: { 
    apitoken: null, 
    settings: { place: '', location: '', count: 0 }, 
    invitations: [], 
    invitationsFetchedAt: null 
  },
  modal: { show: false, itemToDelete: null },
  search: {},
  tags: { tags: [], formattedTags: [] },
  recentlyViewed: { illustrations: [] },
};

const mockStore = configureStore({
  reducer: {
    flash: (state = mockInitialState.flash) => state,
    ui: (state = mockInitialState.ui) => state,
    user: (state = mockInitialState.user) => state,
    modal: (state = mockInitialState.modal) => state,
    search: (state = mockInitialState.search) => state,
    tags: (state = mockInitialState.tags) => state,
    recentlyViewed: (state = mockInitialState.recentlyViewed) => state,
  },
});

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/',
  }),
}));

jest.mock('next-auth/react', () => {
  const mockSession = {
    accessToken: 'mock-token',
    userId: 1,
    team: null,
    memberships: [],
  };
  
  return {
    __esModule: true,
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
    useSession: jest.fn(() => ({ data: mockSession, status: 'authenticated' })),
    getSession: jest.fn(() => Promise.resolve(mockSession)),
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
});

export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  return {
    accessToken: 'mock-token',
    userId: 1,
    team: null,
    memberships: [],
    ...overrides,
  };
}

export function createMockTeam(overrides: Partial<MockTeam> = {}): MockTeam {
  return {
    id: 1,
    name: 'Test Team',
    inviteCode: 'ABC123',
    role: 'owner',
    members: [],
    ...overrides,
  };
}

export function createMockTeamMember(overrides: Partial<MockTeamMember> = {}): MockTeamMember {
  return {
    userId: 2,
    username: 'testuser',
    email: 'test@test.com',
    role: 'editor',
    ...overrides,
  };
}

export function createMockMembership(overrides: Partial<MockMembership> = {}): MockMembership {
  return {
    teamId: 2,
    teamName: 'Other Team',
    role: 'readonly',
    ...overrides,
  };
}

export function createMockApiResponse(data: any, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(data),
  };
}

const mockApiResponses: Record<string, any> = {
  '/api/auth/session': { accessToken: 'mock-token', userId: 1, team: null, memberships: [] },
  '/tags': [
    { id: 1, name: 'tag-1', slug: 'tag-1', user_id: 1, team_id: null },
    { id: 2, name: 'tag-2', slug: 'tag-2', user_id: 1, team_id: null },
  ],
  '/tag/test-tag': {
    id: 1,
    name: 'test-tag',
    illustrations: [
      { id: 1, title: 'Illustration 1', author: 'Author 1', source: '', content: '', user_id: 1, team_id: null, private: false },
      { id: 2, title: 'Illustration 2', author: 'Author 2', source: '', content: '', user_id: 2, team_id: null, private: true },
      { id: 3, title: 'Illustration 3', author: 'Author 3', source: '', content: '', user_id: 1, team_id: null, private: false },
    ],
  },
  '/settings': { place: '', location: '', count: 0, emptyTags: 0 },
  '/user/invitations': [
    { id: 1, teamId: 1, teamName: 'Team A', role: 'editor' },
  ],
  '/user/blocks': [
    { teamId: 2, teamName: 'Blocked Team' },
  ],
  '/team': { id: 1, name: 'Test Team', inviteCode: 'ABC123' },
  '/team/memberships': [
    { teamId: 1, teamName: 'Test Team', role: 'owner' },
  ],
  '/team/members': [],
  '/team/invitations': [],
};

export function mockApiCalls(responses: Record<string, any> = {}) {
  const mergedResponses = { ...mockApiResponses, ...responses };
  
  global.fetch = jest.fn((url: string | URL, options?: RequestInit) => {
    let urlStr = url.toString();
    
    // Handle URLs like "undefined/tag/path" or "http://localhost:3000/tag/path"
    // Extract just the path portion
    const undefinedMatch = urlStr.match(/^undefined(\/.*)$/);
    if (undefinedMatch) {
      urlStr = undefinedMatch[1];
    } else {
      // Try to parse as URL and extract pathname
      try {
        const urlObj = new URL(urlStr);
        urlStr = urlObj.pathname + (urlObj.search || '');
      } catch {
        // If URL parsing fails, try to strip common prefixes
        urlStr = urlStr.replace(/^https?:\/\/[^/]+/, '');
      }
    }
    
    // Check for next-auth session endpoint
    if (urlStr.includes('auth/session') || urlStr.endsWith('/api/auth/session')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          accessToken: 'mock-token', 
          userId: 1, 
          team: null, 
          memberships: [] 
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    }
    
    for (const [pattern, response] of Object.entries(mergedResponses)) {
      if (urlStr.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
          headers: new Headers(),
        });
      }
    }
    
    console.warn(`No mock response found for URL: ${urlStr}`);
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    });
  }) as jest.Mock;
}

export function resetAllMocks() {
  jest.clearAllMocks();
  global.fetch = jest.fn();
}

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={mockStore}>
        {children}
      </ReduxProvider>
    </SessionProvider>
  );
}

export { mockStore };
