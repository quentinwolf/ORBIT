// ==UserScript==
// @name         ORBIT
// @namespace    http://tampermonkey.net/
// @version      1.052
// @description  Old Reddit Ban Insertion Tool -- Autofill ban fields on the Old Reddit ban page based on made-up URL parameters.
// @author       portable-hole
// @match        https://*.reddit.com/r/*/about/banned/*
// @match        https://*.reddit.com/r/*/about/contributors/*
// @match        https://*.reddit.com/r/mod/about/modqueue*
// @match        https://*.reddit.com/report*
// @downloadURL  https://github.com/quentinwolf/ORBIT/raw/main/ORBIT.user.js
// @updateURL    https://github.com/quentinwolf/ORBIT/raw/main/ORBIT.user.js
// @OLDdownloadURL  https://github.com/portable-hole/ORBIT/raw/main/ORBIT.user.js
// @OLDupdateURL    https://github.com/portable-hole/ORBIT/raw/main/ORBIT.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Define your key-pair dictionary here
    // BE SURE to list subreddit in all lowercase, as the script does a comparison to lowercase.
    const subredditBanConfig = {
        "dadsgonewild": {
            "requiredAge": 30,
            "reasons": {
                1: "You have been banned for violating **Rule 2**. All content must depict men **aged 30+ only**. Do not post content outside this scope. You are "
                // Add other reasons as needed
            }
        },
        "daddypics": {
            "requiredAge": 40,
            "reasons": {
                1: "You have been banned for violating **Rule 2**. All content must depict men **aged 40+ only**. Do not post content outside this scope. You are ",  // age related
                2: "You have been banned for using inappropriate language.",
                3: "You have been banned for not following subreddit guidelines."
                // Add other reasons as needed
            }
        },
        "olddicks": {
            "requiredAge": 40,
            "reasons": {
                1: "You have been banned for violating **Rule 2**. All content must depict men **aged 40+ only**. Do not post content outside this scope. You are ",  // age related
                2: "You have been banned for using inappropriate language.",
                3: "You have been banned for not following subreddit guidelines."
                // Add other reasons as needed
            }
        },
        "grandpasgonewild": {
            "requiredAge": 50,
            "reasons": {
                1: "You have been banned for violating **Rule 2**. All content must depict men **aged 50+ only**. Do not post content outside this scope. You are ",  // age related
                2: "You have been banned for using inappropriate language.",
                3: "You have been banned for not following subreddit guidelines."
                // Add other reasons as needed
            }
        }
        // Add other subreddits as needed
    };

    const defaultBanMessage = "You have been banned for violating the subreddit rules.";

    // Parse URL parameters
    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function parseAge(ageString) {
        if (!ageString) return null;
        // Use regex to extract numeric value
        let match = String(ageString).match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null; // Return null if no number found
    }

    // New function to add ban evasion report links to mod queue
    function addBanEvasionReportLinks() {
        const thingsContainer = document.querySelector('#siteTable'); // Parent container of modqueue items

        if (!thingsContainer) {
            console.log('No modqueue items found.');
            return;
        }

        console.log('Ban Evasion report link observer initialized.');

        // Function to process individual items and inject the Ban Evasion report link
        function processThing(thing) {
            console.log('Processing thing:', thing);

            const reportButton = thing.querySelector('.report-button');
            const actionTable = thing.querySelector('.tb-action-table');

            if (!reportButton) {
                console.log('No report button found for this item.');
                return;
            }

            if (!actionTable) {
                console.log('No action table found for this item. Retrying in 500ms...');
                // Retry in 500ms
                setTimeout(() => processThing(thing), 500);
                return;
            }

            // Check if the action table contains a Ban Evasion reason
            const hasBanEvasionAction = Array.from(actionTable.querySelectorAll('td')).some(td =>
                                                                                            td.textContent.toLowerCase().includes('ban evasion')
                                                                                           );

            if (hasBanEvasionAction) {
                console.log('Ban Evasion detected for:', thing);

                if (!thing.querySelector('.report-ban-evasion')) {
                    const username = thing.getAttribute('data-author');
                    const subreddit = thing.getAttribute('data-subreddit');
                    const permalink = thing.getAttribute('data-permalink');

                    const reportLink = document.createElement('a');
                    reportLink.href = `https://old.reddit.com/report?reason=its-ban-evasion&subreddit=${subreddit}&username=${username}&info=${encodeURIComponent(permalink)}`;
                    reportLink.target = `_blank`;
                    reportLink.textContent = '🚨Ban Evasion';
                    reportLink.className = 'report-ban-evasion';
                    reportLink.style.marginLeft = '2px';
                    reportLink.style.marginRight = '7px';
                    reportLink.style.color = '#ff4500';
                    reportLink.style.fontWeight = 'bold';

                    reportButton.parentNode.insertBefore(reportLink, reportButton.nextSibling);
                    console.log('Ban Evasion report link added.');
                } else {
                    console.log('Ban Evasion link already exists for this item.');
                }
            } else {
                console.log('No Ban Evasion detected for:', thing);
            }
        }

        // Process existing items
        const existingThings = document.querySelectorAll('.thing');
        console.log('Found existing things:', existingThings.length);
        existingThings.forEach(processThing);

        // Set up a MutationObserver to watch for changes in the modqueue
        const observer = new MutationObserver(mutations => {
            console.log('Mutation observed:', mutations.length);
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    console.log('Added nodes detected:', mutation.addedNodes.length);
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('thing')) {
                            console.log('Processing new thing:', node);
                            processThing(node); // Process newly added items
                        } else if (node.querySelectorAll) {
                            // Check for updates to existing items (e.g., loading of tb-action-table)
                            const updatedThings = node.querySelectorAll('.thing');
                            console.log('Processing updated things:', updatedThings.length);
                            updatedThings.forEach(processThing);
                        }
                    });
                }
            });
        });

        // Observe changes to the #siteTable and its subtree
        observer.observe(thingsContainer, { childList: true, subtree: true });
    }





    // Old Reddit function to fill ban evasion report form
    function fillBanEvasionReportOld() {
        console.log("BANEVADER script started.");

        const subreddit = getParameterByName('subreddit');
        const username = getParameterByName('username');
        const info = getParameterByName('info');

        function findBanEvasionReasonWrapper() {
            const reasonWrappers = document.querySelectorAll('.reason-wrapper');
            for (let wrapper of reasonWrappers) {
                const banEvasionInput = wrapper.querySelector('input[data-reason-as-param="its-ban-evasion"]');
                if (banEvasionInput) return wrapper;
            }
            return null;
        }

        function findBanEvasionUsernameInput() {
            const wrapper = findBanEvasionReasonWrapper();
            if (wrapper) return wrapper.querySelector('.username-field-row input[type="text"]');
            return null;
        }

        function findBanEvasionTextarea() {
            const wrapper = findBanEvasionReasonWrapper();
            if (wrapper) return wrapper.querySelector('.custom-text-input-div textarea');
            return null;
        }

        function setNativeValue(element, value) {
            console.log(`Setting native value for element:`, element);
            const lastValue = element.value;
            element.value = value;

            const event = new Event('input', { bubbles: true });
            const tracker = element._valueTracker;
            if (tracker) tracker.setValue(lastValue);

            element.dispatchEvent(event);
        }

        function verifyFieldValue(element, expectedValue, fieldName) {
            setTimeout(() => {
                const actualValue = element.value;
                console.log(`${fieldName} - Expected: "${expectedValue}" vs Actual: "${actualValue}"`);
            }, 500);
        }

        function fillFields() {
            const subredditInput = document.querySelector('.sr-name-text-input-div input[type="text"]');
            if (subredditInput && subreddit) {
                setNativeValue(subredditInput, subreddit);
                verifyFieldValue(subredditInput, subreddit, 'Subreddit Input');
            }

            const usernameInput = findBanEvasionUsernameInput();
            if (usernameInput && username) {
                setNativeValue(usernameInput, `u/${username}`);
                verifyFieldValue(usernameInput, `u/${username}`, 'Username Input');
            }

            const infoTextarea = findBanEvasionTextarea();
            if (infoTextarea && info) {
                const infoValue = `Ban Evasion: This content is from an account suspected of ban evasion\nPermalink: ${info}`;
                setNativeValue(infoTextarea, infoValue);
                verifyFieldValue(infoTextarea, infoValue, 'Info Textarea');
            }
        }

        const observer = new MutationObserver((mutations, observer) => {
            const subredditInput = document.querySelector('.sr-name-text-input-div input[type="text"]');
            const usernameInput = findBanEvasionUsernameInput();
            const infoTextarea = findBanEvasionTextarea();

            if (subredditInput && usernameInput && infoTextarea) {
                fillFields();
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // New Reddit function to fill ban evasion report form
    function fillBanEvasionReportNew() {
        const subreddit = getParameterByName('subreddit');
        const username = getParameterByName('username');
        const info = getParameterByName('info');

        // Wait longer for React to fully initialize
        setTimeout(() => {
            const checkForm = setInterval(() => {
                const subredditInput = document.querySelector('input[data-empty="true"]');
                const usernameInput = document.querySelector('input[value^="u/"]');
                const infoTextarea = document.querySelector('textarea[data-empty="true"]');

                if (subredditInput && usernameInput && infoTextarea) {
                    clearInterval(checkForm);

                    // Create a controlled input simulation function
                    const simulateControlledInput = (element, finalValue) => {
                        // Get the original descriptor
                        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

                        // Define a custom getter/setter
                        Object.defineProperty(element, 'value', {
                            configurable: true,
                            get: function() { return finalValue; },
                            set: function(value) {
                                descriptor.set.call(this, value);
                                const e = new Event('input', { bubbles: true });
                                this.dispatchEvent(e);
                            }
                        });

                        // Simulate typing
                        element.value = finalValue;
                        element.setAttribute('data-empty', 'false');
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    };

                    // Fill the fields using the controlled input simulation
                    simulateControlledInput(subredditInput, subreddit);
                    simulateControlledInput(usernameInput, `u/${username}`);

                    // Keep the working textarea implementation
                    const infoText = `Ban Evasion: This content is from an account suspected of ban evasion\nPermalink: ${info}`;
                    infoTextarea.value = infoText;
                    infoTextarea.setAttribute('data-empty', 'false');
                    infoTextarea.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: infoText,
                        isComposing: false
                    }));

                    const charCount = document.querySelector('._2nMs12tSLppI6tzUQbdtpO');
                    if (charCount) {
                        charCount.textContent = `${infoText.length}/500`;
                    }
                }
            }, 500);
        }, 1000);
    }

    // Fill ban form fields
    function fillBanFields() {
        console.log("Running the script...");

        let username = getParameterByName('user');
        console.log("Username:", username);

        if (!username) {
            console.log("Username parameter not passed.");
            return; // Parameter not passed
        }
        
        // Fill fields
        document.querySelector('.friend-name').value = username;
        
        let reasonCode = parseInt(getParameterByName('reason'), 10);

        let realAgeString = getParameterByName('realage');
        let fakeAgeString = getParameterByName('fakeage');
        let realAge = parseAge(realAgeString); //Run the real age through regex to extract the actual age
        let fakeAge = parseAge(fakeAgeString); // Also parse fake age to support mixed inputs

        const hasRealAge = Number.isInteger(realAge);
        const hasFakeAge = Number.isInteger(fakeAge);

        console.log("Real Age:", realAge);
        console.log("Age Fake:", fakeAge);

        // Fill fields
        let noteValue = '';
        if (hasRealAge && hasFakeAge) {
            noteValue = realAge + " as " + fakeAge + " to evade bot";
        } else if (hasRealAge) {
            noteValue = "Age " + realAge;
        } else if (hasFakeAge) {
            noteValue = "Posting as " + fakeAge + " to evade bot";
        }
        document.querySelector('#note').value = noteValue;
        
        let subredditMatch = window.location.href.match(/https:\/\/(?:www|old)\.reddit\.com\/r\/(.*?)\//);
        let subreddit = (subredditMatch && subredditMatch[1]) ? subredditMatch[1].toLowerCase() : null;

        let config = subredditBanConfig[subreddit];

        let banMessage, banDuration;

        if (config) {
            let messageTemplate = config.reasons[reasonCode] || defaultBanMessage;
            if (reasonCode === 1) { // If reason is age related
                if (hasRealAge) {
                    banMessage = messageTemplate + realAge + ".";
                    let ageDifference = config.requiredAge - realAge;
                    if (ageDifference === 3) {
                        banDuration = 999;
                    } else if (ageDifference >= 1 && ageDifference <= 2) {
                        banDuration = Math.max(330 * ageDifference, 1);
                    } else {
                        banDuration = ''; // Permanent ban
                    }
                } else if (hasFakeAge) {
                    banMessage = messageTemplate + "posting as " + fakeAge + ".";
                    banDuration = '';
                } else {
                    banMessage = messageTemplate + "an unknown age.";
                    banDuration = '';
                }
            } else {
                banMessage = messageTemplate;  // For other reasons, use the message as it is
                banDuration = ''; // Default is permanent ban, adjust if needed
            }
        } else {
            banMessage = defaultBanMessage;
            banDuration = ''; // Default is permanent ban
        }

        // Fill fields
        document.querySelector('#duration').value = banDuration;
        document.querySelector('#ban_message').value = banMessage;

        console.log("Filled all required fields.");

        // Clear junk field if all required fields are filled
        if (document.querySelector('.friend-name') && document.querySelector('#note') && document.querySelector('#duration') && document.querySelector('#ban_message')) {
            document.querySelector('#user').value = '';
            console.log("Cleared the unused field.");
        }
    }

    function fillContributorFields() {
        console.log("Running the script for contributors...");

        let username = getParameterByName('user');
        console.log("Username:", username);

        if (!username) {
            console.log("Username parameter not passed.");
            return; // Parameter not passed
        }

        // Fill the username field
        document.querySelector('#name').value = username;

        console.log("Filled the username field.");
    }

    // Run the appropriate script based on the current page
    const path = window.location.pathname;
    const hostname = window.location.hostname;

    if (path.includes('/about/banned/')) {
        fillBanFields();
    } else if (path.includes('/about/contributors/')) {
        fillContributorFields();
    } else if (path.includes('/r/mod/about/modqueue')) {
        addBanEvasionReportLinks();
    } else if (hostname === 'old.reddit.com' && (path.includes('/report') && getParameterByName('reason') === 'its-ban-evasion')) {
        fillBanEvasionReportOld();
    } else if ((hostname === 'www.reddit.com' || hostname === 'new.reddit.com') && path.includes('/report') && getParameterByName('reason') === 'its-ban-evasion') {
        fillBanEvasionReportNew();
    }
})();
