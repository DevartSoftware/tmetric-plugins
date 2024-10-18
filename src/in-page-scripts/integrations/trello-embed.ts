document.addEventListener('DOMContentLoaded', () => {

    // Trello uses Adobe React Spectrum that interferes with focus in iframe.
    // See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/interactions/src/useFocusVisible.ts
    const originalFocus = HTMLElement.prototype.focus;
    let overriddenFocus: typeof HTMLElement.prototype.focus | undefined;

    // so while our popup is open, the programmatic focus of other elements will be ignored
    new MutationObserver(mutationsList => {
        mutationsList.forEach((mutation) => {

            mutation.addedNodes.forEach(node => {
                if ((node as HTMLElement).id === 'tmetric-popup' && HTMLElement.prototype.focus !== originalFocus) {
                    overriddenFocus = HTMLElement.prototype.focus;
                    HTMLElement.prototype.focus = () => { }; // ignore focus
                }
            });

            mutation.removedNodes.forEach((node) => {
                if ((node as HTMLElement).id === 'tmetric-popup' && overriddenFocus) {
                    HTMLElement.prototype.focus = overriddenFocus;
                }
            });
        });
    }).observe(document.body, { childList: true });

    // listen to find out if trello.ts has requested the full issue url (TMET-10682)
    new MutationObserver(() => {
        setTimeout(findFullUrl);
    }).observe(document.head, { childList: true });

    function findFullUrl() {
        const meta = document.querySelector<HTMLMetaElement>('head > meta[name=tmetric-issue-url]');
        if (!meta || meta.content) {
            return;
        }

        const trelloData = (window as any as {
            ModelCache?: {
                _listeners?: {
                    [key: string]: { attributes?: { url?: string } } | null
                }
            }
        }).ModelCache?._listeners;

        if (!trelloData) {
            return;
        }

        // find url among the values cached by Trello
        const url = document.URL.replace(/\/*$/, '/'); // append a single slash
        for (const key in trelloData) {
            const fullUrl = trelloData[key]?.attributes?.url;
            if (fullUrl?.startsWith(url)) {
                const newMeta = document.createElement('meta');
                newMeta.name = 'tmetric-issue-url';
                newMeta.content = fullUrl;
                document.head.appendChild(newMeta);
                document.head.removeChild(meta);
                break;
            }
        }
    }

}, { once: true });
