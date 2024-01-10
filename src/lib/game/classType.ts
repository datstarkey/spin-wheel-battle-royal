import { z } from 'zod';
import type { ClassBase } from './classes/classBase';
import { Swe } from './classes/swe';
import { Stoner } from './classes/stoner';
import { Poopmaster } from './classes/poopmaster';
import { Gorf } from './classes/gorf';
import { Magicman } from './classes/magicman';

export const classMap: Record<ClassType, ClassBase> = {
	swe: Swe,
	stoner: Stoner,
	poopmaster: Poopmaster,
	gorf: Gorf,
	magicman: Magicman,
	none: Swe //placeholder
};
export type ClassType = z.infer<typeof ClassType>;

export const ClassType = z.enum(['none', 'stoner', 'poopmaster', 'swe', 'gorf', 'magicman']);
