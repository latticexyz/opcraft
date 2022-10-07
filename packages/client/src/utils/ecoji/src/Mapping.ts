import IMapping from "./IMapping";

const padding = 0x2615;
const padding40 = 0x269c;
const padding41 = 0x1f3cd;
const padding42 = 0x1f4d1;
const padding43 = 0x1f64b;

export default class Mapping implements IMapping {
  private emojis: Map<string, number>;

  private revEmojis: Map<number, string>;

  // This should sort before everything.  This is output when 3 or less input bytes are present.
  private padding: string = String.fromCodePoint(padding);

  // The following paddings are used when only 4 of 5 input bytes are present.
  // This should sort between padding and emojis[0]
  private padding40: string = String.fromCodePoint(padding40);
  // This should sort between emojis[255] and emojis[256]
  private padding41: string = String.fromCodePoint(padding41);
  // This should sort between emojis[511] and emojis[512]
  private padding42: string = String.fromCodePoint(padding42);
  // This should sort between emojis[767] and emojis[768]
  private padding43: string = String.fromCodePoint(padding43);

  constructor(emojis: string[]) {
    this.emojis = emojis.reduce(
      (Map, hexUnicode, i) => Map.set(String.fromCodePoint(Number(hexUnicode)), i),
      new Map()
    );
    this.emojis.set(this.padding, -1);
    this.revEmojis = emojis.reduce(
      (Map, hexUnicode, i) => Map.set(i, String.fromCodePoint(Number(hexUnicode))),
      new Map()
    );
    this.revEmojis.set(-1, this.padding);
  }

  public getEmoji(id: number): string {
    const emoji = this.revEmojis.get(id);

    if (undefined === emoji) {
      throw Error(`Invalid id provided: ${id}`);
    }

    return emoji;
  }

  public getId(rune: string): number {
    const id = this.emojis.get(rune);

    if (undefined === id) {
      throw Error(`Invalid rune provided: ${rune}`);
    }

    return id;
  }

  public getPadding(): string {
    return this.padding;
  }

  public getPadding40(): string {
    return this.padding40;
  }

  public getPadding41(): string {
    return this.padding41;
  }

  public getPadding42(): string {
    return this.padding42;
  }

  public getPadding43(): string {
    return this.padding43;
  }
}
