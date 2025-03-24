declare module 'react-intersection-observer' {
  export function useInView(options?: {
    triggerOnce?: boolean;
    threshold?: number;
    rootMargin?: string;
    skip?: boolean;
    initialInView?: boolean;
    root?: React.RefObject<Element>;
  }): [React.RefObject<any>, boolean, IntersectionObserverEntry | undefined];
} 