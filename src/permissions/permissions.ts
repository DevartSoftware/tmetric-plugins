$(document).ready(() => {

    function renderIntegrations(holder: string, items: WebToolDescription[]) {
        const content = items.map(item => $('<li>')
            .attr('title', item.serviceName)
            .data('keywords', [item.serviceName].concat(item.keywords || []).map(k => k.toLowerCase()))
            .append(`
<label class="logo-wrapper">
    <input type="checkbox" name="${item.serviceType}" />
    <span class="logo-area">
        <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
        <button class="btn btn-default show-popup" ${item.hasAdditionalOrigins ? '' : 'style="display:none"'}"><i class="fa fa-pencil"></i> Edit</button>
    </span>
</label>`));
        $(holder).empty().append(content);
    }

    function setScrollArea() {
        let headerHeight = $('.header').outerHeight();
        let filterHeight = $('.filter-section').outerHeight();
        let bodyHeight = $(document).height();
        let containerMargins = 82;
        let scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
        $('.logos-section').css("height", scrollAreaHeight + "px");
    }

    function renderOriginListItem(origin: string) {
        return $('<li>').append(`
<input class="url input form-control" type="text" value="${origin}" readonly />
<button class="btn btn-icon edit-url"><i class="fa fa-pencil"></i></button>
<button class="btn btn-icon save-url" style="display:none"><i class="fa fa-check"></i></button>
<button class="btn btn-icon remove-url"><i class="fa fa-times"></i></button>`);
    }

    function initLogoClick() {

        let popup = '.location-popup';

        async function getOrigins(serviceType: string) {

            let webToolDescription = webToolDescriptions.find(i => i.serviceType == serviceType);
            if (!webToolDescription) {
                return {};
            }

            let { origins = [], hasAdditionalOrigins } = webToolDescription;

            let webTools = await getEnabledWebTools();
            let webTool = webTools.find(item => item.serviceType == serviceType);
            if (webTool) {
                origins = webTool.origins;
            }

            return { origins, hasAdditionalOrigins };
        }

        async function showPopup(serviceType: string, origins: string[]) {

            $(popup).data('serviceType', serviceType);

            $('.add-url-input-holder input', popup).val('');

            $('.url-list', popup).empty().append(origins.map(renderOriginListItem));

            $('.location-popup, .overlay').addClass('visible');
        }

        function closePopup() {
            $('.location-popup, .overlay').removeClass('visible');
            updatePermissionCheckboxes();
        }

        $('.logo-wrapper').on('click', async function (event) {

            event.stopPropagation();

            const input = $(this).find('input:checkbox');
            const name = input.prop('name');
            const checked = input.prop('checked');

            const { origins, hasAdditionalOrigins } = await getOrigins(name);

            if (!checked && origins.length == 0 && hasAdditionalOrigins) {
                showPopup(name, origins);
            }
        });

        $('.logo-wrapper').on('click', '.show-popup', async function (event) {

            event.stopPropagation();

            const input = $(this).parent().siblings('input:checkbox');
            const name = input.prop('name');

            const { origins, hasAdditionalOrigins } = await getOrigins(name);

            if (hasAdditionalOrigins) {
                showPopup(name, origins);
            }
        });

        $('.add-url', popup).click(function () {

            let input = $('input', $(this).parent('.add-url-input-holder'));
            let value = input.val();
            let origin = toOrigin(value);

            input.toggleClass('invalid', !origin);

            if (!origin) {
                return;
            }

            $('.url-list', popup).append(renderOriginListItem(origin));
        });

        $('.url-list', popup).on('click', '.edit-url', function () {
            $(this).siblings('input').prop('readonly', false).focus();
            $(this).siblings('.save-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.save-url', function () {

            let input = $(this).siblings('input');
            let value = input.val();
            let origin = toOrigin(value);

            input.toggleClass('invalid', !origin);

            if (!origin) {
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

            let serviceType = $(popup).data('serviceType');
            let origins = $('.url-list .url', popup).toArray().map((el: HTMLInputElement) => el.value);
            let item: WebTool = { serviceType, origins };

            if (await permissionsManager.requestPermissions([item])) {
                closePopup();
            }
        });
    }

    function setAllLogos() {
        $('.enable-all').click(async () => {

            let items = getWebToolDescriptions()
                .filter(i => i.origins.length)
                .map(i => (<WebTool>{
                    serviceType: i.serviceType,
                    origins: i.origins
                }));

            await permissionsManager.requestPermissions(items);

            updatePermissionCheckboxes();
        });

        $('.disable-all').click(async () => {

            let items = getWebToolDescriptions()
                .map(i => (<WebTool>{
                    serviceType: i.serviceType,
                    origins: i.origins
                }));

            items.push(...await getEnabledWebTools());

            await permissionsManager.removePermissions(items);
            await permissionsManager.cleanupPermissions();

            updatePermissionCheckboxes();
        });
    }

    function initPermissionCheckboxes() {
        $('.logo-wrapper input').change(async event => {

            let input = <HTMLInputElement>event.currentTarget;
            let webToolDescription = webToolDescriptions.find(i => i.serviceType == input.name);

            try {

                let item: WebTool = {
                    serviceType: webToolDescription.serviceType,
                    origins: webToolDescription.origins
                };

                if (input.checked) {
                    await permissionsManager.requestPermissions([item]);
                } else {
                    await permissionsManager.removePermissions([item]);
                }

                updatePermissionCheckboxes();

            } catch (err) {
                console.error(err);
            }
        });

        updatePermissionCheckboxes();
    }

    function setPermissionCheckboxStatus(serviceType: string, checked: boolean) {
        $(`.logo-wrapper input[name='${serviceType}']`).prop('checked', checked);
    }

    async function updatePermissionCheckboxes() {

        const webTools = await getEnabledWebTools();
        const webToolDescriptions = getWebToolDescriptions();

        webToolDescriptions.forEach(webToolDescription => {

            const { serviceType } = webToolDescription;

            const webTool = webTools.find(s => s.serviceType == serviceType);

            if (webTool) {

                let permissions = <chrome.permissions.Permissions>{
                    origins: webTool.origins
                };

                chrome.permissions.contains(permissions, result => {
                    setPermissionCheckboxStatus(serviceType, result);
                });
            } else {
                setPermissionCheckboxStatus(serviceType, false);
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

    var permissionsManager = new PermissionManager();

    const webToolDescriptions = getWebToolDescriptions().filter(i => i.serviceType && i.scripts);
    renderIntegrations('#integrations', webToolDescriptions);

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
