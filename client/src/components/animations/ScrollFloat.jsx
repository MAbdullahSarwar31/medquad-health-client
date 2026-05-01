import { useEffect, useRef } from 'react';
import './Animations.css';

export default function ScrollFloat({ children, className = '', delay = 0, Tag = 'div' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('scroll-float--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`scroll-float ${className}`}
            style={{ '--float-delay': `${delay}ms` }}
        >
            {children}
        </Tag>
    );
}
