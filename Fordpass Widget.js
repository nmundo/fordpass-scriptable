// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;
/**************
 * Permission to use, copy, modify, and/or distribute this software for any purpose without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
 * OF THIS SOFTWARE.
 *
 *
 * This is a widget for the iOS/iPad/MacOS app named Scriptable https://scriptable.app/ created by Anthony Santilli (https://github.com/tonesto7)
 *
 * Fuel pump Icon made by Kiranshastry from www.flaticon.com
 *
 * Based off the work of others:
 *  - The original Fordpass Scriptable script by Damian Schablowsky  <dschablowsky.dev@gmail.com> (https://github.com/dschablowsky/FordPassWidget)
 *  - Api Logic based on ffpass from https://github.com/d4v3y0rk - thanks a lot for the work!
 *  - WidgetMarkup.js by @rafaelgandi (https://github.com/rafaelgandi/WidgetMarkup-Scriptable)
 *
 *
 * IMPORTANT NOTE: This widget will only work with vehicles that show up in the FordPassFordPass app!
 */

/**************
Changelog:
    v1.0.0:
        - Newly Remastered version of Damians Scriptable widget with a new look and feel
    v1.0.1:
        - Added remote start to ignition status and remote stop to running status
    v1.0.2:
        - Merged in changes from @yuxinli915 pull request
        - Added an vehicle selector to allow quick selection of vehicle icon and name
    v1.0.3:
        - Removed the need to store your login and vehicle info in the script. You will now be prompted for it when the script runs. and it will be stored securely in the apple keychain.
            If you ever need to clear it then just tap on the widget and select settings from the menu and select clear all data. On the next run it prompt you to enter the info again.
        - More code cleanup and added some comments
        - dynamic menu items now show up based on the vehicle capabilities (only filters out zone lighting if it is not supported... for now)
        - Moved widget settings to a settings menu so you no longer need to edit the file
    v1.0.4: 
        - Fixed bugs for the first time run
        - Updated the list of selectable vehicle types.
    v1.0.5: 
        - Fixed bugs with tire pressure showing as an object instead of a number
    v1.0.6: 
        - Fixes for invalid vehicle types
    v1.1.0: 
        - Fixes for login failures.
        - Pulls in your vehicle image from ford.
        - pulls in vehicle capabilties from ford.
        - Many other improvements to support future features.
    v1.1.1: 
        - Initial support of Electric Vehicles (battery charge, and range)
        - Added screen size detection to adjust the font size on iphones with smaller displays. (Will be used later to fine tune the padding of the widget).
        - Added a version check to show you on the widget and main menu if there is a new version available.
        - Low Voltage Battery Text now shows up as a red when it is low.
        - Status Text is displays at the bottom of the widget. When vehicle is in deep sleep mode, firmware update is in progress, or the vehicle is in a low voltage battery state, the status text will be displayed.
        - Fixed bug in using metric and defining psi tire pressure
        - Tweak the padding of the widget to make it more consistent.
        - Fixed tire pressure font so it matches the rest of the widget.
    v1.2.0: 
        - Added support for advanced commands like securialert, and likely any future commands.
        - Updated navigation labels and menus so that you can go back to previous menus instead of exiting each time
        - Refactored the entire authentication mechinism to get the new token required for more advanced commands and data
        - Added a debug menu under the widget settings menu.  It will allow you to save all vehicle data to your device clipboard for easy sharing with me or others.
        - Added a rough OTA API page under the debug menu as well.
        - Added a rough Vehicle Data page under the debug menu as well.
        - Lot's of fixes
    v1.2.1: 
        - Tweaked the way door status is handled.  Hopefully eliminating some errors and removing read door entries on 2-door vehicles.
        - Fixed some bugs in the debug menu
    v1.2.2: 
        - Added in a personal data scrubber to remove personal data from the data shown in the debug menu.  Cleans VIN, address, long & lat position.
    v1.2.3:
        - Added in a placeholder image for vehicles that don't have an image.
        - Fixed a bug for the using psi tire pressure and metric units.
        - Automatically determine measurement units like distance, pressure, and locale from your Ford account. This should allow support for users outside north america.
        - Added Light/Dark mode to ota and vehicle data pages.

**************/
const WIDGET_VERSION = '1.2.3 ';
const LATEST_VERSION = await getLatestScriptVersion();
const updateAvailable = isNewerVersion(WIDGET_VERSION, LATEST_VERSION);
console.log('Script Update Available: ' + updateAvailable);
//************************************************************************* */
//*                  Device Detail Functions
//************************************************************************* */
const screenSize = Device.screenResolution();
const screenType = screenSize.width < 1200 ? 'small' : 'default';
const usingDarkMode = Device.isUsingDarkAppearance();
const isPhone = Device.isPhone();
const isPad = Device.isPad();
// console.log('---------------DEVICE INFO ----------------');
// console.log(`OSDarkMode: ${usingDarkMode}`);
// console.log(`ScreenType: ${screenType}`);
// console.log(`ScreenSize: Width: ${screenSize.width} | Height: ${screenSize.height}`);
// console.log(`Device Info | Model: ${Device.model()} | OSVersion: ${Device.systemVersion()}`, Device.name());
// console.log(`Locale: ${Device.locale()} | Language: ${Device.language()}`);

//******************************************************************
//* Customize Widget Options
//******************************************************************
const widgetConfig = {
    debugMode: false, // ENABLES MORE LOGGING... ONLY Use it if you have problems with the widget!
    debugAuthMode: false, // ENABLES MORE LOGGING... ONLY Use it if you have problems with the widget!
    logVehicleData: false, // Logs the vehicle data to the console (Used to help end users easily debug their vehicle data and share with develop)
    refreshInterval: 5, // allow data to refresh every (xx) minutes
    largeWidget: false, // uses large widget layout, if false, medium layout is used
    alwaysFetch: true, // always fetch data from FordPass, even if it is not needed
    /**
     * Only use the options below if you are experiencing problems. Set them back to false once everything is working.
     * Otherwise the token and the pictures are newly fetched everytime the script is executed.
     */
    clearKeychainOnNextRun: false, // false or true
    clearFileManagerOnNextRun: false, // false or true
};
let fetchCnt = 0;
//******************************************************************
//* Edit these values to accomodate your langauge or prefrerences
//******************************************************************
const textValues = (str) => {
    return {
        elemHeaders: {
            fuelTank: 'Fuel',
            odometer: 'Mileage',
            oil: 'Oil Life',
            windows: 'Windows',
            doors: 'Doors',
            position: 'Location',
            tirePressure: `Tires (${str})`,
            lockStatus: 'Locks',
            lock: 'Lock',
            unlock: 'Unlock',
            ignitionStatus: 'Ignition',
            batteryStatus: 'Battery',
            evChargeStatus: 'Charger',
            remoteStart: 'Remote Start',
        },
        UIValues: {
            closed: 'Closed',
            open: 'Open',
            unknown: 'Unknown',
            greaterOneDay: '> 1 Day',
            smallerOneMinute: '< 1 Min Ago',
            minute: 'Minute',
            hour: 'Hour',
            perYear: 'p.a.',
            plural: 's', // 's' in english
            precedingAdverb: '', // used in german language, for english let it empty
            subsequentAdverb: 'ago', // used in english language ('ago'), for german let it empty
        },
        errorMessages: {
            invalidGrant: 'Incorrect Login Data',
            connectionErrorOrVin: 'Incorrect VIN Number',
            unknownError: 'Unknown Error',
            noMessages: 'No Messages',
            accessDenied: 'Access Denied',
            noData: 'No Data',
            noCredentials: 'Missing Login Credentials',
            noVin: 'VIN Missing',
            cmd_err_590: 'Command Failed!\n\nVehicle failed to start. You must start from inside your vehicle after two consecutive remote start events. ',
            cmd_err: `There was an error sending the command to the vehicle!\n`,
        },
        successMessages: {
            locks_cmd_title: 'Lock Command',
            locked_msg: 'Vehicle Received Lock Command Successfully',
            unlocked_msg: 'Vehicle Received Unlock Command Successfully',
            cmd_success: `Vehicle Received Command Successfully`,
        },
    };
};

//***************************************************************************
//* Customize the Appearance of widget elements when in dark or light mode
//***************************************************************************

const runtimeData = {
    textColor1: usingDarkMode ? 'EDEDED' : '000000', // Header Text Color
    textColor2: usingDarkMode ? 'EDEDED' : '000000', // Value Text Color
    backColor: usingDarkMode ? '111111' : 'FFFFFF', // Background Color'
    backColorGrad: usingDarkMode ? ['141414', '13233F'] : ['BCBBBB', 'DDDDDD'], // Background Color Gradient
    fuelIcon: usingDarkMode ? 'gas-station_dark.png' : 'gas-station_light.png', // Image for gas station
    lockStatus: usingDarkMode ? 'lock_dark.png' : 'lock_light.png', // Image Used for Lock Icon
    lockIcon: usingDarkMode ? 'lock_dark.png' : 'lock_light.png', // Image Used for Lock Icon
    tirePressure: usingDarkMode ? 'tire_dark.png' : 'tire_light.png', // Image for tire pressure
    unlockIcon: usingDarkMode ? 'unlock_dark.png' : 'unlock_light.png', // Image Used for UnLock Icon
    batteryStatus: usingDarkMode ? 'battery_dark.png' : 'battery_light.png', // Image Used for Battery Icon
    doors: usingDarkMode ? 'door_dark.png' : 'door_light.png', // Image Used for Door Lock Icon
    windows: usingDarkMode ? 'window_dark.png' : 'window_light.png', // Image Used for Window Icon
    oil: usingDarkMode ? 'oil_dark.png' : 'oil_light.png', // Image Used for Oil Icon
    ignitionStatus: usingDarkMode ? 'key_dark.png' : 'key_light.png', // Image Used for Ignition Icon
    keyIcon: usingDarkMode ? 'key_dark.png' : 'key_light.png', // Image Used for Key Icon
    position: usingDarkMode ? 'location_dark.png' : 'location_light.png', // Image Used for Location Icon
    evBatteryStatus: usingDarkMode ? 'ev_battery_dark.png' : 'ev_battery_light.png', // Image Used for EV Battery Icon
    evChargeStatus: usingDarkMode ? 'ev_plug_dark.png' : 'ev_plug_light.png', // Image Used for EV Plug Icon
};

const closedSymbol = '✓';
const openSymbol = '✗';

/*
 * Change titleFontSize to 9 and detailFontSizeMedium to 10 for smaller displays, e.g. iPhone SE 2
 */
const sizes = {
    default: {
        titleFontSize: 10,
        detailFontSizeSmall: 10,
        detailFontSizeMedium: 11,
        detailFontSizeBig: 19,
        barWidth: 80,
        barHeight: 10,
    },
    small: {
        titleFontSize: 9,
        detailFontSizeSmall: 8,
        detailFontSizeMedium: 9,
        detailFontSizeBig: 19,
        barWidth: 80,
        barHeight: 10,
    },
};

//******************************************************************************
//* Main Widget Code - ONLY make changes if you know what you are doing!!
//******************************************************************************

// console.log(`ScriptURL: ${URLScheme.forRunningScript()}`);
// console.log(`Script QueryParams: ${args.queryParameter}`);
// console.log(`Script WidgetParams: ${args.widgetParameter}`);
// let chkKcMigrated = await performKeychainMigration();
let widget = await createWidget();
if (widget === null) {
    return;
}
widget.setPadding(10, 5, 5, 5);

if (config.runsInWidget) {
    Script.setWidget(widget);
}
// Show alert with current data (if running script in app)
else if (config.runsInApp || config.runsFromHomeScreen) {
    if (args.shortcutParameter) {
        await showAlert('shortcutParameter: ', JSON.stringify(args.shortcutParameter));
        // Create a parser function...
    } else {
        createMainMenu();
    }
} else if (config.runsWithSiri || config.runsInActionExtension) {
    // console.log('runsWithSiri: ' + config.runsWithSiri);
    // console.log('runsInActionExtension: ' + config.runsInActionExtension);
} else {
    if (widgetConfig.largeWidget) {
        await widget.presentLarge();
    } else {
        await widget.presentMedium();
    }
}
Script.complete();

//*****************************************************************************************************************************
//*                                              START WIDGET UI ELEMENT FUNCTIONS
//*****************************************************************************************************************************

async function getMainMenuItems() {
    const vehicleData = await fetchVehicleData(true);
    const caps = vehicleData.capabilities && vehicleData.capabilities.length ? vehicleData.capabilities : undefined;
    return [{
            title: `New Script Available: (v${LATEST_VERSION})`,
            action: async() => {
                console.log('(Main Menu) New Version was pressed');
                createMainMenu();
            },
            destructive: true,
            show: updateAvailable,
        },
        {
            title: 'View Widget',
            action: async() => {
                console.log('(Main Menu) View Widget was pressed');
                if (widgetConfig.largeWidget) {
                    await widget.presentLarge();
                } else {
                    await widget.presentMedium();
                }
            },
            destructive: false,
            show: true,
        },
        {
            title: 'View Info',
            action: async() => {
                console.log('(Main Menu) View Info was pressed');
                await subControlMenu('advancedInfo');
            },
            destructive: false,
            show: false,
        },
        {
            title: 'Lock Vehicle',
            action: async() => {
                console.log('(Main Menu) Lock was pressed');
                await sendVehicleCmd('lock');
            },
            destructive: false,
            show: true,
        },
        {
            title: 'Unlock Vehicle',
            action: async() => {
                console.log('(Main Menu) Unlock was pressed');
                await sendVehicleCmd('unlock');
            },
            destructive: true,
            show: true,
        },
        {
            title: 'Remote Start (Stop)',
            action: async() => {
                console.log('(Main Menu) Stop was pressed');
                await sendVehicleCmd('stop');
            },
            destructive: false,
            show: true,
        },
        {
            title: 'Remote Start (Run)',
            action: async() => {
                console.log('(Main Menu) Start was pressed');
                await sendVehicleCmd('start');
            },
            destructive: true,
            show: true,
        },
        {
            title: 'Force Refresh',
            action: async() => {
                console.log('(Main Menu) Refresh was pressed');
                await sendVehicleCmd('status');
            },
            destructive: false,
            show: true,
        },
        {
            title: 'Advanced Controls',
            action: async() => {
                console.log('(Main Menu) Advanced Control was pressed');
                await subControlMenu('advancedControl');
            },
            destructive: false,
            show: caps && caps.length && (caps.includes('ZONE_LIGHTING_FOUR_ZONES') || caps.includes('ZONE_LIGHTING_TWO_ZONES') || caps.includes('GUARD_MODE') || caps.includes('TRAILER_LIGHT')),
        },
        {
            title: 'Widget Settings',
            action: async() => {
                console.log('(Main Menu) Widget Settings was pressed');
                createSettingMenu();
            },
            destructive: false,
            show: true,
        },
        {
            title: 'Exit',
            action: async() => {
                console.log('(Main Menu) Exit was pressed');
            },
            destructive: false,
            show: true,
        },
    ];
}

async function subControlMenu(type) {
    const vehicleData = await fetchVehicleData(true);
    const caps = vehicleData.capabilities && vehicleData.capabilities.length ? vehicleData.capabilities : undefined;
    let title = '';
    let items = [];
    let message = '';
    switch (type) {
        case 'advancedControl':
            title = 'Advanced Controls';
            items = [{
                    title: 'ZoneLighting Control',
                    action: async() => {
                        console.log('(Advanced Controls Menu) Zone Lighting was pressed');
                        await subControlMenu('zoneLighting');
                    },
                    destructive: false,
                    show: caps && caps.length && (caps.includes('ZONE_LIGHTING_FOUR_ZONES') || caps.includes('ZONE_LIGHTING_TWO_ZONES')),
                },
                {
                    title: 'SecuriAlert Control',
                    action: async() => {
                        console.log('(Advanced Controls Menu) SecuriAlert was pressed');
                        await subControlMenu('securiAlert');
                    },
                    destructive: false,
                    show: caps && caps.length && caps.includes('GUARD_MODE'),
                },
                {
                    title: 'Trailer Lighting Check Control',
                    action: async() => {
                        console.log('(Advanced Controls Menu) Trailer Light Check was pressed');
                        await subControlMenu('trailerLightCheck');
                    },
                    destructive: false,
                    show: caps && caps.length && caps.includes('TRAILER_LIGHT'),
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(Advanced Controls Menu) Back was pressed');
                        createMainMenu();
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
        case 'debugMenu':
            title = 'Debug Menu';
            items = [{
                    title: 'Copy Vehicle Data to Clipboard',
                    action: async() => {
                        console.log('(Debug Menu) Copy Data was pressed');
                        let data = await fetchVehicleData(true);
                        data = scrubPersonalData(data);
                        await Pasteboard.copyString(JSON.stringify(data, null, 4));
                        await showAlert('Debug Menu', 'Vehicle Data Copied to Clipboard');
                        subControlMenu('debugMenu');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'View OTA API Info',
                    action: async() => {
                        console.log('(Debug Menu) OTA Info was pressed');
                        let data = await getVehicleOtaInfo();
                        await showDataWebView('OTA Info Page', 'OTA Vehicle Info', data);
                        await subControlMenu('debugMenu');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'View Vehicle Data Output',
                    action: async() => {
                        console.log('(Debug Menu) Vehicle Data was pressed');
                        let data = await fetchVehicleData(true);
                        data.ota = await getVehicleOtaInfo();
                        await showDataWebView('Vehicle Data Output', 'Vehicle Data', data);
                        await subControlMenu('debugMenu');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(Debug Menu) Back was pressed');
                        createMainMenu();
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
        case 'advancedInfo':
            title = 'Advanced Info';
            items = [{
                    title: `SecuriAlert Status: ${(await getSecuriAlertStatus()) === 'enable' ? 'Enabled' : 'Disabled'}`,
                    action: async() => {
                        console.log('(Advanced Controls Menu) Zone Lighting was pressed');
                        subControlMenu('advancedInfo');
                    },
                    destructive: false,
                    show: caps && caps.length && caps.includes('GUARD_MODE'),
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(Advanced Controls Menu) Back was pressed');
                        createMainMenu();
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
        case 'zoneLighting':
            title = 'Zone Lighting Control';
            message = '';
            items = [{
                    title: 'Turn On All ZoneLighting',
                    action: async() => {
                        console.log('(Zone Lighting Menu) On was pressed');
                        await sendVehicleCmd('zone_lights_on');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'Turn Off All ZoneLighting',
                    action: async() => {
                        console.log('(Zone Lighting Menu) Off was pressed');
                        await sendVehicleCmd('zone_lights_off');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(Zone Lighting Menu) Back was pressed');
                        subControlMenu('advancedControl');
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
        case 'securiAlert':
            title = 'SecuriAlert Control';
            message = '';
            items = [{
                    title: 'Disable SecuriAlert',
                    action: async() => {
                        console.log('(SecuriAlert Menu) Off was pressed');
                        await sendVehicleCmd('guard_mode_off');
                    },
                    destructive: true,
                    show: true,
                },
                {
                    title: 'Enable SecuriAlert',
                    action: async() => {
                        console.log('(SecuriAlert Menu) On was pressed');
                        await sendVehicleCmd('guard_mode_on');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(SecuriAlert Menu) Back was pressed');
                        subControlMenu('advancedControl');
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
        case 'trailerLightCheck':
            title = 'Trailer Lighting Check Control';
            message = '';
            items = [{
                    title: 'Turn On Trailer Light Check',
                    action: async() => {
                        console.log('(Trailer Lighting Menu) On was pressed');
                        await sendVehicleCmd('trailer_light_check_on');
                    },
                    destructive: true,
                    show: true,
                },
                {
                    title: 'Turn Off Trailer Light Check',
                    action: async() => {
                        console.log('(Trailer Lighting Menu) Off was pressed');
                        await sendVehicleCmd('trailer_light_check_off');
                    },
                    destructive: false,
                    show: true,
                },
                {
                    title: 'Back',
                    action: async() => {
                        console.log('(Trailer Lighting Menu) Back was pressed');
                        subControlMenu('advancedControl');
                    },
                    destructive: false,
                    show: true,
                },
            ];
            break;
    }
    if (title.length > 0 && items.length > 0) {
        let menuItems = items.filter((item) => item.show === true);
        const subMenu = new Alert();
        subMenu.title = title;
        subMenu.message = message;
        menuItems.forEach((item, ind) => {
            if (item.destructive) {
                subMenu.addDestructiveAction(item.title);
            } else {
                subMenu.addAction(item.title);
            }
        });
        const respInd = await subMenu.presentSheet();
        if (respInd !== null) {
            const menuItem = items[respInd];
            // console.log(`(Sub Control Menu) Selected: ${JSON.stringify(menuItem)}`);
            menuItem.action();
        }
    }
}

async function showDataWebView(title, heading, data) {
    // console.log(`showDataWebView(${title}, ${heading}, ${data})`);
    data = scrubPersonalData(data);
    console.log('showDataWebView() | DarkMode: ' + Device.isUsingDarkAppearance());
    const bgColor = usingDarkMode ? '#242424' : 'white';
    const fontColor = usingDarkMode ? '#ffffff' : '#242425';
    const wv = new WebView();
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0;"/>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
            <link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.10.1/mdb.min.css" rel="stylesheet"/>
            <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/default.min.css">
            
            <title>${title}</title>
            <style>
                body { font-family: -apple-system; background-color: ${bgColor}; color: ${fontColor}; }
            </style>
            
        </head>
        
        <body>
            <div class="mx-2"><h3>${heading}</h3></div>
            <div class="ml-3" id="wrapper">
                <pre>${JSON.stringify(data, null, 4)}</pre>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.10.1/mdb.min.js"></script>
        </body>
        
        </html>  
    `;
    await wv.loadHTML(html);
    await wv.waitForLoad();
    // let result = await wv.evaluateJavaScript(`hljs.highlightAll();`, true);
    await wv.present(true);
}

function scrubPersonalData(data) {
    function scrubInfo(obj, id) {
        function scrub(type, str) {
            switch (type) {
                case 'vin':
                    return str.substring(0, str.length - 6) + 'XXXXXX';
                case 'position':
                    return '1234 Someplace Drive';
                case 'latitude':
                    return 42.123456;
                case 'longitude':
                    return -89.123456;
            }
        }
        Object.keys(obj).forEach((key) => {
            if (key === id) {
                obj[key] = scrub(id, obj[key]);
            } else if (obj[key] !== null && typeof obj[key] === 'object') {
                scrubInfo(obj[key], id);
            }
        });
        return obj;
    }

    let out = scrubInfo(data, 'vin');
    out = scrubInfo(data, 'position');
    out = scrubInfo(data, 'latitude');
    out = scrubInfo(data, 'longitude');
    return out;
}

async function createMainMenu() {
    const mainMenu = new Alert();
    mainMenu.title = `FordPass Actions`;

    let menuItems = (await getMainMenuItems()).filter((item) => item.show === true);
    // console.log(`Menu Items: (${menuItems.length}) ${JSON.stringify(menuItems)}`);
    menuItems.forEach((item, ind) => {
        if (item.destructive) {
            mainMenu.addDestructiveAction(item.title);
        } else {
            mainMenu.addAction(item.title);
        }
    });
    const respInd = await mainMenu.presentSheet();
    if (respInd !== null) {
        const menuItem = menuItems[respInd];
        // console.log(`(Main Menu) Selected: ${JSON.stringify(menuItem)}`);
        menuItem.action();
    }
}

async function createSettingMenu() {
    const settingMenu = new Alert();
    settingMenu.title = `FordPass Widget Settings`;
    // settingMenu.message = 'These settings allow you to configure FordPass Widget.';

    settingMenu.addAction(`Widget Version: ${WIDGET_VERSION}`); //0
    let useMetric = await useMetricUnits();
    settingMenu.addAction(`Measurement Units: ${useMetric ? 'Metric' : 'Imperial'}`); //1

    let pressureUnits = await getKeychainValue('fpPressureUnits');
    settingMenu.addAction(`Pressure Units: ${pressureUnits}`); //2

    let mapProvider = await getMapProvider();
    settingMenu.addAction(`Map Provider: ${mapProvider === 'apple' ? 'Apple' : 'Google'}`); //3

    settingMenu.addAction('Debug Menu'); //4

    settingMenu.addDestructiveAction('Clear All Saved Data'); //5

    settingMenu.addAction('Back'); //6

    const respInd = await settingMenu.presentSheet();

    switch (respInd) {
        case 0:
            console.log('(Setting Menu) Widget Version was pressed');
            createSettingMenu();
            break;
        case 1:
            console.log('(Setting Menu) Measurement Units pressed');
            // await toggleUseMetricUnits();
            createSettingMenu();
            break;
        case 2:
            console.log('(Setting Menu) Pressure Units pressed');
            // await toggleUsePsiUnits();
            createSettingMenu();
            break;
        case 3:
            console.log('(Setting Menu) Map Provider pressed');
            await toggleMapProvider();
            createSettingMenu();
            break;
        case 4:
            console.log('(Setting Menu) Debug Menu pressed');
            subControlMenu('debugMenu');
            break;
        case 5:
            console.log('(Setting Menu) Clear All Data was pressed');
            await clearKeychain();
            await clearFileManager();
            // createSettingMenu();
            break;
        case 6:
            console.log('(Setting Menu) Back was pressed');
            createMainMenu();
            break;
    }
}

function inputTest(val) {
    return val !== '' && val !== null && val !== undefined;
}

async function requiredPrefsMenu() {
    try {
        let user = await getKeychainValue('fpUser');
        let pass = await getKeychainValue('fpPass');
        let vin = await getKeychainValue('fpVin');
        // let useMetric = await useMetricUnits();
        // let psi = await usePsiUnit();
        let mapProvider = await getMapProvider();

        let prefsMenu = new Alert();
        prefsMenu.title = 'Required Settings Missing';
        prefsMenu.message = 'Please enter you FordPass Credentials and Vehicle VIN.\n\nTap a setting to toggle change\nPress Done to Save.';

        prefsMenu.addTextField('FordPass Email', user || '');
        prefsMenu.addSecureTextField('FordPass Password', pass || '');
        prefsMenu.addTextField('Vehicle VIN', vin || '');

        prefsMenu.addAction(`Map Provider: ${mapProvider === 'apple' ? 'Apple' : 'Google'}`); //0

        prefsMenu.addAction('Save'); //1
        prefsMenu.addCancelAction('Cancel'); //2

        let respInd = await prefsMenu.presentAlert();
        switch (respInd) {
            case 0:
                console.log('(Config Menu) Map Provider pressed');
                await toggleMapProvider();
                requiredPrefsMenu();
                break;
            case 1:
                console.log('(Config Menu) Done was pressed');
                user = prefsMenu.textFieldValue(0);
                pass = prefsMenu.textFieldValue(1);
                vin = prefsMenu.textFieldValue(2);
                // console.log(`${user} ${pass} ${vin}`);
                if (inputTest(user) && inputTest(pass) && inputTest(vin)) {
                    await setKeychainValue('fpUser', user);
                    await setKeychainValue('fpPass', pass);
                    await setKeychainValue('fpVin', vin);
                    // console.log(`metric: ${useMetric ? 'true' : 'false'} | map: ${mapProvider}`);
                    await setKeychainValue('fpMapProvider', mapProvider);
                    return true;
                } else {
                    requiredPrefsMenu();
                }
                break;
            case 2:
                return false;
        }
    } catch (err) {
        console.log(`(Required Prefs Menu) Error: ${err}`);
        throw err;
    }
}

async function createWidget() {
    if (widgetConfig.clearKeychainOnNextRun) {
        await clearKeychain();
    }
    if (widgetConfig.clearFileManagerOnNextRun) {
        await clearFileManager();
    }
    let reqOk = await requiredPrefsOk();
    // console.log(`reqOk: ${ukcOk}`);
    if (!reqOk) {
        let prompt = await requiredPrefsMenu();
        if (!prompt) {
            console.log('Login, VIN, or Prefs not set... User cancelled!!!');
            return null;
        } else {
            await setUserPrefs();
        }
    }

    let vehicleData = await fetchVehicleData();
    // console.log(`vehicleData: ${JSON.stringify(vehicleData)}`);
    // Defines the Widget Object
    const widgetSize = config.widgetFamily;
    console.log('Widget Size: ' + widgetSize);
    const widget = new ListWidget();
    widget.backgroundGradient = getBgGradient();

    let mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.setPadding(0, 5, 0, 5);

    let contentStack = mainStack.addStack();
    contentStack.layoutHorizontally();

    //*****************
    //* First column
    //*****************
    let mainCol1 = await createColumn(contentStack, { '*setPadding': [0, 0, 0, 0] });

    // Vehicle Logo
    let vehicleLogoRow = await createRow(mainCol1, { '*centerAlignContent': null });
    let vehicleLogo = vehicleData.info !== undefined && vehicleData.info.vehicle !== undefined ? await createImage(vehicleLogoRow, await getVehicleImage(vehicleData.info.vehicle.modelYear), { imageSize: new Size(85, 45), '*centerAlignImage': null }) : null;
    mainCol1.addSpacer(0);

    // Creates the Fuel Info Elements
    await createFuelBattElement(mainCol1, vehicleData);

    // Creates the Mileage Info Elements
    await createMileageElement(mainCol1, vehicleData);

    // Creates Battery Level Elements
    await createBatteryElement(mainCol1, vehicleData);

    // Creates Oil Life Elements
    if (!vehicleData.evVehicle) {
        await createOilElement(mainCol1, vehicleData);
    } else {
        // Creates EV Plug Elements
        await createEvChargeElement(mainCol1, vehicleData);
    }

    contentStack.addSpacer();

    //*****************************
    //* Large Card Column 1 Row 1
    //*****************************
    if (widgetConfig.largeWidget) {
        mainCol1.addSpacer(40);

        // Element 7
    }

    //************************
    //* Second column
    //************************
    let mainCol2 = await createColumn(contentStack, { '*setPadding': [0, 0, 0, 0] });

    // Creates the Lock Status Elements
    await createLockStatusElement(mainCol2, vehicleData);

    // Creates the Door Status Elements
    await createDoorElement(mainCol2, vehicleData);

    // Create Tire Pressure Elements
    await createTireElement(mainCol2, vehicleData);

    mainCol2.addSpacer(0);

    //*****************************
    //* Large Card Column 2 Row 1
    //*****************************
    if (widgetConfig.largeWidget) {
        // Element 11
    }

    contentStack.addSpacer();

    //****************
    //* Third column
    //****************
    let mainCol3 = await createColumn(contentStack, { '*setPadding': [0, 0, 0, 0] });

    // Creates the Ignition Status Elements
    await createIgnitionStatusElement(mainCol3, vehicleData);

    // Creates the Door Status Elements
    await createWindowElement(mainCol3, vehicleData);

    // Creates the Vehicle Location Element
    await createPositionElement(mainCol3, vehicleData);

    mainCol3.addSpacer();

    contentStack.addSpacer();

    //**********************
    //* Refresh and error
    //*********************
    let infoStack = await createRow(mainStack, { '*layoutHorizontally': null });

    // Creates the Refresh Label to show when the data was last updated from Ford
    let refreshTime = vehicleData.fetchTime ? calculateTimeDifference(vehicleData.fetchTime) : textValues().UIValues.unknown;
    let refreshLabel = await createText(infoStack, refreshTime, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.lightGray() });
    if (updateAvailable) {
        infoStack.addSpacer(10);
        await createText(infoStack, `New Version Available: v${LATEST_VERSION}`, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.orange() });
    }
    if (!vehicleData.evVehicle && vehicleData.batteryStatus === 'STATUS_LOW') {
        infoStack.addSpacer(10);
        await createText(infoStack, `12V Battery Low`, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.red() });
    }

    if (vehicleData.deepSleepMode) {
        infoStack.addSpacer(10);
        await createText(infoStack, `Deep Sleep Mode Active`, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.red() });
    }

    if (vehicleData.firmwareUpdating) {
        infoStack.addSpacer(10);
        await createText(infoStack, `Firmware Updating`, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.orange() });
    }

    // Creates Elements to display any errors in red at the bottom of the widget
    if (vehicleData.error) {
        infoStack.addSpacer(10);
        let errorMsg = vehicleData.error ? 'Error: ' + vehicleData.error : '';
        let errorLabel = await createText(infoStack, errorMsg, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeSmall), textColor: Color.red() });
    }

    return widget;
}

function getBgGradient() {
    let grad = new LinearGradient();
    grad.locations = [0, 1];
    grad.colors = [new Color(runtimeData.backColorGrad[0]), new Color(runtimeData.backColorGrad[1])];
    return grad;
}

async function createColumn(srcField, styles = {}) {
    let col = srcField.addStack();
    col.layoutVertically();
    if (styles && Object.keys(styles).length > 0) {
        _mapMethodsAndCall(col, styles);
    }

    return col;
}

async function createRow(srcField, styles = {}) {
    let row = srcField.addStack();
    row.layoutHorizontally();
    if (styles && Object.keys(styles).length > 0) {
        _mapMethodsAndCall(row, styles);
    }

    return row;
}

async function createText(srcField, text, styles = {}) {
    let txt = srcField.addText(text);
    if (styles && Object.keys(styles).length > 0) {
        _mapMethodsAndCall(txt, styles);
    }
    return txt;
}

async function createImage(srcField, image, styles = {}) {
    let _img = srcField.addImage(image);
    if (styles && Object.keys(styles).length > 0) {
        _mapMethodsAndCall(_img, styles);
    }
    return _img;
}

async function createTitle(headerField, element, icon = undefined) {
    let ico = icon || runtimeData[element];
    if (ico !== undefined) {
        headerField.layoutHorizontally();
        let imgFile = await getImage(ico.toString());
        let titleImg = await createImage(headerField, imgFile, { imageSize: new Size(11, 11) });
        headerField.addSpacer(2);
    }
    let titleParams = element.split('||');
    //     console.log(`titleParams(${element}): ${titleParams}`);
    let title = titleParams.length > 1 ? textValues(titleParams[1]).elemHeaders[titleParams[0]] : textValues().elemHeaders[titleParams[0]];
    let txt = await createText(headerField, title + ':', { font: Font.boldSystemFont(sizes[screenType].titleFontSize), textColor: new Color(runtimeData.textColor1) });
    // return headerField;
}

async function createProgressBar(percent) {
    let fuelLevel = percent > 100 ? 100 : percent;
    const bar = new DrawContext();
    bar.size = new Size(sizes[screenType].barWidth, sizes[screenType].barHeight + 3);
    bar.opaque = false;
    bar.respectScreenScale = true;
    // Background
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, sizes[screenType].barWidth, sizes[screenType].barHeight), 3, 2);
    bar.addPath(path);
    bar.setFillColor(Color.lightGray());
    bar.fillPath();
    // Fuel
    const fuel = new Path();
    fuel.addRoundedRect(new Rect(0, 0, (sizes[screenType].barWidth * fuelLevel) / 100, sizes[screenType].barHeight), 3, 2);
    bar.addPath(fuel);
    bar.setFillColor(new Color('2f78dd'));
    bar.fillPath();
    const fuel25Indicator = new Path();
    fuel25Indicator.addRoundedRect(new Rect(sizes[screenType].barWidth * 0.25, 1, 2, sizes[screenType].barHeight - 2), 3, 2);
    bar.addPath(fuel25Indicator);
    bar.setFillColor(Color.black());
    bar.fillPath();
    const fuel50Indicator = new Path();
    fuel50Indicator.addRoundedRect(new Rect(sizes[screenType].barWidth * 0.5, 1, 2, sizes[screenType].barHeight - 2), 3, 2);
    bar.addPath(fuel50Indicator);
    bar.setFillColor(Color.black());
    bar.fillPath();
    const fuel75Indicator = new Path();
    fuel75Indicator.addRoundedRect(new Rect(sizes[screenType].barWidth * 0.75, 1, 2, sizes[screenType].barHeight - 2), 3, 2);
    bar.addPath(fuel75Indicator);
    bar.setFillColor(Color.black());
    bar.fillPath();
    return await bar.getImage();
}

async function createFuelBattElement(srcField, vehicleData) {
    const isEV = vehicleData.evVehicle === true;
    let lvlValue = !isEV ? (vehicleData.fuelLevel ? vehicleData.fuelLevel : 0) : vehicleData.evBatteryLevel ? vehicleData.evBatteryLevel : 0;
    let dteValue = !isEV ? (vehicleData.distanceToEmpty ? vehicleData.distanceToEmpty : null) : vehicleData.evDistanceToEmpty ? vehicleData.evDistanceToEmpty : null;
    let dtePostfix = isEV ? 'Range' : 'to E';
    // console.log('isEV: ' + isEV);
    // console.log(`fuelLevel: ${vehicleData.fuelLevel}`);
    // console.log(`distanceToEmpty: ${vehicleData.distanceToEmpty}`);
    // console.log(`evBatteryLevel: ${vehicleData.evBatteryLevel}`);
    // console.log('evDistanceToEmpty: ' + vehicleData.evDistanceToEmpty);
    // console.log(`lvlValue: ${lvlValue}`);
    // console.log(`dteValue: ${dteValue}`);

    // Fuel tank header
    let fuelHeaderRow = await createRow(srcField);
    let fuelHeadericon = await createImage(fuelHeaderRow, await getImage(isEV ? runtimeData.evBatteryStatus : runtimeData.fuelIcon), { imageSize: new Size(11, 11) });
    fuelHeaderRow.addSpacer(3);
    // console.log(`fuelLevel: ${vehicleData.fuelLevel}`);

    let lvlTxt = lvlValue ? (lvlValue > 100 ? 100 : lvlValue) : 50;
    let fuelHeadertext = await createText(fuelHeaderRow, textValues().elemHeaders[isEV ? 'batteryStatus' : 'fuelTank'], { font: Font.boldSystemFont(sizes[screenType].titleFontSize), textColor: new Color(runtimeData.textColor1) });
    let fuelHeadertext2 = await createText(fuelHeaderRow, ' (' + lvlTxt + '%):', { font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: new Color(runtimeData.textColor1) });
    srcField.addSpacer(3);

    // Fuel Level Bar
    let fuelBarCol = await createColumn(srcField, { '*setPadding': [0, 0, 0, 0], '*centerAlignContent': null });
    let fuelBarRow = await createRow(fuelBarCol, { '*setPadding': [0, 0, 0, 0] });
    let fuelBarImg = await createImage(fuelBarRow, await createProgressBar(lvlValue ? lvlValue : 50), { '*centerAlignImage': null, imageSize: new Size(sizes[screenType].barWidth, sizes[screenType].barHeight + 3) });

    // Fuel Distance to Empty
    let fuelBarTextRow = await createRow(fuelBarCol, { '*centerAlignContent': null, '*topAlignContent': null });
    let distanceMultiplier = (await useMetricUnits()) ? 1 : 0.621371; // distance multiplier
    let unitOfLength = (await useMetricUnits()) ? 'km' : 'mi'; // unit of length
    let dteInfo = dteValue ? `    ${Math.round(dteValue * distanceMultiplier)}${unitOfLength} ${dtePostfix}` : textValues().errorMessages.noData;
    let fuelDteRowTxt = await createText(fuelBarTextRow, dteInfo, { '*centerAlignText': null, font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: new Color(runtimeData.textColor2), lineLimit: 1 });

    srcField.addSpacer(3);
}

async function createMileageElement(srcField, vehicleData) {
    let elem = await createRow(srcField, { '*layoutHorizontally': null });
    await createTitle(elem, 'odometer');
    elem.addSpacer(2);
    let distanceMultiplier = (await useMetricUnits()) ? 1 : 0.621371; // distance multiplier
    let unitOfLength = (await useMetricUnits()) ? 'km' : 'mi'; // unit of length
    let value = vehicleData.odometer ? `${Math.round(vehicleData.odometer * distanceMultiplier)}${unitOfLength}` : textValues().errorMessages.noData;
    // console.log(`odometer: ${value}`);
    let txt = await createText(elem, value, { font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: new Color(runtimeData.textColor2) });
    srcField.addSpacer(3);
}

async function createBatteryElement(srcField, vehicleData) {
    let elem = await createRow(srcField, { '*layoutHorizontally': null });
    await createTitle(elem, 'batteryStatus');
    elem.addSpacer(2);
    let value = vehicleData.batteryLevel ? `${vehicleData.batteryLevel}V` : 'N/A';
    // console.log(`batteryLevel: ${value}`);
    let lowBattery = vehicleData.batteryStatus === 'STATUS_LOW' ? true : false;
    let txt = await createText(elem, value, { font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: lowBattery ? Color.red() : new Color(runtimeData.textColor2) });
    srcField.addSpacer(3);
}

async function createOilElement(srcField, vehicleData) {
    let elem = await createRow(srcField, { '*layoutHorizontally': null });
    await createTitle(elem, 'oil');
    elem.addSpacer(2);
    let value = vehicleData.oilLife ? `${vehicleData.oilLife}%` : textValues().errorMessages.noData;
    // console.log(`oilLife: ${value}`);
    let txt = await createText(elem, value, { font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: new Color(runtimeData.textColor2) });
    srcField.addSpacer(3);
}

async function createEvChargeElement(srcField, vehicleData) {
    let elem = await createRow(srcField, { '*layoutHorizontally': null });
    await createTitle(elem, 'evChargeStatus');
    elem.addSpacer(2);
    let value = vehicleData.evChargeStatus ? `${vehicleData.evChargeStatus}` : textValues().errorMessages.noData;
    // console.log(`oilLife: ${value}`);
    let txt = await createText(elem, value, { font: Font.regularSystemFont(sizes[screenType].detailFontSizeSmall), textColor: new Color(runtimeData.textColor2) });
    srcField.addSpacer(3);
}

async function createDoorElement(srcField, vehicleData, countOnly = false) {
    const styles = {
        normTxt: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color(runtimeData.textColor2) },
        statOpen: { font: Font.heavySystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('FF5733') },
        statClosed: { font: Font.heavySystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#5A65C0') },
        offset: 10,
    };

    let offset = styles.offset;
    let titleFld = await createRow(srcField);
    await createTitle(titleFld, 'doors');

    // Creates the first row of status elements for LF and RF
    let dataRow1Fld = await createRow(srcField);

    if (countOnly) {
        let value = textValues().errorMessages.noData;
        let countOpenDoors;
        if (vehicleData.statusDoors) {
            countOpenDoors = Object.values(vehicleData.statusDoors).filter((door) => door === true).length;
            value = countOpenDoors == 0 ? textValues().UIValues.closed : `${countOpenDoors} ${textValues().UIValues.open}`;
        }
        let cntOpenTxt = await createText(dataRow1Fld, value, styles.normTxt);
    } else {
        let row1LfTxt1 = await createText(dataRow1Fld, 'LF (', styles.normTxt);
        let row1LfStatTxt = await createText(dataRow1Fld, vehicleData.statusDoors['leftFront'] ? openSymbol : closedSymbol, vehicleData.statusDoors['leftFront'] ? styles.statOpen : styles.statClosed);
        let row1LfTxt2 = await createText(dataRow1Fld, ')' + ' | ', styles.normTxt);
        let row1RfTxt1 = await createText(dataRow1Fld, 'RF (', styles.normTxt);
        let row1RfStatTxt = await createText(dataRow1Fld, vehicleData.statusDoors['rightFront'] ? openSymbol : closedSymbol, vehicleData.statusDoors['rightFront'] ? styles.statOpen : styles.statClosed);
        let row1RfTxt2 = await createText(dataRow1Fld, ')', styles.normTxt);

        // Creates the second row of status elements for LR and RR
        if (vehicleData.statusDoors.leftRear !== undefined && vehicleData.statusDoors.rightRear !== undefined) {
            let dataRow2Fld = await createRow(srcField);
            let row2RfTxt1 = await createText(dataRow2Fld, 'LR (', styles.normTxt);
            let row2RfStatTxt = await createText(dataRow2Fld, vehicleData.statusDoors['leftRear'] ? openSymbol : closedSymbol, vehicleData.statusDoors['leftRear'] ? styles.statOpen : styles.statClosed);
            let row2RfTxt2 = await createText(dataRow2Fld, ')' + ' | ', styles.normTxt);
            let row2RrTxt1 = await createText(dataRow2Fld, 'RR (', styles.normTxt);
            let row2RrStatTxt = await createText(dataRow2Fld, vehicleData.statusDoors['rightRear'] ? openSymbol : closedSymbol, vehicleData.statusDoors['rightRear'] ? styles.statOpen : styles.statClosed);
            let row2RrTxt2 = await createText(dataRow2Fld, ')', styles.normTxt);
        }

        // Creates the third row of status elements for the tailgate (if equipped)
        if (vehicleData.statusDoors['tailgate'] !== undefined) {
            let dataRow3Fld = await createRow(srcField);
            let row3TgTxt1 = await createText(dataRow3Fld, `${vehicleData.statusDoors['hood'] ? '' : '       '}TG (`, styles.normTxt);
            let row3TgStatTxt = await createText(dataRow3Fld, vehicleData.statusDoors['tailgate'] ? openSymbol : closedSymbol, vehicleData.statusDoors['tailgate'] ? styles.statOpen : styles.statClosed);
            let row3TgTxt2 = await createText(dataRow3Fld, ')', styles.normTxt);
            // Adds hood (frunk) status to third row
            if (vehicleData.statusDoors['hood'] !== undefined) {
                let row3HdTxt1 = await createText(dataRow3Fld, ' | HD (', styles.normTxt);
                let row3HdStatTxt = await createText(dataRow3Fld, vehicleData.statusDoors['hood'] ? openSymbol : closedSymbol, vehicleData.statusDoors['hood'] ? styles.statOpen : styles.statClosed);
                let row3HdTxt2 = await createText(dataRow3Fld, ')', styles.normTxt);
            } else {
                offset = offset - 5;
            }
        }
    }
    srcField.addSpacer(offset);
}

async function createWindowElement(srcField, vehicleData, countOnly = false) {
    const styles = {
        normTxt: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color(runtimeData.textColor2) },
        statOpen: { font: Font.heavySystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('FF5733') },
        statClosed: { font: Font.heavySystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#5A65C0') },
        offset: 10,
    };

    let offset = styles.offset;
    let titleFld = await createRow(srcField);
    await createTitle(titleFld, 'windows');

    // Creates the first row of status elements for LF and RF
    let dataRow1Fld = await createRow(srcField);
    if (countOnly) {
        let value = textValues().errorMessages.noData;
        let countOpenWindows;
        if (vehicleData.statusWindows) {
            countOpenWindows = Object.values(vehicleData.statusWindows).filter((window) => window === true).length;
            value = countOpenWindows == 0 ? textValues().UIValues.closed : `${countOpenWindows} ${textValues().UIValues.open}`;
        }
        let cntOpenTxt = await createText(dataRow1Fld, value, styles.normTxt);
    } else {
        let row1LfTxt1 = await createText(dataRow1Fld, 'LF (', styles.normTxt);
        let row1LfStatTxt = await createText(dataRow1Fld, vehicleData.statusWindows['leftFront'] ? openSymbol : closedSymbol, vehicleData.statusWindows['leftFront'] ? styles.statOpen : styles.statClosed);
        let row1LfTxt2 = await createText(dataRow1Fld, ')' + ' | ', styles.normTxt);
        let row1RfTxt1 = await createText(dataRow1Fld, 'RF (', styles.normTxt);
        let row1RfStatTxt = await createText(dataRow1Fld, vehicleData.statusWindows['rightFront'] ? openSymbol : closedSymbol, vehicleData.statusWindows['rightFront'] ? styles.statOpen : styles.statClosed);
        let row1RfTxt2 = await createText(dataRow1Fld, ')', styles.normTxt);

        // Creates the second row of status elements for LR and RR
        let dataRow2Fld = await createRow(srcField);
        let row2RfTxt1 = await createText(dataRow2Fld, 'LR (', styles.normTxt);
        let row2RfStatTxt = await createText(dataRow2Fld, vehicleData.statusWindows['leftRear'] ? openSymbol : closedSymbol, vehicleData.statusWindows['leftRear'] ? styles.statOpen : styles.statClosed);
        let row2RfTxt2 = await createText(dataRow2Fld, ')' + ' | ', styles.normTxt);
        let row2RrTxt1 = await createText(dataRow2Fld, 'RR (', styles.normTxt);
        let row2RrStatTxt = await createText(dataRow2Fld, vehicleData.statusWindows['rightRear'] ? openSymbol : closedSymbol, vehicleData.statusWindows['rightRear'] ? styles.statOpen : styles.statClosed);
        let row2RrTxt2 = await createText(dataRow2Fld, ')', styles.normTxt);

        if (vehicleData.statusDoors['tailgate'] !== undefined) {
            offset = offset + 10;
        }
    }
    srcField.addSpacer(offset);
}

async function createTireElement(srcField, vehicleData) {
    let offset = 0;
    let titleFld = await createRow(srcField);
    let pressureUnits = await getKeychainValue('fpPressureUnits');
    let unitTxt = pressureUnits.toLowerCase() === 'kpa' ? 'kPa' : pressureUnits.toLowerCase();
    await createTitle(titleFld, `tirePressure||${unitTxt}`);

    let dataFld = await createRow(srcField);
    let value = `${vehicleData.tirePressure['leftFront']} | ${vehicleData.tirePressure['rightFront']}\n${vehicleData.tirePressure['leftRear']} | ${vehicleData.tirePressure['rightRear']}`;
    let txt = await createText(dataFld, value, { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color(runtimeData.textColor2), lineLimit: 2 });
    srcField.addSpacer(offset);
}

async function createPositionElement(srcField, vehicleData) {
    let offset = 0;
    let titleFld = await createRow(srcField);
    await createTitle(titleFld, 'position');

    let dataFld = await createRow(srcField);
    let url = (await getMapProvider()) == 'google' ? `https://www.google.com/maps/search/?api=1&query=${vehicleData.latitude},${vehicleData.longitude}` : `http://maps.apple.com/?q=${encodeURI(vehicleData.info.vehicle.nickName)}&ll=${vehicleData.latitude},${vehicleData.longitude}`;
    let value = vehicleData.position ? `${vehicleData.position}` : textValues().errorMessages.noData;
    let text = await createText(dataFld, value, { url: url, font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color(runtimeData.textColor2), lineLimit: 2, minimumScaleFactor: 0.7 });
    srcField.addSpacer(offset);
}

async function createLockStatusElement(srcField, vehicleData) {
    const styles = {
        statOpen: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#FF5733'), lineLimit: 1 },
        statClosed: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#5A65C0'), lineLimit: 1 },
    };
    let offset = 5;
    let titleFld = await createRow(srcField);
    await createTitle(titleFld, 'lockStatus');
    titleFld.addSpacer(2);
    let dataFld = await createRow(srcField);
    let value = vehicleData.lockStatus ? vehicleData.lockStatus : textValues().errorMessages.noData;
    let text = await createText(dataFld, value, vehicleData.lockStatus !== undefined && vehicleData.lockStatus === 'LOCKED' ? styles.statClosed : styles.statOpen);
    srcField.addSpacer(offset);
}

async function createIgnitionStatusElement(srcField, vehicleData) {
    const styles = {
        statOn: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#FF5733') },
        statOff: { font: Font.mediumSystemFont(sizes[screenType].detailFontSizeMedium), textColor: new Color('#5A65C0') },
    };
    let remStartOn = vehicleData.remoteStartStatus && vehicleData.remoteStartStatus.running ? true : false;
    let status = '';
    if (remStartOn) {
        status = `Remote Start (ON)`;
    } else if (vehicleData.ignitionStatus != undefined) {
        status = vehicleData.ignitionStatus.toUpperCase();
    } else {
        textValues().errorMessages.noData;
    }
    let offset = 5;
    let titleFld = await createRow(srcField);
    await createTitle(titleFld, 'ignitionStatus');
    titleFld.addSpacer(2);
    let dataFld = await createRow(srcField);
    let text = await createText(dataFld, status, (vehicleData.ignitionStatus !== undefined && vehicleData.ignitionStatus === 'On') || remStartOn ? styles.statOn : styles.statOff);
    srcField.addSpacer(offset);
}

//***************************************************END WIDGET ELEMENT FUNCTIONS********************************************************
//***************************************************************************************************************************************

//*****************************************************************************************************************************
//*                                                  START FORDPASS API FUNCTIONS
//*****************************************************************************************************************************

function appIDs() {
    return {
        UK_Europe: '1E8C7794-FF5F-49BC-9596-A1E0C86C5B19',
        Australia: '5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98',
        NA: '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592',
    };
}

async function checkAuth(src = undefined) {
    let token = await getKeychainValue('fpToken2');
    let expiresAt = await getKeychainValue('fpTokenExpiresAt');
    let expired = expiresAt ? Date.now() >= Date.parse(expiresAt) : false;
    if (widgetConfig.debugMode) {
        console.log(`chechAuth(${src})`);
        console.log(`checkAuth | Token: ${token}`);
        console.log(`checkAuth | ExpiresAt: ${expiresAt}`);
        console.log(`checkAuth | Expired: ${expired}`);
    }
    let tok;
    let refresh;
    if (expired) {
        console.log('Token has expired... Refreshing Token...');
        refresh = await refreshToken();
    } else if (token === null || token === undefined || token === '' || expiresAt === null || expiresAt === undefined || expiresAt === '') {
        console.log('Token or Expiration State is Missing... Fetching Token...');
        tok = await fetchToken();
    }
    if ((tok || refresh) && (tok == textValues().errorMessages.invalidGrant || tok == textValues().errorMessages.noCredentials || refresh == textValues().errorMessages.invalidGrant || refresh == textValues().errorMessages.noCredentials)) {
        return tok;
    }
    return;
}

async function fetchToken() {
    let username = await getKeychainValue('fpUser');
    if (!username) {
        return textValues().errorMessages.noCredentials;
    }
    let password = await getKeychainValue('fpPass');
    if (!password) {
        return textValues().errorMessages.noCredentials;
    }
    let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
        'Accept-Encoding': 'gzip, deflate, br',
        authorization: 'Basic ZWFpLWNsaWVudDo=',
    };

    try {
        let req1 = new Request('https://sso.ci.ford.com/oidc/endpoint/default/token');
        req1.headers = headers;
        req1.method = 'POST';
        req1.body = `client_id=9fb503e0-715b-47e8-adfd-ad4b7770f73b&grant_type=password&username=${username}&password=${encodeURIComponent(password)}`;

        let token1 = await req1.loadJSON();
        let resp1 = req1.response;
        if (widgetConfig.debugAuthMode) {
            console.log(`Token1 Req | Status: ${resp1.statusCode}) | Resp: ${JSON.stringify(token1)}`);
        }
        if (token1.error && token1.error == 'invalid_grant') {
            if (widgetConfig.debugMode) {
                console.log('Debug: Error while receiving token1 data');
                console.log(token1);
            }
            return textValues().errorMessages.invalidGrant;
        }
        if (resp1.statusCode === 200) {
            let req2 = new Request(`https://api.mps.ford.com/api/oauth2/v1/token`);
            headers['content-type'] = 'application/json';
            headers['application-id'] = appIDs().NA;
            req2.headers = headers;
            req2.method = 'PUT';
            req2.body = JSON.stringify({ code: token1.access_token });

            let token2 = await req2.loadJSON();
            let resp2 = req2.response;
            if (widgetConfig.debugAuthMode) {
                console.log(`Token2 Req | Status: ${resp2.statusCode}) | Resp: ${JSON.stringify(token2)}`);
            }
            if (token2.error && token2.error == 'invalid_grant') {
                if (widgetConfig.debugMode) {
                    console.log('Debug: Error while receiving token2 data');
                    console.log(token2);
                }
                return textValues().errorMessages.invalidGrant;
            }
            if (resp2.statusCode === 200) {
                await setKeychainValue('fpToken2', token2.access_token);
                await setKeychainValue('fpRefreshToken', token2.refresh_token);
                await setKeychainValue('fpTokenExpiresAt', (Date.now() + token2.expires_in).toString());
                let token = await getKeychainValue('fpToken2');
                let expiresAt = await getKeychainValue('fpTokenExpiresAt');
                // console.log(`expiresAt: ${expiresAt}`);
                return;
            }
        }
    } catch (e) {
        console.log(`fetchToken Error: ${e}`);
        if (e.error && e.error == 'invalid_grant') {
            return textValues().errorMessages.invalidGrant;
        }
        throw e;
    }
}

async function refreshToken() {
    try {
        const refreshToken = await getKeychainValue('fpRefreshToken');

        let req = new Request(`https://api.mps.ford.com/api/oauth2/v1/refresh`);
        req.headers = {
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json',
            'Application-Id': appIDs().NA,
        };
        req.method = 'PUT';
        req.body = JSON.stringify({ refresh_token: refreshToken });

        let token = await req.loadJSON();
        let resp = req.response;
        if (widgetConfig.debugAuthMode) {
            console.log(`RefreshToken Req | Status: ${resp.statusCode}) | Resp: ${JSON.stringify(token)}`);
        }
        if (token.error && token.error == 'invalid_grant') {
            if (widgetConfig.debugMode) {
                console.log('Debug: Error while receiving refreshing token');
                console.log(token);
            }
            return textValues().errorMessages.invalidGrant;
        }
        if (resp.statusCode === 200) {
            await setKeychainValue('fpToken2', token.access_token);
            await setKeychainValue('fpRefreshToken', token.refresh_token);
            await setKeychainValue('fpTokenExpiresAt', (Date.now() + token.expires_in).toString());
            // console.log(`expiresAt: ${expiresAt}`);
            return;
        } else if (resp.statusCode === 401) {
            await fetchToken();
        }
    } catch (e) {
        console.log(`refreshMpsToken Error: ${e}`);
        if (e.error && e.error == 'invalid_grant') {
            return textValues().errorMessages.invalidGrant;
        }
        throw e;
    }
}

async function getVehicleStatus() {
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    return await makeFordRequest('getVehicleStatus', `https://usapi.cv.ford.com/api/vehicles/v4/${vin}/status`, 'GET', false);
}

async function getVehicleInfo() {
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    return await makeFordRequest('getVehicleInfo', `https://usapi.cv.ford.com/api/users/vehicles/${vin}/detail?lrdt=01-01-1970%2000:00:00`, 'GET', false);
}

async function getVehicleMessages() {
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    let data = await makeFordRequest('getVehicleMessages', `https://api.mps.ford.com/api/messagecenter/v3/messages`, 'GET', false);
    return data && data.result ? data.result : textValues().errorMessages.noMessages;
}

async function getVehicleCapabilities() {
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    let data = await makeFordRequest('getVehicleCapabilities', `https://api.mps.ford.com/api/capability/v1/vehicles/${vin}?lrdt=01-01-1970%2000:00:00`, 'GET', false);
    if (data && data.result && data.result.features && data.result.features.length > 0) {
        let caps = data.result.features
            .filter((cap) => {
                return cap.state && cap.state.eligible === true;
            })
            .map((cap) => {
                return cap.feature;
            });
        return caps;
    }
    return undefined;
}

async function getVehicleOtaInfo() {
    let vin = await getKeychainValue('fpVin');
    let token = await getKeychainValue('fpToken2');
    let country = await getKeychainValue('fpCountry');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }

    return await makeFordRequest('getVehicleOtaInfo', `https://www.digitalservices.ford.com/owner/api/v2/ota/status?country=${country.toLowerCase()}&vin=${vin}`, 'GET', false, {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
        'Application-Id': appIDs().NA,
        'auth-token': `${token}`,
        'Consumer-Key': `Z28tbmEtZm9yZA==`, // Base64 encoded version of "go-na-ford"
        Referer: 'https://ford.com',
        Origin: 'https://ford.com',
    });
}

async function getSecuriAlertStatus() {
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    let data = await makeFordRequest('getSecuriAlertStatus', `https://api.mps.ford.com/api/guardmode/v1/${vin}/session`, 'GET', false);
    return data && data.session && data.session.gmStatus ? data.session.gmStatus : undefined;
    // console.log('getSecuriAlertStatus: ' + JSON.stringify(data));
}

async function makeFordRequest(desc, url, method, json = false, headerOverride = undefined, body = undefined) {
    let authMsg = await checkAuth('makeFordRequest(' + desc + ')');
    if (authMsg) {
        return authMsg;
    }
    let token = await getKeychainValue('fpToken2');
    let vin = await getKeychainValue('fpVin');
    if (!vin) {
        return textValues().errorMessages.noVin;
    }
    const headers = headerOverride || {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
        'Application-Id': appIDs().NA,
        'auth-token': `${token}`,
    };

    let request = new Request(url);
    request.headers = headers;
    request.method = method;
    if (body) {
        request.body = JSON.stringify(body);
    }
    try {
        let data = json ? await request.loadJSON() : await request.loadString();
        let resp = request.response;
        // if (widgetConfig.debugMode) {
        // console.log(`makeFordRequest Req | Status: ${resp.statusCode}) | Resp: ${data}`);
        // }
        if (data == textValues().errorMessages.accessDenied) {
            console.log(`makeFordRequest(${desc}): Auth Token Expired. Fetching New Token and Requesting Data Again!`);
            let result = await fetchToken();
            if (result && result == textValues().errorMessages.invalidGrant) {
                return result;
            }
            data = await makeFordRequest(desc, url, method, json, body);
        } else {
            data = json ? data : JSON.parse(data);
        }
        if (data.statusCode && data.statusCode !== 200) {
            return textValues().errorMessages.connectionErrorOrVin;
        }
        return data;
    } catch (e) {
        console.log(`makeFordRequest | ${desc} | Error: ${e}`);
        return textValues().errorMessages.unknownError;
    }
}

async function showAlert(title, message) {
    let alert = new Alert();
    alert.title = title;
    alert.message = message;
    alert.addAction('OK');
    const respInd = await alert.presentAlert();
    // console.log(`showAlert Response: ${respInd}`);
    switch (respInd) {
        case 0:
            // console.log(`${title} alert was cleared...`);
            return true;
    }
}

const vehicleCmdConfigs = (vin) => {
    const baseUrl = 'https://usapi.cv.ford.com/api';
    const guardUrl = 'https://api.mps.ford.com/api';
    return {
        lock: {
            desc: 'Lock Vehicle',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/doors/lock`,
                method: 'PUT',
            }, ],
        },
        unlock: {
            desc: 'Unlock Vehicle',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/doors/lock`,
                method: 'DELETE',
            }, ],
        },
        start: {
            desc: 'Remote Start Vehicle',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/engine/start`,
                method: 'PUT',
            }, ],
        },
        stop: {
            desc: 'Remote Stop Vehicle',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/engine/start`,
                method: 'DELETE',
            }, ],
        },
        zone_lights_off: {
            desc: 'Zone Off Zone Lighting (All Lights)',
            cmds: [{
                    uri: `${baseUrl}/vehicles/${vin}/zonelightingactivation`,
                    method: 'DELETE',
                },
                {
                    uri: `${baseUrl}/vehicles/${vin}/0/zonelighting`,
                    method: 'DELETE',
                },
            ],
        },
        zone_lights_on: {
            desc: 'Turn On Zone Lighting (All Lights)',
            cmds: [{
                    uri: `${baseUrl}/vehicles/${vin}/zonelightingactivation`,
                    method: 'PUT',
                },
                {
                    uri: `${baseUrl}/vehicles/${vin}/0/zonelighting`,
                    method: 'PUT',
                },
            ],
        },
        guard_mode_on: {
            desc: 'Enable SecuriAlert',
            cmds: [{
                uri: `${guardUrl}/guardmode/v1/${vin}/session`,
                method: 'PUT',
            }, ],
        },
        guard_mode_off: {
            desc: 'Disable SecuriAlert',
            cmds: [{
                uri: `${guardUrl}/guardmode/v1/${vin}/session`,
                method: 'DELETE',
            }, ],
        },
        trailer_light_check_on: {
            desc: 'Trailer Light Check ON',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/trailerlightcheckactivation`,
                method: 'PUT',
            }, ],
        },
        trailer_light_check_off: {
            desc: 'Trailer Light Check OFF',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/trailerlightcheckactivation`,
                method: 'DELETE',
            }, ],
        },
        status: {
            desc: 'Refresh Vehicle Status',
            cmds: [{
                uri: `${baseUrl}/vehicles/${vin}/status`,
                method: 'PUT',
            }, ],
        },
    };
};

async function sendVehicleCmd(cmd_type = '') {
    let authMsg = await checkAuth('sendVehicleCmd(' + cmd_type + ')');
    if (authMsg) {
        console.log(`sendVehicleCmd(${cmd_type}): ${result}`);
        return;
    }
    let token = await getKeychainValue('fpToken2');
    let vin = await getKeychainValue('fpVin');
    let cmdCfgs = vehicleCmdConfigs(vin);
    let cmds = cmdCfgs[cmd_type].cmds;
    let cmdDesc = cmdCfgs[cmd_type].desc;
    let multiCmds = cmds.length > 1;
    // console.log(`multipleCmds: ${multiCmds}`);
    let wasError = false;
    let errMsg = undefined;
    let outMsg = { title: '', message: '' };

    for (const cmd in cmds) {
        let isLastCmd = !multiCmds || (multiCmds && cmds.length == parseInt(cmd) + 1);
        // console.log(`processing vehicle command (${cmd_type}) #${cmd} | Method: ${cmds[cmd].method} | URI: ${cmds[cmd].uri}`);
        let req = new Request(cmds[cmd].uri);
        req.headers = {
            Accept: '*/*',
            'Accept-Language': 'en-us',
            'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json',
            'Application-Id': appIDs().NA,
            'auth-token': `${token}`,
        };
        req.method = cmds[cmd].method;

        try {
            let data = await req.loadString();
            let cmdResp = req.response;
            // console.log(data);
            if (data == 'Access Denied') {
                console.log('sendVehicleCmd: Auth Token Expired. Fetching new token and fetch raw data again');
                let result = await fetchToken();
                if (result && result == textValues().errorMessages.invalidGrant) {
                    console.log(`sendVehicleCmd(${cmd_type}): ${result}`);
                    return result;
                }
                data = await req.loadString();
            }
            data = JSON.parse(data);

            if (cmdResp.statusCode) {
                console.log(`sendVehicleCmd(${cmd_type}) Status Code (${cmdResp.statusCode})`);
                if (cmdResp.statusCode !== 200) {
                    wasError = true;
                    if (widgetConfig.debugMode) {
                        console.log('Debug: Error while sending vehicle cmd');
                        console.log(JSON.stringify(data));
                    }
                    if (cmdResp.statusCode === 590) {
                        console.log('code 590');
                        console.log(`isLastCmd: ${isLastCmd}`);
                        outMsg = { title: `${cmdDesc} Command`, message: textValues().errorMessages.cmd_err_590 };
                    } else {
                        errMsg = `Command Error: ${JSON.stringify(data)}`;
                        outMsg = { title: `${cmdDesc} Command`, message: `${textValues().errorMessages.cmd_err}\n\Error: ${cmdResp.statusCode}` };
                    }
                } else {
                    console.log('sendVehicleCmd Response: ' + JSON.stringify(data));
                    outMsg = { title: `${cmdDesc} Command`, message: textValues().successMessages.cmd_success };
                }
            }

            if (wasError) {
                if (errMsg) {
                    console.log(`sendVehicleCmd(${cmd_type}) | Error: ${errMsg}`);
                }
                if (outMsg.message !== '') {
                    await showAlert(outMsg.title, outMsg.message);
                }
                return;
            } else {
                if (isLastCmd) {
                    console.log(`sendVehicleCmd(${cmd_type}) | Sent Successfully`);
                    await showAlert(outMsg.title, outMsg.message);
                }
            }
        } catch (e) {
            console.log(`sendVehicleCmd Catch Error: ${e}`);
            return;
        }
    }
    return;
}

async function getUuid() {
    console.log(UUID.toString());
}

async function getKeychainValue(cred) {
    try {
        if (await Keychain.contains(cred)) {
            return await Keychain.get(cred);
        }
    } catch (e) {
        console.log(`getKeychainValue(${cred}) Error: ${e}`);
    }
    return null;
}

async function setKeychainValue(key, value) {
    await Keychain.set(key, value);
}

function hasKeychainValue(key) {
    return Keychain.contains(key);
}

async function removeKeychainValue(key) {
    const vin = await Keychain.get('fpVin');
    if (await Keychain.contains(key)) {
        await Keychain.remove(key);
    }
}

async function requiredPrefsOk() {
    let kcKeys = ['fpUser', 'fpPass', 'fpToken2', 'fpVin', 'fpMapProvider', 'fpCountry', 'fpDeviceLanguage', 'fpLanguage', 'fpTz', 'fpPressureUnits', 'fpSpeedUnits'];
    let missingKeys = [];
    for (const key in kcKeys) {
        let val = await getKeychainValue(kcKeys[key]);
        if (val === null || val === '' || val === undefined) {
            missingKeys.push(kcKeys[key]);
        }
    }
    console.log('missing: ' + missingKeys);
    return missingKeys.length === 0;
}

async function clearKeychain() {
    console.log('Info: Clearing Authentication from Keychain');
    const keys = ['fpToken', 'fpToken2', 'fpUsername', 'fpUser', 'fpPass', 'fpPassword', 'fpVin', 'fpUseMetricUnits', 'fpUsePsi', 'fpVehicleType', 'fpMapProvider', 'fpCat1Token', 'fpTokenExpiresAt', 'fpCountry', 'fpDeviceLanguage', 'fpLanguage', 'fpTz', 'fpPressureUnits', 'fpSpeedUnits'];
    for (const key in keys) {
        await removeKeychainValue(keys[key]);
    }
}

async function performKeychainMigration() {
    let kcKeys = ['fpUser', 'fpPass', 'fpToken2', 'fpVin', 'fpMapProvider', 'fpCountry', 'fpDeviceLanguage', 'fpLanguage', 'fpTz', 'fpPressureUnits', 'fpSpeedUnits'];
    for (const key in kcKeys) {
        // if (Keychain.contains())
    }
}

//from local store if last fetch is < x minutes, otherwise fetch from server
async function fetchVehicleData(loadLocal = false) {
    //Fetch data from local store
    if ((!widgetConfig.alwaysFetch && isLocalDataFreshEnough()) || loadLocal) {
        return readLocalData();
    }

    //fetch data from server
    console.log('fetchVehicleData: Fetching Vehicle Data from Ford Servers...');
    let statusData = await getVehicleStatus();

    // console.log(`statusData: ${JSON.stringify(statusData)}`);
    let vehicleData = new Object();
    if (statusData == textValues().errorMessages.invalidGrant || statusData == textValues().errorMessages.connectionErrorOrVin || statusData == textValues().errorMessages.unknownError || statusData == textValues().errorMessages.noVin || statusData == textValues().errorMessages.noCredentials) {
        // console.log('fetchVehicleData | Error: ' + statusData);
        let localData = readLocalData();
        if (localData) {
            vehicleData = localData;
        }
        if (statusData == textValues().errorMessages.invalidGrant) {
            console.log(`fetchVehicleData | Error: ${statusData} | Clearing Authentication from Keychain`);
            await removeKeychainValue('fpPass');
            // await removeLocalData();
        }
        vehicleData.error = statusData;
        return vehicleData;
    }
    vehicleData.rawStatus = statusData;
    if (widgetConfig.logVehicleData) {
        console.log(`Status: ${JSON.stringify(statusData)}`);
    }

    // Pulls in info about the vehicle like brand, model, year, etc. (Used to help with getting vehicle image and name for the map)
    let infoData = await getVehicleInfo();
    // console.log(`infoData: ${JSON.stringify(infoData)}`);
    vehicleData.info = infoData;
    if (widgetConfig.logVehicleData) {
        console.log(`Info: ${JSON.stringify(infoData)}`);
    }

    // Pulls in a list of the vehicles capabilities like zone lighting, remote start, etc.
    let capData = await getVehicleCapabilities();
    // console.log(`capData: ${JSON.stringify(capData)}`);
    vehicleData.capabilities = capData;
    if (widgetConfig.logVehicleData) {
        console.log(`Capabilities: ${JSON.stringify(capData)}`);
    }

    vehicleData.messages = await getVehicleMessages();
    // console.log(`messagesData: ${JSON.stringify(vehicleData.messages)}`);

    let vehicleStatus = statusData.vehiclestatus;

    vehicleData.fetchTime = Date.now();

    //ev details
    vehicleData.evVehicle = vehicleData.capabilities.includes('EV_FUEL') || (vehicleStatus.batteryFillLevel && vehicleStatus.batteryFillLevel.value !== null);
    if (vehicleData.evVehicle) {
        vehicleData.evBatteryLevel = vehicleStatus.batteryFillLevel && vehicleStatus.batteryFillLevel.value ? Math.floor(vehicleStatus.batteryFillLevel.value) : null;
        vehicleData.evDistanceToEmpty = vehicleStatus.elVehDTE && vehicleStatus.elVehDTE.value ? vehicleStatus.elVehDTE.value : null;
        vehicleData.evChargeStatus = vehicleStatus.chargingStatus && vehicleStatus.chargingStatus.value ? vehicleStatus.chargingStatus.value : null;
        vehicleData.evPlugStatus = vehicleStatus.plugStatus && vehicleStatus.plugStatus.value ? vehicleStatus.plugStatus.value : null;
        vehicleData.evChargeStartTime = vehicleStatus.chargeStartTime && vehicleStatus.chargeStartTime.value ? vehicleStatus.chargeStartTime.value : null;
        vehicleData.evChargeStopTime = vehicleStatus.chargeEndTime && vehicleStatus.chargeEndTime.value ? vehicleStatus.chargeEndTime.value : null;
    }

    //odometer
    vehicleData.odometer = vehicleStatus.odometer.value;

    //oil life
    vehicleData.oilLife = vehicleStatus.oil.oilLifeActual;

    //door lock status
    vehicleData.lockStatus = vehicleStatus.lockStatus.value;

    //ignition status
    vehicleData.ignitionStatus = vehicleStatus.ignitionStatus ? vehicleStatus.ignitionStatus.value : 'Off';

    //zone-lighting status
    vehicleData.zoneLightingSupported = vehicleStatus.zoneLighting && vehicleStatus.zoneLighting.activationData && vehicleStatus.zoneLighting.activationData.value === undefined ? false : true;
    vehicleData.zoneLightsStatus = vehicleStatus.zoneLighting && vehicleStatus.zoneLighting.activationData && vehicleStatus.zoneLighting.activationData.value ? vehicleStatus.zoneLighting.activationData.value : 'Off';

    // Remote Start status
    vehicleData.remoteStartStatus = {
        running: vehicleStatus.remoteStartStatus ? (vehicleStatus.remoteStartStatus.value === 0 ? false : true) : false,
        duration: vehicleStatus.remoteStart && vehicleStatus.remoteStart.remoteStartDuration ? vehicleStatus.remoteStart.remoteStartDuration.value : 0,
    };
    // console.log(`Remote Start Status: ${JSON.stringify(vehicleStatus.remoteStart)}`);

    // Alarm status
    vehicleData.alarmStatus = vehicleStatus.alarm ? (vehicleStatus.alarm.value === 'SET' ? 'On' : 'Off') : 'Off';

    //Battery info
    vehicleData.batteryStatus = vehicleStatus.battery && vehicleStatus.battery.batteryHealth ? vehicleStatus.battery.batteryHealth.value : textValues().UIValues.unknown;
    vehicleData.batteryLevel = vehicleStatus.battery && vehicleStatus.battery.batteryStatusActual ? vehicleStatus.battery.batteryStatusActual.value : textValues().UIValues.unknown;

    // Whether Vehicle is in deep sleep mode (Battery Saver) | Supported Vehicles Only
    vehicleData.deepSleepMode = vehicleStatus.deepSleepInProgess ? vehicleStatus.deepSleepInProgess.value === 'true' : undefined;

    // Whether Vehicle is currently installing and OTA update (OTA) | Supported Vehicles Only
    vehicleData.firmwareUpdating = vehicleStatus.firmwareUpgInProgress ? vehicleStatus.firmwareUpgInProgress.value === 'true' : undefined;

    //distance to empty
    vehicleData.distanceToEmpty = vehicleStatus.fuel && vehicleStatus.fuel.distanceToEmpty ? vehicleStatus.fuel.distanceToEmpty : null;

    //fuel level
    vehicleData.fuelLevel = vehicleStatus.fuel && vehicleStatus.fuel.fuelLevel ? Math.floor(vehicleStatus.fuel.fuelLevel) : null;

    //position of car
    vehicleData.position = await getPosition(vehicleStatus);
    vehicleData.latitude = parseFloat(vehicleStatus.gps.latitude);
    vehicleData.longitude = parseFloat(vehicleStatus.gps.longitude);

    // true means, that window is open
    let windows = vehicleStatus.windowPosition;
    //console.log("windows:", JSON.stringify(windows));
    vehicleData.statusWindows = {
        leftFront: !['Fully_Closed', 'Fully closed position', 'Undefined window position'].includes(windows.driverWindowPosition.value),
        rightFront: !['Fully_Closed', 'Fully closed position', 'Undefined window position'].includes(windows.passWindowPosition.value),
        leftRear: !['Fully_Closed', 'Fully closed position', 'Undefined window position'].includes(windows.rearDriverWindowPos.value),
        rightRear: !['Fully_Closed', 'Fully closed position', 'Undefined window position'].includes(windows.rearPassWindowPos.value),
    };

    //true means, that door is open
    let doors = vehicleStatus.doorStatus;
    vehicleData.statusDoors = {
        leftFront: !(doors.driverDoor && doors.driverDoor.value == 'Closed'),
        rightFront: !(doors.passengerDoor && doors.passengerDoor.value == 'Closed'),
    };
    if (doors.leftRearDoor && doors.leftRearDoor.value !== undefined) {
        vehicleData.statusDoors.leftRear = !(doors.leftRearDoor.value == 'Closed');
    }
    if (doors.rightRearDoor && doors.rightRearDoor.value !== undefined) {
        vehicleData.statusDoors.rightRear = !(doors.rightRearDoor.value == 'Closed');
    }
    if (doors.hoodDoor && doors.hoodDoor.value !== undefined) {
        vehicleData.statusDoors.hood = !(doors.hoodDoor.value == 'Closed');
    }
    if (doors.tailgateDoor && doors.tailgateDoor.value !== undefined) {
        vehicleData.statusDoors.tailgate = !(doors.tailgateDoor.value == 'Closed');
    }
    if (doors.innerTailgateDoor && doors.innerTailgateDoor.value !== undefined) {
        vehicleData.statusDoors.innerTailgate = !(doors.innerTailgateDoor.value == 'Closed');
    }

    //tire pressure
    let tpms = vehicleStatus.TPMS;
    vehicleData.tirePressure = {
        leftFront: await pressureToFixed(tpms.leftFrontTirePressure.value, 1),
        rightFront: await pressureToFixed(tpms.rightFrontTirePressure.value, 1),
        leftRear: await pressureToFixed(tpms.outerLeftRearTirePressure.value, 1),
        rightRear: await pressureToFixed(tpms.outerRightRearTirePressure.value, 1),
    };
    // console.log(JSON.stringify(vehicleData));

    //save data to local store
    saveDataToLocal(vehicleData);

    return vehicleData;
}

//******************************************** END FORDPASS API FUNCTIONS *********************************************************
//*********************************************************************************************************************************

//********************************************************************************************************************************
//*                                             START FILE/KEYCHAIN MANAGEMENT FUNCTIONS
//********************************************************************************************************************************

async function setUserPrefs() {
    let data = await makeFordRequest('setUserPrefs', `https://api.mps.ford.com/api/users`, 'GET', false);
    if (data && data.status === 200 && data.profile) {
        const prefs = {
            fpCountry: data.profile.country || 'USA',
            fpDeviceLanguage: data.profile.deviceLanguage,
            fpLanguage: data.profile.preferredLanguage || 'en-US',
            fpTz: data.profile.timeZone,
            fpPressureUnits: data.profile.uomPressure || 'PSI',
            fpSpeedUnits: data.profile.uomSpeed || 'MPH',
        };
        for (const key in prefs) {
            await setKeychainValue(key, prefs[key]);
        }
        console.log(`setUserPrefs: ${JSON.stringify(prefs)}`);
    }
}

async function useMetricUnits() {
    return (await getKeychainValue('fpSpeedUnits')) !== 'MPH';
}

// async function setUseMetricUnits(value) {
//     await setKeychainValue("fpUseMetricUnits", value.toString());
// }

// async function toggleUseMetricUnits() {
//     setUseMetricUnits((await useMetricUnits()) ? "false" : "true");
// }

// async function usePsiUnit() {
//     return (await getKeychainValue("fpUsePsi")) !== "false";
// }

// async function setUsePsiUnit(value) {
//     await setKeychainValue("fpUsePsi", value.toString());
// }

// async function toggleUsePsiUnits() {
//     setUsePsiUnit((await usePsiUnit()) ? "false" : "true");
// }

async function getMapProvider() {
    return (await getKeychainValue('fpMapProvider')) || 'apple';
}

async function setMapProvider(value) {
    await setKeychainValue('fpMapProvider', value);
}

async function toggleMapProvider() {
    await setMapProvider((await getMapProvider()) === 'google' ? 'apple' : 'google');
}

// get images from local filestore or download them once
async function getImage(image) {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, image);
    if (fm.fileExists(path)) {
        return fm.readImage(path);
    } else {
        // download once
        let repoPath = 'https://raw.githubusercontent.com/tonesto7/fordpass-scriptable/main/icons/';
        let imageUrl;
        switch (image) {
            case 'gas-station_light.png':
                imageUrl = 'https://i.imgur.com/gfGcVmg.png';
                break;
            case 'gas-station_dark.png':
                imageUrl = 'https://i.imgur.com/hgYWYC0.png';
                break;
            default:
                imageUrl = 'https://raw.githubusercontent.com/tonesto7/fordpass-scriptable/main/icons/' + image;
                // console.log(`FP: Sorry, couldn't find a url for ${image}.`);
        }
        let iconImage = await loadImage(imageUrl);
        fm.writeImage(path, iconImage);
        return iconImage;
    }
}

async function getVehicleImage(modelYear) {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, 'vehicle.png');
    if (fm.fileExists(path)) {
        return fm.readImage(path);
    } else {
        let vin = await getKeychainValue('fpVin');
        let token = await getKeychainValue('fpToken2');
        let country = await getKeychainValue('fpCountry');
        // console.log(`modelYear: ${modelYear}`);
        let req = new Request(`https://www.digitalservices.ford.com/fs/api/v2/vehicles/image/full?vin=${vin}&year=${modelYear}&countryCode=${country}&angle=4`);
        req.headers = {
            'Content-Type': 'application/json',
            Accept: 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
            'Accept-Encoding': 'gzip, deflate, br',
            'auth-token': `${token}`,
        };
        req.method = 'GET';

        try {
            let img = await req.loadImage();
            let resp = req.response;
            if (resp.statusCode === 200) {
                fm.writeImage(path, img);
            } else {
                img = await getImage('placeholder.png');
            }
            return img;
        } catch (e) {
            console.log(`getVehicleImage Error: Could Not Load Vehicle Image. ${e}`);
        }
    }
}

async function loadImage(imgUrl) {
    try {
        const req = new Request(imgUrl);
        return await req.loadImage();
    } catch (e) {
        console.log(`loadImage Error: Could Not Load Image from ${imgUrl}.`);
        return undefined;
    }
}

function saveDataToLocal(data) {
    console.log('FileManager: Saving New Vehicle Data to Local Storage...');
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, 'fp_vehicleData.json');
    if (fm.fileExists(path)) {
        fm.remove(path);
    } //clean old data
    fm.writeString(path, JSON.stringify(data));
}

function readLocalData() {
    console.log('FileManager: Retrieving Vehicle Data from Local Storage...');
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, 'fp_vehicleData.json');
    if (fm.fileExists(path)) {
        let localData = fm.readString(path);
        return JSON.parse(localData);
    }
    return null;
}

async function removeLocalData(filename) {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, filename);
    if (fm.fileExists(path)) {
        await fm.remove(path);
    }
}

function isLocalDataFreshEnough() {
    let localData = readLocalData();
    if (localData && Date.now() - localData.fetchTime < 60000 * widgetConfig.refreshInterval) {
        return true;
    } else {
        return false;
    }
}

async function clearFileManager() {
    console.log('Info: Clearing All Files from Local Directory');
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    fm.listContents(dir).forEach(async(file) => {
        await removeLocalData(file);
    });
}

async function getLatestScriptVersion() {
    let req = new Request(`https://raw.githubusercontent.com/tonesto7/fordpass-scriptable/main/latest.json`);
    req.headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'FordPass/5 CFNetwork/1327.0.4 Darwin/21.2.0',
        'Accept-Encoding': 'gzip, deflate, br',
    };
    req.method = 'GET';
    try {
        let ver = await req.loadJSON();
        return ver && ver.version ? ver.version.replace('v', '') : undefined;
    } catch (e) {
        console.log(`getLatestScriptVersion Error: Could Not Load Version File | ${e}`);
    }
}

//************************************************** END FILE MANAGEMENT FUNCTIONS************************************************
//********************************************************************************************************************************

//********************************************************************************************************************************
// ***********************************************START UTILITY FUNCTIONS ********************************************************
//********************************************************************************************************************************

async function getPosition(data) {
    let loc = await Location.reverseGeocode(parseFloat(data.gps.latitude), parseFloat(data.gps.longitude));
    return `${loc[0].postalAddress.street}, ${loc[0].postalAddress.city}`;
}

function calculateTimeDifference(oldTime) {
    let newTime = Date.now();
    let diffMs = newTime - oldTime;
    if (Math.floor(diffMs / 86400000) >= 1) {
        return textValues().UIValues.greaterOneDay;
    }
    if (Math.floor((diffMs % 86400000) / 3600000) >= 1) {
        let diff = Math.floor((diffMs % 86400000) / 3600000);
        return `${textValues().UIValues.precedingAdverb} ${diff} ${textValues().UIValues.hour}${diff == 1 ? '' : textValues().UIValues.plural} ${textValues().UIValues.subsequentAdverb}`;
    }
    if (Math.round(((diffMs % 86400000) % 3600000) / 60000) >= 1) {
        let diff = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        return `${textValues().UIValues.precedingAdverb} ${diff} ${textValues().UIValues.minute}${diff == 1 ? '' : textValues().UIValues.plural} ${textValues().UIValues.subsequentAdverb}`;
    }
    return textValues().UIValues.smallerOneMinute;
}

async function pressureToFixed(pressure, digits) {
    let unit = await getKeychainValue('fpPressureUnits');
    switch (unit) {
        case 'PSI':
            return pressure ? (pressure * 0.145).toFixed(digits) : -1;
        case 'BAR':
            return pressure ? pressure / 100 : -1;
        default:
            //KPA
            return pressure || -1;
    }
}

// Shamelessly borrowed from WidgetMarkup.js by @rafaelgandi
function _getObjectClass(obj) {
    // See: https://stackoverflow.com/a/12730085
    if (obj && obj.constructor && obj.constructor.toString) {
        let arr = obj.constructor.toString().match(/function\s*(\w+)/);
        if (arr && arr.length == 2) {
            return arr[1];
        }
    }
    return undefined;
}

function _mapMethodsAndCall(inst, options) {
    Object.keys(options).forEach((key) => {
        if (key.indexOf('*') !== -1) {
            key = key.replace('*', '');
            if (!(key in inst)) {
                throw new Error(`Method "${key}()" is not applicable to instance of ${_getObjectClass(inst)}`);
            }
            if (Array.isArray(options['*' + key])) {
                inst[key](...options['*' + key]);
            } else {
                inst[key](options[key]);
            }
        } else {
            if (!(key in inst)) {
                throw new Error(`Property "${key}" is not applicable to instance of ${_getObjectClass(inst)}`);
            }
            inst[key] = options[key];
        }
    });
    return inst;
}

function isNewerVersion(oldVer, newVer) {
    const oldParts = oldVer.split('.');
    const newParts = newVer.split('.');
    for (var i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i]; // parse int
        const b = ~~oldParts[i]; // parse int
        if (a > b) return true;
        if (a < b) return false;
    }
    return false;
}

//************************************************* END UTILITY FUNCTIONS ********************************************************
//********************************************************************************************************************************