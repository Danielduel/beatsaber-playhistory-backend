import express from "express";
import dotenv from "dotenv";
import * as fse from "fs-extra";
import {createProxyMiddleware, Options as ProxyOptions} from "http-proxy-middleware";
import PlayerProfile from "./model/PlayerProfile";

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

app.get("/api/profile/create/:name", async (req, res) => {
  const playerProfile = await PlayerProfile.create(req.params.name).update();
  return res.status(200).json(playerProfile);
});

app.get("/api/profile/getById/:id", async (req, res) => {
  const playerProfile = await PlayerProfile.getById(req.params.id);
  const censoredPlayerProfile = {
    ...playerProfile,
    __comment__: "Secret was censored in this response",
    secret: null
  };
  return res.status(200).json(censoredPlayerProfile);
});

app.post("/api/history/clearAll", (req, res) => {
  const isBadRequest = (
    !req.body ||
    !req.body.secret ||
    !req.body.playerName
  );

  if (isBadRequest) {
    console.log("Bad request");
    return res.status(400).send("Bad request");
  }
  if (req.body.secret !== secret) {
    console.log("Forbidden");
    return res.status(403).send("Forbidden");
  }

  const playerName = req.body.playerName;
  const savefilePath = `${dataDir}/${playerName}/history.json`;
  try {
    fse.removeSync(savefilePath);
  } catch (_) {/* ignore */}
});
app.post("/api/history/push", (req, res) => {
  const isBadRequest = (
    !req.body ||
    !req.body.secret ||
    !req.body.playerName
  );

  console.log(req.body);
  if (isBadRequest) {
    console.log("Bad request");
    return res.status(400).send("Bad request");
  }
  if (req.body.secret !== secret) {
    console.log("Forbidden");
    return res.status(403).send("Forbidden");
  }

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
  res.status(200);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.send("OK");
});

app.get("/api/history/:playerName/list", (req, res) => {
  const playerName = req.params.playerName;
  const savefilePath = `${dataDir}/${playerName}/history.json`;

  let content = [];

  try {
    content = fse.readJSONSync(savefilePath);
  } catch (_) {}

  return res.status(200).json(content);
});

registerFrontendProxy(app); // NOTE: Order matters, keep it last just before `listen`
app.listen(3001);

function registerFrontendProxy(_app: express.Express) {
  const frontendProxyOptions: ProxyOptions = {
    target: process.env.FRONTEND_PROXY_TARGET, // target host
    changeOrigin: true, // needed for virtual hosted sites
    pathRewrite: {
      [process.env.FRONTEND_PROXY_REWRITE as string]: "/"
    }
  };
  const frontendProxy = createProxyMiddleware(frontendProxyOptions);
  _app.use("*", frontendProxy);
}
