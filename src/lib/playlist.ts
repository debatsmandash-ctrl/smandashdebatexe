import interstellar from "@/assets/interstellar-theme.mp3.asset.json";
import noTime from "@/assets/audio/notime-for-caution.mp3.asset.json";
import stay from "@/assets/audio/stay-at-your-house.mp3.asset.json";
import dragonspine from "@/assets/audio/dragonspine-medley.mp3.asset.json";
import dreamAria from "@/assets/audio/dream-aria.mp3.asset.json";
import columbina from "@/assets/audio/columbina-lullaby.mp3.asset.json";
import canYouHear from "@/assets/audio/can-you-hear-the-music.mp3.asset.json";
import timeInception from "@/assets/audio/time-inception.mp3.asset.json";
import internationale from "@/assets/audio/internationale-sovietwave.mp3.asset.json";
import inThePool from "@/assets/audio/in-the-pool.mp3.asset.json";
import solace from "@/assets/audio/solace-txmy.mp3.asset.json";
import solas from "@/assets/audio/solas-jamie-duffy.mp3.asset.json";

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const TRACKS: Track[] = [
  { id: "interstellar",  title: "Interstellar Theme",            artist: "Hans Zimmer",        url: interstellar.url },
  { id: "time-inception",title: "Time",                          artist: "Hans Zimmer",        url: timeInception.url },
  { id: "can-you-hear",  title: "Can You Hear The Music (slow)", artist: "Ludwig Göransson",   url: canYouHear.url },
  { id: "no-time",       title: "No Time For Caution",           artist: "Hans Zimmer",        url: noTime.url },
  { id: "stay",          title: "I Really Want to Stay",         artist: "Rosa Walton",        url: stay.url },
  { id: "dragonspine",   title: "Dragonspine Medley",            artist: "Genshin Impact",     url: dragonspine.url },
  { id: "dream-aria",    title: "Dream Aria",                    artist: "Genshin Impact",     url: dreamAria.url },
  { id: "columbina",     title: "Columbina's Lullaby",           artist: "Genshin Impact",     url: columbina.url },
  { id: "internationale",title: "The Internationale (Sovietwave)",artist: "Forte Republic",    url: internationale.url },
  { id: "in-the-pool",   title: "In The Pool",                   artist: "The Dreamer Piano",  url: inThePool.url },
  { id: "solace",        title: "Solace",                        artist: "Txmy",               url: solace.url },
  { id: "solas",         title: "Solas",                         artist: "Jamie Duffy",        url: solas.url },
];

export const DEFAULT_ENABLED_TRACKS: Record<string, boolean> = Object.fromEntries(
  TRACKS.map((t) => [t.id, true])
);
