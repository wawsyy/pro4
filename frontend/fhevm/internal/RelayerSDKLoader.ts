import { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { SDK_CDN_URL, SDK_FALLBACK_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this._trace);
  }

  public load(): Promise<void> {
    console.log("[RelayerSDKLoader] load...");
    // Ensure this only runs in the browser
    if (typeof window === "undefined") {
      console.log("[RelayerSDKLoader] window === undefined");
      return Promise.reject(
        new Error("RelayerSDKLoader: can only be used in the browser.")
      );
    }

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this._trace)) {
        console.log("[RelayerSDKLoader] window.relayerSDK === undefined");
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return this._loadWithFallback();
  }

  private _loadWithFallback(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`
      );
      if (existingScript) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
            )
          );
        }
        resolve();
        return;
      }

      // Try primary URL first
      const primaryScript = document.createElement("script");
      primaryScript.src = SDK_CDN_URL;
      primaryScript.type = "text/javascript";
      primaryScript.async = true;

      primaryScript.onload = () => {
        if (!isFhevmWindowType(window, this._trace)) {
          console.log("[RelayerSDKLoader] primary script onload FAILED, trying fallback...");
          // Primary failed, try fallback
          this._loadFallbackScript().then(resolve).catch(reject);
        } else {
          console.log("[RelayerSDKLoader] primary script loaded successfully");
          resolve();
        }
      };

      primaryScript.onerror = () => {
        console.log("[RelayerSDKLoader] primary script failed, trying fallback...");
        // Primary failed, try fallback
        this._loadFallbackScript().then(resolve).catch(reject);
      };

      console.log("[RelayerSDKLoader] loading primary script from", SDK_CDN_URL);
      document.head.appendChild(primaryScript);
    });
  }

  private _loadFallbackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingFallbackScript = document.querySelector(
        `script[src="${SDK_FALLBACK_URL}"]`
      );
      if (existingFallbackScript) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object after fallback."
            )
          );
        }
        resolve();
        return;
      }

      const fallbackScript = document.createElement("script");
      fallbackScript.src = SDK_FALLBACK_URL;
      fallbackScript.type = "text/javascript";
      fallbackScript.async = true;

      fallbackScript.onload = () => {
        if (!isFhevmWindowType(window, this._trace)) {
          console.log("[RelayerSDKLoader] fallback script onload FAILED...");
          reject(
            new Error(
              `RelayerSDKLoader: Fallback Relayer SDK script has been successfully loaded from ${SDK_FALLBACK_URL}, however, the window.relayerSDK object is invalid.`
            )
          );
        } else {
          console.log("[RelayerSDKLoader] fallback script loaded successfully");
          resolve();
        }
      };

      fallbackScript.onerror = () => {
        console.log("[RelayerSDKLoader] fallback script failed");
        reject(
          new Error(
            `RelayerSDKLoader: Failed to load Relayer SDK from both primary (${SDK_CDN_URL}) and fallback (${SDK_FALLBACK_URL}) URLs`
          )
        );
      };

      console.log("[RelayerSDKLoader] loading fallback script from", SDK_FALLBACK_URL);
      document.head.appendChild(fallbackScript);
    });
  }
}

function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined") {
    trace?.("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    trace?.("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!objHasProperty(o, "initSDK", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  if (!objHasProperty(o, "createInstance", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  if (!objHasProperty(o, "SepoliaConfig", "object", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  if ("__initialized__" in o) {
    if (o.__initialized__ !== true && o.__initialized__ !== false) {
      trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined") {
    trace?.("RelayerSDKLoader: window object is undefined");
    return false;
  }
  if (win === null) {
    trace?.("RelayerSDKLoader: window object is null");
    return false;
  }
  if (typeof win !== "object") {
    trace?.("RelayerSDKLoader: window is not an object");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType(win.relayerSDK);
}

function objHasProperty<
  T extends object,
  K extends PropertyKey,
  V extends string // "string", "number", etc.
>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType
): obj is T &
  Record<
    K,
    V extends "string"
      ? string
      : V extends "number"
      ? number
      : V extends "object"
      ? object
      : V extends "boolean"
      ? boolean
      : V extends "function"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) => any
      : unknown
  > {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(
      `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
    );
    return false;
  }

  return true;
}
