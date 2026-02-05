import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '../Tabs';

const tabs = [
    { id: 'a', label: 'A', panel: <div>Panel A</div> },
    { id: 'b', label: 'B', panel: <div>Panel B</div> },
    { id: 'c', label: 'C', panel: <div>Panel C</div> },
];

describe('Tabs component', () => {
    it('renders tabs and updates selected state', () => {
        render(<Tabs tabs={tabs} defaultIndex={0} />);
        const tabA = screen.getByRole('tab', { name: 'A' });
        const tabB = screen.getByRole('tab', { name: 'B' });

        // initial selection
        expect(tabA).toHaveAttribute('aria-selected', 'true');
        expect(tabA.className).toContain('border-b-0');
        expect(tabA.className).toContain('rounded-b-none');
        expect(tabA.className).toContain('shadow-sm');
        expect(tabA.className).toContain('-mt-1');
        expect(tabA.className).toContain('first:rounded-bl-none');
        const tabC = screen.getByRole('tab', { name: 'C' });
        expect(tabC.className).toContain('last:rounded-br-none');
        expect(tabB.className).toContain('border');
        expect(tabB.className).toContain('rounded-b-lg');
        expect(tabB.className).toContain('shadow-sm');

        // switch selection
        fireEvent.click(tabB);
        expect(tabB).toHaveAttribute('aria-selected', 'true');
        expect(tabB.className).toContain('border-b-0');
        expect(tabB.className).toContain('rounded-b-lg');
    });

    it('panel container has no border around content', () => {
        render(<Tabs tabs={tabs} defaultIndex={0} />);
        const panelWrapper = screen.getByText('Panel A').parentElement?.parentElement as HTMLElement;
        expect(panelWrapper.className).not.toContain('border');
    });
});
