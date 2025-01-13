import path from "node:path";

import { $ } from "zx";

import { rm, safeReadFile, safeWriteFile } from "./fs";

export const withPatchEnv = async (pkg: string, fn: (dir: string) => Promise<void>) => {
    const temp = path.resolve(import.meta.dirname, "../.temp", pkg);

    await rm(temp);
    await $`pnpm patch ${pkg} --edit-dir ${temp}`;

    try {
        await fn(temp);
    } catch (error) {
        await rm(temp);
        console.log("❌ Failed to patch files");
        throw error;
    }

    await $`pnpm patch-commit --patches-dir ./patches ${temp}`;
    await rm(temp);

    console.log("✅ Patched files successfully");
};

export const staticPatch = async (temp: string) => {
    const patches = [
        {
            filepaths: ["dist/cli.js"],
            handler: (content: string) =>
                content.replace("'--inject <url>'", "'--inject <url...>'"),
        },
        {
            filepaths: ["dist/cli.js"],
            handler: (content: string) => {
                const matched = [
                    ...content.matchAll(
                        /(.*)(async function combineFiles\(files, output\) {\n)(.*)(\n\s+return files;\n})(.*)/gs,
                    ),
                ].flatMap(match => Array.from(match).slice(1));

                if (matched.length !== 5) {
                    throw new Error("Failed to match the function `combineFiles`");
                }

                matched[2] = String.raw`const contents = files.map(file => fs.readFileSync(file));
fs.writeFileSync(output, contents.join('\n'));`;

                return matched.join("");
            },
        },
    ];

    for (const patch of patches) {
        const filepaths = patch.filepaths.map(filepath => path.resolve(temp, filepath));

        for (const filepath of filepaths) {
            const content = await safeReadFile(filepath);

            if (!content) {
                throw new Error(`File not exits or empty: ${filepath}`);
            }

            const patched = patch.handler(content);
            await safeWriteFile(filepath, patched);
        }
    }
};
