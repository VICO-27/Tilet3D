export type Gender = 'male' | 'female';

export type BodyType =
  | 'slim'
  | 'athletic'
  | 'average'
  | 'plus'
  | 'inverted_triangle'
  | 'pear'
  | 'rectangle';

export type SkinTone =
  | 'ivory'
  | 'fair'
  | 'light'
  | 'honey'
  | 'medium'
  | 'caramel'
  | 'tan'
  | 'chestnut'
  | 'rich'
  | 'espresso'
  | 'deep'
  | 'ebony';

export type AnimationName = 'idle' | 'walk' | 'spin';

export interface AvatarData {
  nickname: string;
  age: number;
  gender: Gender;
  body_type: BodyType;
  skin_tone: SkinTone;
  height: number;
  weight: number;
  chest: number;
  waist: number;
  shoulder_width: number;
  hips: number;
}

export interface AvatarState extends AvatarData {
  isConfirmed: boolean;
  currentAnimation: AnimationName;
  isLoading: boolean;
}