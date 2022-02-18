import { v4 as uuid } from "uuid";

export default class GenericItem {
  id: string;
  version: number;

  constructor (version: number, id?: string) {
    if (!id) {
      this.id = uuid();
    } else {
      this.id = id;
    }

    this.version = version;
  }
}

