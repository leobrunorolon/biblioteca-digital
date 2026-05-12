// ============================================================
// POLYFILLS - Deben ir PRIMERO antes de cualquier import
// Hermes (motor JS de React Native release) no tiene estas APIs
// ============================================================

// URL polyfill - requerido por @supabase/supabase-js
import "react-native-url-polyfill/auto";

// atob / btoa polyfill
if (typeof global.atob === "undefined") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  global.atob = function (input: string): string {
    const str = input.replace(/[^A-Za-z0-9+/=]/g, "");
    let output = "";
    let i = 0;
    while (i < str.length) {
      const enc1 = chars.indexOf(str.charAt(i++));
      const enc2 = chars.indexOf(str.charAt(i++));
      const enc3 = chars.indexOf(str.charAt(i++));
      const enc4 = chars.indexOf(str.charAt(i++));
      output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
      if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
    }
    return output;
  };

  global.btoa = function (input: string): string {
    let output = "";
    let i = 0;
    while (i < input.length) {
      const chr1 = input.charCodeAt(i++);
      const chr2 = input.charCodeAt(i++);
      const chr3 = input.charCodeAt(i++);
      output += chars.charAt(chr1 >> 2);
      output += chars.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
      output += isNaN(chr2) ? "=" : chars.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
      output += isNaN(chr3) ? "=" : chars.charAt(chr3 & 63);
    }
    return output;
  };
}

// ============================================================
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
