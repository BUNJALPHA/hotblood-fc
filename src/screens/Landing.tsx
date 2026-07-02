import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  ChevronRight, Trophy, Users, Calendar, Flame, Target, TrendingUp,
  ShoppingBag, Ticket, Menu, X, ArrowRight, Star, Shield, Activity,
  MapPin, Quote, Instagram, Facebook, Twitter, Youtube, Play, Sparkles
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ============================================================
   HOT BLOOD FC — Landing
   Mobile-first · 4K premium · sport-editorial motion
   Every nav link + CTA wired to a real section or route
   ============================================================ */

/* --- Static content (kept in-repo; swap for live data later) --- */

const heroSlides = [
  {
    image: '/images/players/captain-mike.png',
    name: 'Captain Mike',
    tag: 'PASSION',
    subtitle: 'Unmatched Dedication',
    stat: '15',
    statLabel: 'Trophies',
    color: 'from-red-600/40',
  },
  {
    image: '/images/players/lewis-mwangi.png',
    name: 'Lewis Mwangi',
    tag: 'POWER',
    subtitle: 'Dominant Force',
    stat: '50',
    statLabel: 'Matches',
    color: 'from-orange-600/40',
  },
  {
    image: '/images/players/fire-back.png',
    name: 'Keith Muthomi',
    tag: 'VICTORY',
    subtitle: 'Winning Legacy',
    stat: '10K',
    statLabel: 'Fans',
    color: 'from-yellow-600/40',
  },
];

const liveTicker = [
  '🔥 Hot Blood FC 2 - 1 Mpukoni FC · 2nd Half',
  '⚽ Captain Mike scores a brace!',
  '🏆 League Cup Quarter-Final tickets now live',
  '🎟️ New 2026 home kits — 20% off this week',
  '📍 Next fixture: Kagumo Grounds · Sat 3:00 PM',
  '🩸 "Fire in our hearts, blood on our boots"',
];

const features = [
  { icon: Flame, title: 'Fiery Spirit', desc: 'Born in Kagumo, bred for greatness. We play every minute like it is the last.' },
  { icon: Target, title: 'Precision Play', desc: 'Tactical excellence on every pitch, drilled until it is instinct.' },
  { icon: TrendingUp, title: 'Rising Stars', desc: 'A junior-to-senior pipeline that turns raw talent into champions.' },
  { icon: ShoppingBag, title: 'Club Shop', desc: 'Exclusive Hot Blood kits, scarves & gear — direct to the pack.' },
];

const stats = [
  { icon: Users, value: 10000, suffix: '+', label: 'Registered Fans', color: 'from-red-500 to-orange-500' },
  { icon: Trophy, value: 15, suffix: '', label: 'Trophies Lifted', color: 'from-yellow-500 to-orange-500' },
  { icon: Calendar, value: 25, suffix: '', label: 'Years of Excellence', color: 'from-orange-500 to-red-500' },
  { icon: Activity, value: 50, suffix: '+', label: 'Matches This Season', color: 'from-red-500 to-pink-500' },
];

const starPlayers = [
  { name: 'Captain Mike', pos: 'Striker', goals: 25, assists: 12, img: '/images/players/captain-mike.png', number: 9 },
  { name: 'Lewis Mwangi', pos: 'Defender', goals: 3, assists: 8, img: '/images/players/lewis-mwangi.png', number: 5 },
  { name: 'Keith Muthomi', pos: 'Midfielder', goals: 18, assists: 22, img: '/images/players/fire-back.png', number: 8 },
];

const achievements = [
  { year: '2024', title: 'Regional Cup Champions', desc: 'Undefeated run through the Tharaka-Nithi regional cup.', icon: Trophy },
  { year: '2023', title: 'League Promotion', desc: 'Climbed to the top division with a record points tally.', icon: TrendingUp },
  { year: '2022', title: 'Best Youth Academy', desc: 'Recognised for developing the strongest junior pipeline.', icon: Star },
  { year: '2021', title: 'Community Award', desc: 'Honoured for grassroots impact across Kagumo.', icon: Shield },
];

const aims = [
  { icon: Target, title: 'Compete & Win', text: 'Win every competition we enter with discipline and fire.' },
  { icon: Users, title: 'Develop Talent', text: 'Turn local raw talent into professional-grade footballers.' },
  { icon: Flame, title: 'Unite the Pack', text: 'Build the most passionate, connected fan community in Kenya.' },
  { icon: Sparkles, title: 'Give Back', text: 'Use the club as a force for good across our community.' },
];

const shopPreview = [
  { name: '2026 Home Kit', price: 2500, img: '/images/home.png', tag: 'New' },
  { name: 'Away Jersey', price: 2200, img: '/images/away.png', tag: 'Sale' },
  { name: 'Club Scarf', price: 800, img: '/images/scarf.png', tag: 'Hot' },
  { name: 'Club Cap', price: 600, img: '/images/club cap.png', tag: 'New' },
];

/* --- Hooks --- */

/** Smooth scroll to a section id, accounting for the fixed nav height. */
function useScrollTo() {
  return (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };
}

/** Count-up number that triggers when the element scrolls into view. */
function useCountUp(target: number, run: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

/** Toggle a `.revealed` class on elements with `.reveal` once visible. */
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* --- Small presentational helpers --- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blood-500/10 border border-blood-500/30 text-blood-400 text-xs font-semibold tracking-[0.3em] uppercase">
      <Flame size={12} className="animate-flicker" />
      {children}
    </div>
  );
}

/* --- Count-up stat card --- */
function StatCard({ stat, run, index }: { stat: typeof stats[number]; run: boolean; index: number }) {
  const value = useCountUp(stat.value, run);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="text-center p-6 sm:p-8 rounded-3xl bg-dark-800/60 border border-white/5 backdrop-blur-sm hover:border-blood-500/40 transition-colors"
    >
      <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-blood-900/30`}>
        <stat.icon className="text-white" size={26} />
      </div>
      <h3 className="text-4xl sm:text-5xl font-black text-white mb-1 font-display tabular-nums">
        {value.toLocaleString()}
        <span className="text-blood-500">{stat.suffix}</span>
      </h3>
      <p className="text-gray-400 font-medium text-sm sm:text-base">{stat.label}</p>
    </motion.div>
  );
}

/* ============================================================
   MAIN LANDING COMPONENT
   ============================================================ */

export default function Landing() {
  const navigate = useNavigate();
  const scrollTo = useScrollTo();
  useScrollReveal();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(heroProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // Parallax tilt for the hero player image (mouse-driven)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });

  /* Auto-advance hero slides */
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 5500);
    return () => clearInterval(t);
  }, []);

  /* Sticky-nav scroll state */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lock body scroll when the mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleHeroMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const navLinks: { label: string; target: string }[] = [
    { label: 'Home', target: 'home' },
    { label: 'Team', target: 'team' },
    { label: 'Matches', target: 'fixtures' },
    { label: 'Shop', target: 'shop' },
    { label: 'Club', target: 'club' },
  ];

  const goLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">
      {/* Ambient background grid + glows */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,69,0,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,69,0,0.4)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="fixed top-0 left-1/4 w-[40rem] h-[40rem] bg-blood-600/10 rounded-full blur-[140px] pointer-events-none animate-flicker" />
      <div className="fixed bottom-0 right-1/4 w-[36rem] h-[36rem] bg-orange-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ============ NAVIGATION ============ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-dark-900/90 backdrop-blur-xl border-b border-blood-900/20 shadow-2xl shadow-black/40' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo('home')} className="flex items-center gap-3 group" aria-label="Hot Blood FC home">
            <div className="relative">
              <img
                src="/images/logo1.png"
                alt="Hot Blood FC"
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-blood-600 shadow-[0_0_20px_rgba(220,38,38,0.6)] group-hover:shadow-[0_0_30px_rgba(220,38,38,0.9)] transition-shadow"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-dark-900" />
            </div>
            <div className="hidden sm:block text-left leading-none">
              <span className="block text-lg lg:text-xl font-black font-display tracking-tight bg-gradient-to-r from-blood-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-gradient-sweep">
                HOT BLOOD FC
              </span>
              <span className="block text-[9px] lg:text-[10px] text-blood-400/80 tracking-[0.3em] uppercase mt-0.5">Kagumo · Kenya</span>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) => (
              <button
                key={l.target}
                onClick={() => scrollTo(l.target)}
                className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group"
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-blood-500 to-orange-500 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => scrollTo('fixtures')}
              className="hidden sm:inline-flex text-sm text-gray-300 hover:text-white px-3 py-2 transition-colors"
            >
              Fixtures
            </button>
            <motion.button
              onClick={goLogin}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blood-600 to-orange-600 rounded-full font-semibold text-white text-sm sm:text-base shadow-lg shadow-blood-600/30 hover:shadow-blood-600/50 transition-shadow"
            >
              Join The Pack <ArrowRight size={16} className="hidden sm:block" />
            </motion.button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 text-white"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-dark-900/98 backdrop-blur-xl lg:hidden flex flex-col"
          >
            <div className="h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between border-b border-blood-900/20">
              <span className="font-display font-black text-xl text-white">MENU</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2" aria-label="Close menu">
                <X size={26} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center px-6 gap-2">
              {navLinks.map((l, i) => (
                <motion.button
                  key={l.target}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => { scrollTo(l.target); setIsMenuOpen(false); }}
                  className="text-left text-4xl font-display font-bold text-white hover:text-blood-400 transition-colors py-3 border-b border-white/5"
                >
                  {l.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => { setIsMenuOpen(false); goLogin(); }}
                className="mt-8 w-full py-4 bg-gradient-to-r from-blood-600 to-orange-600 rounded-2xl font-bold text-lg text-white shadow-lg shadow-blood-600/30 flex items-center justify-center gap-2"
              >
                Join The Pack <ChevronRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ HERO ============ */}
      <section id="home" ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden pt-16 sm:pt-20">
        {/* Background slide gradient */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].color} via-dark-900 to-dark-900`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>

        {/* Embers / floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-blood-500/40 rounded-full blur-[1px]"
              style={{ left: `${(i * 6.3 + 5) % 100}%`, bottom: 0 }}
              animate={{ y: [0, -window.innerHeight * 0.8], opacity: [0, 0.8, 0] }}
              transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-0">
          {/* Copy */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 text-blood-400 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase">
                <Flame size={14} className="animate-flicker" />
                <span>Est. 2001 · Tharaka-Nithi</span>
              </div>
            </motion.div>

            {/* Big animated headline with per-word reveal */}
            <h1 className="font-display font-bold leading-[0.9] text-5xl xs:text-6xl sm:text-7xl lg:text-8xl text-balance">
              <AnimatedWord text="PASSION" delay={0.1} className="block text-white" />
              <AnimatedWord
                text="POWER"
                delay={0.3}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-blood-500 via-orange-500 to-yellow-500 animate-gradient-sweep"
              />
              <AnimatedWord text="VICTORY" delay={0.5} className="block text-white" />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              <span className="italic text-blood-400 font-light">"We play with fire in our hearts and blood on our boots."</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={goLogin}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group relative px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blood-600 to-orange-600 rounded-full font-bold text-white overflow-hidden shadow-2xl shadow-blood-600/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Join The Pack <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-blood-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
              <motion.button
                onClick={() => scrollTo('fixtures')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-7 sm:px-8 py-3.5 sm:py-4 border-2 border-blood-500/50 rounded-full font-semibold text-white hover:bg-blood-500/10 transition-colors backdrop-blur-sm"
              >
                View Fixtures
              </motion.button>
            </motion.div>

            {/* Live match indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-3 justify-center lg:justify-start pt-2"
            >
              <span className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-blood-500/10 border border-blood-500/30 rounded-full text-xs font-medium text-blood-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blood-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blood-500" />
                </span>
                LIVE
              </span>
              <span className="text-xs sm:text-sm text-gray-500">Hot Blood FC vs Mpukoni FC · 2nd Half</span>
            </motion.div>
          </div>

          {/* Hero player visual with 3D tilt */}
          <motion.div
            className="relative h-[340px] xs:h-[420px] sm:h-[500px] lg:h-[600px] order-1 lg:order-2 [perspective:1200px]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={() => { mx.set(0); my.set(0); }}
          >
            <div className="absolute inset-0 bg-blood-600/20 rounded-[3rem] blur-3xl animate-flicker" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                className="relative w-full h-full"
              >
                <motion.img
                  src={heroSlides[currentSlide].image}
                  alt={heroSlides[currentSlide].name}
                  className="w-full h-full object-contain drop-shadow-2xl animate-slow-zoom"
                  initial={{ opacity: 0, x: 60, scale: 1.05 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Floating stat card */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-2 right-2 sm:-bottom-6 sm:-right-6 bg-dark-800/95 backdrop-blur-xl border-2 border-blood-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(220,38,38,0.4)] z-20"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-xl">
                  <Trophy className="text-yellow-400" size={24} />
                </div>
                <div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentSlide}
                      className="text-2xl sm:text-3xl font-black text-white font-display"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {heroSlides[currentSlide].stat}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-[10px] sm:text-sm text-gray-300 font-medium">{heroSlides[currentSlide].statLabel}</p>
                </div>
              </div>
            </motion.div>

            {/* Slide indicators */}
            <div className="absolute bottom-3 right-0 sm:bottom-10 flex gap-2 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 sm:w-12 bg-blood-500' : 'w-4 sm:w-6 bg-gray-700 hover:bg-gray-600'}`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.button
          onClick={() => scrollTo('live-ticker')}
          className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-gray-500 hover:text-blood-400 transition-colors z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-label="Scroll down"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-blood-500 to-transparent" />
        </motion.button>
      </section>

      {/* ============ LIVE TICKER MARQUEE ============ */}
      <section id="live-ticker" className="relative py-3 bg-gradient-to-r from-blood-700 via-blood-600 to-orange-600 border-y border-blood-500/40 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee-fast">
          {[...liveTicker, ...liveTicker].map((item, i) => (
            <span key={i} className="inline-flex items-center text-white font-display font-semibold tracking-wide text-sm sm:text-base px-8">
              {item}
              <span className="mx-8 text-white/50">◆</span>
            </span>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="club" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12 sm:mb-16 reveal"
            initial={false}
          >
            <SectionLabel>What We Stand For</SectionLabel>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white mb-4 text-balance">
              Built For <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-500 to-orange-500">Greatness</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Every part of our club is engineered to fuel the fire of champions.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                className="group relative p-6 sm:p-8 bg-dark-800/60 border border-white/5 rounded-3xl overflow-hidden hover:border-blood-500/50 transition-colors reveal"
                whileHover={{ y: -10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blood-600/0 to-orange-600/0 group-hover:from-blood-600/10 group-hover:to-orange-600/10 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blood-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blood-600/30 group-hover:scale-110 transition-transform">
                    <f.icon className="text-white" size={26} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white mb-2 group-hover:text-blood-400 transition-colors">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS (count-up) ============ */}
      <section
        className="py-20 sm:py-28 bg-dark-800/40 relative overflow-hidden"
        ref={(el) => {
          if (el && !statsVisible) {
            const io = new IntersectionObserver(([e]) => {
              if (e.isIntersecting) { setStatsVisible(true); io.disconnect(); }
            }, { threshold: 0.3 });
            io.observe(el);
          }
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.12),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 reveal">
            <SectionLabel>By The Numbers</SectionLabel>
            <h2 className="mt-5 text-4xl sm:text-5xl font-black font-display text-white">The Pack Keeps Growing</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, i) => (
              <StatCard key={s.label} stat={s} run={statsVisible} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ STAR PLAYERS ============ */}
      <section id="team" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 sm:mb-14 reveal">
            <div>
              <SectionLabel>The Squad</SectionLabel>
              <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white">
                Star <span className="text-blood-500">Players</span>
              </h2>
              <p className="text-gray-400 mt-2">The talent driving our success.</p>
            </div>
            <button onClick={goLogin} className="hidden sm:flex items-center gap-2 text-blood-400 hover:text-blood-300 font-medium transition-colors">
              Meet The Full Squad <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {starPlayers.map((p, idx) => (
              <motion.div
                key={p.name}
                className="group relative bg-dark-800/60 rounded-3xl overflow-hidden border border-white/5 hover:border-blood-500/50 transition-colors reveal"
                whileHover={{ y: -10 }}
              >
                <div className="h-72 sm:h-80 overflow-hidden relative bg-gradient-to-b from-blood-900/20 to-dark-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent z-10" />
                  {/* Big faded jersey number */}
                  <span className="absolute top-4 left-4 z-0 text-8xl font-black font-display text-white/5 select-none">#{p.number}</span>
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-blood-600/90 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                    {p.pos}
                  </div>
                </div>
                <div className="p-5 sm:p-6 relative z-20 -mt-10">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white group-hover:text-blood-400 transition-colors">{p.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">Senior Team · #{p.number}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-dark-900/70 rounded-xl">
                      <p className="text-2xl font-black font-display text-white tabular-nums">{p.goals}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Goals</p>
                    </div>
                    <div className="text-center p-3 bg-dark-900/70 rounded-xl">
                      <p className="text-2xl font-black font-display text-blood-400 tabular-nums">{p.assists}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assists</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ACHIEVEMENTS TIMELINE ============ */}
      <section className="py-20 sm:py-28 bg-dark-800/40 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 reveal">
            <SectionLabel>Honours</SectionLabel>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white">Trophy <span className="text-yellow-500">Cabinet</span></h2>
          </div>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blood-500/60 via-blood-500/20 to-transparent sm:-translate-x-1/2" />
            <div className="space-y-8 sm:space-y-12">
              {achievements.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.6 }}
                  className={`relative flex items-center gap-6 sm:gap-0 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                >
                  {/* dot */}
                  <div className="absolute left-4 sm:left-1/2 w-4 h-4 rounded-full bg-blood-500 ring-4 ring-dark-800 sm:-translate-x-1/2 z-10" />
                  {/* card */}
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                    <div className="inline-block p-5 sm:p-6 bg-dark-900/70 border border-white/5 rounded-2xl hover:border-blood-500/40 transition-colors">
                      <div className={`flex items-center gap-3 mb-2 ${i % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                          <a.icon className="text-yellow-400" size={18} />
                        </div>
                        <span className="text-blood-400 font-display font-bold text-lg">{a.year}</span>
                      </div>
                      <h3 className="font-bold font-display text-lg text-white">{a.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{a.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PURPOSE / AIMS ============ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 reveal">
            <SectionLabel>Why We Exist</SectionLabel>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white text-balance">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-500 to-orange-500">Purpose</span> &amp; Aims
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {aims.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-6 rounded-3xl bg-gradient-to-b from-dark-800/80 to-dark-900/40 border border-white/5 hover:border-blood-500/40 transition-colors group"
              >
                <div className="w-12 h-12 mb-4 rounded-2xl bg-blood-500/10 border border-blood-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <a.icon className="text-blood-400" size={22} />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{a.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{a.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Quote band */}
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 text-center max-w-3xl mx-auto relative"
          >
            <Quote className="absolute -top-4 left-1/2 -translate-x-1/2 text-blood-600/40" size={48} />
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight text-balance pt-6">
              "More than a club — we are a <span className="text-blood-500">movement</span> born on the pitches of Kagumo."
            </p>
            <footer className="mt-6 text-gray-500 text-sm tracking-wider uppercase">— The Hot Blood Code</footer>
          </motion.blockquote>
        </div>
      </section>

      {/* ============ FIXTURES / UPCOMING ============ */}
      <section id="fixtures" className="py-20 sm:py-28 px-4 sm:px-6 bg-dark-800/40 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 reveal">
            <SectionLabel>Match Day</SectionLabel>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white">Upcoming <span className="text-blood-500">Fixtures</span></h2>
          </div>

          <div className="space-y-4">
            {[
              { opp: 'Mpukoni FC', comp: 'League · Round 12', date: 'SAT 04 JUL', time: '15:00', venue: 'Kagumo Grounds', home: true },
              { opp: 'Chuka United', comp: 'Regional Cup · QF', date: 'SUN 12 JUL', time: '14:30', venue: 'Chuka Town Stadium', home: false },
              { opp: 'Nithi Stars', comp: 'League · Round 13', date: 'SAT 18 JUL', time: '16:00', venue: 'Kagumo Grounds', home: true },
            ].map((m, i) => (
              <motion.div
                key={m.opp}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 bg-dark-900/70 border border-white/5 rounded-2xl hover:border-blood-500/50 transition-colors"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${m.home ? 'bg-gradient-to-br from-blood-600 to-orange-600 text-white shadow-lg shadow-blood-600/30' : 'bg-white/5 text-gray-400'}`}>
                  {m.home ? '🏠' : '✈️'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold font-display text-white">vs {m.opp}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full uppercase">Tickets</span>
                  </div>
                  <p className="text-xs text-blood-400 font-semibold tracking-wide uppercase mt-1">{m.comp}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {m.venue}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-6">
                  <p className="text-blood-500 font-display font-black text-xl">{m.date}</p>
                  <p className="text-gray-400 text-sm">{m.time} EAT</p>
                </div>
                <button
                  onClick={goLogin}
                  className="px-5 py-2.5 bg-blood-600 hover:bg-blood-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ticket size={16} /> Get Ticket
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SHOP PREVIEW ============ */}
      <section id="shop" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 reveal">
            <div>
              <SectionLabel>The Vault</SectionLabel>
              <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white">Club <span className="text-blood-500">Shop</span></h2>
              <p className="text-gray-400 mt-2">Wear the blood. Rep the pack.</p>
            </div>
            <button onClick={goLogin} className="flex items-center gap-2 text-blood-400 hover:text-blood-300 font-medium transition-colors">
              Visit Full Shop <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {shopPreview.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group bg-dark-800/60 rounded-2xl overflow-hidden border border-white/5 hover:border-blood-500/50 transition-colors"
              >
                <div className="relative aspect-square bg-gradient-to-br from-white/5 to-dark-900 overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-blood-600 text-white text-[10px] font-bold rounded-full uppercase">{p.tag}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold font-display text-white text-sm sm:text-base truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-blood-500 font-black font-display text-lg">KES {p.price.toLocaleString()}</span>
                    <button onClick={goLogin} className="p-2 bg-blood-600 hover:bg-blood-500 text-white rounded-lg transition-colors" aria-label={`Buy ${p.name}`}>
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blood-900/30 via-dark-900 to-orange-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_60%)] animate-flicker" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white mb-6 text-balance">
            Ready To Join The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-500 to-orange-500 animate-gradient-sweep">Pack?</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Become part of the most passionate football community in Kenya. Register for exclusive tickets, merchandise, and live updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              onClick={goLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blood-600 to-orange-600 rounded-full font-bold text-white text-lg shadow-2xl shadow-blood-600/40 flex items-center gap-2"
            >
              Register Now <ArrowRight size={20} />
            </motion.button>
            <motion.button
              onClick={() => scrollTo('shop')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-blood-500/50 rounded-full font-semibold text-white hover:bg-blood-500/10 transition-colors flex items-center gap-2"
            >
              <Play size={18} /> Visit Shop
            </motion.button>
          </div>

          {/* Membership perks */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Ticket, label: 'Priority Tickets' },
              { icon: ShoppingBag, label: 'Member Discounts' },
              { icon: Trophy, label: 'Exclusive Updates' },
              { icon: Users, label: 'Join 10K+ Fans' },
            ].map((perk) => (
              <div key={perk.label} className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blood-500/10 border border-blood-500/30 flex items-center justify-center">
                  <perk.icon className="text-blood-400" size={20} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{perk.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-dark-900 border-t border-blood-900/30 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/logo.png" alt="Hot Blood FC" className="w-12 h-12 rounded-full object-cover border-2 border-blood-600" />
                <div>
                  <span className="block font-display font-black text-xl text-white">HOT BLOOD FC</span>
                  <span className="block text-[10px] text-blood-400 tracking-[0.3em] uppercase">Kagumo · Kenya</span>
                </div>
              </div>
              <p className="text-gray-500 mb-6 max-w-sm text-sm leading-relaxed">
                The most aggressive and passionate football club in Tharaka-Nithi.
                <span className="italic text-blood-400/80 block mt-2">"We play with fire in our hearts and blood on our boots."</span>
              </p>
              <div className="flex gap-3">
                {[Twitter, Facebook, Instagram, Youtube].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    whileHover={{ y: -3, scale: 1.1 }}
                    className="w-10 h-10 rounded-full bg-dark-800 border border-blood-900/30 flex items-center justify-center text-gray-400 hover:text-white hover:border-blood-500 transition-colors"
                    aria-label="Social link"
                  >
                    <Icon size={16} />
                  </motion.a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 font-display">Quick Links</h4>
              <ul className="space-y-2.5">
                {navLinks.map((l) => (
                  <li key={l.target}>
                    <button onClick={() => scrollTo(l.target)} className="text-gray-500 hover:text-blood-400 transition-colors text-sm text-left">
                      {l.label}
                    </button>
                  </li>
                ))}
                <li><button onClick={goLogin} className="text-gray-500 hover:text-blood-400 transition-colors text-sm">Login / Register</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 font-display">Newsletter</h4>
              <p className="text-gray-500 text-sm mb-4">Get fixtures, offers & match updates.</p>
              <form
                onSubmit={(e) => { e.preventDefault(); alert('Thanks for subscribing! 🩸'); }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-blood-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-blood-500 placeholder:text-gray-600"
                />
                <button type="submit" className="px-4 py-2.5 bg-blood-600 hover:bg-blood-500 rounded-lg text-white transition-colors flex-shrink-0" aria-label="Subscribe">
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-blood-900/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs sm:text-sm">© {new Date().getFullYear()} Hot Blood FC. All rights reserved.</p>
            <p className="text-blood-500/60 text-xs sm:text-sm font-display font-bold tracking-[0.3em]">PASSION · POWER · VICTORY</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- Per-word headline animation --- */
function AnimatedWord({ text, delay, className }: { text: string; delay: number; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: delay + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </span>
  );
}
