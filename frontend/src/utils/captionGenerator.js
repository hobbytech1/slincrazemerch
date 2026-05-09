// captionGenerator.js
// Bruk denne i merch-appen din for å lage random captions til humor merch og music merch.

export const hooksNO = [
  "POV:",
  "ny drop",
  "endelig ute",
  "denne går hardt",
  "ok men hør her",
  "æ kan ikke lyve",
  "lavmælt clean",
  "ka i all verden 😭",
  "denne føles dyr",
  "ekte bygdeenergi",
  "samisk streetwear",
  "jatta jatta energi",
  "for de ekte",
  "denne e unødvendig hard",
  "ser ut som et problem",
  "musikk møter streetwear",
  "minimalistisk men høylytt",
  "denne hører hjemme på festival",
  "midnattskjøring outfit",
  "denne føles ulovlig å gå med",
  "sámi drip",
  "ser ut som dårlig dømmekraft 🔥",
  "nordnorsk main character energy",
];

export const humorCaptionsNO = [
  "100% bygdegodkjent",
  "jatta jatta approved",
  "ser bedre ut etter kl 02",
  "perfekt for dårlige avgjørelser",
  "garantert awkward øyekontakt",
  "denne hoodien sender meldinga ‘u våken?’",
  "for emosjonelt utilgjengelige legender",
  "ser ut som den kjører scooter uten hjelm",
  "denne tskjorta e et rødt flagg",
  "perfekt outfit for å si ‘oja’ uten grunn",
  "kan føre til situationships",
  "ser ut som nån som ikke svarer på snap",
  "bygdefest uniform",
  "denne lukter energidrikk og dårlig søvn",
  "for folk som sier ‘det ordner sæ’",
  "denne e for deg som alltid har en dårlig idé",
  "brukes med ekstrem selvtillit",
  "perfekt for å late som du har kontroll",
  "denne sier mer enn du burde",
  "offisiell uniform for flørt og kaos",
];

export const musicCaptionsNO = [
  "inspirert av musikken",
  "ekte artist merch",
  "fra studio til gata",
  "laget under sene studiosessions",
  "albumenergi i klesform",
  "musikk du kan ha på dæ",
  "denne føles som en unreleased sang",
  "for de som faktisk høre etter",
  "nordlige netter gjort om til design",
  "lydspor energi",
  "rapperuniform",
  "denne føles cinematic",
  "musikk + streetwear",
  "fra Sápmi med kaos",
  "designet midt i kreativ galskap",
  "for de som spiller låtan på repeat",
  "merch med mening",
  "ikke bare et print, men en stemning",
  "fra teksten til tskjorta",
  "denne bærer sounden",
];

export const CTA_NO = [
  "ville du gått med denne?",
  "vær ærlig 👀",
  "cop eller drop?",
  "1-10?",
  "hoodie eller tee?",
  "hvilken farge neste?",
  "skal æ slippe flere?",
  "trenger denne 😭",
  "hard eller cringe?",
  "festivalfit godkjent?",
  "tagg en som hadde brukt denne",
  "hvem kjøper denne?",
  "skal denne inn i shoppen?",
  "burde denne trykkes?",
  "hvilken versjon er best?",
];

export const emojisNO = [
  "🔥",
  "😭",
  "💀",
  "👀",
  "❄️",
  "🖤",
  "🦌",
  "⚡",
  "😂",
  "🥶",
];

export const hashtagsNO = [
  "#streetwear",
  "#merch",
  "#jattajatta",
  "#slincraze",
  "#sapmi",
  "#sami",
  "#hoodie",
  "#tshirt",
  "#bygdefest",
  "#nordnorge",
  "#fyp",
  "#viral",
  "#artistmerch",
  "#streetstyle",
  "#samisk",
  "#creator",
  "#musikk",
  "#norsktiktok",
  "#sjekketriks",
  "#northernvibes",
];

export function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function generateCaption(type = "humor") {
  const middle = type === "music" ? random(musicCaptionsNO) : random(humorCaptionsNO);

  return `${random(hooksNO)} ${random(emojisNO)}\n\n${middle}\n\n${random(CTA_NO)}\n\n${shuffle(hashtagsNO).slice(0, 5).join(" ")}`;
}

export function generateHumorCaption() {
  return generateCaption("humor");
}

export function generateMusicCaption() {
  return generateCaption("music");
}
