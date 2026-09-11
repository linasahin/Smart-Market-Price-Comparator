// Smart Market — shared design tokens & style objects

export const colors = {
  // ── Topbar / bottombar ──────────────────────────
  topbar:       '#1e2d4a',
  topbarText:   '#ffffff',
  topbarSub:    '#a8b8d8',
  topbarMuted:  'rgba(255,255,255,0.15)',

  // ── Sayfa & kart ────────────────────────────────
  pageBg:       '#f5f6f9',
  cardBg:       '#ffffff',
  border:       '#d0d6e8',
  softBorder:   '#dde2f0',

  // ── Metin ───────────────────────────────────────
  textDark:     '#1e2d4a',
  textMid:      '#3a5280',
  textLight:    '#6a7898',
  textPale:     '#a8b0c8',

  // ── Butonlar ────────────────────────────────────
  primary:      '#1e2d4a',    // ana buton — lacivert
  forward:      '#f0c030',    // ileri git — sarı
  forwardText:  '#1a1a00',    // sarı üzeri koyu metin

  // ── Chip & bar ──────────────────────────────────
  chipOnBg:     '#1e2d4a',
  chipOnText:   '#ffffff',
  totalBg:      '#e8ecf7',
  qbtnBg:       '#e8ecf7',

  // ── Geriye uyumluluk (eski ekranlar hâlâ kullanıyor) ──
  darkGreen:    '#1e2d4a',
  midGreen:     '#3a5280',
  lightGreen:   '#6a7898',
  paleGreen:    '#a8b0c8',
  bgGreen:      '#e8ecf7',
  borderGreen:  '#d0d6e8',
};

export const s = {
  phone: {
    width: '100%',
    background: colors.pageBg,
    borderRadius: 20,
    overflow: 'hidden',
    border: `1.5px solid ${colors.border}`,
    fontFamily: 'system-ui, sans-serif',
  },

  topbar: {
    background: colors.topbar,
    padding: '11px 14px 9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tbTitle: { fontSize: 15, fontWeight: 600, color: colors.topbarText },
  tbSub:   { fontSize: 11, color: colors.topbarSub },

  body: {
    background: 'rgba(245,246,249,0.93)',
    padding: '11px 12px',
  },

  searchBar: {
    background: '#ffffff',
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: '7px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },

  chip: {
    background: '#ffffff',
    color: colors.textMid,
    border: `1px solid ${colors.border}`,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chipOn: {
    background: colors.chipOnBg,
    color: colors.chipOnText,
    borderColor: colors.chipOnBg,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  pcard: {
    background: '#ffffff',
    border: `1px solid ${colors.softBorder}`,
    borderRadius: 10,
    overflow: 'hidden',
  },
  pimg: {
    background: '#edf0f7',
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinfo: { padding: '6px 7px' },
  pname: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.textDark,
    marginBottom: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pprice:    { fontSize: 13, fontWeight: 600, color: colors.textDark },
  ppriceSub: { fontSize: 10, color: colors.textLight },

  // Ana buton — lacivert (Seçenekler, Sepete ekle)
  greenBtn: {
    background: colors.primary,
    color: '#ffffff',
    borderRadius: 10,
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
  },

  // İleri git butonu — sarı (Sepetim, Rotaları karşılaştır, Haritada gör, Sonuçlara dön)
  forwardBtn: {
    background: colors.forward,
    color: colors.forwardText,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    cursor: 'pointer',
    border: '1.5px solid rgba(0,0,0,0.15)',
    width: '100%',
  },

  outlineBtn: {
    border: `1px solid ${colors.border}`,
    color: colors.textDark,
    borderRadius: 10,
    padding: '9px 14px',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 7,
    background: '#ffffff',
    cursor: 'pointer',
    width: '100%',
    display: 'block',
  },

  // Geri ok — topbar içinde blend
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: colors.topbarMuted,
    border: 'none',
    color: colors.topbarText,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  bnav: {
    background: '#ffffff',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '7px 0 5px',
  },
  navItem:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  navLabel:   { fontSize: 9, color: colors.textPale },
  navLabelOn: { fontSize: 9, color: colors.topbar },

  bcard: {
    background: 'rgba(255,255,255,0.96)',
    border: `1px solid ${colors.softBorder}`,
    borderRadius: 10,
    padding: '9px 11px',
    marginBottom: 7,
  },
  bcTitle: { fontSize: 13, fontWeight: 500, color: colors.textDark, marginBottom: 5 },

  qbtn: {
    background: colors.qbtnBg,
    color: colors.textDark,
    borderRadius: 5,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
  },

  totalBar: {
    background: colors.totalBg,
    borderRadius: 9,
    padding: '9px 13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '8px 0',
  },
};

// Zincir chip renkleri
export const storeBadgeStyle = (store) => {
  const map = {
    A101:      { background: '#deeafc', color: '#1a4a8a' },
    BIM:       { background: '#fde8e8', color: '#8b1a1a' },
    SOK:       { background: '#e3f5e8', color: '#1a5c2a' },
    MIGROS:    { background: '#fdf0e0', color: '#8b4a00' },
    CF:        { background: '#ede8fc', color: '#4a1a8b' },
    CARREFOUR: { background: '#ede8fc', color: '#4a1a8b' },
  };
  return {
    ...(map[store] || { background: '#e8ecf7', color: '#3a5280' }),
    display: 'inline-block',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 3,
    marginRight: 3,
  };
};