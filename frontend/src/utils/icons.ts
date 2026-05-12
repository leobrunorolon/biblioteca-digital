// Mapear nombres de iconos (Heroicons/etc) a emojis
export function getIconEmoji(icon?: string): string {
  // Si ya es un emoji (empieza con un carácter no ASCII), devolverlo directo
  if (icon && /\p{Emoji}/u.test(icon) && !/^[a-z]/i.test(icon)) {
    return icon;
  }

  const map: Record<string, string> = {
    // Iconos del seed original
    sparkles:         "✨",
    "code-bracket":   "💻",
    "book-open":      "📖",
    beaker:           "🔬",
    "light-bulb":     "💡",
    "document-text":  "📄",
    "speaker-wave":   "🎧",
    "academic-cap":   "🎓",
    star:             "⭐",
    "lock-open":      "🔓",
    // Emojis directos (nuevas secciones creadas desde la app)
    "📚": "📚", "💻": "💻", "🔬": "🔬", "💡": "💡",
    "📖": "📖", "🎧": "🎧", "✨": "✨", "🏆": "🏆",
    "🤝": "🤝", "🌱": "🌱", "📄": "📄", "🎓": "🎓",
    "🗺️": "🗺️", "🎨": "🎨", "🎵": "🎵", "⚡": "⚡",
    "🔥": "🔥", "🌍": "🌍", "🧠": "🧠", "🎯": "🎯",
  };

  return map[icon ?? ""] ?? "📚";
}
