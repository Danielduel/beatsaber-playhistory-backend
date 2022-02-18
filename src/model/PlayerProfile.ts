import { v4 as uuid } from "uuid";
import {db, dbCreateOrUpdate, dbGetById} from "../utils";
import GenericItem from "./GenericItem";

export const dbItemType = "PlayerProfile";
export const version = 3;
export default class PlayerProfile extends GenericItem {
  name: string;
  secret: string;
  isPublic: boolean;
  saberColors: [string, string];

  constructor (name: string, secret: string) {
    super(version);

    this.name = name;
    this.secret = secret;
    this.isPublic = false;
    this.saberColors = ["red", "blue"];
  }

  update() {
    return dbCreateOrUpdate(dbItemType, this);
  }

  static update(dbData: PlayerProfile) {
    return dbCreateOrUpdate(dbItemType, dbData);
  }

  static create(name: string) {
    const secret = uuid();

    return new PlayerProfile(name, secret);
  }

  static async getById(id: string) {
    const dbData = await dbGetById<PlayerProfile>(dbItemType, id);
    const playerProfile = await migrate(dbData as unknown as PlayerProfile);
    return playerProfile; 
  }
}

async function migrate(playerProfile: PlayerProfile) {
  let migrated = false;

  if (playerProfile.version === 1) {
    playerProfile.isPublic = false;
    playerProfile.version = 2;
    migrated = true;
  }

  if (playerProfile.version === 2) {
    playerProfile.saberColors = ["red", "blue"]
    playerProfile.version = 3;
    migrated = true;
  }

  if (migrated) {
    await PlayerProfile.update(playerProfile);
  }

  return playerProfile;
}

