import './WhatsAppButton.css';

const WA_NUMBER = '923225014415'; // International format, no +
const WA_MESSAGE = encodeURIComponent(
    'Hello! I visited your website and would like to inquire about your medical imaging equipment services.'
);

export default function WhatsAppButton() {
    return (
        <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
            className="wa-fab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            title="Chat with us on WhatsApp"
        >
            {/* WhatsApp SVG icon */}
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="wa-fab-icon">
                <path d="M16 0C7.164 0 0 7.163 0 16c0 2.826.738 5.476 2.027 7.785L0 32l8.454-2.01A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.265 13.265 0 01-6.777-1.857l-.486-.288-5.02 1.194 1.284-4.898-.317-.503A13.22 13.22 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333z" fill="currentColor" opacity=".15" />
                <path d="M23.2 19.467c-.374-.187-2.213-1.093-2.56-1.213-.346-.12-.6-.187-.853.187-.253.373-.98 1.213-1.2 1.466-.22.254-.44.28-.814.094-.373-.187-1.573-.58-2.993-1.847-1.107-.987-1.853-2.206-2.073-2.58-.22-.373-.024-.573.166-.76.17-.166.374-.44.56-.66.187-.22.25-.373.374-.627.123-.253.062-.48-.032-.667-.093-.186-.853-2.053-1.167-2.813-.307-.733-.62-.633-.853-.647-.22-.013-.48-.013-.733-.013a1.413 1.413 0 00-1.027.48c-.353.387-1.346 1.32-1.346 3.213s1.373 3.733 1.566 3.987c.187.253 2.707 4.133 6.56 5.8.92.4 1.633.64 2.193.82.92.293 1.76.253 2.42.153.738-.113 2.213-.906 2.526-1.78.314-.873.314-1.62.22-1.78-.093-.16-.346-.253-.72-.44z" fill="currentColor" />
            </svg>
            <span className="wa-fab-label">Chat with us</span>
        </a>
    );
}
