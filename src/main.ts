import os from "node:os";
import path from "node:path";
import querystring from "node:querystring";

import { pick } from "remeda";
import { $, glob, useBash, usePowerShell } from "zx";

import { cp, safeMkdir } from "./fs";
import { staticPatch, withPatchEnv } from "./patch";
import { download, inferExtname } from "./utils";

const platform = os.platform();
if (platform === "win32") {
    usePowerShell();
} else if (platform === "linux") {
    useBash();
} else if (platform === "darwin") {
    useBash();
}

const env = pick(process.env, [
    "URL",
    "NAME",
    "ICON_URL",
    "HEIGHT",
    "WIDTH",
    "HIDE_TITLE_BAR",
    "FULLSCREEN",
    "ACTIVATION_SHORTCUT",
    "ALWAYS_ON_TOP",
    "APP_VERSION",
    "DARK_MODE",
    "DISABLED_WEB_SHORTCUTS",
    "MULTI_ARCH",
    "TARGETS",
    "USER_AGENT",
    "SHOW_SYSTEM_TRAY",
    "SYSTEM_TRAY_ICON_URL",
    "INSTALLER_LANGUAGE",
    "INJECT_URL",
    "PROXY_URL",
    "DEBUG",
    "MORE_OPTIONS",
]);

if (env.MORE_OPTIONS) {
    const moreOptions = querystring.parse(env.MORE_OPTIONS);
    Object.assign(env, moreOptions);
}

console.log("====================================");
console.log("Environment variables:");
console.table(env);

const options = {
    name: {
        name: "name",
        value: env.NAME,
    },
    icon: {
        name: "icon",
        value: undefined as string | undefined,
    },
    height: {
        name: "height",
        value: env.HEIGHT,
    },
    width: {
        name: "width",
        value: env.WIDTH,
    },
    hideTitleBar: {
        name: "hide-title-bar",
        value: env.HIDE_TITLE_BAR === "true",
    },
    fullscreen: {
        name: "fullscreen",
        value: env.FULLSCREEN === "true",
    },
    activationShortcut: {
        name: "activation-shortcut",
        value: env.ACTIVATION_SHORTCUT,
    },
    alwaysOnTop: {
        name: "always-on-top",
        value: env.ALWAYS_ON_TOP === "true",
    },
    appVersion: {
        name: "app-version",
        value: env.APP_VERSION,
    },
    darkMode: {
        name: "dark-mode",
        value: env.DARK_MODE === "true",
    },
    disabledWebShortcuts: {
        name: "disabled-web-shortcuts",
        value: env.DISABLED_WEB_SHORTCUTS === "true",
    },
    multiArch: {
        name: "multi-arch",
        value: env.MULTI_ARCH === "true",
    },
    targets: {
        name: "targets",
        value: env.TARGETS,
    },
    userAgent: {
        name: "user-agent",
        value: env.USER_AGENT,
    },
    showSystemTray: {
        name: "show-system-tray",
        value: env.SHOW_SYSTEM_TRAY === "true",
    },
    systemTrayIcon: {
        name: "system-tray-icon",
        value: undefined as string | undefined,
    },
    installerLanguage: {
        name: "installer-language",
        value: env.INSTALLER_LANGUAGE,
    },
    inject: {
        name: "inject",
        value: [] as string[],
    },
    proxyUrl: {
        name: "proxy-url",
        value: env.PROXY_URL,
    },
    debug: {
        name: "debug",
        value: env.DEBUG === "true",
    },
};

if (env.ICON_URL) {
    console.log("====================================");
    console.log("Downloading icon...");
    const filepath = await download("unknown_icon_file", env.ICON_URL);
    console.log("Download icon completed.");

    const extname = await inferExtname(filepath);
    const filename = `icon.${extname}`;
    await cp(filepath, path.resolve(path.dirname(filepath), filename));
    options.icon.value = path.resolve(path.dirname(filepath), filename);
    console.log("Icon file:", filename);
}

if (env.SYSTEM_TRAY_ICON_URL) {
    console.log("====================================");
    console.log("Downloading system tray icon...");
    const filepath = await download("unknown_system_icon_file", env.SYSTEM_TRAY_ICON_URL);
    console.log("Download system tray icon completed.");

    const extname = await inferExtname(filepath);
    const filename = `tray-icon.${extname}`;
    await cp(filepath, path.resolve(path.dirname(filepath), filename));
    options.systemTrayIcon.value = path.resolve(path.dirname(filepath), filename);
    console.log("System tray icon file:", filename);
}

if (env.INJECT_URL) {
    console.log("====================================");
    console.log("Downloading inject file...");
    const filepath = await download("inject.js", env.INJECT_URL);
    console.log("Download inject file completed.");

    options.inject.value.push(filepath);
}

const args = Object.values(options).flatMap(({ name, value }) => {
    switch (typeof value) {
        case "string":
            return value.length > 0 ? [`--${name}`, value] : [];

        case "boolean":
            return value ? [`--${name}`] : [];

        case "object":
            return Array.isArray(value) && value.length > 0
                ? value.flatMap(v => (v.length > 0 ? [`--${name}`, v] : []))
                : [];

        case "undefined":
            return [];

        default:
            return [];
    }
});
args.unshift(env.URL!);

console.log("====================================");
console.log("Installing Pake...");
await $`pnpm add pake-cli`;
console.log("Install Pake completed.");

console.log("====================================");
console.log("Patching Pake...");
await withPatchEnv("pake-cli", async dirpath => {
    await staticPatch(dirpath);

    let dest = "";
    if (platform === "win32") {
        dest = "src-tauri/png/icon_256.ico";
    } else if (platform === "linux") {
        dest = "src-tauri/png/icon_512.png";
    } else if (platform === "darwin") {
        dest = "src-tauri/icons/icon.icns";
    }

    if (options.icon.value && dest.length > 0) {
        await cp(options.icon.value, path.resolve(dirpath, dest));
        options.icon.value = undefined;
    }
});
console.log("Patch Pake completed.");

console.log("====================================");
console.log("Command line arguments:");
console.table(args);

console.log("====================================");
console.log("Building app...");
await $`pnpm exec pake ${args}`;
console.log("Build app completed.");

console.log("====================================");
console.log("Copying installer...");
const installers = await glob([`${options.name.value}.*`]);
if (installers.length === 0) {
    throw new Error("No installer found");
} else {
    console.log("Installers:", installers.join(", "));
}

await safeMkdir("output");
for (const installer of installers) {
    await cp(installer, path.join("output", installer));
}
console.log("Copy installer completed.");

process.exit(0);
