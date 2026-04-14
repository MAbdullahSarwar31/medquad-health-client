import { useEffect } from 'react';

/**
 * useSEO — Sets document title and meta description on every page.
 * Works without any external library (React 19 compatible).
 *
 * @param {string} title       — Page title shown in browser tab & Google
 * @param {string} description — Meta description shown in Google search snippets
 */
export default function useSEO(title, description) {
    useEffect(() => {
        // Update tab / window title
        document.title = title
            ? `${title} | Medquad Health Solutions`
            : 'Medquad Health Solutions — Medical Imaging Equipment Pakistan';

        // Update or create meta description tag
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = description || 'Medquad Health Solutions — Supply, installation, and maintenance of MRI, CT, and medical imaging equipment across Pakistan.';

        // Update or create Open Graph tags (for WhatsApp / social link previews)
        const ogTags = {
            'og:title': title || 'Medquad Health Solutions',
            'og:description': description || 'Medical imaging equipment specialists in Pakistan.',
            'og:site_name': 'Medquad Health Solutions',
            'og:type': 'website',
        };
        Object.entries(ogTags).forEach(([property, content]) => {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.content = content;
        });
    }, [title, description]);
}
