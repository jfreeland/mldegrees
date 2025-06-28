import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider } from 'next-auth/react';
import Home from '@/app/page';
import { mockUniversities } from '@/mocks/universities';

// Mock the setTimeout to speed up tests
jest.useFakeTimers();

// Helper function to render with SessionProvider
const renderWithSession = (component: React.ReactElement, session = null) => {
  return render(
    <SessionProvider session={session}>
      {component}
    </SessionProvider>
  );
};

describe('Home Page', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders loading state initially', () => {
    renderWithSession(<Home />);
    expect(screen.getByText('Loading universities...')).toBeInTheDocument();
  });

  it('renders universities after loading', async () => {
    renderWithSession(<Home />);

    // Fast-forward the timer
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Machine Learning Graduate Programs')).toBeInTheDocument();
    });

    // Check if all universities are rendered
    mockUniversities.forEach(university => {
      expect(screen.getByText(university.name)).toBeInTheDocument();
      expect(screen.getByText(university.programName)).toBeInTheDocument();
      expect(screen.getByText(university.description)).toBeInTheDocument();
    });
  });

  it('displays correct ratings', async () => {
    renderWithSession(<Home />);
    jest.runAllTimers();

    await waitFor(() => {
      mockUniversities.forEach(university => {
        expect(screen.getByText(university.rating.toString())).toBeInTheDocument();
      });
    });
  });

  it('handles upvote correctly', async () => {
    renderWithSession(<Home />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Stanford University')).toBeInTheDocument();
    });

    const upvoteButtons = screen.getAllByLabelText('Upvote');
    const firstUpvote = upvoteButtons[0];

    fireEvent.click(firstUpvote);

    await waitFor(() => {
      expect(screen.getByText('43')).toBeInTheDocument();
    });
  });

  it('handles downvote correctly', async () => {
    renderWithSession(<Home />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Stanford University')).toBeInTheDocument();
    });

    const downvoteButtons = screen.getAllByLabelText('Downvote');
    const firstDownvote = downvoteButtons[0];

    fireEvent.click(firstDownvote);

    await waitFor(() => {
      expect(screen.getByText('41')).toBeInTheDocument();
    });
  });

  it('toggles vote when clicking same button twice', async () => {
    renderWithSession(<Home />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Stanford University')).toBeInTheDocument();
    });

    // Find Stanford's card
    const stanfordCard = screen.getByText('Stanford University').closest('.bg-white') as HTMLElement;
    const upvoteButton = within(stanfordCard).getByLabelText('Upvote');

    // Initial rating should be 42
    expect(within(stanfordCard).getByText('42')).toBeInTheDocument();

    // First click - upvote (42 -> 43)
    fireEvent.click(upvoteButton);

    // Wait for the state to update
    await waitFor(() => {
      const ratingElement = within(stanfordCard).getByText('43');
      expect(ratingElement).toBeInTheDocument();
    });

    // Second click - remove vote (43 -> 42)
    fireEvent.click(upvoteButton);

    // Wait for the state to update back to 42
    await waitFor(() => {
      const ratingElement = within(stanfordCard).getByText('42');
      expect(ratingElement).toBeInTheDocument();
    });
  });

  it('changes vote when clicking opposite button', async () => {
    renderWithSession(<Home />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Stanford University')).toBeInTheDocument();
    });

    const stanfordCard = screen.getByText('Stanford University').closest('.bg-white') as HTMLElement;
    const upvoteButton = within(stanfordCard).getByLabelText('Upvote');
    const downvoteButton = within(stanfordCard).getByLabelText('Downvote');

    // Initial rating should be 42
    expect(within(stanfordCard).getByText('42')).toBeInTheDocument();

    // First upvote (42 -> 43)
    fireEvent.click(upvoteButton);
    await waitFor(() => {
      expect(within(stanfordCard).getByText('43')).toBeInTheDocument();
    });

    // Then downvote (43 -> 41, because we go from +1 to -1, which is a -2 change)
    fireEvent.click(downvoteButton);
    await waitFor(() => {
      expect(within(stanfordCard).getByText('41')).toBeInTheDocument();
    });
  });
});
