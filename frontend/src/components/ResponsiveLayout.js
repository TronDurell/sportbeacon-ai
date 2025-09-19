import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ResponsiveLayout = ({ children, className = "" }) => {
    return (_jsxs("div", { className: `responsive-layout ${className}`, children: [_jsx("style", { children: `
        .responsive-layout {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Mobile-first responsive breakpoints */
        @media (max-width: 390px) {
          .responsive-layout {
            padding: 0 0.75rem;
          }
        }

        @media (min-width: 640px) {
          .responsive-layout {
            max-width: 640px;
            padding: 0 1.5rem;
          }
        }

        @media (min-width: 768px) {
          .responsive-layout {
            max-width: 768px;
            padding: 0 2rem;
          }
        }

        @media (min-width: 1024px) {
          .responsive-layout {
            max-width: 1024px;
            padding: 0 2.5rem;
          }
        }

        @media (min-width: 1280px) {
          .responsive-layout {
            max-width: 1280px;
            padding: 0 3rem;
          }
        }
      ` }), children] }));
};
export default ResponsiveLayout;
