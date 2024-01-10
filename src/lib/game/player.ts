import { ClassType } from './classType';

export class Player {
	name: string;
	class: ClassType;
	hp: number = 0;
	attack: number = 0;
	defense: number = 0;
	gold: number = 0;

	constructor(name: string) {
		this.name = name;
		this.class = 'none';
	}
}
