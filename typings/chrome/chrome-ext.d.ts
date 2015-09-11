interface ChromeExtensionManifest
{
    content_scripts: [{
        matches: string[];
        js: string[];
        run_at: string;
    }];
}