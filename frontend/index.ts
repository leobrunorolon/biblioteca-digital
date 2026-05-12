// Polyfills para Hermes (motor JS de React Native en release)
// atob/btoa no existen en Hermes
if (typeof global.atob === "undefined") {
  global.atob = function (base64: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;
    const str = base64.replace(/[^A-Za-z0-9+/]/g, "");
    while (i < str.length) {
      const enc1 = chars.indexOf(str[i++]);
      const enc2 = chars.indexOf(str[i++]);
      const enc3 = chars.indexOf(str[i++]);
      const enc4 = chars.indexOf(str[i++]);
      result += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
      if (enc3 !== 64) result += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if (enc4 !== 64) result += String.fromCharCode(((enc3 & 3) << 6) | enc4);
    }
    return result;
  };
}

if (typeof global.btoa === "undefined") {
  global.btoa = function (str: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = str.charCodeAt(i++);
      const c = str.charCodeAt(i++);
      result += chars[a >> 2];
      result += chars[((a & 3) << 4) | (b >> 4)];
      result += isNaN(b) ? "=" : chars[((b & 15) << 2) | (c >> 6)];
      result += isNaN(c) ? "=" : chars[c & 63];
    }
    return result;
  };
}

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
