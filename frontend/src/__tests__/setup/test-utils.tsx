import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Helper functions for form testing
export const fillFormField = async (element: HTMLElement, value: string) => {
  await userEvent.clear(element);
  await userEvent.type(element, value);
};

export const selectOption = async (selectElement: HTMLElement, optionText: string) => {
  await userEvent.click(selectElement);
  const option = selectElement.querySelector(`[data-value="${optionText}"]`);
  if (option) {
    await userEvent.click(option);
  }
};

export const checkCheckbox = async (checkbox: HTMLElement) => {
  await userEvent.click(checkbox);
};

export const submitForm = async (form: HTMLElement) => {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    await userEvent.click(submitButton);
  }
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
export { userEvent }; 