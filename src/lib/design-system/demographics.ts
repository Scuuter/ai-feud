/**
 * Demographic Skins — the "channel" layer of the design system.
 *
 * A Demographic is a themed collection of 100 AI personas (see
 * `docs/glossary.md`). Visually, each demographic is a broadcast channel
 * layered on top of the Y2K Vice City TV chassis. It changes the room,
 * accent colors, LIVE bug, channel label, and ticker copy — but never the
 * chassis geometry, borders, fonts, or brutalist shadows.
 *
 * See `docs/design-system.md` §5 for the authoring rules.
 */

import type { HexColor, ThemedTokenKey } from "./tokens";

export type DemographicId =
  | "default"
  | "game-of-thrones"
  | "modern-berlin"
  | "italian-village";

export type SampleAnswer = {
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  text: string;
  score: number;
  flavorQuote?: { personaName: string; text: string };
};

export type DemographicSkin = {
  /** Matches `data-demographic` attribute + persona JSON tags. */
  id: DemographicId;
  /** Shown in the channel switcher and the channel label overlay. */
  displayName: string;
  /** Broadcast chrome — rendered as the tiny channel tag on the TV. */
  channelLabel: string;
  /** One-line mood description, shown in showcase and in the host lobby. */
  tagline: string;
  /** Longer copy displayed on the room wall in the showcase. */
  roomDescription: string;
  /** Optional extra class on the room wall for per-demographic texture. */
  roomTextureClass?: "room-texture-stone" | "room-texture-concrete";
  /** News ticker phrases written in that channel's voice. All uppercase. */
  tickerPhrases: string[];
  /** A topic whose flavor this channel absolutely nails. */
  sampleTopic: string;
  /** 4 short board answers + optional flavor quote for preview purposes. */
  sampleAnswers: SampleAnswer[];
  /** Example wildcard payload for the <StrikeIndicator mode="wildcard" />. */
  sampleWildcard: { personaName: string; flavorQuote: string };
  /** TS mirror of the CSS theme tokens. Used by showcase swatches. */
  palette: Record<Extract<ThemedTokenKey, "roomBg" | "roomInk" | "tileShadow" | "wildcardAccent" | "missAccent" | "channelDot">, HexColor>;
};

export const DEMOGRAPHICS: readonly DemographicSkin[] = [
  {
    id: "default",
    displayName: "VICE CITY BROADCAST",
    channelLabel: "CH 04 · VICE CITY FEED",
    tagline: "The canonical look. 1995 Miami hotel lobby at 2 a.m.",
    roomDescription:
      "Hot flamingo-pink wallpaper, a chrome-trimmed Sony Trinitron, late-night infomercials hallucinating across the screen.",
    tickerPhrases: [
      "BREAKING · FLAMINGO SIGHTED ORDERING DAIQUIRI AT DRIVE-THRU",
      "MARKETS · CHROME UP 6% · NEON HOLDING STEADY",
      "WEATHER · 88°F AND GETTING WEIRDER",
      "CELEBRITY · STALLONE SPOTTED BUYING 9 COCONUTS",
    ],
    sampleTopic:
      "Name something you'd find in a wizard's suitcase.",
    sampleAnswers: [
      { rank: 1, text: "A Rolled-Up Newspaper", score: 32, flavorQuote: { personaName: "Tired Dad Wizard", text: "Need somethin' to swat the familiar with." } },
      { rank: 2, text: "Snacks For The Familiar", score: 24 },
      { rank: 3, text: "A Spare Wand (Just In Case)", score: 22 },
      { rank: 4, text: "An Expired Potion", score: 14 },
    ],
    sampleWildcard: {
      personaName: "Anxious House Cat",
      flavorQuote: "I found a small glowing bug. I need to kill it. I need to protect my human. Why is it ticking.",
    },
    palette: {
      roomBg: "#FFC0CB",
      roomInk: "#000000",
      tileShadow: "#00FFFF",
      wildcardAccent: "#FFD700",
      missAccent: "#FF0000",
      channelDot: "#FF0000",
    },
  },
  {
    id: "game-of-thrones",
    displayName: "WESTEROS ROYAL BROADCAST",
    channelLabel: "CH 07 · WRBC · THE CROWN'S NETWORK",
    tagline: "A TV propped on a stone table in a drafty castle. No one knows how it got here.",
    roomDescription:
      "Wet slate walls, torches guttering off-camera, a three-eyed raven sulking on the antenna. Winter is, as ever, coming.",
    roomTextureClass: "room-texture-stone",
    tickerPhrases: [
      "BREAKING · SMALL COUNCIL VOTES 6-1 TO IGNORE THE NORTH AGAIN",
      "WEATHER · WINTER STILL COMING · ETA: IMMINENT (ACCORDING TO SOURCES)",
      "SPORTS · TOURNEY POSTPONED AFTER THIRD UNEXPECTED BEHEADING",
      "MARKETS · IRON BANK RAISES RATES · LANNISTERS TO PAY EVENTUALLY",
      "WILDLING ALERT · 40,000 REPORTED NORTH OF THE WALL · PROBABLY FINE",
    ],
    sampleTopic:
      "Name something a Lannister does when they feel insulted.",
    sampleAnswers: [
      { rank: 1, text: "Sip Wine Judgmentally", score: 38, flavorQuote: { personaName: "Cersei Lannister", text: "I find your defiance refreshing. For about nine more seconds." } },
      { rank: 2, text: "Order Someone Beheaded", score: 27 },
      { rank: 3, text: "Reference Their Gold", score: 21 },
      { rank: 4, text: "Recite Their Full Name", score: 14 },
    ],
    sampleWildcard: {
      personaName: "Tyrion Lannister",
      flavorQuote: "I drink, and I know things. Currently I know you shouldn't have said that.",
    },
    palette: {
      roomBg: "#3A3F44",
      roomInk: "#D7D2C8",
      tileShadow: "#A8D8EA",
      wildcardAccent: "#D4AF37",
      missAccent: "#8B0000",
      channelDot: "#8B0000",
    },
  },
  {
    id: "modern-berlin",
    displayName: "KANAL KREUZBERG",
    channelLabel: "CH 24 · KANAL KREUZBERG · 24H",
    tagline: "The TV is on a milk crate in a Neukölln WG at 6 a.m. The bassline is coming from three apartments away.",
    roomDescription:
      "Concrete walls tagged in five languages, an overflowing ashtray, one plant miraculously surviving. The U8 is down again.",
    roomTextureClass: "room-texture-concrete",
    tickerPhrases: [
      "U8 STÖRUNG · ERSATZVERKEHR · OBVIOUSLY",
      "BERGHAIN DOOR · 4H QUEUE · SVEN SAYS NEIN",
      "SPÄTI ROUND: EIN BIER, EIN WASSER, EIN KUSS VON DER KASSE",
      "TEMPELHOFER FELD · 12 DOGS OFF LEASH · 12 OWNERS UNBOTHERED",
      "WOHNUNG FOUND IN 8 MINUTES · IN A FANTASY NOVEL",
    ],
    sampleTopic:
      "Name something you'd pull out of a Späti fridge at 5 a.m.",
    sampleAnswers: [
      { rank: 1, text: "A Suspiciously Warm Sterni", score: 34, flavorQuote: { personaName: "Tuesday Morning Raver", text: "It's room temperature, which means it's technically still cold for Berlin." } },
      { rank: 2, text: "Club-Mate (Obviously)", score: 28 },
      { rank: 3, text: "A Single Haribo Pack", score: 19 },
      { rank: 4, text: "Someone Else's Leftovers", score: 14 },
    ],
    sampleWildcard: {
      personaName: "Berghain Bouncer",
      flavorQuote: "Nein.",
    },
    palette: {
      roomBg: "#2A2A2A",
      roomInk: "#F5F5F0",
      tileShadow: "#FF00FF",
      wildcardAccent: "#39FF14",
      missAccent: "#FF0040",
      channelDot: "#39FF14",
    },
  },
  {
    id: "italian-village",
    displayName: "RAI QUATTRO · IL PAESE",
    channelLabel: "CH 04 · RAI QUATTRO · EDIZIONE PAESE",
    tagline: "The TV lives on a doily in a stone-walled kitchen in Puglia. Your nonna is absolutely judging you.",
    roomDescription:
      "Limestone walls warmed by a wood oven, a crocheted tablecloth, one cat asleep across the remote. Sunday sauce has been simmering since Thursday.",
    tickerPhrases: [
      "METEO · SOLE · MA LA NONNA DICE DI PORTARE UNA FELPA",
      "SAGRA DEL PEPERONCINO · INGRESSO GRATIS · LIVELLO PICCANTEZZA: DIO",
      "TRAFFICO · UNA VESPA · UN PASTORE · UN DIBATTITO",
      "CRONACA · GATTO DELLA PIAZZA RIELETTO SINDACO PER IL 7° ANNO",
      "SPORT · CALCIO POSTICIPATO · TUTTI A PRANZO",
    ],
    sampleTopic:
      "Nomina una cosa che la nonna dice quando sbagli la pasta.",
    sampleAnswers: [
      { rank: 1, text: "\"Mamma Mia!\" (Disappointed)", score: 31, flavorQuote: { personaName: "Nonna Giuseppina", text: "Ti ho visto mettere la panna. Non dirlo a nessuno. Mai." } },
      { rank: 2, text: "Invoke Ancestors By Name", score: 25 },
      { rank: 3, text: "Wooden Spoon Threat", score: 22 },
      { rank: 4, text: "Silent Stare For 9 Seconds", score: 15 },
    ],
    sampleWildcard: {
      personaName: "Il Gatto Della Piazza",
      flavorQuote: "Miao. (translation: I have seen what you did with the olive oil. I am not surprised.)",
    },
    palette: {
      roomBg: "#F4E4BC",
      roomInk: "#3B2A1A",
      tileShadow: "#6B8E23",
      wildcardAccent: "#E25822",
      missAccent: "#9B2335",
      channelDot: "#9B2335",
    },
  },
] as const;

export const DEFAULT_DEMOGRAPHIC_ID: DemographicId = "default";

export function getDemographic(id: DemographicId): DemographicSkin {
  const found = DEMOGRAPHICS.find((d) => d.id === id);
  if (!found) {
    throw new Error(`Unknown demographic: ${id}`);
  }
  return found;
}
