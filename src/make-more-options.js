import querystring from "node:querystring";

const query = querystring.stringify({
    // HEIGHT: 780,
    // WIDTH: 1200,
    // HIDE_TITLE_BAR: false,
    // FULLSCREEN: false,
    // ALWAYS_ON_TOP: false,
    // DARK_MODE: false,
    // DISABLED_WEB_SHORTCUTS: false,
    // MULTI_ARCH: false,
    // TARGETS: "deb" /*  "appimage"  */ /*  "rpm"  */,
    // USER_AGENT: "",
    // INSTALLER_LANGUAGE:"en-US",
    // INJECT_URL: "",
    // PROXY_URL: "",
    // DEBUG: false,
});

console.log(query);
