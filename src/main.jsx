import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const stages = [
  { name: 'دوستان حیوانی', icon: '🐾', items: [['🐶','سگ','dog','سگ حیوان وفاداری است.'],['🐱','گربه','cat','گربه پنجه‌های نرم دارد.'],['🐰','خرگوش','rabbit','خرگوش گوش‌های بلند دارد.'],['🦁','شیر','lion','شیر پادشاه جنگل است.'],['🐘','فیل','elephant','فیل خرطوم بلند دارد.'],['🐟','ماهی','fish','ماهی در آب شنا می‌کند.']] },
  { name: 'میوه‌های خوشمزه', icon: '🍎', items: [['🍎','سیب','apple','سیب میوه‌ای قرمز و خوشمزه است.'],['🍌','موز','banana','موز زرد و شیرین است.'],['🍓','توت‌فرنگی','strawberry','توت‌فرنگی قرمز و خوش‌عطر است.'],['🍇','انگور','grape','انگور دانه‌های کوچک دارد.'],['🍉','هندوانه','watermelon','هندوانه سبز و آبدار است.'],['🍊','پرتقال','orange','پرتقال ویتامین سی دارد.']] },
  { name: 'رنگ‌های جادویی', icon: '🌈', items: [['🔴','قرمز','red','قرمز رنگ سیب است.'],['🔵','آبی','blue','آبی رنگ آسمان است.'],['🟡','زرد','yellow','زرد رنگ خورشید است.'],['🟢','سبز','green','سبز رنگ چمن است.'],['🟣','بنفش','purple','بنفش رنگ زیبایی است.'],['🟠','نارنجی','orange','نارنجی رنگ پرتقال است.']] },
]
const allStages = Array.from({ length: 10 }, (_, i) => stages[i % stages.length])
const robots = ['ربات ۱', 'ربات ۲', 'ربات ۳']
const robotStartingProgress = [0.6, 1.8, 1.2]
const audioBase = `${import.meta.env.BASE_URL}audio/`
const speak = (text, lang = 'fa-IR', onError) => {
  // On Android Chrome, voices may load asynchronously. Waiting for
  // `voiceschanged` loses the tap gesture that is required to start audio,
  // so queue the utterance synchronously and use a voice only when available.
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    onError?.()
    return false
  }
  const synth = window.speechSynthesis
  const utterance = new window.SpeechSynthesisUtterance(text)
  const languagePrefix = lang.split('-')[0].toLowerCase()
  const voice = synth.getVoices().find(item => item.lang.toLowerCase().startsWith(languagePrefix))
  if (voice) utterance.voice = voice
  utterance.lang = lang
  utterance.rate = lang.startsWith('fa') ? .78 : .86
  utterance.pitch = 1.3
  utterance.volume = 1
  utterance.onerror = () => onError?.()
  synth.cancel()
  synth.resume()
  synth.speak(utterance)
  return true
}
const normalize = s => String(s).toLowerCase().replace(/[\s‌-]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک')

function App() {
  const [user, setUser] = useState('')
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [count, setCount] = useState(0)
  const [stageNo, setStageNo] = useState(1)
  const [selected, setSelected] = useState(null)
  const [passed, setPassed] = useState([])
  const [score, setScore] = useState(0)
  const [listening, setListening] = useState(false)
  const [notice, setNotice] = useState('')
  const [showFallback, setShowFallback] = useState(false)
  const [audioNotice, setAudioNotice] = useState('')
  const [recognitionLang, setRecognitionLang] = useState('fa-IR')
  const [retryVisible, setRetryVisible] = useState(false)
  const welcomeOpen = false
  const welcomeNotice = ''
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [robotProgress, setRobotProgress] = useState(robotStartingProgress)
  const [stageWinner, setStageWinner] = useState(null)
  const [robotWinner, setRobotWinner] = useState(0)
  const recognition = useRef(null)
  const audioPlayer = useRef(null)
  const robotProgressRef = useRef([...robotStartingProgress])
  const stage = allStages[stageNo - 1]
  const players = useMemo(() => [user, ...robots], [user])

  useEffect(() => { if (!joining || count === 0) return; const t = setTimeout(() => setCount(c => c - 1), 1000); return () => clearTimeout(t) }, [joining, count])
  useEffect(() => { if (joining && count === 0) { const t = setTimeout(() => setJoining(false), 900); return () => clearTimeout(t) } }, [joining, count])
  useEffect(() => {
    if (passed.length === 6 && !stageWinner) {
      setFinished(true)
      setStageWinner('user')
    }
  }, [passed, stageWinner])

  useEffect(() => {
    if (joining || !user || finished || stageWinner || passed.length === 6) return
    const timer = setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          const highestProgress = Math.max(...robotProgressRef.current)
          setRobotWinner(robotProgressRef.current.indexOf(highestProgress))
          setStageWinner('robot')
          setFinished(false)
          setSelected(null)
          setNotice('')
          return 0
        }
        return previous - 1
      })
      setRobotProgress(previous => {
        const next = previous.map((items, index) => Math.min(6, items + (index === 0 ? 0.08 : index === 1 ? 0.05 : 0.02)))
        robotProgressRef.current = next
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [joining, user, finished, stageWinner, passed.length])

  async function login(e) {
    e.preventDefault(); const wanted = name.trim(); if (!wanted) return
    if ('speechSynthesis' in window) window.speechSynthesis.resume()
    let assigned = wanted
    try { const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username:wanted }) }); const d = await r.json(); if (d.username) assigned = d.username } catch { const used = JSON.parse(localStorage.getItem('kalambaz-users') || '[]'); assigned = used.includes(wanted) ? `${wanted}${Math.floor(100 + Math.random()*900)}` : wanted; localStorage.setItem('kalambaz-users', JSON.stringify([...used, assigned])) }
    setCount(Math.floor(Math.random() * 21))
    setUser(assigned); setJoining(true)
  }
  function playLocalAudio(fileName, onError, onEnded) {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined' || !fileName) { onError?.(); return false }
    audioPlayer.current?.pause()
    const audio = new window.Audio(`${audioBase}${fileName}`)
    let failed = false
    const fail = () => { if (!failed) { failed = true; onError?.() } }
    audio.preload = 'auto'
    audio.volume = 1
    audio.onerror = fail
    audio.onended = () => onEnded?.()
    audioPlayer.current = audio
    try {
      const result = audio.play()
      result?.catch(fail)
    } catch {
      fail()
    }
    return true
  }
  function playDescription(text, item, onEnded) {
    setAudioNotice('')
    const category = ((stageNo - 1) % stages.length) + 1
    const fallback = () => {
      const available = speak(`${text} حالا اسمش را بگو!`, 'fa-IR', () => setAudioNotice('Persian audio is unavailable. Enable text-to-speech on the phone.'))
      if (!available) setAudioNotice('Audio is unavailable in this browser. Enable text-to-speech on the phone.')
      window.setTimeout(() => onEnded?.(), 1800)
    }
    const continueListening = () => {
      speak('حالا اسمش را بگو!', 'fa-IR')
      window.setTimeout(() => onEnded?.(), 700)
    }
    if (!playLocalAudio(item ? `${category}-${item[2]}.wav` : '', fallback, continueListening)) fallback()
  }
  function openItem(item) { setSelected(item); setNotice(''); setShowFallback(false); setRetryVisible(false); playDescription(item[3], item, () => useMic(item, recognitionLang)) }
  function replayWelcome() {}
  function useMic(item, language = recognitionLang) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setShowFallback(true); setNotice('مرورگرت میکروفون را پشتیبانی نمی‌کند.'); return }
    const r = new SR(); recognition.current = r; r.lang = language; r.interimResults = false; setListening(true); setRetryVisible(false)
    r.onresult = e => {
      const transcript = e.results[0][0].transcript
      const normalized = normalize(transcript)
      const expectedFa = normalize(item[1])
      if (language === 'fa-IR' && normalized !== expectedFa) {
        useMic(item, 'en-US')
        return
      }
      checkAnswer(transcript, item)
    }
    r.onerror = () => { setListening(false); setShowFallback(true); setRetryVisible(true); setNotice('صدایت را نشنیدم. تلاش مجدد کن!') }; r.onend = () => setListening(false); r.start()
  }
  function checkAnswer(answer, item) {
    if (stageWinner || finished) return
    const said = normalize(answer), fa = normalize(item[1]), en = normalize(item[2]); const points = said === en ? 20 : said === fa ? 10 : 0
    if (!points) { setRetryVisible(true); setShowFallback(true); setNotice('تلاش مجدد! دوباره اسم تصویر را بگو.'); speak('تلاش مجدد! دوباره اسم تصویر را بگو.'); return }
    if (!passed.includes(item[1])) { setPassed(p => [...p, item[1]]); setScore(s => s + points) }
    setRetryVisible(false); setShowFallback(false)
    const feedback = points === 20 ? 'آفرین! درست گفتی و بیست امتیاز گرفتی.' : 'آفرین! درست گفتی و ده امتیاز گرفتی.'
    setNotice(feedback); speak(feedback, 'fa-IR')
    setTimeout(() => { setSelected(null); setNotice('') }, 1500)
  }
  function resetStage() {
    const startingProgress = [...robotStartingProgress]
    robotProgressRef.current = startingProgress
    setPassed([]); setSelected(null); setFinished(false); setStageWinner(null); setRobotWinner(0); setTimeLeft(60); setRobotProgress(startingProgress); setNotice('')
  }
  function nextStage() {
    setStageNo(n => n >= 10 ? 1 : n + 1)
    if (stageNo >= 10) setScore(0)
    resetStage()
  }
  if (!user) return <main className="login"><div className="cloud c1">☁️</div><div className="cloud c2">☁️</div><div className="logo">کلم<span>باز</span><small>بازی با کلمه‌ها</small></div><div className="mascot">🦊</div><form onSubmit={login}><h1>سلام دوست کوچولو!</h1><p>اسمت چیه؟ با هم بازی کنیم.</p><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام بازیکن" autoFocus /><button>شروع بازی 🚀</button></form></main>
  if (joining) return <main className="lobby"><div className="spinner">✨</div><h1>داریم دوست‌ها را پیدا می‌کنیم</h1><p>تا شروع بازی <b>{count}</b> ثانیه مانده</p><div className="playerchips"><i>{user} 🧒</i>{robots.map((x,i)=><i className="waiting" key={x}>{count < 3*(i+1) ? x+' 🤖' : 'در انتظار…'}</i>)}</div><small>اگر دوستی نیاید، ربات‌ها با ما بازی می‌کنند!</small></main>
  return <main className="game"><header><div className="brand">کلم<span>باز</span></div><div className="stage">مرحله {stageNo} از ۱۰ <b>{stage.icon} {stage.name}</b></div><div className={`time ${timeLeft <= 10 ? 'urgent' : ''}`}>⏱ {timeLeft}</div><div className="score">⭐ {score}</div></header><section className="race">{players.map((p,i)=><div key={p}><span>{i ? '🤖':'🧒'}</span><em>{p}</em><div className="track"><i style={{width:`${i ? Math.min(100, (robotProgress[i - 1] / 6) * 100) : (passed.length / 6) * 100}%`}} /></div></div>)}</section><div className="instruction">روی یک تصویر بزن، گوش کن و سپس اسمش را با میکروفون بگو! 🎤</div><section className="cards">{stage.items.map((it,i)=><button className={`card ${passed.includes(it[1])?'done':''}`} onClick={()=>openItem(it)} key={it[1]}><span>{it[0]}</span><b>{passed.includes(it[1])?'آفرین! ✓':'تصویر '+(i+1)}</b></button>)}</section>{selected && <div className="modal"><div className="popup"><button className="close" onClick={()=>setSelected(null)}>×</button><div className="bigemoji">{selected[0]}</div><p>{selected[3]}</p><div className="score-hint">راهنما: انگلیسی بگو <b>۲۰ امتیاز</b>، فارسی بگو <b>۱۰ امتیاز</b> ⭐</div><button className="speak-description" onClick={()=>playDescription(selected[3], selected)}>🔊 گوش کن</button><button className={`mic ${listening?'pulse':''}`} onClick={()=>useMic(selected)}>🎤<small>{listening?'گوش می‌دهم…':'بگو!'}</small></button>{showFallback && <div className="answer"><button aria-label="پاسخ فارسی" onClick={()=>checkAnswer(selected[1],selected)}>🇮🇷 <small>+۱۰</small></button><button aria-label="پاسخ انگلیسی" onClick={()=>checkAnswer(selected[2],selected)}>🇬🇧 <small>+۲۰</small></button></div>}{audioNotice && <strong className="audio-notice">{audioNotice}</strong>}{notice && <strong className="notice">{notice}</strong>}</div></div>}{finished && <div className="modal victory"><div className="popup"><div className="confetti">🎉 ✨ 🏆 ✨ 🎉</div><h1>آفرین {user}!</h1><p>تو اول شدی و مرحله {stageNo} را تمام کردی!</p><b className="stars">⭐⭐⭐</b><button onClick={nextStage}>{stageNo === 10 ? 'بازی را دوباره شروع کن 🔄' : 'برو به مرحله بعد 🚀'}</button></div></div>}{stageWinner === 'robot' && <div className="modal victory timeout"><div className="popup"><div className="confetti">⏰ 🤖 ✨</div><h1>زمان تمام شد!</h1><p>{robots[robotWinner]} برندهٔ این مرحله شد.</p><p>اشکالی ندارد؛ دوباره تلاش کن یا به مرحلهٔ بعد برو.</p><div className="result-actions"><button onClick={resetStage}>تلاش دوباره 🔁</button><button onClick={nextStage}>مرحلهٔ بعد 🚀</button></div></div></div>}{welcomeOpen && <div className="modal welcome-modal"><div className="popup"><div className="confetti">🎉 ✨ 🚀</div><h1>به بازی خوش آمدی!</h1><p>بزن بریم؟</p><div className="welcome-actions"><button className="welcome-primary" onClick={replayWelcome}>🔊 پخش صدا</button><button className="welcome-secondary" onClick={()=>setWelcomeOpen(false)}>شروع بازی 🚀</button></div>{welcomeNotice && <strong className="audio-notice">{welcomeNotice}</strong>}</div></div>}</main>
}
createRoot(document.getElementById('root')).render(<App />)
