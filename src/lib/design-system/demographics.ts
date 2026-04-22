/**
 * Demographic Skins — the "channel" layer of the design system.
 *
 * A Demographic is a themed collection of ~100 AI personas (see
 * `docs/glossary.md`). Visually, each demographic is a broadcast channel
 * layered on top of the Y2K Vice City TV chassis. It changes the screen
 * chrome tint, accent colors, LIVE bug, channel label, subject line, ticker
 * copy, and sample board content — but never the chassis geometry, borders,
 * fonts, or brutalist shadows.
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
  /** Broadcast chrome — rendered as the channel tag on the TV chin. */
  channelLabel: string;
  /** Plural noun completing "We asked 100 …". All-caps rendered by view. */
  subjectPlural: string;
  /** One-line mood description, shown in the channel menu. */
  tagline: string;
  /** Longer copy describing the room the TV lives in. Reserved for host
   *  lobby / about screens — NOT rendered outside the TV in gameplay. */
  roomDescription: string;
  /** Optional texture hint reserved for host-lobby scenes. Not used in the
   *  in-TV preview. */
  roomTextureClass?: "room-texture-stone" | "room-texture-concrete";
  /** News ticker phrases written in that channel's voice. */
  tickerPhrases: string[];
  /** A topic whose flavor this channel absolutely nails. */
  sampleTopic: string;
  /** Showcase tile count for this channel's preview board (3 | 5 | 7 | 8). */
  tileCount: 3 | 5 | 7 | 8;
  /** Enough sample answers to fill tileCount. Extras are ignored. */
  sampleAnswers: SampleAnswer[];
  /** Example wildcard payload for the <StrikeIndicator mode="wildcard" />. */
  sampleWildcard: { personaName: string; flavorQuote: string };
  /** TS mirror of the CSS theme tokens. Used by showcase swatches. */
  palette: Record<
    Extract<
      ThemedTokenKey,
      "roomBg" | "roomInk" | "tileShadow" | "wildcardAccent" | "missAccent" | "channelDot"
    >,
    HexColor
  >;
};

export const DEMOGRAPHICS: readonly DemographicSkin[] = [
  {
    id: "default",
    displayName: "VICE CITY BROADCAST",
    channelLabel: "CH 04 · VICE CITY FEED",
    subjectPlural: "late-night callers",
    tagline: "The canonical look. 1995 Miami hotel lobby at 2 a.m.",
    roomDescription:
      "Hot flamingo-pink wallpaper, a chrome-trimmed Sony Trinitron, late-night infomercials hallucinating across the screen.",
    tickerPhrases: [
      "BREAKING · FLAMINGO SIGHTED ORDERING DAIQUIRI AT DRIVE-THRU",
      "MARKETS · CHROME UP 6% · NEON HOLDING STEADY",
      "WEATHER · 88°F AND GETTING WEIRDER",
      "CELEBRITY · STALLONE SPOTTED BUYING 9 COCONUTS",
      "TECH · LOCAL MAN STILL REFUSES TO UPDATE HIS BEEPER",
    ],
    sampleTopic: "Name something you'd find in a wizard's suitcase.",
    tileCount: 5,
    sampleAnswers: [
      { rank: 1, text: "A Rolled-Up Newspaper", score: 32, flavorQuote: { personaName: "Tired Dad Wizard", text: "Need somethin' to swat the familiar with." } },
      { rank: 2, text: "Snacks For The Familiar", score: 24 },
      { rank: 3, text: "A Spare Wand (Just In Case)", score: 22 },
      { rank: 4, text: "An Expired Potion", score: 14 },
      { rank: 5, text: "Emergency Tea Bags", score: 8 },
    ],
    sampleWildcard: {
      personaName: "Anxious House Cat",
      flavorQuote:
        "I found a small glowing bug. I need to kill it. I need to protect my human. Why is it ticking.",
    },
    palette: {
      roomBg: "#FFC0CB",
      roomInk: "#1A0A10",
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
    subjectPlural: "Game of Thrones characters",
    tagline:
      "A TV propped on a stone table in a drafty castle. No one knows how it got here.",
    roomDescription:
      "Wet slate walls, torches guttering off-camera, a three-eyed raven sulking on the antenna. Winter is, as ever, coming.",
    roomTextureClass: "room-texture-stone",
    tickerPhrases: [
      "BREAKING · SMALL COUNCIL VOTES 6-1 TO IGNORE THE NORTH AGAIN",
      "WEATHER · WINTER STILL COMING · ETA: IMMINENT (PER SOURCES)",
      "SPORTS · TOURNEY POSTPONED AFTER THIRD UNEXPECTED BEHEADING",
      "MARKETS · IRON BANK RAISES RATES · LANNISTERS TO PAY EVENTUALLY",
      "WILDLING ALERT · 40,000 REPORTED NORTH OF THE WALL · PROBABLY FINE",
      "ROYAL GOSSIP · BRAN REPORTEDLY DOES NOTHING, BRILLIANTLY",
    ],
    sampleTopic: "Name something a Lannister does when they feel insulted.",
    tileCount: 8,
    sampleAnswers: [
      { rank: 1, text: "Sip Wine Judgmentally", score: 38, flavorQuote: { personaName: "Cersei Lannister", text: "I find your defiance refreshing. For nine more seconds." } },
      { rank: 2, text: "Order Someone Beheaded", score: 27 },
      { rank: 3, text: "Reference Their Gold", score: 21 },
      { rank: 4, text: "Recite Their Full Name", score: 14 },
      { rank: 5, text: "Stare At The Fire Silently", score: 9 },
      { rank: 6, text: "Send A Strongly-Worded Raven", score: 6 },
      { rank: 7, text: "Hum The Rains Of Castamere", score: 4 },
      { rank: 8, text: "Pretend To Forgive You", score: 1 },
    ],
    sampleWildcard: {
      personaName: "Tyrion Lannister",
      flavorQuote:
        "I drink, and I know things. Currently I know you shouldn't have said that.",
    },
    palette: {
      roomBg: "#2E343A",
      roomInk: "#E6E1D5",
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
    subjectPlural: "Berliner personas",
    tagline:
      "The TV is on a milk crate in a Neukölln WG at 6 a.m. The bassline is coming from three apartments away.",
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
    tileCount: 3,
    sampleAnswers: [
      { rank: 1, text: "A Suspiciously Warm Sterni", score: 46, flavorQuote: { personaName: "Tuesday Morning Raver", text: "It's room temperature, which is technically still cold for Berlin." } },
      { rank: 2, text: "Club-Mate (Obviously)", score: 34 },
      { rank: 3, text: "Someone Else's Leftovers", score: 18 },
    ],
    sampleWildcard: {
      personaName: "Berghain Bouncer",
      flavorQuote: "Nein.",
    },
    palette: {
      roomBg: "#1C1C1C",
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
    subjectPlural: "paesani",
    tagline:
      "The TV lives on a doily in a stone-walled kitchen in Puglia. Your nonna is absolutely judging you.",
    roomDescription:
      "Limestone walls warmed by a wood oven, a crocheted tablecloth, one cat asleep across the remote. Sunday sauce has been simmering since Thursday.",
    tickerPhrases: [
      "METEO · SOLE · MA LA NONNA DICE DI PORTARE UNA FELPA",
      "SAGRA DEL PEPERONCINO · INGRESSO GRATIS · LIVELLO: DIO",
      "TRAFFICO · UNA VESPA · UN PASTORE · UN DIBATTITO",
      "CRONACA · GATTO DELLA PIAZZA RIELETTO SINDACO · 7° ANNO",
      "SPORT · CALCIO POSTICIPATO · TUTTI A PRANZO",
    ],
    sampleTopic:
      "Nomina una cosa che la nonna dice quando sbagli la pasta.",
    tileCount: 7,
    sampleAnswers: [
      { rank: 1, text: "\"Mamma Mia!\" (Disappointed)", score: 31, flavorQuote: { personaName: "Nonna Giuseppina", text: "Ti ho visto mettere la panna. Non dirlo a nessuno. Mai." } },
      { rank: 2, text: "Invoke Ancestors By Name", score: 25 },
      { rank: 3, text: "Wooden Spoon Threat", score: 22 },
      { rank: 4, text: "Silent Stare For 9 Seconds", score: 15 },
      { rank: 5, text: "Call Your Mother Immediately", score: 11 },
      { rank: 6, text: "Sigh Audibly Three Times", score: 9 },
      { rank: 7, text: "Offer To Redo It Herself", score: 7 },
    ],
    sampleWildcard: {
      personaName: "Il Gatto Della Piazza",
      flavorQuote:
        "Miao. (translation: I have seen what you did with the olive oil. I am not surprised.)",
    },
    palette: {
      roomBg: "#E9D39A",
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
