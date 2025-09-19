import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
const RegistrationForm = ({ onSuccess, onCancel }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "player",
        organization: "",
        phone: "",
        dateOfBirth: "",
        emergencyContact: {
            name: "",
            phone: "",
            relationship: ""
        }
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const validateForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        if (formData.role === "admin" && !formData.organization.trim()) {
            newErrors.organization = "Organization is required for administrators";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                organization: formData.organization || undefined
            });
            onSuccess?.();
        }
        catch (error) {
            setErrors({ general: "Registration failed. Please try again." });
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };
    const roles = [
        {
            value: "player",
            label: "Player",
            description: "I am a player participating in sports activities"
        },
        {
            value: "coach",
            label: "Coach",
            description: "I coach teams and help players develop"
        },
        {
            value: "parent",
            label: "Parent",
            description: "I am a parent supporting my child's sports activities"
        },
        {
            value: "admin",
            label: "Administrator",
            description: "I manage leagues, teams, or facilities"
        }
    ];
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Create Your Account" }), _jsx("p", { className: "text-gray-600", children: "Join SportBeacon AI and start your sports journey today." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: _jsx("p", { className: "text-red-600", children: errors.general }) })), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "First Name *" }), _jsx("input", { type: "text", value: formData.firstName, onChange: (e) => handleInputChange("firstName", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.firstName ? "border-red-300" : "border-gray-300"}`, placeholder: "Enter your first name" }), errors.firstName && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.firstName }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Last Name *" }), _jsx("input", { type: "text", value: formData.lastName, onChange: (e) => handleInputChange("lastName", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lastName ? "border-red-300" : "border-gray-300"}`, placeholder: "Enter your last name" }), errors.lastName && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.lastName }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => handleInputChange("email", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? "border-red-300" : "border-gray-300"}`, placeholder: "Enter your email address" }), errors.email && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.email }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Phone Number" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => handleInputChange("phone", e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Enter your phone number" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Date of Birth" }), _jsx("input", { type: "date", value: formData.dateOfBirth, onChange: (e) => handleInputChange("dateOfBirth", e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Your Role" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: roles.map((role) => (_jsxs("div", { className: `p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.role === role.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"}`, onClick: () => handleInputChange("role", role.value), children: [_jsx("h3", { className: "font-semibold text-gray-900", children: role.label }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: role.description })] }, role.value))) }), formData.role === "admin" && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Organization *" }), _jsx("input", { type: "text", value: formData.organization, onChange: (e) => handleInputChange("organization", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.organization ? "border-red-300" : "border-gray-300"}`, placeholder: "Enter your organization name" }), errors.organization && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.organization }))] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Security" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password *" }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => handleInputChange("password", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? "border-red-300" : "border-gray-300"}`, placeholder: "Create a strong password" }), errors.password && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.password }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm Password *" }), _jsx("input", { type: "password", value: formData.confirmPassword, onChange: (e) => handleInputChange("confirmPassword", e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? "border-red-300" : "border-gray-300"}`, placeholder: "Confirm your password" }), errors.confirmPassword && (_jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.confirmPassword }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Emergency Contact" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Contact Name" }), _jsx("input", { type: "text", value: formData.emergencyContact.name, onChange: (e) => setFormData(prev => ({
                                                    ...prev,
                                                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                                                })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Emergency contact name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Contact Phone" }), _jsx("input", { type: "tel", value: formData.emergencyContact.phone, onChange: (e) => setFormData(prev => ({
                                                    ...prev,
                                                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                                                })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Emergency contact phone" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Relationship" }), _jsx("input", { type: "text", value: formData.emergencyContact.relationship, onChange: (e) => setFormData(prev => ({
                                            ...prev,
                                            emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                                        })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "e.g., Parent, Spouse, Friend" })] })] }), _jsxs("div", { className: "flex gap-4 pt-6", children: [onCancel && (_jsx("button", { type: "button", onClick: onCancel, className: "px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50", children: "Cancel" })), _jsx("button", { type: "submit", disabled: loading, className: "flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? "Creating Account..." : "Create Account" })] })] })] }));
};
export default RegistrationForm;
