declare module '*.svg' { 
  import * as React from 'react'; 
  const C: React.FC<React.SVGProps<SVGSVGElement>>; 
  export default C; 
}

declare module '*.png';
declare module '*.jpg';
declare module '*.css';
declare module '*.module.css';
