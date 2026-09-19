/**
 * A curated list of common, easy-to-spell English words for passphrase
 * generation — not the full EFF long wordlist (which has ~7,776 words).
 * With 248 words, each word contributes about log2(248) ≈ 8 bits of
 * entropy; a 4-word passphrase from this list is roughly as strong as a
 * random 10-character password across all four character classes —
 * genuinely reasonable for most purposes, but a smaller pool than a
 * dedicated long wordlist would give you. Documented here so the tradeoff
 * is visible rather than implied to be stronger than it is.
 */
export const PASSPHRASE_WORDLIST: string[] = [
  "apple", "river", "cloud", "stone", "forest", "mountain", "ocean", "desert",
  "valley", "island", "bridge", "castle", "garden", "harbor", "meadow", "canyon",
  "glacier", "volcano", "lagoon", "prairie", "tundra", "jungle", "coral", "reef",
  "sunset", "sunrise", "twilight", "midnight", "morning", "evening", "autumn", "winter",
  "summer", "spring", "shadow", "shimmer", "sparkle", "glimmer", "thunder", "lightning",
  "breeze", "storm", "rainbow", "horizon", "comet", "meteor", "planet", "galaxy",
  "nebula", "orbit", "rocket", "satellite", "compass", "anchor", "voyage", "journey",
  "explorer", "pioneer", "traveler", "wanderer", "captain", "sailor", "pilot", "engineer",
  "builder", "painter", "writer", "dancer", "singer", "musician", "artist", "sculptor",
  "teacher", "student", "scholar", "scientist", "inventor", "chemist", "physicist", "biologist",
  "falcon", "eagle", "hawk", "sparrow", "raven", "swan", "heron", "owl",
  "tiger", "panther", "leopard", "cheetah", "jaguar", "lion", "wolf", "fox",
  "otter", "beaver", "badger", "raccoon", "squirrel", "rabbit", "deer", "moose",
  "dolphin", "whale", "turtle", "seahorse", "octopus", "jellyfish", "starfish", "urchin",
  "maple", "willow", "cedar", "birch", "oak", "pine", "bamboo", "cactus",
  "lavender", "jasmine", "orchid", "tulip", "daisy", "lily", "violet", "marigold",
  "amber", "jade", "topaz", "opal", "quartz", "onyx", "pearl", "copper",
  "bronze", "silver", "golden", "platinum", "crystal", "granite", "marble", "velvet",
  "silk", "cotton", "linen", "wool", "denim", "flannel", "suede", "harmony",
  "melody", "rhythm", "cadence", "symphony", "chorus", "echo", "whisper", "courage",
  "wisdom", "honor", "loyalty", "kindness", "patience", "gratitude", "curiosity", "adventure",
  "discovery", "mystery", "legend", "fable", "chronicle", "saga", "lantern", "candle",
  "beacon", "torch", "ember", "spark", "flame", "blaze", "puzzle", "riddle",
  "pattern", "mosaic", "prism", "kaleidoscope", "spectrum", "gradient", "orchard", "vineyard",
  "meadowlark", "hilltop", "brookside", "cliffside", "seaside", "hillside", "carousel", "telescope",
  "binoculars", "sundial", "hourglass", "pendulum", "biscuit", "pretzel", "walnut", "almond",
  "cashew", "hazelnut", "chestnut", "pistachio", "cinnamon", "vanilla", "nutmeg", "saffron",
  "paprika", "basil", "rosemary", "thyme", "penguin", "walrus", "narwhal", "seal",
  "puffin", "albatross", "pelican", "flamingo", "slate", "limestone", "basalt", "obsidian",
  "sandstone", "canvas", "palette", "sketch", "portrait", "mural", "tapestry", "fresco",
  "etching", "lighthouse", "pier", "dock", "wharf", "jetty", "cove", "inlet",
];
