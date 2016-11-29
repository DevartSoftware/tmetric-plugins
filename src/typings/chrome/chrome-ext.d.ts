interface ChromeExtensionManifest {
    content_scripts: [{
        matches: string[];
        js: string[];
        css: string[];
        run_at: string;
    }];
}

declare module chrome.tabs {
    interface Tab {
        width: number;
        height: number;
    }
}