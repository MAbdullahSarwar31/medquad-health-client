import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import ChatWidget from './chat/ChatWidget';
import './PublicLayout.css';

export default function PublicLayout({ children }) {
    return (
        <div className="pub-layout">
            <PublicNavbar />
            <main className="pub-main">{children}</main>
            <PublicFooter />
            <ChatWidget />
        </div>
    );
}
