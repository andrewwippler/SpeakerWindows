import '@testing-library/jest-dom';

export const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockClear();
  global.fetch = mockFetch;
});

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
