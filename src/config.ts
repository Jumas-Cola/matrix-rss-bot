import * as config from "config";

interface IConfig {
    homeserverUrl: string;
    accessToken: string;
    autoJoin: boolean;
    dataPath: string;
    encryption: boolean;
    rssPollInterval: number;
}

export default <IConfig>config;
