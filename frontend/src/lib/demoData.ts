export type ProfileSummary = {
  nickname: string;
  rank: string;
  kd: string;
  winRate: string;
  recent: Array<{ map: string; mode: string; result: string }>;
};

export type MatchPreview = {
  mode: string;
  map: string;
  teamKd: string;
  enemyKd: string;
  hs: string;
  damage: string;
};

export type InsightSummary = {
  mapWinRate: Array<{ map: string; winRate: string }>;
  timeHeat: Array<{ hour: number; winRate: string }>;
  compare: { win: string; kd: string; hs: string };
};

export function fetchProfileDemo(nickname: string): Promise<ProfileSummary> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          nickname,
          rank: "GM I",
          kd: "1.12",
          winRate: "54.7%",
          recent: [
            { map: "프로방스", mode: "랭크", result: "W" },
            { map: "제3보급창고", mode: "랭크", result: "L" },
            { map: "샤론", mode: "일반", result: "W" },
            { map: "웨어하우스", mode: "랭크", result: "W" },
          ],
        }),
      450
    )
  );
}

export function fetchMatchesDemo(_nickname: string): Promise<MatchPreview[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            mode: "랭크",
            map: "프로방스",
            teamKd: "52/41/11",
            enemyKd: "41/52/8",
            hs: "18%",
            damage: "34.2k",
          },
          {
            mode: "랭크",
            map: "샤론",
            teamKd: "48/50/9",
            enemyKd: "50/48/7",
            hs: "15%",
            damage: "33.8k",
          },
        ]),
      420
    )
  );
}

export function fetchInsightsDemo(_nickname: string): Promise<InsightSummary> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          mapWinRate: [
            { map: "프로방스", winRate: "57%" },
            { map: "웨어하우스", winRate: "61%" },
            { map: "샤론", winRate: "52%" },
          ],
          timeHeat: [
            { hour: 20, winRate: "63%" },
            { hour: 21, winRate: "58%" },
            { hour: 22, winRate: "55%" },
          ],
          compare: { win: "+4.2%", kd: "+0.08", hs: "+2.1%" },
        }),
      400
    )
  );
}

