export type Finalist = {
  rank: number
  name: string
  repository?: string
}

// Official final standings from final-with-rank.csv. Repository links are matched by
// rank, team name, and captain email from final-with-github-urls.csv.
export const finalists: Finalist[] = [
  { rank: 1, name: 'OpenCollab（zhx）' },
  { rank: 2, name: '我和我们的队友都想去 gosim 参加颁…（VOLO-AI）', repository: 'https://github.com/thunderstone-group/volo-factory-finals' },
  { rank: 3, name: "Limitless'（Limitless'）" },
  { rank: 4, name: 'Orchestro（Orchestro）', repository: 'https://github.com/gaoyu06/arcbench-agent' },
  { rank: 5, name: 'Eto Demerzel（RyanSanchez）' },
  { rank: 6, name: 'haiknow（haiknow）', repository: 'https://github.com/anson-zas/haiknow-arc-hackathon-pub' },
  { rank: 7, name: 'bzt（bzt）', repository: 'https://github.com/qcqcgaga/OAIC2026_final_by_BZT_7th' },
  { rank: 8, name: 'Shallow（Shallow）', repository: 'https://github.com/TheaDust/Shallow' },
  { rank: 9, name: '午夜里，贝奥兰迪驾车登上尻名山，只因范达…（尻名山掌管排水渠过弯的神）', repository: 'https://github.com/inoichi1009207/smoke-agent/' },
  { rank: 10, name: 'gto（gto）', repository: 'https://github.com/Altman-conquer/factory26-hackathon-r17' },
  { rank: 11, name: 'Abram（Abram）', repository: 'https://github.com/Abarm009/Abram' },
  { rank: 12, name: 'fuxing（fuxing）', repository: 'https://github.com/sjok666/arc-bench' },
  { rank: 13, name: 'AIOS（AIOS）', repository: 'https://github.com/amosarc/octos-arc' },
  { rank: 14, name: 'Lan_zhijiang（Lan_zhijiang）', repository: 'https://github.com/xiaoland/gosim-factory26' },
  { rank: 15, name: 'evenni（evenni）' },
  { rank: 16, name: 'Amazing（Amazing）', repository: 'https://github.com/Zzhousx/agentic-software-factory' },
  { rank: 17, name: 'xinyurun（xinyurun）', repository: 'https://github.com/xinyurun215/oaic' },
  { rank: 18, name: 'wqing0093（wqing0093）' },
  { rank: 19, name: 'windy664（windy664）', repository: 'https://github.com/windy664/Torine-hackathon-agent-ts' },
  { rank: 20, name: 'HH（HH）' },
]

export function repositoryLabel(repository: string) {
  return repository.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '')
}
