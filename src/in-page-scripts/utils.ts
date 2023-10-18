interface Utils {
    <TElement extends HTMLElement>(selector: string, element?: ParentNode, condition?: (el: TElement) => boolean): TElement | null;
    try<TElement extends HTMLElement>(selector: string, element?: ParentNode, condition?: (el: TElement) => boolean): Properties<TElement>;
    visible<TElement extends HTMLElement>(selector: string, element?: ParentNode): TElement | null;
    all<TElement extends HTMLElement>(selector: string, element?: ParentNode): TElement[];
    closest<TElement extends HTMLElement>(selector: string, element: HTMLElement, condition?: (el: TElement) => boolean): TElement | null;
    prev<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement | null;
    next<TElement extends HTMLElement>(selector: string, element: HTMLElement): TElement | null;
    getAttribute(selector: string, attributeName: string, element?: ParentNode): string;
    create<TElement extends HTMLElement>(tagName: string, ...classNames: string[]): TElement;
    getRelativeUrl(baseUrl: string, fullUrl: string): string;
    findNode(selector: string, nodeType: number, element?: ParentNode): Node | null;
    findAllNodes(selector: string, nodeType: number, element?: ParentNode): Node[];
    searchParams(paramString: string): { [name: string]: string };
}

type Properties<T> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: T[K] | undefined;
}

// Do not use 'let' here to allow variable reassigning
const $$ = function (selector: string, element?: ParentNode, condition?: (el: Element) => boolean) {

    element = element || document;

    if (!condition) {
        return <HTMLElement>element.querySelector(selector);
    }

    const nodeList = element.querySelectorAll(selector);
    for (let i = 0; i < nodeList.length; i++) {
        if (condition(nodeList[i])) {
            return nodeList[i];
        }
    }

    return null;
} as Utils;


$$.try = function <TElement extends HTMLElement>(selector: string, element?: ParentNode, condition?: (el: TElement) => boolean) {
    return ($$(selector, element, condition) || {}) as Properties<TElement>;
}

$$.create = function <TElement extends HTMLElement>(tagName, ...classNames: string[]) {
    const element = document.createElement(tagName) as TElement;
    classNames.push(IntegrationService.affix + '-' + tagName.toLowerCase());
    element.classList.add(...classNames);
    return element;
};

$$.all = function <TElement extends HTMLElement>(selector: string, element?: ParentNode) {
    element = element || document;
    const nodeList = element.querySelectorAll(selector);
    const result = [] as TElement[];
    for (let i = nodeList.length - 1; i >= 0; i--) {
        result[i] = nodeList[i] as TElement;
    }
    return result;
};

$$.visible = function <TElement extends HTMLElement>(selector: string, element?: ParentNode) {
    return $$<TElement>(selector, element, el => {

        // Check display
        if (!el.offsetWidth && !el.offsetHeight && !el.getClientRects().length) {
            return false;
        }

        // Check visibility
        while (el) {
            if (el === document.body) {
                return true;
            }
            if (el.style.visibility === 'hidden' || el.style.visibility === 'collapse') {
                return false;
            }
            el = el.parentElement as TElement;
        }
        return false;
    });
};

$$.closest = function <TElement extends HTMLElement>(selector: string, element: HTMLElement, condition: (el: TElement) => boolean) {
    while (element) {
        if (element.matches(selector) && (!condition || condition(element as TElement))) {
            return element as TElement;
        }
        element = element.parentElement!;
    }
    return null;
};

$$.prev = function <TElement extends HTMLElement>(selector: string, element: HTMLElement) {
    while (element) {
        if (element.matches(selector)) {
            return element as TElement;
        }
        element = element.previousElementSibling as HTMLElement;
    }
    return null;
};

$$.next = function <TElement extends HTMLElement>(selector: string, element: HTMLElement) {
    while (element) {
        if (element.matches(selector)) {
            return element as TElement;
        }
        element = element.nextElementSibling as HTMLElement;
    }
    return null;
};

$$.getAttribute = function (selector: string, attributeName: string, element?: ParentNode): string {
    let result: string | null = null;
    const child = $$(selector, element);
    if (child) {
        result = child.getAttribute(attributeName);
    }
    return result || '';
};

$$.getRelativeUrl = function (baseUrl: string, url: string) {

    const c = console; // save console to prevent strip in release;

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

$$.findNode = (selector: string, nodeType: number, element?: ParentNode) => {
    const elements = $$.all(selector, element);
    for (let el of elements) {
        const childNodes = el.childNodes;
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType == nodeType) {
                    return node;
                }
            }
        }
    }
    return null;
};

$$.findAllNodes = (selector: string, nodeType: number, element?: ParentNode) => {
    const result = [] as Node[];
    const elements = $$.all(selector, element);
    for (let el of elements) {
        const childNodes = el.childNodes;
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (nodeType == null || node.nodeType === nodeType) {
                    result.push(node);
                }
            }
        }
    }
    return result;
};

$$.searchParams = query => {

    const params: { [name: string]: string } = {};

    if (!query) {
        return params;
    }

    query = query.replace(/^[^?]*\?/, '');

    if (/^#/.test(query)) {
        query = query.slice(1);
    }

    query.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent((value || '').replace(/\+/g, ' '));
    });

    return params;
};