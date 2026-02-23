import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockStore = configureStore({
  reducer: {
    flash: (state = {}) => state,
    ui: (state = {}) => state,
    user: (state = { settings: { place: '', location: '', count: 0 } }) => state,
    modal: (state = { show: false, itemToDelete: null }) => state,
    search: (state = {}) => state,
  },
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
  const originalModule = jest.requireActual('next-auth/react');
  return {
    ...originalModule,
    useSession: () => ({
      data: {
        accessToken: 'mock-token',
        userId: 1,
        team: null,
        memberships: [],
      },
      status: 'authenticated',
    }),
  };
});

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={mockStore}>
        {children}
      </ReduxProvider>
    </SessionProvider>
  );
}
