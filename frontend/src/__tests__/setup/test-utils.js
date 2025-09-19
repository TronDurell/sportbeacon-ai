import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
// Custom render function that includes providers
const customRender = (ui, options) => {
    return render(ui, { ...options });
};
// Helper functions for form testing
export const fillFormField = async (element, value) => {
    await userEvent.clear(element);
    await userEvent.type(element, value);
};
export const selectOption = async (selectElement, optionText) => {
    await userEvent.click(selectElement);
    const option = selectElement.querySelector(`[data-value="${optionText}"]`);
    if (option) {
        await userEvent.click(option);
    }
};
export const checkCheckbox = async (checkbox) => {
    await userEvent.click(checkbox);
};
export const submitForm = async (form) => {
    const submitButton = form.querySelector("button[type=\"submit\"]");
    if (submitButton) {
        await userEvent.click(submitButton);
    }
};
// Re-export everything from testing library
export * from "@testing-library/react";
export { customRender as render };
export { userEvent };
