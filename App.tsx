import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Heart, BookOpen, Home, History, Bookmark, X, ChevronRight, Sparkles, RefreshCw } from 'lucide-react'

type Manga = {
  id: string
  title: string
  description: string
  status: string
  year?: number
  tags: string[]
  cover: string
  rating: string
}

const API = 'https://api.mangadex.org'
const titleOf = (m: any) => m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Tanpa judul'
const descriptionOf = (m: any) => m.attributes.description?.en || Object.values(m.attributes.description || {})[0] || 'Belum ada deskripsi.'

export default function App() {
  const [manga, setManga] = useState<Manga[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [tab, setTab] = useState('Terbaru')
  const [selected, setSelected] = useState<Manga | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('yans-favs') || '[]'))
  const [history, setHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem('yans-history') || '[]'))
  const [showFilters, setShowFilters] = useState(false)

  async function loadManga() {
    setLoading(true); setError('')
    try {
      const order = tab === 'Populer' ? 'followedCount' : tab === 'Rating' ? 'rating' : 'latestUploadedChapter'
      const params = new URLSearchParams()
      params.set('limit', '24')
      params.set('offset', '0')
      params.set('includes[]', 'cover_art')
      params.set(`order[${order}]`, 'desc')
      params.append('contentRating[]', 'safe')
      params.append('contentRating[]', 'suggestive')
      params.append('availableTranslatedLanguage[]', 'id')
      params.append('availableTranslatedLanguage[]', 'en')
      if (query.trim()) params.set('title', query.trim())
      const res = await fetch(`${API}/manga?${params.toString()}`)
      if (!res.ok) throw new Error('MangaDex sedang tidak bisa dihubungi. Coba lagi sebentar.')
      const data = await res.json()
      const items: Manga[] = data.data.map((m: any) => {
        const coverRel = m.relationships.find((r: any) => r.type === 'cover_art')
        const filename = coverRel?.attributes?.fileName
        return {
          id: m.id, title: titleOf(m), description: descriptionOf(m), status: m.attributes.status,
          year: m.attributes.year, tags: m.attributes.tags.slice(0, 3).map((t: any) => t.attributes.name.en).filter(Boolean),
          cover: filename ? `https://uploads.mangadex.org/covers/${m.id}/${filename}.256.jpg` : '',
          rating: m.attributes.contentRating || 'safe'
        }
      })
      setManga(items)
    } catch (e) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan.') }
    finally { setLoading(false) }
  }

  useEffect(() => { const timer = setTimeout(loadManga, 350); return () => clearTimeout(timer) }, [tab, query])
  useEffect(() => { localStorage.setItem('yans-favs', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('yans-history', JSON.stringify(history)) }, [history])

  const visible = useMemo(() => {
    let list = manga
    if (category !== 'Semua') list = list.filter(m => m.tags.some(t => t.toLowerCase().includes(category.toLowerCase())))
    if (tab === 'Favorit') list = list.filter(m => favorites.includes(m.id))
    return list
  }, [manga, category, tab, favorites])

  function openManga(m: Manga) { setSelected(m); setHistory(old => [m.id, ...old.filter(id => id !== m.id)].slice(0, 30)) }
  function toggleFavorite(id: string) { setFavorites(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]) }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => { setSelected(null); setTab('Terbaru') }}><span className="brand-mark">Y</span><span>Yans<span className="brand-accent">Manga</span></span></a>
      <nav className="desktop-nav"><button className={tab === 'Terbaru' ? 'nav-active' : ''} onClick={() => setTab('Terbaru')}>Beranda</button><button onClick={() => setTab('Populer')}>Populer</button><button onClick={() => setTab('Favorit')}>Favorit</button></nav>
      <div className="top-actions"><span className="status-dot"/><span className="online-label">MangaDex API</span><div className="avatar">Y</div></div>
    </header>

    <main id="top">
      {!selected ? <>
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR COMIC UNIVERSE</div><h1>Dunia cerita,<br/><span>tanpa batas.</span></h1><p>Temukan manga, manhwa, dan manhua favoritmu dalam satu tempat.</p><div className="hero-search"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari judul komik..."/><button onClick={() => setShowFilters(!showFilters)} aria-label="Filter"><SlidersHorizontal size={18}/></button></div></div>
          <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-card card-back">漫画</div><div className="hero-card card-front"><span>YANS</span><strong>MANGA</strong><small>READ YOUR NEXT STORY</small></div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div></div>
        </section>

        {showFilters && <div className="filter-panel"><div><b>Genre</b><div className="chips">{['Semua','Action','Romance','Fantasy','Comedy','Drama'].map(c => <button key={c} className={category === c ? 'chip selected' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}</div></div><button className="reset-filter" onClick={() => { setCategory('Semua'); setQuery('') }}>Reset filter</button></div>}

        <section className="catalog-section"><div className="section-heading"><div><div className="eyebrow muted">PILIHAN UNTUKMU</div><h2>Jelajahi komik</h2><p className="section-sub">Cerita seru menunggumu hari ini.</p></div><button className="refresh-btn" onClick={loadManga}><RefreshCw size={16}/> Refresh</button></div>
          <div className="tabs">{['Terbaru','Populer','Rating','Favorit'].map(t => <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}{t === 'Favorit' && favorites.length > 0 ? ` (${favorites.length})` : ''}</button>)}</div>
          {loading ? <div className="loading-grid">{Array.from({length:8}).map((_,i)=><div className="skeleton" key={i}/>)}</div> : error ? <div className="empty-state"><p>{error}</p><button className="primary-btn" onClick={loadManga}>Coba lagi</button></div> : visible.length === 0 ? <div className="empty-state"><BookOpen size={30}/><p>Belum ada komik di sini.</p><span>Coba kata kunci atau kategori lain.</span></div> : <div className="manga-grid">{visible.map(m => <article className="manga-card" key={m.id} onClick={() => openManga(m)}><div className="cover-wrap">{m.cover ? <img src={m.cover} alt={m.title} loading="lazy"/> : <div className="cover-fallback">Y<span>MANGA</span></div>}<button className={`favorite-btn ${favorites.includes(m.id) ? 'is-fav' : ''}`} onClick={e => {e.stopPropagation(); toggleFavorite(m.id)}} aria-label="Favorit"><Heart size={16} fill={favorites.includes(m.id) ? 'currentColor' : 'none'}/></button><span className="cover-label">{m.status === 'completed' ? 'TAMAT' : 'ONGOING'}</span></div><div className="manga-info"><h3>{m.title}</h3><p>{m.tags.slice(0,2).join(' · ') || 'Komik'}</p></div></article>)}</div>}
        </section>
      </> : <section className="detail-view"><button className="back-btn" onClick={() => setSelected(null)}>← Kembali ke katalog</button><div className="detail-card"><div className="detail-cover">{selected.cover && <img src={selected.cover} alt={selected.title}/>}</div><div className="detail-copy"><div className="eyebrow muted">DETAIL KOMIK</div><h1>{selected.title}</h1><div className="detail-tags">{selected.tags.map(t=><span key={t}>{t}</span>)}</div><p>{selected.description}</p><p className="detail-meta">Status: {selected.status} {selected.year ? ` · ${selected.year}` : ''}</p><button className="primary-btn" onClick={() => toggleFavorite(selected.id)}><Heart size={17} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'}/>{favorites.includes(selected.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}</button><div className="api-note">Data katalog dan sampul disediakan oleh MangaDex. Ketersediaan chapter mengikuti sumber MangaDex.</div></div></div></section>}
      <footer><div className="footer-brand">Yans<span>Manga</span></div><p>Temukan cerita favoritmu, satu chapter dalam satu waktu.</p><small>Data katalog dari MangaDex API · YansManga bukan afiliasi resmi MangaDex.</small><a href="https://mangadex.org/" target="_blank" rel="noreferrer">Kunjungi MangaDex <ChevronRight size={13}/></a></footer>
    </main>
    <nav className="mobile-nav"><button className={tab === 'Terbaru' ? 'mobile-active' : ''} onClick={() => {setSelected(null);setTab('Terbaru')}}><Home size={19}/><span>Beranda</span></button><button onClick={() => {setSelected(null);setTab('Populer')}}><Sparkles size={19}/><span>Populer</span></button><button onClick={() => {setSelected(null);setTab('Favorit')}}><Bookmark size={19}/><span>Favorit</span></button><button onClick={() => {setSelected(null);setTab('Terbaru');setQuery('')}}><History size={19}/><span>Jelajah</span></button></nav>
  </div>
}
