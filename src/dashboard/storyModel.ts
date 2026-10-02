import { selectArchive, summarize } from "./insights.ts";
export const eras = [
  {
    id: "youth",
    from: 2008,
    to: 2011,
    title: "The beginning",
    years: "2008–2011",
    line: "Before the records, there was a place to earn.",
    copy: "An ODI debut in 2008. A place in the 2011 World Cup-winning side. The early chapter was about turning promise into a permanent place in India’s batting order.",
    color: "#7da6bc",
  },
  {
    id: "rise",
    from: 2012,
    to: 2015,
    title: "The chase becomes his",
    years: "2012–2015",
    line: "A target became an invitation.",
    copy: "Hobart’s 133*. Mirpur’s 183. These were innings that gave run-chasing a new central character. In Adelaide, twin centuries on captaincy debut carried that intent into Test cricket.",
    color: "#d29a65",
  },
  {
    id: "peak",
    from: 2016,
    to: 2019,
    title: "The extraordinary, repeated",
    years: "2016–2019",
    line: "One great innings became an expectation.",
    copy: "The 973-run IPL season. The Mohali chase. A first Test series win in Australia as captain. Explore the covered ODI and T20I innings behind this remarkable stretch.",
    color: "#e6c47e",
  },
  {
    id: "reset",
    from: 2020,
    to: 2022,
    title: "The test of belief",
    years: "2020–2022",
    line: "The difficult chapter belongs in the story too.",
    copy: "The wait for an international hundred became part of the conversation. A T20I century in September 2022 ended that wait. Weeks later, Melbourne offered a different kind of answer.",
    color: "#aa9fca",
  },
  {
    id: "return",
    from: 2023,
    to: 2026,
    title: "More chapters to write",
    years: "2023–2026",
    line: "Records fell. The moments stayed.",
    copy: "The 50th ODI hundred at Wankhede. A World Cup final farewell to T20Is in Barbados. This chapter follows the later innings available in the archive, through July 2026.",
    color: "#88b8a1",
  },
] as const;
export function eraSummary(id: string, format: "ODI" | "T20I") {
  const era = eras.find((e) => e.id === id) || eras[2];
  const rows = selectArchive({ format }).filter(
    (r) =>
      Number(r.date.slice(0, 4)) >= era.from &&
      Number(r.date.slice(0, 4)) <= era.to,
  );
  return { era, rows, stats: summarize(rows) };
}
export const replayMatches = [
  {
    id: "1298150",
    name: "Melbourne ’22",
    opponent: "Pakistan",
    tag: "THE NIGHT BELIEF WON",
    title: "The chase that stopped a stadium.",
    copy: "India were 31/4 chasing 160. Kohli finished unbeaten on 82. Move through the overs to see how the innings grew.",
    format: "T20I",
  },
  {
    id: "951363",
    name: "Mohali ’16",
    opponent: "Australia",
    tag: "A CHASE, PERFECTLY PACED",
    title: "When timing was everything.",
    copy: "An unbeaten 82 from 51 balls in a chase of 161. Follow the acceleration that took India through this decisive World T20 group match.",
    format: "T20I",
  },
  {
    id: "518966",
    name: "Hobart ’12",
    opponent: "Sri Lanka",
    tag: "THE CHASE MASTER ARRIVES",
    title: "A target. A deadline. A statement.",
    copy: "India needed 321 inside 40 overs for a bonus point. Kohli’s 133* from 86 balls powered a finish in 36.4 overs.",
    format: "ODI",
  },
  {
    id: "535798",
    name: "Mirpur ’12",
    opponent: "Pakistan",
    tag: "THE ODI HIGH-WATER MARK",
    title: "183 reasons to remember.",
    copy: "Chasing 330 after an early wicket, Kohli made his highest ODI score. Follow the innings that turned a formidable target into a famous win.",
    format: "ODI",
  },
] as const;
