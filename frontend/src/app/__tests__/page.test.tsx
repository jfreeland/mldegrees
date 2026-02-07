import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgramCard from '@/components/ProgramCard';
import { mockPrograms } from '@/mocks/programs';

describe('ProgramCard', () => {
  it('renders program information correctly', () => {
    const program = mockPrograms[0];
    render(<ProgramCard program={program} />);

    expect(screen.getByText(program.universityName)).toBeInTheDocument();
    expect(screen.getByText(program.name)).toBeInTheDocument();
    expect(screen.getByText(program.description)).toBeInTheDocument();
  });

  it('displays degree type badge', () => {
    const program = mockPrograms[0];
    render(<ProgramCard program={program} />);

    expect(screen.getByText(program.degreeType)).toBeInTheDocument();
  });

  it('displays location information', () => {
    const program = mockPrograms[0];
    render(<ProgramCard program={program} />);

    expect(screen.getByText(`${program.city}, ${program.state}, ${program.country}`)).toBeInTheDocument();
  });

  it('displays cost information', () => {
    const program = mockPrograms[0];
    render(<ProgramCard program={program} />);

    expect(screen.getByText('High Cost')).toBeInTheDocument();
  });

  it('displays medium cost correctly', () => {
    const program = mockPrograms[3]; // UC Berkeley has $$
    render(<ProgramCard program={program} />);

    expect(screen.getByText('Medium Cost')).toBeInTheDocument();
  });

  it('renders external link when URL is provided', () => {
    const programWithUrl = { ...mockPrograms[0], url: 'https://example.com/program' };
    render(<ProgramCard program={programWithUrl} />);

    const link = screen.getByRole('link', { name: /visit program page/i });
    expect(link).toHaveAttribute('href', 'https://example.com/program');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render external link when URL is not provided', () => {
    const programWithoutUrl = { ...mockPrograms[0], url: undefined };
    render(<ProgramCard program={programWithoutUrl} />);

    expect(screen.queryByRole('link', { name: /visit program page/i })).not.toBeInTheDocument();
  });
});
