import { promises as fsp } from "node:fs";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";

import { safeWriteFile } from "./fs";

export const download = async (filename: string, url: string, retry = 0): Promise<string> => {
    try {
        const res = await fetch(url);
        const data = await res.arrayBuffer();
        if (!data) {
            throw new Error("Empty response data:" + url);
        }

        await safeWriteFile(filename, Buffer.from(data));

        return path.resolve(filename);
    } catch (error) {
        if (retry < 3) {
            console.log("Retry download:", retry);
            return await download(filename, url, retry + 1);
        } else {
            throw error;
        }
    }
};

export const inferExtname = async (filename: string) => {
    const file = await fsp.readFile(filename);
    const info = await fileTypeFromBuffer(file);
    if (!info) {
        throw new Error("Unknown file type:" + filename);
    }

    return info.ext;
};
