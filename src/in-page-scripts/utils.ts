interface Utils {
    <TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement;
    try<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement;
    visible<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement;
    all<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement[];
    closest<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement;
    create<TElement extends HTMLElement>(tagName: string, className?: string): TElement;
    getRelativeUrl(baseUrl: string, fullUrl: string): string;
}

var $$ = <Utils>function (selector: string, element?: NodeSelector) {
    element = element || document;
    return <HTMLElement>element.querySelector(selector);
}

$$.try = function (selector: string, element?: NodeSelector) {
    return $$(selector, element) || <HTMLElement>{};
}

$$.create = function (tagName, className) {
    var element = document.createElement(tagName);
    element.classList.add(Integrations.IntegrationService.affix + '-' + tagName.toLowerCase());
    if (className) {
        element.classList.add(className);
    }
    return element;
}

$$.all = function (selector: string, element?: NodeSelector) {
    element = element || document;
    var nodeList = <NodeListOf<HTMLElement>>element.querySelectorAll(selector);
    var result: HTMLElement[] = [];
    for (var i = nodeList.length - 1; i >= 0; i--) {
        result[i] = nodeList[i];
    }
    return result;
}

$$.visible = function (selector: string, element?: NodeSelector) {

    function isVisible(element: HTMLElement) {
        while (element) {
            if (element === document.body) {
                return true;
            }
            if (!element || element.style.display === 'none' || element.style.visibility === 'hidden') {
                return false;
            }
            element = element.parentElement;
        }
        return false;
    }

    return $$.all(selector, element).filter(isVisible)[0];
}

$$.closest = function (selector: string, element: HTMLElement) {
    var results = $$.all(selector);
    while (element) {
        if (results.indexOf(element) >= 0) {
            return element;
        }
        element = element.parentElement;
    }
}

$$.getRelativeUrl = function (baseUrl: string, url: string) {

    if (!url) {
        console.error('Url is not specified.');
        url = '/';
    }
    else if (!baseUrl) {
        console.error('Base url is not specified.');
    }
    else {

        if (baseUrl[baseUrl.length - 1] != '/') {
            baseUrl += '/';
        }

        if (url.indexOf(baseUrl) == 0) {
            url = '/' + url.substring(baseUrl.length);
        }
    }
    return url;
}