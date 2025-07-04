import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider } from 'next-auth/react';
import Home from '@/app/page';
import { mockUniversities } from '@/mocks/universities';

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Helper function to render with SessionProvider
const renderWithSession = (component: React.ReactElement, session?: any) => {
  return render(component);
};

describe('Home Page', () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
          });
        global.fetch = jest.fn()
          .mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockUniversities),
          });
        window.alert = jest.fn();
      });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    renderWithSession(<Home />);
    expect(screen.getByText('Loading universities...')).toBeInTheDocument();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  it('renders universities after loading', async () => {
    await act(async () => {
      renderWithSession(<Home />);
    });

    // Check if all universities are rendered
    await waitFor(() => {
      mockUniversities.forEach(university => {
        expect(screen.getByText(university.name)).toBeInTheDocument();
        expect(screen.getByText(university.description)).toBeInTheDocument();
      });
    });
  });

  it('displays correct ratings', async () => {
    await act(async () => {
      renderWithSession(<Home />);
    });

    await waitFor(() => {
      mockUniversities.forEach(university => {
        expect(screen.getAllByText(university.rating.toString()).length).toBeGreaterThan(0);
      });
    });
  });

  describe('with authenticated user', () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: {
              user: {
                name: 'Test User',
                email: 'test@example.com',
                image: 'https://example.com/avatar.png',
                googleId: '1234567890',
              },
            },
            status: 'authenticated',
          });

        global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUniversities),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });
    });

    it('handles upvote correctly', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText('Upvote');
      const firstUpvote = upvoteButtons[0];

      await act(async () => {
        fireEvent.click(firstUpvote);
      });

      await waitFor(() => {
        expect(screen.getByText('43')).toBeInTheDocument();
      });
    });

    it('handles downvote correctly', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      const downvoteButtons = screen.getAllByLabelText('Downvote');
      const firstDownvote = downvoteButtons[0];

      await act(async () => {
        fireEvent.click(firstDownvote);
      });

      await waitFor(() => {
        expect(screen.getByText('41')).toBeInTheDocument();
      });
    });

    it('toggles vote when clicking same button twice', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      // Find Stanford's card - need to get the parent card container
      const stanfordText = screen.getByText('Stanford University');
      const stanfordCard = stanfordText.closest('.bg-white') as HTMLElement;
      const upvoteButton = within(stanfordCard).getByLabelText('Upvote');

      // Initial rating should be 42
      await waitFor(() => {
        expect(within(stanfordCard).getByText('42')).toBeInTheDocument();
      });

      // First click - upvote (42 -> 43)
      await act(async () => {
        fireEvent.click(upvoteButton);
      });

      // Wait for the state to update
      await waitFor(() => {
        const ratingElement = within(stanfordCard).getByText('43');
        expect(ratingElement).toBeInTheDocument();
      });

      // Second click - remove vote (43 -> 42)
      await act(async () => {
        fireEvent.click(upvoteButton);
      });

      // Wait for the state to update back to 42
      await waitFor(() => {
        const ratingElement = within(stanfordCard).getByText('42');
        expect(ratingElement).toBeInTheDocument();
      });
    });

    it('changes vote when clicking opposite button', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      const stanfordText = screen.getByText('Stanford University');
      const stanfordCard = stanfordText.closest('.bg-white') as HTMLElement;
      const upvoteButton = within(stanfordCard).getByLabelText('Upvote');
      const downvoteButton = within(stanfordCard).getByLabelText('Downvote');

      // Initial rating should be 42
      await waitFor(() => {
        expect(within(stanfordCard).getByText('42')).toBeInTheDocument();
      });

      // First upvote (42 -> 43)
      await act(async () => {
        fireEvent.click(upvoteButton);
      });
      await waitFor(() => {
        expect(within(stanfordCard).getByText('43')).toBeInTheDocument();
      });

      // Then downvote (43 -> 41, because we go from +1 to -1, which is a -2 change)
      await act(async () => {
        fireEvent.click(downvoteButton);
      });
      await waitFor(() => {
        expect(within(stanfordCard).getByText('41')).toBeInTheDocument();
      });
    });
  });
});
