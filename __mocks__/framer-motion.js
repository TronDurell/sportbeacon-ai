// Mock Framer Motion
const React = require('react');

module.exports = {
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    img: ({ ...props }) => React.createElement('img', props),
    section: ({ children, ...props }) => React.createElement('section', props, children),
    article: ({ children, ...props }) => React.createElement('article', props, children),
    header: ({ children, ...props }) => React.createElement('header', props, children),
    footer: ({ children, ...props }) => React.createElement('footer', props, children),
    nav: ({ children, ...props }) => React.createElement('nav', props, children),
    main: ({ children, ...props }) => React.createElement('main', props, children),
    aside: ({ children, ...props }) => React.createElement('aside', props, children),
    h1: ({ children, ...props }) => React.createElement('h1', props, children),
    h2: ({ children, ...props }) => React.createElement('h2', props, children),
    h3: ({ children, ...props }) => React.createElement('h3', props, children),
    h4: ({ children, ...props }) => React.createElement('h4', props, children),
    h5: ({ children, ...props }) => React.createElement('h5', props, children),
    h6: ({ children, ...props }) => React.createElement('h6', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
    a: ({ children, ...props }) => React.createElement('a', props, children),
    ul: ({ children, ...props }) => React.createElement('ul', props, children),
    ol: ({ children, ...props }) => React.createElement('ol', props, children),
    li: ({ children, ...props }) => React.createElement('li', props, children),
    form: ({ children, ...props }) => React.createElement('form', props, children),
    input: ({ ...props }) => React.createElement('input', props),
    textarea: ({ children, ...props }) => React.createElement('textarea', props, children),
    select: ({ children, ...props }) => React.createElement('select', props, children),
    option: ({ children, ...props }) => React.createElement('option', props, children),
    label: ({ children, ...props }) => React.createElement('label', props, children),
    table: ({ children, ...props }) => React.createElement('table', props, children),
    thead: ({ children, ...props }) => React.createElement('thead', props, children),
    tbody: ({ children, ...props }) => React.createElement('tbody', props, children),
    tr: ({ children, ...props }) => React.createElement('tr', props, children),
    th: ({ children, ...props }) => React.createElement('th', props, children),
    td: ({ children, ...props }) => React.createElement('td', props, children)
  },
  AnimatePresence: ({ children }) => React.createElement('div', { children }),
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  }),
  useMotionValue: jest.fn(),
  useTransform: jest.fn(),
  useSpring: jest.fn(),
  useViewportScroll: jest.fn(() => ({
    scrollX: { get: () => 0 },
    scrollY: { get: () => 0 }
  }))
};
