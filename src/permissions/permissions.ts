$(document).ready(() => {

    function renderIntegrations(holder: string, items: WebToolDescription[]) {
        const content = items.map(item => $('<li>')
            .data('keywords', [item.serviceName].concat(item.keywords || []).map(k => k.toLowerCase()))
            .append(`
<label title="${item.serviceName}" class="logo-wrapper">
    <input type="checkbox" name="${item.serviceType}" />
    <span class="logo-area">
        <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
        <button class="btn btn-default show-popup" ${item.hasAdditionalOrigins ? '' : 'style="display:none"'}"><i class="fa fa-pencil"></i> Edit</button>
    </span>
</label>`));
        $(holder).empty().append(content);
    }

    function setScrollArea() {
        if ($('.permissions-page').length > 0) {
            let headerHeight = $('.header').outerHeight();
            let filterHeight = $('.filter-section').outerHeight();
            let bodyHeight = $(document).height();
            let containerMargins = 82;
            let scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
            $('.logos-section').css("height", scrollAreaHeight + "px");
        }
    }

    function renderUrlListItem(url: string) {
        return $('<li>').append(`
<input class="url input form-control" type="text" value="${url}" readonly />
<button class="btn btn-icon edit-url"><i class="fa fa-pencil"></i></button>
<button class="btn btn-icon save-url" style="display:none"><i class="fa fa-check"></i></button>
<button class="btn btn-icon remove-url"><i class="fa fa-times"></i></button>`);
    }

    function initLogoClick() {

        let popup = '.location-popup';

        function getServiceUrls(serviceType: string) {

            let webToolDescription = getWebToolDescriptions().find(i => i.serviceType == serviceType);
            if (!webToolDescription) {
                return {};
            }

            let { origins = [], hasAdditionalOrigins } = webToolDescription;

            let serviceUrlsMap = WebToolManager.getServiceUrls();
            let serviceUrls = serviceUrlsMap[serviceType] || origins;

            return { serviceUrls, hasAdditionalOrigins };
        }

        async function showPopup(serviceType: string, serviceUrls: string[]) {

            $(popup).data('serviceType', serviceType);
            $(popup).data('serviceUrlsInitial', serviceUrls);

            $('.add-url-input-holder input', popup).val('');

            $('.add-url-input-holder input', popup).attr('placeholder', `https://${serviceType.toLowerCase()}.server.com`);

            $('.url-list', popup).empty().append(serviceUrls.map(renderUrlListItem));

            $('.location-popup, .overlay').addClass('visible');
        }

        function closePopup() {
            $('.location-popup, .overlay').removeClass('visible');
            updatePermissionCheckboxes();
        }

        $('.logo-wrapper').on('click', function (event) {

            event.stopPropagation();

            const input = $(this).find('input:checkbox');
            const name = input.prop('name');
            const checked = input.prop('checked');

            const { serviceUrls, hasAdditionalOrigins } = getServiceUrls(name);

            if (!checked && serviceUrls.length == 0 && hasAdditionalOrigins) {
                showPopup(name, serviceUrls);
            }
        });

        $('.logo-wrapper').on('click', '.show-popup', function (event) {

            event.stopPropagation();

            const input = $(this).parent().siblings('input:checkbox');
            const name = input.prop('name');

            const { serviceUrls, hasAdditionalOrigins } = getServiceUrls(name);

            if (hasAdditionalOrigins) {
                showPopup(name, serviceUrls);
            }
        });

        $('.add-url', popup).click(function () {

            let input = $('input', $(this).parent('.add-url-input-holder'));
            let value = input.val();
            let serviceUrl = WebToolManager.toServiceUrl(value);

            input.toggleClass('invalid', !serviceUrl);

            if (!serviceUrl) {
                return;
            }

            $('.url-list', popup).append(renderUrlListItem(serviceUrl));
        });

        $('.url-list', popup).on('click', '.edit-url', function () {
            $(this).siblings('input').prop('readonly', false).focus();
            $(this).siblings('.save-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.save-url', function () {

            let input = $(this).siblings('input');
            let value = input.val();
            let serviceUrl = WebToolManager.toServiceUrl(value);

            input.toggleClass('invalid', !serviceUrl);

            if (!serviceUrl) {
                return;
            }

            $(this).siblings('input').prop('readonly', true);
            $(this).siblings('.edit-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.remove-url', function () {
            $(this).parent('li').remove();
        });

        $('.close-popup', popup).click(function () {
            closePopup();
        });

        $('.apply-popup', popup).click(async function () {

            const serviceType = $(popup).data('serviceType');
            const urlsAfter = $('.url-list .url', popup).toArray().map((el: HTMLInputElement) => el.value);

            const input = $('.add-url-input-holder input', popup);
            const value = input.val();
            const serviceUrl = WebToolManager.toServiceUrl(value);
            if (serviceUrl && urlsAfter.indexOf(serviceUrl) < 0) {
                urlsAfter.push(serviceUrl);
            }

            const urlsBefore: string[] = $(popup).data('serviceUrlsInitial') || [];

            const urlsAdded = urlsAfter
                .filter(url => urlsBefore.indexOf(url) < 0)
                .reduce((map, url) => (map[url] = serviceType) && map, <ServiceTypesMap>{});

            const urlsRemoved = urlsBefore
                .filter(url => urlsAfter.indexOf(url) < 0)
                .reduce((map, url) => (map[url] = serviceType) && map, <ServiceTypesMap>{});

            await permissionsManager.updatePermissions(urlsAdded, urlsRemoved);

            closePopup();

        });
    }

    function setAllLogos() {
        $('.enable-all').click(async () => {

            const map = WebToolManager.toServiceTypesMap(getWebToolDescriptions());
            await permissionsManager.requestPermissions(map);

            updatePermissionCheckboxes();
        });

        $('.disable-all').click(async () => {

            const map: ServiceTypesMap = {};

            const webTools = getWebToolDescriptions();
            webTools.forEach(webTool => webTool.origins.map(origin => map[origin] = webTool.serviceType));

            const serviceTypes = WebToolManager.serviceTypes;
            Object.keys(serviceTypes).forEach(serviceUrl => map[serviceUrl] = serviceTypes[serviceUrl]);

            await permissionsManager.removePermissions(map);
            await permissionsManager.cleanupPermissions();

            updatePermissionCheckboxes();
        });
    }

    function initPermissionCheckboxes() {
        $('.logo-wrapper input').change(async event => {

            const input = <HTMLInputElement>event.currentTarget;

            try {

                const serviceType = input.name;
                const serviceUrls = $(input).data('serviceUrls');
                const map = serviceUrls.reduce((map, url) => (map[url] = serviceType) && map, <ServiceTypesMap>{});

                if (input.checked) {
                    await permissionsManager.requestPermissions(map);
                } else {
                    await permissionsManager.removePermissions(map);
                }

                updatePermissionCheckboxes();
            } catch (err) {
                console.error(err);
            }
        });

        updatePermissionCheckboxes();
    }

    function setPermissionCheckboxStatus(serviceType: string, serviceUrls: string[], checked: boolean) {
        $(`.logo-wrapper input[name='${serviceType}']`)
            .prop('checked', checked)
            .data('serviceUrls', serviceUrls);
    }

    async function updatePermissionCheckboxes() {

        const serviceUrlsMap = WebToolManager.getServiceUrls();
        const webToolDescriptions = getWebToolDescriptions();

        webToolDescriptions.forEach(async webToolDescription => {

            const { serviceType } = webToolDescription;

            const serviceUrls = serviceUrlsMap[serviceType];

            if (serviceUrls) {
                const result = await WebToolManager.isAllowed(serviceUrls);
                setPermissionCheckboxStatus(serviceType, serviceUrls, result);
            } else {
                setPermissionCheckboxStatus(serviceType, webToolDescription.origins, false);
            }
        });
    }

    function initSearch() {

        let search: string;

        function containSearch(keyword: string) {
            return !search || keyword.indexOf(search) >= 0;
        }

        function checkKeywords() {
            const keywords: string[] = $(this).data('keywords');
            if (keywords.some(containSearch)) {
                $(this).show(500);
            } else {
                $(this).hide(500);
            }
        }

        $('.search-input').on('input', function () {
            search = (<string>$(this).val()).toLowerCase();
            $('.logos-section ul li').each(checkKeywords);
        }).focus();
    }

    function initClosePage() {
        $('.close-page').click(() => {
            chrome.tabs.getCurrent(tab => {
                chrome.tabs.remove(tab.id);
            });
        });
    }

    // init

    const permissionsManager = new PermissionManager();

    renderIntegrations('#integrations', getWebToolDescriptions());

    setScrollArea();
    setAllLogos();
    initLogoClick();
    initPermissionCheckboxes();
    initSearch();
    initClosePage();

    $(window).resize(function () {
        setScrollArea();
    });
});
