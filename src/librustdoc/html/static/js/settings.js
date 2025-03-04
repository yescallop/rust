// Local js definitions:
/* global getSettingValue, getVirtualKey, updateLocalStorage, updateSystemTheme */
/* global addClass, removeClass, onEach, onEachLazy */
/* global MAIN_ID, getVar, getSettingsButton */

"use strict";

(function () {
    const isSettingsPage = window.location.pathname.endsWith("/settings.html");

    function changeSetting(settingName, value) {
        updateLocalStorage(settingName, value);

        switch (settingName) {
            case "theme":
            case "preferred-dark-theme":
            case "preferred-light-theme":
            case "use-system-theme":
                updateSystemTheme();
                updateLightAndDark();
                break;
        }
    }

    function handleKey(ev) {
        // Don't interfere with browser shortcuts
        if (ev.ctrlKey || ev.altKey || ev.metaKey) {
            return;
        }
        switch (getVirtualKey(ev)) {
            case "Enter":
            case "Return":
            case "Space":
                ev.target.checked = !ev.target.checked;
                ev.preventDefault();
                break;
        }
    }

    function showLightAndDark() {
        addClass(document.getElementById("theme").parentElement, "hidden");
        removeClass(document.getElementById("preferred-light-theme").parentElement, "hidden");
        removeClass(document.getElementById("preferred-dark-theme").parentElement, "hidden");
    }

    function hideLightAndDark() {
        addClass(document.getElementById("preferred-light-theme").parentElement, "hidden");
        addClass(document.getElementById("preferred-dark-theme").parentElement, "hidden");
        removeClass(document.getElementById("theme").parentElement, "hidden");
    }

    function updateLightAndDark() {
        if (getSettingValue("use-system-theme") !== "false") {
            showLightAndDark();
        } else {
            hideLightAndDark();
        }
    }

    function setEvents(settingsElement) {
        updateLightAndDark();
        onEachLazy(settingsElement.getElementsByClassName("slider"), elem => {
            const toggle = elem.previousElementSibling;
            const settingId = toggle.id;
            const settingValue = getSettingValue(settingId);
            if (settingValue !== null) {
                toggle.checked = settingValue === "true";
            }
            toggle.onchange = function() {
                changeSetting(this.id, this.checked);
            };
            toggle.onkeyup = handleKey;
            toggle.onkeyrelease = handleKey;
        });
        onEachLazy(settingsElement.getElementsByClassName("select-wrapper"), elem => {
            const select = elem.getElementsByTagName("select")[0];
            const settingId = select.id;
            const settingValue = getSettingValue(settingId);
            if (settingValue !== null) {
                select.value = settingValue;
            }
            select.onchange = function() {
                changeSetting(this.id, this.value);
            };
        });
        onEachLazy(settingsElement.querySelectorAll("input[type=\"radio\"]"), elem => {
            const settingId = elem.name;
            const settingValue = getSettingValue(settingId);
            if (settingValue !== null && settingValue !== "null") {
                elem.checked = settingValue === elem.value;
            }
            elem.addEventListener("change", ev => {
                changeSetting(ev.target.name, ev.target.value);
            });
        });
    }

    /**
     * This function builds the sections inside the "settings page". It takes a `settings` list
     * as argument which describes each setting and how to render it. It returns a string
     * representing the raw HTML.
     *
     * @param {Array<Object>} settings
     *
     * @return {string}
     */
    function buildSettingsPageSections(settings) {
        let output = "";

        for (const setting of settings) {
            output += "<div class=\"setting-line\">";
            const js_data_name = setting["js_name"];
            const setting_name = setting["name"];

            if (setting["options"] !== undefined) {
                // This is a select setting.
                output += `<div class="radio-line" id="${js_data_name}">\
                        <span class="setting-name">${setting_name}</span>\
                        <div class="choices">`;
                onEach(setting["options"], option => {
                    const checked = option === setting["default"] ? " checked" : "";

                    output += `<label for="${js_data_name}-${option}" class="choice">\
                           <input type="radio" name="${js_data_name}" \
                                id="${js_data_name}-${option}" value="${option}"${checked}>\
                           ${option}\
                         </label>`;
                });
                output += "</div></div>";
            } else {
                // This is a toggle.
                const checked = setting["default"] === true ? " checked" : "";
                output += `
                    <label class="toggle">
                        <input type="checkbox" id="${js_data_name}"${checked}>
                        <span class="slider"></span>
                    </label>
                    <div>${setting_name}</div>`;
            }
            output += "</div>";
        }
        return output;
    }

    /**
     * This function builds the "settings page" and returns the generated HTML element.
     *
     * @return {HTMLElement}
     */
    function buildSettingsPage() {
        const themes = getVar("themes").split(",");
        const settings = [
            {
                "name": "Use system theme",
                "js_name": "use-system-theme",
                "default": true,
            },
            {
                "name": "Theme",
                "js_name": "theme",
                "default": "light",
                "options": themes,
            },
            {
                "name": "Preferred light theme",
                "js_name": "preferred-light-theme",
                "default": "light",
                "options": themes,
            },
            {
                "name": "Preferred dark theme",
                "js_name": "preferred-dark-theme",
                "default": "dark",
                "options": themes,
            },
            {
                "name": "Auto-hide item contents for large items",
                "js_name": "auto-hide-large-items",
                "default": true,
            },
            {
                "name": "Auto-hide item methods' documentation",
                "js_name": "auto-hide-method-docs",
                "default": false,
            },
            {
                "name": "Auto-hide trait implementation documentation",
                "js_name": "auto-hide-trait-implementations",
                "default": false,
            },
            {
                "name": "Directly go to item in search if there is only one result",
                "js_name": "go-to-only-result",
                "default": false,
            },
            {
                "name": "Show line numbers on code examples",
                "js_name": "line-numbers",
                "default": false,
            },
            {
                "name": "Disable keyboard shortcuts",
                "js_name": "disable-shortcuts",
                "default": false,
            },
        ];

        // Then we build the DOM.
        let innerHTML = "";
        let elementKind = "div";

        if (isSettingsPage) {
            elementKind = "section";
            innerHTML = `<div class="main-heading">
                <h1 class="fqn">
                    <span class="in-band">Rustdoc settings</span>
                </h1>
                <span class="out-of-band">
                    <a id="back" href="javascript:void(0)" onclick="history.back();">Back</a>
                </span>
                </div>`;
        }
        innerHTML += `<div class="settings">${buildSettingsPageSections(settings)}</div>`;

        const el = document.createElement(elementKind);
        el.id = "settings";
        el.innerHTML = innerHTML;

        if (isSettingsPage) {
            document.getElementById(MAIN_ID).appendChild(el);
        } else {
            el.setAttribute("tabindex", "-1");
            getSettingsButton().appendChild(el);
        }
        return el;
    }

    const settingsMenu = buildSettingsPage();

    function displaySettings() {
        settingsMenu.style.display = "";
    }

    function elemIsInParent(elem, parent) {
        while (elem && elem !== document.body) {
            if (elem === parent) {
                return true;
            }
            elem = elem.parentElement;
        }
        return false;
    }

    function blurHandler(event) {
        const settingsButton = getSettingsButton();
        if (!elemIsInParent(document.activeElement, settingsButton) &&
            !elemIsInParent(event.relatedTarget, settingsButton)
        ) {
            window.hideSettings();
        }
    }

    if (isSettingsPage) {
        // We replace the existing "onclick" callback to do nothing if clicked.
        getSettingsButton().onclick = function(event) {
            event.preventDefault();
        };
    } else {
        // We replace the existing "onclick" callback.
        const settingsButton = getSettingsButton();
        const settingsMenu = document.getElementById("settings");
        window.hideSettings = function() {
            settingsMenu.style.display = "none";
        };
        settingsButton.onclick = function(event) {
            if (elemIsInParent(event.target, settingsMenu)) {
                return;
            }
            event.preventDefault();
            if (settingsMenu.style.display !== "none") {
                window.hideSettings();
            } else {
                displaySettings();
            }
        };
        settingsButton.onblur = blurHandler;
        settingsButton.querySelector("a").onblur = blurHandler;
        onEachLazy(settingsMenu.querySelectorAll("input"), el => {
            el.onblur = blurHandler;
        });
        settingsMenu.onblur = blurHandler;
    }

    // We now wait a bit for the web browser to end re-computing the DOM...
    setTimeout(() => {
        setEvents(settingsMenu);
        // The setting menu is already displayed if we're on the settings page.
        if (!isSettingsPage) {
            displaySettings();
        }
        removeClass(getSettingsButton(), "rotate");
    }, 0);
})();
