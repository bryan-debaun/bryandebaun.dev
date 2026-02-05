import { render, screen } from '@testing-library/react';
import Stars from '../Stars';

describe('Stars component', () => {
    it('renders 5 filled stars for value 10 and correct sr text', () => {
        render(<Stars value={10} />);
        expect(screen.getByText('5 out of 5 stars')).toBeInTheDocument();
        expect(screen.getAllByTitle('Filled star')).toHaveLength(5);
    });

    it('renders 4 filled + 1 half star for value 9 and correct sr text', () => {
        render(<Stars value={9} />);
        expect(screen.getByText('4.5 out of 5 stars')).toBeInTheDocument();
        expect(screen.getAllByTitle('Filled star')).toHaveLength(4);
        expect(screen.getAllByTitle('Half star')).toHaveLength(1);
    });

    it('renders 4 filled for value 8 and correct sr text', () => {
        render(<Stars value={8} />);
        expect(screen.getByText('4 out of 5 stars')).toBeInTheDocument();
        expect(screen.getAllByTitle('Filled star')).toHaveLength(4);
        expect(screen.queryByTitle('Half star')).toBeNull();
    });
});
