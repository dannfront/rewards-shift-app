import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ShiftCode } from '../interfaces/shift-code.interface';
import { IShiftCodeAdapter } from '../interfaces/shift-code-adapter.interface';

@Injectable()
export class MentalMarsAdapter implements IShiftCodeAdapter {
  private readonly logger = new Logger(MentalMarsAdapter.name);
  private readonly baseUrl =
    'https://mentalmars.com/game-news/borderlands-4-shift-codes/';
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  private readonly codeRegex = /[A-Z0-9]{5}(?:-[A-Z0-9]{5}){4}/;

  async fetchCodes(): Promise<ShiftCode[]> {
    const html = await this.fetchPage();
    const codes = this.parseHtml(html);
    return this.filterActiveAndUnknown(codes);
  }

  private async fetchPage(): Promise<string> {
    const response = await axios.get<string>(this.baseUrl, {
      headers: { 'User-Agent': this.userAgent },
    });
    return response.data;
  }

  private parseHtml(html: string): ShiftCode[] {
    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) {
      this.logger.warn('No <tbody> found in page');
      return [];
    }

    const rows = tbodyMatch[1].split(/<\/tr>/i);
    const codes: ShiftCode[] = [];

    for (const row of rows) {
      const code = this.parseRow(row);
      if (code) {
        codes.push(code);
      }
    }

    return codes;
  }

  private parseRow(rowHtml: string): ShiftCode | null {
    const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cells || cells.length < 4) {
      return null;
    }

    const codeCell = this.stripTags(cells[2]);
    const expireCell = this.stripTags(cells[3]);

    const codeMatch = codeCell.match(this.codeRegex);
    if (!codeMatch) {
      return null;
    }

    const hasStrikethrough = /<s[^>]*>/i.test(cells[2]);
    const isUnknownExpire = /\?\?\?|never/i.test(expireCell);

    return {
      code: codeMatch[0],
      expireAt: hasStrikethrough ? true : isUnknownExpire ? null : false,
    };
  }

  private filterActiveAndUnknown(codes: ShiftCode[]): ShiftCode[] {
    return codes.filter((c) => c.expireAt !== true);
  }

  private stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, '').trim();
  }
}
