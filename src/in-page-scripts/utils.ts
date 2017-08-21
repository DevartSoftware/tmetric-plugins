interface Utils {
    <TElement extends HTMLElement>(selector: string, element?: NodeSelector, condition?: (el: TElement) => boolean): TElement;
    try<TElement extends HTMLElement>(selector: string, element?: NodeSelector, condition?: (el: TElement) => boolean): TElement;
    visible<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement;
    all<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement[];
    closest<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement;
    prev<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement;
    next<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement;
    getAttribute(selector: string, attributeName: string, element?: NodeSelector): string;
    create<TElement extends HTMLElement>(tagName: string, ...classNames: string[]): TElement;
    getRelativeUrl(baseUrl: string, fullUrl: string): string;
    findNode(selector: string, nodeType: number, element?: NodeSelector): Node;
    findAllNodes(selector: string, nodeType: number, element?: NodeSelector): Node[];
    searchParams(paramString: string): { [name: string]: string };
}

// Do not use 'let' here to allow variable reassigning
var $$ = <Utils>function (selector: string, element?: NodeSelector, condition?: (el: Element) => boolean) {

    element = element || document;

    if (!condition) {
        return <HTMLElement>element.querySelector(selector);
    }

    let nodeList = element.querySelectorAll(selector);
    for (let i = 0; i < nodeList.length; i++) {
        if (condition(nodeList[i])) {
            return nodeList[i];
        }
    }

    return null;
};

$$.try = function (selector: string, element?: NodeSelector, condition?: (el: Element) => boolean) {
    return $$(selector, element, condition) || <HTMLElement>{};
};

$$.create = function (tagName, ...classNames: string[]) {
    let element = <HTMLElement>document.createElement(tagName);
    classNames.push(Integrations.IntegrationService.affix + '-' + tagName.toLowerCase());
    element.classList.add(...classNames);
    return element;
};

$$.all = function (selector: string, element?: NodeSelector) {
    element = element || document;
    let nodeList = element.querySelectorAll(selector);
    let result = <Element[]>[];
    for (let i = nodeList.length - 1; i >= 0; i--) {
        result[i] = nodeList[i];
    }
    return result;
};

$$.visible = function (selector: string, element?: NodeSelector) {
    return $$(selector, element, el => {
        while (el) {
            if (el === document.body) {
                return true;
            }
            if (!el || el.style.display === 'none' || el.style.visibility === 'hidden') {
                return false;
            }
            el = el.parentElement;
        }
        return false;
    });
};

$$.closest = function (selector: string, element: HTMLElement) {
    while (element) {
        if (element.matches(selector)) {
            return element;
        }
        element = element.parentElement;
    }
};

$$.prev = function (selector: string, element: HTMLElement) {
    while (element) {
        if (element.matches(selector)) {
            return element;
        }
        element = <HTMLElement>element.previousElementSibling;
    }
};

$$.next = function (selector: string, element: HTMLElement) {
    while (element) {
        if (element.matches(selector)) {
            return element;
        }
        element = <HTMLElement>element.nextElementSibling;
    }
};

$$.getAttribute = function (selector: string, attributeName: string, element?: NodeSelector): string {
    let result: string;
    let child = $$(selector, element);
    if (child) {
        result = child.getAttribute(attributeName);
    }
    return result || '';
};

$$.getRelativeUrl = function (baseUrl: string, url: string) {

    let c = console; // save console to prevent strip in release;

    if (!url) {
        c.error('Url is not specified.');
        url = '/';
    }
    else if (!baseUrl) {
        c.error('Base url is not specified.');
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
};

$$.findNode = (selector: string, nodeType: number, element?: NodeSelector) => {
    let childNodes = $$.try(selector, element).childNodes;
    if (childNodes) {
        for (let i = 0; i < childNodes.length; i++) {
            let node = childNodes[i];
            if (node.nodeType == nodeType) {
                return node;
            }
        }
    }
};

$$.findAllNodes = (selector: string, nodeType: number, element?: NodeSelector) => {
    let result = <Node[]>[];
    let childNodes = $$.try(selector, element).childNodes;
    if (childNodes) {
        for (let i = 0; i < childNodes.length; i++) {
            let node = childNodes[i];
            if (nodeType == null || node.nodeType === nodeType) {
                result.push(node);
            }
        }
    }
    return result;
};

$$.searchParams = query => {

    let params: { [name: string]: string } = {};

    if (!query) {
        return params;
    }

    if (/^[?#]/.test(query)) {
        query = query.slice(1);
    }

    query.split('&').forEach(param => {
        let [key, value] = param.split('=');
        params[key] = decodeURIComponent((value || '').replace(/\+/g, ' '));
    });
    return params;
};