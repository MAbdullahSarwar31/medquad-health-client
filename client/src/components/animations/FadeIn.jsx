import { useEffect, useRef } from 'react';
import './Animations.css';

export default function FadeIn({ children, className = '', delay = 0, Tag = 'div' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('fadein--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`fadein ${className}`}
            style={{ '--fadein-delay': `${delay}ms` }}
        >
            {children}
        </Tag>
    );
}
