import { platform } from 'node:os';
import { PlatformsEnum } from '../types/platforms.enum';

export function getPlatforms(data: string): PlatformsEnum[] {
  const regex =
    /value="([^"]+)"[^>]+name="archway_code_redemption\[service\]"/g;

  const matches = [...data.matchAll(regex)];
  const platforms = matches.map((match) => match[1]) as PlatformsEnum[];

  const indexXbox = platforms.indexOf(PlatformsEnum.XBOX);

  const xbox = platforms.splice(indexXbox, 1)[0];

  platforms.splice(0, 0, xbox);

  return platforms;
}
