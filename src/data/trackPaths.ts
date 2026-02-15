export interface TrackPath {
  trackId: string
  viewBox: string
  path: string
  startLine: number
}

export const trackPaths: TrackPath[] = [
  // Albert Park — lake-hugging layout with fast sweepers and chicanes
  {
    trackId: 'australia',
    viewBox: '0 0 200 200',
    path: 'M100 30 L120 32 Q140 35 150 50 L155 70 Q158 85 150 95 L140 105 Q130 115 135 130 L140 145 Q142 155 135 165 L120 175 Q110 180 95 178 L75 172 Q60 168 50 155 L42 140 Q38 125 42 110 L48 95 Q52 82 60 72 L70 58 Q78 45 90 35 Z',
    startLine: 0,
  },
  // Shanghai — distinctive long back straight, hairpin, and snail-shaped turns 1-3
  {
    trackId: 'china',
    viewBox: '0 0 200 200',
    path: 'M90 25 Q75 28 60 40 Q45 55 40 70 Q35 90 50 105 Q65 115 80 110 Q95 105 100 90 Q105 75 115 70 Q130 65 145 75 L155 90 L160 120 L158 150 Q155 165 140 172 L110 180 Q90 182 75 175 L55 162 Q40 150 38 135 L40 110 Q42 100 35 90 Q28 80 30 65 Q32 50 45 38 Q60 25 80 22 Z',
    startLine: 0,
  },
  // Suzuka — iconic figure-8 with esses, Degner curves, spoon, 130R
  {
    trackId: 'japan',
    viewBox: '0 0 200 200',
    path: 'M60 40 Q80 30 100 35 Q120 40 135 55 Q145 65 140 80 Q135 95 120 100 Q105 105 95 115 Q85 125 90 140 Q95 150 80 160 Q65 170 50 165 Q35 158 30 140 L28 120 Q26 105 35 92 Q45 80 55 75 Q65 70 70 60 Q75 48 65 42 Z',
    startLine: 0,
  },
  // Sakhir — angular desert circuit with multiple tight braking zones
  {
    trackId: 'bahrain',
    viewBox: '0 0 200 200',
    path: 'M100 25 L130 25 L145 40 L145 65 L130 75 L130 95 L150 110 L150 140 L140 155 L120 160 L110 175 L80 175 L65 160 L55 140 L55 110 L70 95 L70 75 L55 65 L55 40 L70 25 Z',
    startLine: 0,
  },
  // Jeddah Corniche — fast flowing street circuit, long straights
  {
    trackId: 'saudi-arabia',
    viewBox: '0 0 200 200',
    path: 'M70 25 L75 25 Q85 28 90 40 L92 70 Q93 80 88 88 Q82 95 78 105 L75 130 Q73 145 80 155 Q88 165 100 168 L130 170 Q145 168 155 158 L162 140 L165 100 Q165 80 158 65 Q150 50 140 42 L120 30 Q110 25 95 24 Z',
    startLine: 0,
  },
  // Miami International Autodrome — hard rock stadium area, mix of straights and chicanes
  {
    trackId: 'miami',
    viewBox: '0 0 200 200',
    path: 'M65 35 L140 35 Q155 38 160 50 L162 80 Q163 95 150 105 L120 115 Q110 120 108 130 L105 150 Q103 162 90 168 L65 172 Q50 170 42 158 L38 130 Q36 110 42 95 L50 75 Q55 60 58 45 Z',
    startLine: 0,
  },
  // Circuit Gilles Villeneuve — island circuit, long straights, tight chicanes, hairpin
  {
    trackId: 'canada',
    viewBox: '0 0 200 200',
    path: 'M50 45 L90 40 L130 40 Q145 42 150 55 L152 75 Q150 85 140 88 L115 90 Q105 92 100 100 L98 115 Q96 125 105 132 L140 140 Q155 145 160 158 Q162 170 150 178 L90 180 Q70 178 58 168 L45 150 Q38 138 40 120 L42 90 Q44 72 48 55 Z',
    startLine: 0,
  },
  // Monte Carlo — tight hairpin, tunnel, swimming pool chicane, harbor section
  {
    trackId: 'monaco',
    viewBox: '0 0 200 200',
    path: 'M80 30 L120 28 Q138 30 148 42 L155 60 Q158 72 150 82 L130 95 Q118 102 115 115 Q112 125 120 132 L145 145 Q155 152 152 165 Q148 175 135 178 L95 180 Q78 178 65 168 L50 150 Q42 138 40 120 Q38 100 45 85 L55 68 Q62 55 70 42 Z',
    startLine: 0,
  },
  // Barcelona-Catalunya — long main straight, sweeping final sector
  {
    trackId: 'spain',
    viewBox: '0 0 200 200',
    path: 'M95 25 L145 28 Q160 32 168 48 L170 70 Q170 85 158 95 L140 108 Q128 115 125 130 L122 150 Q120 162 108 170 L85 175 Q68 175 55 165 L42 148 Q35 135 38 118 L45 95 Q50 78 55 65 L65 48 Q75 32 88 26 Z',
    startLine: 0,
  },
  // Red Bull Ring — short, steep, fast with elevation changes
  {
    trackId: 'austria',
    viewBox: '0 0 200 200',
    path: 'M80 40 L120 35 Q140 38 152 52 L160 75 Q165 95 155 112 Q145 128 130 135 L105 145 Q88 150 75 142 L58 128 Q45 112 42 92 L40 70 Q42 52 55 42 Z',
    startLine: 0,
  },
  // Silverstone — high-speed flowing layout, Maggots-Becketts complex, Copse
  {
    trackId: 'great-britain',
    viewBox: '0 0 200 200',
    path: 'M85 30 L115 28 Q130 30 142 38 L158 52 Q168 65 170 82 Q172 100 162 115 L148 128 Q138 138 125 142 L105 148 Q90 152 78 148 Q65 142 55 130 L42 112 Q35 98 35 82 Q35 65 42 52 L55 38 Q68 30 78 28 Z',
    startLine: 0,
  },
  // Spa-Francorchamps — La Source, Eau Rouge, long Kemmel straight, sweeping through Ardennes
  {
    trackId: 'belgium',
    viewBox: '0 0 200 200',
    path: 'M55 35 L75 30 Q90 28 100 38 L108 55 Q112 68 125 72 L148 78 Q162 82 168 95 L170 120 Q170 140 158 152 L138 165 Q122 175 105 172 L80 168 Q62 162 50 148 L38 128 Q30 108 32 88 L35 65 Q38 48 48 38 Z',
    startLine: 0,
  },
  // Hungaroring — tight, twisty, low-speed, bowl-shaped
  {
    trackId: 'hungary',
    viewBox: '0 0 200 200',
    path: 'M100 30 L125 32 Q142 38 152 52 L158 72 Q162 90 155 105 Q148 118 138 128 L118 142 Q105 150 90 148 Q75 145 62 135 L48 118 Q40 102 42 85 L48 65 Q55 48 68 38 L85 30 Z',
    startLine: 0,
  },
  // Zandvoort — short, narrow, banked corners, sand dunes
  {
    trackId: 'netherlands',
    viewBox: '0 0 200 200',
    path: 'M90 35 L120 32 Q138 35 148 48 L155 68 Q160 85 152 100 L140 115 Q128 128 112 132 L90 135 Q72 132 60 120 L48 102 Q42 85 45 68 L52 50 Q60 38 75 34 Z',
    startLine: 0,
  },
  // Monza — Temple of Speed: very long straights, tight chicanes, Parabolica
  {
    trackId: 'italy',
    viewBox: '0 0 200 200',
    path: 'M90 25 L110 25 L145 30 Q160 35 165 50 L168 80 Q170 95 160 105 L145 112 Q135 115 130 125 L125 145 Q122 158 110 165 L85 172 Q68 175 55 165 L42 148 Q35 132 38 115 L45 90 Q48 70 52 55 L60 38 Q70 28 82 25 Z',
    startLine: 0,
  },
  // IFEMA Madrid — new circuit, modern layout with mix of fast and technical sections
  {
    trackId: 'madrid',
    viewBox: '0 0 200 200',
    path: 'M70 30 L135 30 Q150 33 158 45 L165 70 L168 100 Q168 118 155 130 L135 142 Q125 148 120 160 L115 175 Q108 182 95 180 L65 175 Q50 170 42 155 L38 130 L35 100 Q35 80 42 65 L52 45 Q60 33 68 30 Z',
    startLine: 0,
  },
  // Baku City Circuit — ultra-long main straight, tight old city section, castle complex
  {
    trackId: 'azerbaijan',
    viewBox: '0 0 200 200',
    path: 'M75 25 L85 25 L88 60 L90 100 L92 130 Q93 142 102 148 L125 155 Q140 158 148 148 L155 130 L158 100 L156 70 Q154 55 142 45 L120 35 Q108 30 95 28 L80 25 Z',
    startLine: 0,
  },
  // Marina Bay — night street circuit, many 90-degree turns, tight and bumpy
  {
    trackId: 'singapore',
    viewBox: '0 0 200 200',
    path: 'M65 40 L135 40 L140 45 L140 75 L155 75 L155 110 L140 110 L140 140 L135 145 L100 145 L100 165 L65 165 L60 160 L60 110 L45 110 L45 75 L60 75 L60 45 Z',
    startLine: 0,
  },
  // COTA — iconic elevation change turn 1, esses section inspired by Silverstone/Hockenheim, long back straight
  {
    trackId: 'united-states',
    viewBox: '0 0 200 200',
    path: 'M80 30 L95 28 Q108 30 118 42 L128 60 Q135 72 145 78 L160 85 Q172 90 175 105 L175 130 Q172 148 158 158 L135 168 Q118 175 100 172 L75 165 Q58 158 48 142 L40 120 Q35 102 38 85 L45 65 Q52 48 65 38 Z',
    startLine: 0,
  },
  // Hermanos Rodriguez — long main straight, Peraltada, stadium section, high altitude
  {
    trackId: 'mexico',
    viewBox: '0 0 200 200',
    path: 'M70 35 L140 35 Q155 38 162 52 L168 75 Q170 92 160 105 L142 118 Q130 125 125 140 Q120 155 108 162 L85 170 Q68 172 55 162 L42 145 Q35 130 35 112 L38 85 Q40 65 50 50 L60 38 Z',
    startLine: 0,
  },
  // Interlagos — short, anti-clockwise, elevation changes, S do Senna
  {
    trackId: 'brazil',
    viewBox: '0 0 200 200',
    path: 'M110 30 Q125 32 138 42 L152 58 Q162 72 160 90 Q158 108 145 118 L125 130 Q110 138 100 150 Q90 162 75 165 Q58 168 45 158 L35 140 Q28 122 32 105 L40 85 Q48 68 60 55 L78 42 Q92 32 105 30 Z',
    startLine: 0,
  },
  // Las Vegas Strip — long straights on the Strip, 90-degree turns, high speed
  {
    trackId: 'las-vegas',
    viewBox: '0 0 200 200',
    path: 'M60 30 L80 30 L80 80 L140 80 L140 30 L160 30 L165 35 L165 120 Q162 135 150 142 L110 148 Q95 150 85 158 L75 170 Q68 178 55 175 L42 165 Q35 155 35 140 L35 55 Q38 38 50 32 Z',
    startLine: 0,
  },
  // Lusail International — fast, flowing, mostly medium/high-speed corners
  {
    trackId: 'qatar',
    viewBox: '0 0 200 200',
    path: 'M95 28 L125 28 Q142 32 155 45 L165 65 Q172 82 168 100 Q165 118 152 132 L135 148 Q120 158 102 160 L82 158 Q65 152 52 138 L40 118 Q32 100 35 82 L42 62 Q50 45 65 35 L82 28 Z',
    startLine: 0,
  },
  // Yas Marina — hotel straddling the track, harbor section, tight final sector
  {
    trackId: 'abu-dhabi',
    viewBox: '0 0 200 200',
    path: 'M90 28 L120 28 Q138 32 150 45 L162 65 Q170 80 170 100 L168 125 Q165 142 150 155 L130 165 Q115 172 98 170 L75 165 Q58 158 45 142 L35 120 Q30 100 35 80 L45 58 Q55 42 70 32 Z',
    startLine: 0,
  },
]

export function getTrackPath(trackId: string): TrackPath | undefined {
  return trackPaths.find((tp) => tp.trackId === trackId)
}
