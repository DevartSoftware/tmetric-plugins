document.addEventListener('DOMContentLoaded', () => {

    // Trello uses Adobe React Spectrum that interferes with focus in iframe.
    // See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/interactions/src/useFocusVisible.ts
    const originalFocus = HTMLElement.prototype.focus;
    let overriddenFocus: typeof HTMLElement.prototype.focus | undefined;

    // so while our popup is open, the programmatic focus of other elements will be ignored
    new MutationObserver(mutationsList => {
        mutationsList.forEach((mutation) => {

            mutation.addedNodes.forEach((node) => {
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

}, { once: true });
