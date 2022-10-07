import Buffer from "buffer-lite";
import MappingInterface from "./IMapping";

export default class Ecoji {
  private mapping: MappingInterface;

  constructor(mapping: MappingInterface) {
    this.mapping = mapping;
  }

  public encode(input: string): string {
    let output = "";

    const bufferIterator = Buffer.from(input.encode(), "binary");
    const values = bufferIterator.values();

    let length = bufferIterator.length;

    while (length > 0) {
      length -= 5;

      const buffer = [];
      for (let i = 0; i < 5; i++) {
        const code = values.next();
        buffer[i] = !code.done ? code.value : 0;
      }

      output += this.mapping.getEmoji((buffer[0] << 2) | (buffer[1] >> 6));
      switch (buffer.filter((i) => i).length) {
        case 1:
          output += [this.mapping.getPadding().repeat(3)].join("");

          break;
        case 2:
          output += [
            this.mapping.getEmoji(((buffer[1] & 0x3f) << 4) | (buffer[2] >> 4)),
            this.mapping.getPadding().repeat(2),
          ].join("");

          break;
        case 3:
          output += [
            this.mapping.getEmoji(((buffer[1] & 0x3f) << 4) | (buffer[2] >> 4)),
            this.mapping.getEmoji(((buffer[2] & 0x0f) << 6) | (buffer[3] >> 2)),
            this.mapping.getPadding(),
          ].join("");

          break;
        case 4:
          output += [
            this.mapping.getEmoji(((buffer[1] & 0x3f) << 4) | (buffer[2] >> 4)),
            this.mapping.getEmoji(((buffer[2] & 0x0f) << 6) | (buffer[3] >> 2)),
          ].join("");

          switch (buffer[3] & 0x03) {
            case 0:
              output += this.mapping.getPadding40();
              break;
            case 1:
              output += this.mapping.getPadding41();
              break;
            case 2:
              output += this.mapping.getPadding42();
              break;
            case 3:
              output += this.mapping.getPadding43();
              break;
          }

          break;
        case 5:
          output += [
            this.mapping.getEmoji(((buffer[1] & 0x3f) << 4) | (buffer[2] >> 4)),
            this.mapping.getEmoji(((buffer[2] & 0x0f) << 6) | (buffer[3] >> 2)),
            this.mapping.getEmoji(((buffer[3] & 0x03) << 8) | buffer[4]),
          ].join("");

          break;
        default:
          break;
      }
    }

    return output;
  }

  public decode(input: string): string {
    let output = "";

    const emojis = input
      .replace(/(?:\r\n|\r|\n)/g, "")
      .decode()
      .mb_split();

    while (emojis.length) {
      if (emojis.length < 4) {
        throw Error("Unexpected emoji sequence provided.");
      }

      const runes = emojis.splice(0, 4);
      const bits = runes.slice(0, 3).map((emoji) => this.mapping.getId(emoji));

      switch (runes[3]) {
        case this.mapping.getPadding40():
          bits[3] = 0;
          break;
        case this.mapping.getPadding41():
          bits[3] = 1 << 8;
          break;
        case this.mapping.getPadding42():
          bits[3] = 2 << 8;
          break;
        case this.mapping.getPadding43():
          bits[3] = 3 << 8;
          break;
        default:
          bits[3] = this.mapping.getId(runes[3]);
          break;
      }

      let out = [
        bits[0] >> 2,
        ((bits[0] & 0x3) << 6) | (bits[1] >> 4),
        ((bits[1] & 0xf) << 4) | (bits[2] >> 6),
        ((bits[2] & 0x3f) << 2) | (bits[3] >> 8),
        bits[3] & 0xff,
      ];

      if (runes[1] === this.mapping.getPadding()) {
        out = out.slice(0, 1);
      } else if (runes[2] === this.mapping.getPadding()) {
        out = out.slice(0, 2);
      } else if (runes[3] === this.mapping.getPadding()) {
        out = out.slice(0, 3);
      } else if (
        [
          this.mapping.getPadding40(),
          this.mapping.getPadding41(),
          this.mapping.getPadding42(),
          this.mapping.getPadding43(),
        ].indexOf(runes[3]) !== -1
      ) {
        out = out.slice(0, 4);
      }

      output += out.reduce((result, item) => {
        result += String.fromCharCode(item);
        return result;
      }, "");
    }

    return output.decode();
  }
}
