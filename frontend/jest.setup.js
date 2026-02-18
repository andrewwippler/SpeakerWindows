import '@testing-library/jest-dom';

export const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockClear();
  global.fetch = mockFetch;
});
