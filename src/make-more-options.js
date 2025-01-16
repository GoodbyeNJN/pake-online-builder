import querystring from "node:querystring";

const query = querystring.stringify({
    // HEIGHT: 780,
    // WIDTH: 1200,
    // HIDE_TITLE_BAR: false,
    // FULLSCREEN: false,
    // ACTIVATION_SHORTCUT: "", /* https://www.electronjs.org/zh/docs/latest/api/accelerator */
    // ALWAYS_ON_TOP: false,
    // DARK_MODE: false,
    // DISABLED_WEB_SHORTCUTS: false,
    // MULTI_ARCH: false,
    // TARGETS: "deb" /*  "appimage"  */ /*  "rpm"  */,
    // USER_AGENT: "",
    // SHOW_SYSTEM_TRAY: false,
    // SYSTEM_TRAY_ICON_URL: "",
    // INSTALLER_LANGUAGE:"en-US",
    // INJECT_URL: "",
    // PROXY_URL: "",
    // DEBUG: false,
});

console.log(query);
