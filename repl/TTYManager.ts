import { Keypress, readKeypress } from "https://deno.land/x/keypress@0.0.4/mod.ts";
import { clearLine, clearScreen, goLeft, goRight, goTo, nextLine } from "https://denopkg.com/iamnathanj/cursor@v2.0.0/mod.ts";
import { isSome, Maybe } from "../src/Maybe.ts";

export class TTYManager {
    private encoder = new TextEncoder();
    private history: string[] = [];
    private historyIndex = 0;
    private textBeforeHistoryLookup = '';
    private xOffset = 0;
    private text = '';
    private prefix = '';

    // inserts a string at the current position
    private async insert(str: string): Promise<void> {
        const lhs = this.text.substring(0, this.xOffset);
        const rhs = this.text.substring(this.xOffset);
        this.text = lhs + str + rhs;
        this.xOffset += str.length;
        await goRight(str.length);
    }

    // removes one character
    private async erase(): Promise<void> {
        const lhs = this.text.substring(0, this.xOffset - 1);
        const rhs = this.text.substring(this.xOffset);
        this.text = lhs + rhs;
        await this.moveLeft();
    }

    public async update(): Promise<void> {
        await goLeft(this.prefix.length + this.text.length);
        await clearLine();
        await Deno.write(Deno.stdin.rid, this.encoder.encode(this.prefix + this.text));
        await goRight(this.xOffset);
        await goLeft(this.text.length);
    }

    private async moveLeft(): Promise<void> {
        if (this.xOffset > 0) {
            await goLeft();
            this.xOffset--;
        }
    }

    private async moveRight(): Promise<void> {
        if (this.xOffset < this.text.length) {
            await goRight();
            this.xOffset++;
        }
    }

    private currentHistory(): string {
        if (this.historyIndex === 0) return this.textBeforeHistoryLookup;
        return this.history[this.history.length - this.historyIndex];
    }

    private async fetchPrevious(): Promise<void> {
        if (this.history.length > 0 && this.historyIndex < this.history.length) {
            if (this.historyIndex === 0) {
                this.textBeforeHistoryLookup = this.text;
            }

            await goLeft(this.text.length);
            this.historyIndex++;
            this.text = this.currentHistory();
            this.xOffset = this.text.length;
            await this.update();
        }
    }

    private async fetchNext(): Promise<void> {
        if (this.history.length > 0 && this.historyIndex > 0) {
            await goLeft(this.text.length);
            this.historyIndex--;
            this.text = this.currentHistory();
            this.xOffset = this.text.length;
            await this.update();
        }
    }

    public async processKey(keypress: Keypress): Promise<Maybe<string>> {
        if (keypress.ctrlKey) {
            switch (keypress.key) {
                case 'c':
                    Deno.exit();
                case 'l':
                    await clearScreen();
                    await goTo(this.text.length + this.prefix.length - this.xOffset, 0);
                    await this.update();
                    return;
            }
        }

        switch (keypress.key) {
            case 'return':
                this.history.push(this.text);
                this.text = '';
                this.xOffset = 0;
                this.historyIndex = 0;
                return this.history[this.history.length - 1];

            case 'backspace':
                await this.erase();
                await this.update();
                break;

            case 'left':
                await this.moveLeft();
                break;

            case 'right':
                await this.moveRight();
                break;

            case 'up':
                await this.fetchPrevious();
                break;

            case 'down':
                await this.fetchNext();
                break;

            default:
                await this.insert(keypress.sequence);
                await this.update();
                break;
        }
    }

    public async prompt(prefix = ''): Promise<string> {
        this.text = '';
        this.prefix = prefix;
        await this.update();

        for await (const keypress of readKeypress()) {
            const res = await this.processKey(keypress);
            if (isSome(res)) {
                await nextLine();
                return res;
            };
        }

        return '';
    }

    public async expect(pred: (key: Keypress) => boolean): Promise<boolean> {
        for await (const keypress of readKeypress()) {
            if (pred(keypress)) return true;
            if (keypress.key === 'return') return false;
            await this.processKey(keypress);
        }

        return false;
    }
}