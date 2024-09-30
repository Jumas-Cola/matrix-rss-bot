import * as config from "config";

interface IConfig {
    homeserverUrl: string;
    accessToken: string;
    autoJoin: boolean;
    dataPath: string;
    encryption: boolean;
    rssPollInterval: number;
    dbUri: string;
    dbName: string;
    dbCollection: string;
    openAiApiUrl: string;
    openAiApiKey: string;
}

export default <IConfig>config;
