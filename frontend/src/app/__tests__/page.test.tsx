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

  it('displays correct average ratings', async () => {
    await act(async () => {
      renderWithSession(<Home />);
    });

    await waitFor(() => {
      // Check that average ratings are displayed
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Stanford
      expect(screen.getByText('4.5')).toBeInTheDocument(); // MIT
      expect(screen.getByText('4.1')).toBeInTheDocument(); // CMU
      expect(screen.getByText('3.8')).toBeInTheDocument(); // Berkeley
      expect(screen.getByText('4.0')).toBeInTheDocument(); // Toronto
    });
  });

  it('displays cost information', async () => {
    await act(async () => {
      renderWithSession(<Home />);
    });

    await waitFor(() => {
      // Check that cost badges are displayed
      expect(screen.getAllByText('High Cost').length).toBeGreaterThan(0); // Stanford, MIT, CMU
      expect(screen.getAllByText('Medium Cost').length).toBeGreaterThan(0); // Berkeley, Toronto
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

    it('displays star rating system for authenticated users', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      // Check that rating interface is displayed (there should be multiple instances)
      expect(screen.getAllByText('Rate this program:').length).toBeGreaterThan(0);

      // Check that stars are present (should have 5 stars per program)
      const stars = screen.getAllByText('★');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('handles star rating interface', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      // Find Stanford's card
      const stanfordText = screen.getByText('Stanford University');
      const stanfordCard = stanfordText.closest('.bg-white') as HTMLElement;

      // Check that the rating interface exists
      expect(within(stanfordCard).getByText('Rate this program:')).toBeInTheDocument();

      // Find the stars within Stanford's card
      const stars = within(stanfordCard).getAllByText('★');
      expect(stars.length).toBe(5); // Should have 5 stars

      // Verify that stars are clickable buttons
      stars.forEach(star => {
        expect(star.tagName).toBe('BUTTON');
      });
    });

    it('shows value rating information', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      // Find Stanford's card
      const stanfordText = screen.getByText('Stanford University');
      const stanfordCard = stanfordText.closest('.bg-white') as HTMLElement;

      // Check that value rating information is displayed
      expect(within(stanfordCard).getByText('Value Rating')).toBeInTheDocument();
      expect(within(stanfordCard).getByText('4.2')).toBeInTheDocument(); // Stanford's rating
      expect(within(stanfordCard).getByText('out of 5')).toBeInTheDocument();
    });

    it('shows different star ratings for different programs', async () => {
        await act(async () => {
          renderWithSession(<Home />);
        });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
        expect(screen.getByText('MIT')).toBeInTheDocument();
      });

      // Find different program cards
      const stanfordText = screen.getByText('Stanford University');
      const stanfordCard = stanfordText.closest('.bg-white') as HTMLElement;

      const mitText = screen.getByText('MIT');
      const mitCard = mitText.closest('.bg-white') as HTMLElement;

      // Check that different programs show different ratings
      expect(within(stanfordCard).getByText('4.2')).toBeInTheDocument();
      expect(within(mitCard).getByText('4.5')).toBeInTheDocument();

      // Both should have star rating interfaces
      expect(within(stanfordCard).getAllByText('★').length).toBe(5);
      expect(within(mitCard).getAllByText('★').length).toBe(5);
    });
  });
});
