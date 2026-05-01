import { useEffect, useRef, useState } from 'react';
import './Animations.css';

function parse(val) {
    const str = String(val);
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    const suffix = str.replace(/[0-9.]/g, '');
    return { num, suffix };
}

export default function CountUp({ value, duration = 2000, className = '' }) {
    const [display, setDisplay] = useState(() => {
        const { suffix } = parse(value);
        return `0${suffix}`;
    });
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const { num, suffix } = parse(value);
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const startTime = performance.now();
                    const tick = (now) => {
                        const t = Math.min((now - startTime) / duration, 1);
                        const eased = 1 - Math.pow(1 - t, 3);
                        setDisplay(`${Math.round(eased * num)}${suffix}`);
                        if (t < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [value, duration]);

    return (
        <span ref={ref} className={`countup-value ${className}`}>
            {display}
        </span>
    );
}
