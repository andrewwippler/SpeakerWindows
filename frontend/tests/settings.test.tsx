import { render, screen } from '@testing-library/react';
import { TestWrapper } from './test-utils';
import Settings from '../src/pages/settings';
import mockApi from './__mocks__/api';

const mockTeam = {
  id: 1,
  name: 'My Team',
  inviteCode: 'ABC12345',
  role: 'owner',
  members: [
    { userId: 2, username: 'member1', email: 'member1@test.com', role: 'editor' },
  ],
};

const mockEmptyTeam = {
  id: 1,
  name: 'My Team',
  inviteCode: 'ABC12345',
  role: 'owner',
  members: [],
};

const mockMemberships = [
  { teamId: 2, teamName: 'Other Team', role: 'readonly' },
];

describe('Settings Page - Team Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });
  });

  const renderWithWrapper = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  it('shows "joined team" section when user is member of another team', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve(mockMemberships);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('You are a member of:');
    expect(screen.getByText('Other Team')).toBeInTheDocument();
  });

  it('hides "Join a Team" when already member of another team', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve(mockMemberships);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('You are a member of:');
    expect(screen.queryByText('Join a Team')).not.toBeInTheDocument();
  });

  it('shows "Leave Team" button for members of other teams', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve(mockMemberships);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Leave Team');
    expect(screen.getByText('Leave Team')).toBeInTheDocument();
  });

  it('hides invite link when user is just a member (not owner/creator)', async () => {
    const memberTeam = {
      ...mockTeam,
      role: 'readonly',
    };
    
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(memberTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Your role: readonly');
    expect(screen.queryByText('Copy Invite Link')).not.toBeInTheDocument();
  });

  it('creator can see invite controls', async () => {
    const creatorTeam = {
      ...mockEmptyTeam,
      role: 'creator',
    };
    
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(creatorTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Copy Invite Link');
    expect(screen.getByText('Copy Invite Link')).toBeInTheDocument();
  });

  it('owner with members cannot join another team', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Edit Members');
    expect(screen.queryByText('Join a Team')).not.toBeInTheDocument();
  });

  it('owner without members sees "Join a Team"', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(mockEmptyTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Join a Team');
    expect(screen.getByText('Join a Team')).toBeInTheDocument();
  });

  it('shows correct role badge', async () => {
    const memberTeam = {
      ...mockTeam,
      role: 'editor',
    };
    
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/team') {
        return Promise.resolve(memberTeam);
      }
      if (url === '/team/memberships') {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });

    renderWithWrapper(<Settings />);
    
    await screen.findByText('Your role: editor');
    expect(screen.getByText('Your role: editor')).toBeInTheDocument();
  });
});
