import express from "express";
import dotenv from "dotenv";
import * as fse from "fs-extra";

dotenv.config();
const secret = process.env.SECRET as string;
const dataDir = process.env.DATA_DIR as string;

if (!secret) {
  console.error("Secret is missing");
  process.exit();
}

if (!dataDir) {
  console.error("No dataDir");
  process.exit();
}

const app = express();
app.use(express.json());

type BeatMapItem = {
  timestamp: string;
  mapHash: string;
  mapName: string;
  coverUrl: string;
  bsrCode: string;
};

type HistoryPushRequestBody = BeatMapItem & {
  secret: string;
  playerName: string; // change to something that is not user-inputable
};

app.post("/history/push", (req, res) => {
  const isBadRequest = (
    !req.body ||
    !req.body.secret ||
    !req.body.playerName
  );
  if (isBadRequest) return res.status(400).send("Bad request");
  if (req.body.secret !== secret) return res.status(403).send("Forbidden");
  
  const {
    playerName,
    timestamp,
    mapName,
    coverUrl,
    mapHash,
    bsrCode
  } = req.body as HistoryPushRequestBody;
  const savefilePath = `${dataDir}/${playerName}/history.json`;
  fse.ensureDirSync(`${dataDir}/${playerName}`);
  fse.ensureFileSync(savefilePath);
  let content = [] as BeatMapItem[];

  try {
    // it is designed to fail for a new file
    content = fse.readJsonSync(savefilePath) as BeatMapItem[];
  } catch (_) {}

  content.push({
    timestamp,
    mapName,
    coverUrl,
    mapHash,
    bsrCode
  });

  fse.writeJSONSync(savefilePath, content);

  return res.status(200).send("OK");
}); 

app.get("/history/:playerName/list", (req, res) => {
  const playerName = req.params.playerName;
  const savefilePath = `${dataDir}/${playerName}/history.json`;

  let content = [];

  try {
    content = fse.readJSONSync(savefilePath);
  } catch(_) {}

  return res.status(200).json(content);
});

app.listen(3001);

