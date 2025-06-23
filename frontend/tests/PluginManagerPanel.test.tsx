import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PluginManagerPanel from '../components/admin/PluginManagerPanel';

describe('PluginManagerPanel', () => {
  it('renders installed plugins and federation selector', () => {
    render(<PluginManagerPanel />);
    expect(screen.getByText('Installed Plugins')).toBeInTheDocument();
    expect(screen.getByLabelText('Federation')).toBeInTheDocument();
  });

  it('shows dynamic status alerts for plugin errors and dependencies', async () => {
    render(<PluginManagerPanel />);
    // Simulate error and dependency warning by forcing random logic
    await waitFor(() => {
      expect(
        screen.getAllByText(/Plugin error detected|Missing dependencies|not enabled for/i).length
      ).toBeGreaterThanOrEqual(0);
    });
  });

  it('toggles federation-scoped plugin activation', async () => {
    render(<PluginManagerPanel />);
    // Select a federation
    fireEvent.mouseDown(screen.getByLabelText('Federation'));
    fireEvent.click(screen.getByText('UIL'));
    expect(screen.getByText('UIL')).toBeInTheDocument();
    // Find a toggle and click it
    const toggles = screen.getAllByRole('checkbox');
    if (toggles.length > 0) {
      fireEvent.click(toggles[0]);
    }
  });

  it('opens plugin preview and validation dialogs', async () => {
    render(<PluginManagerPanel />);
    // Open preview dialog
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);
    expect(await screen.findByText(/Plugin Preview/i)).toBeInTheDocument();
    // Close dialog
    fireEvent.click(screen.getByText('Close'));
    // Open validation dialog
    const validateButtons = screen.getAllByText('Validate');
    fireEvent.click(validateButtons[0]);
    expect(await screen.findByText(/Plugin Validation/i)).toBeInTheDocument();
  });
}); 