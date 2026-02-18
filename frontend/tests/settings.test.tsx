import { render, screen, waitFor } from '@testing-library/react';
import { TestWrapper } from './test-utils';
import Settings from '../src/pages/settings';

declare const global: { fetch: jest.Mock };

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

const mockInvitations: any[] = [];
const mockBlocks: any[] = [];

const mockSettings = {
  place: '',
  location: '',
  count: 0,
};

describe('Settings Page - Team Section', () => {
  const renderWithWrapper = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  const setupFetchMock = (team: any, memberships: any[], invitations: any[], blocks: any[]) => {
    global.fetch.mockImplementation((url: string) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('/team/memberships')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(memberships) });
      }
      
      if (urlStr.includes('/team/invitations')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(invitations) });
      }
      
      if (urlStr.includes('/user/blocks')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(blocks) });
      }
      
      if (urlStr.includes('/team') && !urlStr.includes('/team/') && !urlStr.includes('/teamem')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(team) });
      }
      
      if (urlStr.includes('/user/invitations')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      if (urlStr.includes('/settings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSettings) });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  };

  it('shows "joined team" section when user is member of another team', async () => {
    setupFetchMock(mockTeam, mockMemberships, mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('You are a member of:')).toBeInTheDocument();
    });
    expect(screen.getByText('Other Team')).toBeInTheDocument();
  });

  it('hides "Join a Team" when already member of another team', async () => {
    setupFetchMock(mockTeam, mockMemberships, mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('You are a member of:')).toBeInTheDocument();
    });
    expect(screen.queryByText('Join a Team')).not.toBeInTheDocument();
  });

  it('shows "Leave Team" button for members of other teams', async () => {
    setupFetchMock(mockTeam, mockMemberships, mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('Leave Team')).toBeInTheDocument();
    });
  });

  it('hides invite link when user is just a member (not owner/creator)', async () => {
    const memberTeam = {
      ...mockTeam,
      role: 'readonly',
    };
    
    setupFetchMock(memberTeam, [], mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.queryByText('Your role: readonly')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Copy Invite Link')).not.toBeInTheDocument();
  });

  it('creator can see invite controls', async () => {
    const creatorTeam = {
      ...mockEmptyTeam,
      role: 'creator',
    };
    
    setupFetchMock(creatorTeam, [], mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('Copy Invite Link')).toBeInTheDocument();
    });
  });

  it('owner with members cannot join another team', async () => {
    setupFetchMock(mockTeam, [], mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Members')).toBeInTheDocument();
    });
    expect(screen.queryByText('Join a Team')).not.toBeInTheDocument();
  });

  it('owner without members sees "Join a Team"', async () => {
    setupFetchMock(mockEmptyTeam, [], mockInvitations, mockBlocks);

    renderWithWrapper(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('Join a Team')).toBeInTheDocument();
    });
  });
});
