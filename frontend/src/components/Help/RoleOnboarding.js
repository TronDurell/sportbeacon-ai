import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
const RoleOnboarding = ({ onComplete }) => {
    const { user, updateUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        role: user?.role || "player",
        experience: "",
        goals: "",
        preferences: {}
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(formData);
            onComplete?.();
        }
        catch (error) {
        }
    };
    const steps = [
        {
            id: 1,
            title: "Choose Your Role",
            description: "Select the role that best describes you in the sports community."
        },
        {
            id: 2,
            title: "Experience Level",
            description: "Tell us about your experience in sports."
        },
        {
            id: 3,
            title: "Goals & Preferences",
            description: "What are your goals and preferences?"
        }
    ];
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
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Welcome to SportBeacon AI" }), _jsx("p", { className: "text-gray-600", children: "Let's get you set up with the perfect experience for your role." })] }), _jsx("div", { className: "mb-8", children: _jsx("div", { className: "flex items-center justify-between", children: steps.map((step, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step.id
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-600"}`, children: step.id }), index < steps.length - 1 && (_jsx("div", { className: `w-16 h-1 mx-2 ${currentStep > step.id ? "bg-blue-500" : "bg-gray-200"}` }))] }, step.id))) }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [currentStep === 1 && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: steps[0]?.title ?? "Welcome" }), _jsx("p", { className: "text-gray-600 mb-6", children: steps[0]?.description ?? "Get started with SportBeaconAI" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: roles.map((role) => (_jsxs("div", { className: `p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.role === role.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"}`, onClick: () => setFormData(prev => ({ ...prev, role: role.value })), children: [_jsx("h3", { className: "font-semibold text-gray-900", children: role.label }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: role.description })] }, role.value))) })] })), currentStep === 2 && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: steps[1]?.title ?? "Complete Profile" }), _jsx("p", { className: "text-gray-600 mb-6", children: steps[1]?.description ?? "Tell us more about yourself" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Experience Level" }), _jsxs("select", { value: formData.experience, onChange: (e) => setFormData(prev => ({ ...prev, experience: e.target.value })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select your experience level" }), _jsx("option", { value: "beginner", children: "Beginner (0-2 years)" }), _jsx("option", { value: "intermediate", children: "Intermediate (3-5 years)" }), _jsx("option", { value: "advanced", children: "Advanced (6+ years)" }), _jsx("option", { value: "professional", children: "Professional" })] })] }) })] })), currentStep === 3 && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: steps[2]?.title ?? "Preferences" }), _jsx("p", { className: "text-gray-600 mb-6", children: steps[2]?.description ?? "Customize your experience" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "What are your main goals?" }), _jsx("textarea", { value: formData.goals, onChange: (e) => setFormData(prev => ({ ...prev, goals: e.target.value })), rows: 4, className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "e.g., Improve skills, win championships, stay active, support my child..." })] }) })] })), _jsxs("div", { className: "flex justify-between pt-6", children: [currentStep > 1 && (_jsx("button", { type: "button", onClick: () => setCurrentStep(prev => prev - 1), className: "px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50", children: "Previous" })), currentStep < steps.length ? (_jsx("button", { type: "button", onClick: () => setCurrentStep(prev => prev + 1), className: "ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "Next" })) : (_jsx("button", { type: "submit", className: "ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "Complete Setup" }))] })] })] }));
};
export default RoleOnboarding;
