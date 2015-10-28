describe("Trello", function () {
    var testBoardName = 'trello-test-qazwsxedc';
    var testListName = 'List in trello-test-qazwsxedc';
    var testIssueName = 'Issue for trello-test-qazwsxedc';

    var testIssueUrl = '';
    var testIssueEffectiveUrl = '';

    before(function () {
        var boardsSelector = '//*[@class="member-boards-view"]/*[@class="boards-page-board-section"][.//*[contains(@class,"icon-member")]]/*[contains(@class,"board-list")]';
        var boardSelector = boardsSelector + '//*[contains(@class,"js-open-board") and normalize-space()="' + testBoardName + '"]';

        return browser
            .login("Trello")
        // check test board
            .waitForVisible(boardsSelector)
            .isVisible(boardSelector)
            .then(function (result) {
                return result ?
                    // go to test board
                    browser
                        .click(boardSelector) :
                    // create test board
                    browser
                        .click('li .js-add-board')
                        .setValue('#boardNewTitle', testBoardName)
                        .click('.js-submit');
            })
        // check test list
            .waitForVisible('#board')
            .isVisible('.list-header-name=' + testListName)
            .then(function (result) {
                if (!result) {
                    // create test list
                    return browser
                        .isVisible('.js-add-list.is-idle')
                        .then(function (result) {
                            if (result) {
                                return browser.click('.js-open-add-list');
                            }
                        })
                        .waitForVisible('.list-name-input')
                        .setValue('.list-name-input', testListName)
                        .click('.js-save-edit')
                        .waitForVisible('.list-header-name=' + testListName);
                }
            })
        // check test card
            .isVisible('.list-card-title*=' + testIssueName)
            .then(function (result) {
                if (!result) {
                    // create test card
                    return browser
                        .waitForClick('.js-open-card-composer')
                        .waitForVisible('.list-card-composer-textarea')
                        .setValue('.list-card-composer-textarea', testIssueName)
                        .click('.js-add-card')
                        .pause(1000)
                        .waitForVisible('.list-card-title*=' + testIssueName);
                }
            })
        // get test card url
            .getAttribute('.list-card-title*=' + testIssueName, 'href')
            .then(function (result) {
                testIssueUrl = result;
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;

                // Full card url:
                // https://trello.com/c/CARD_ID/CARD_NUMBER-CARD_TITLE_DASHED_AND_LOWERCASED
                // Effective card url:
                // https://trello.com/c/CARD_ID
                testIssueEffectiveUrl = result.split('/').slice(0, -1).join('/');
                expect(testIssueEffectiveUrl).to.be.a('string').and.not.to.be.empty;
            });
    });

    it("can start timer on an issue", function () {
        console.log(testIssueUrl);
        return browser
            .url(testIssueEffectiveUrl)
            .waitForVisible('.devart-timer-link')
            .getText('.board-header-btn-name').should.eventually.be.equal(testBoardName)
            .getText('.window-title-text').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testIssueUrl)
            .startAndTestTaskStarted(testBoardName, testIssueName, testIssueEffectiveUrl);
    });

    it("can stop timer on an issue", function () {
        return browser
            .url(testIssueEffectiveUrl)
            .startStopAndTestTaskStopped();
    });
});