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

  it('links to the program detail page', () => {
    const program = mockPrograms[0];
    render(<ProgramCard program={program} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/stanford-university/ms-in-computer-science-ai-track');
  });
});
