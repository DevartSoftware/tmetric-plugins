interface ChromeExtensionManifest
{
    content_scripts: [{
        matches: string[];
        js: string[];
        css: string[];
        run_at: string;
    }];
}