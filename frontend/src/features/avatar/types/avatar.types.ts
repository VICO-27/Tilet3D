export type Gender = 'male' | 'female';
export type BodyType = 'slim' | 'athletic' | 'average' | 'plus' | 'inverted_triangle' | 'pear' | 'rectangle';
export type SkinTone = 'fair' | 'light' | 'medium' | 'tan' | 'rich' | 'deep';

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
  currentAnimation: 'idle' | 'walk' | 'spin';
  isLoading: boolean;
}