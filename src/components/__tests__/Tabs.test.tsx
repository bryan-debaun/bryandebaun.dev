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

        // initial selection: A active (open folder tab), B/C inactive
        expect(tabA).toHaveAttribute('aria-selected', 'true');
        expect(tabB).toHaveAttribute('aria-selected', 'false');
        // active tab merges into the content box: bordered, no bottom border
        expect(tabA.className).toContain('border-b-0');
        expect(tabA.className).toContain('rounded-t-md');
        // inactive tabs have no box (transparent border)
        expect(tabB.className).toContain('border-transparent');

        // switch selection
        fireEvent.click(tabB);
        expect(tabB).toHaveAttribute('aria-selected', 'true');
        expect(tabA).toHaveAttribute('aria-selected', 'false');
        expect(tabB.className).toContain('border-b-0');
        expect(tabA.className).toContain('border-transparent');
    });

    it('panel container has no border around content', () => {
        render(<Tabs tabs={tabs} defaultIndex={0} />);
        const panelWrapper = screen.getByText('Panel A').parentElement
            ?.parentElement as HTMLElement;
        expect(panelWrapper.className).not.toContain('border');
    });
});
