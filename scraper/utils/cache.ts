import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class PageCache {
    private cacheDir: string;
    private ttlMs: number;

    constructor(cacheDir: string = '.cache', ttlMs: number = 24 * 60 * 60 * 1000) {
        this.cacheDir = path.resolve(process.cwd(), cacheDir);
        this.ttlMs = ttlMs;
    }

    async init(): Promise<void> {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error(`Failed to create cache directory: ${error}`);
        }
    }

    private generateKey(url: string): string {
        const hash = crypto.createHash('md5').update(url).digest('hex');
        return `${hash}.html`;
    }

    async get(url: string): Promise<string | null> {
        const key = this.generateKey(url);
        const filePath = path.join(this.cacheDir, key);

        try {
            const stats = await fs.stat(filePath);
            const now = Date.now();
            const age = now - stats.mtimeMs;

            if (age < this.ttlMs) {
                return await fs.readFile(filePath, 'utf-8');
            } else {
                // Cache expired
                await fs.unlink(filePath).catch(() => { });
                return null;
            }
        } catch (error) {
            // File not found or other error
            return null;
        }
    }

    async set(url: string, content: string): Promise<void> {
        const key = this.generateKey(url);
        const filePath = path.join(this.cacheDir, key);

        try {
            await fs.writeFile(filePath, content, 'utf-8');
        } catch (error) {
            console.error(`Failed to write to cache: ${error}`);
        }
    }

    async clear(): Promise<void> {
        try {
            await fs.rm(this.cacheDir, { recursive: true, force: true });
            await this.init();
        } catch (error) {
            console.error(`Failed to clear cache: ${error}`);
        }
    }
}
