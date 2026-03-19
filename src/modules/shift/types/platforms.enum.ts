export enum PlatformsEnum {
  XBOX = 'xboxlive',
  STEAM = 'steam',
  NINTENDO = 'nintendo',
  EPIC = 'epic',
  PSN = 'psn',
  STADIA = 'stadia',
}

export type Platforms =
  | PlatformsEnum.XBOX
  | PlatformsEnum.STEAM
  | PlatformsEnum.NINTENDO
  | PlatformsEnum.EPIC
  | PlatformsEnum.PSN
  | PlatformsEnum.STADIA;
