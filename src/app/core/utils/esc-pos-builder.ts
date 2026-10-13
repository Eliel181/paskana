/**
 * Utility for building ESC/POS binary command streams for thermal receipt printers (58mm / 80mm).
 */
export class EscPosBuilder {
  private buffer: number[] = [];
  private readonly maxCharsPerLine: number;

  constructor(maxCharsPerLine: number = 32) {
    this.maxCharsPerLine = maxCharsPerLine;
    this.init();
  }

  /**
   * Initializes printer parameters (ESC @)
   */
  init(): this {
    this.buffer.push(0x1B, 0x40);
    // Set code page to CP850 or ISO-8859-1 for Spanish character support
    this.buffer.push(0x1B, 0x74, 0x02);
    return this;
  }

  /**
   * Sets text alignment: 'left' | 'center' | 'right'
   */
  align(alignment: 'left' | 'center' | 'right'): this {
    const code = alignment === 'center' ? 0x01 : alignment === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1B, 0x61, code);
    return this;
  }

  /**
   * Toggles bold text
   */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  /**
   * Toggles double height & width text
   */
  doubleSize(enable: boolean = true): this {
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  /**
   * Appends text converting Spanish characters to extended ASCII
   */
  text(str: string): this {
    const bytes = this.encodeSpanishText(str);
    this.buffer.push(...bytes);
    return this;
  }

  /**
   * Appends text with a newline
   */
  textLine(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A);
    return this;
  }

  /**
   * Appends a full line separator (e.g. "--------------------------------")
   */
  separator(char: string = '-'): this {
    const line = char.repeat(this.maxCharsPerLine);
    return this.textLine(line);
  }

  /**
   * Appends a row formatted with left content and right content (aligned to 32 chars)
   */
  row(left: string, right: string): this {
    const totalWidth = this.maxCharsPerLine;
    const rightLen = right.length;
    const maxLeftLen = Math.max(0, totalWidth - rightLen - 1);
    
    let leftFormatted = left;
    if (leftFormatted.length > maxLeftLen) {
      leftFormatted = leftFormatted.substring(0, maxLeftLen);
    }
    
    const spacesNeeded = totalWidth - leftFormatted.length - rightLen;
    const line = leftFormatted + ' '.repeat(Math.max(1, spacesNeeded)) + right;
    return this.textLine(line);
  }

  /**
   * Feeds line count
   */
  feed(lines: number = 3): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  /**
   * Paper cut command (GS V B)
   */
  cut(): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * Returns final Uint8Array binary buffer
   */
  generate(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Encodes string converting Spanish special characters to extended ASCII byte codes
   */
  private encodeSpanishText(text: string): number[] {
    const result: number[] = [];
    
    // Replace emoji or special unsupported symbols with plain text representations
    const cleanText = text.replace(/💬/g, '[Nota]');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const code = char.charCodeAt(0);

      if (code < 128) {
        result.push(code);
      } else {
        // Map Spanish characters to CP850 / Latin-1 byte codes
        switch (char) {
          case 'á': result.push(0xA0); break;
          case 'é': result.push(0x82); break;
          case 'í': result.push(0xA1); break;
          case 'ó': result.push(0xA2); break;
          case 'ú': result.push(0xA3); break;
          case 'ñ': result.push(0xA4); break;
          case 'Ñ': result.push(0xA5); break;
          case 'Á': result.push(0xB5); break;
          case 'É': result.push(0x90); break;
          case 'Í': result.push(0xD6); break;
          case 'Ó': result.push(0xE0); break;
          case 'Ú': result.push(0xE9); break;
          case 'ü': result.push(0x81); break;
          case 'Ü': result.push(0x9A); break;
          case '°': result.push(0xF8); break;
          case '¿': result.push(0xA8); break;
          case '¡': result.push(0xAD); break;
          default:
            // Fallback for non-ASCII: convert to standard Latin-1 or ASCII fallback
            result.push(code <= 255 ? code : 0x3F); // 0x3F is '?'
            break;
        }
      }
    }
    return result;
  }
}
