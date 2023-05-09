import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { BOT_HELLO } from "./chat";

export interface AccessControlStore {
  accessCode: string;
  token: string;

  enableAOAI: boolean;
  azureDeployName: string;
  aoaiToken: string;

  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;

  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  switchAOAI: (_: boolean) => void;
  updateDeployName: (_: string) => void;
  updateAOAIToken: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      accessCode: "",

      enableAOAI: false,
      azureDeployName: "",
      aoaiToken: "",

      needCode: true,
      hideUserApiKey: false,
      openaiUrl: "/api/openai/",

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateToken(token: string) {
        set(() => ({ token }));
      },

      switchAOAI(switchStatus: boolean) {
        set((state) => ({ enableAOAI: switchStatus }));
      },
      updateDeployName(azureDeployName: string) {
        set((state) => ({ azureDeployName }));
      },
      updateAOAIToken(aoaiToken: string) {
        set(() => ({ aoaiToken }));
      },

      isAuthorized() {
        get().fetch();

        // has token or has code or disabled access control
        if (get().enableAOAI) {
          return !!get().azureDeployName && !!get().aoaiToken;
        }

        return (
          !!get().token || !!get().accessCode || !get().enabledAccessControl()
        );
      },

      fetch() {
        if (fetchState > 0) return;
        fetchState = 1;
        fetch("/api/config", {
          method: "post",
          body: null,
        })
          .then((res) => res.json())
          .then((res: DangerConfig) => {
            console.log("[Config] got config from server", res);
            set(() => ({ ...res }));

            if ((res as any).botHello) {
              BOT_HELLO.content = (res as any).botHello;
            }
          })
          .catch(() => {
            console.error("[Config] failed to fetch config");
          })
          .finally(() => {
            fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
