import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Trophy, Users, Calendar, 
  Flame, Target, TrendingUp, ShoppingBag, 
  Ticket, Bell, Menu, X, ArrowRight, Star
} from 'lucide-react';
import { useState, useEffect } from 'react';

const heroSlides = [
  {
    image: '/images/players/captain-mike.png',
    title: 'PASSION',
    subtitle: 'Unmatched Dedication',
    stat: '15 Trophies',
    color: 'from-red-600/40'
  },
  {
    image: '/images/players/lewis-mwangi.png',
    title: 'POWER',
    subtitle: 'Dominant Force',
    stat: '50+ Matches',
    color: 'from-orange-600/40'
  },
  {
    image: '/images/players/fire-back.png',
    title: 'VICTORY',
    subtitle: 'Winning Legacy',
    stat: '10K+ Fans',
    color: 'from-yellow-600/40'
  }
];

const features = [
  { icon: Flame, title: 'Fiery Spirit', desc: 'Born in Kagumo, bred for greatness' },
  { icon: Target, title: 'Precision Play', desc: 'Tactical excellence on every pitch' },
  { icon: TrendingUp, title: 'Rising Stars', desc: 'Junior to senior development pipeline' },
  { icon: ShoppingBag, title: 'Club Shop', desc: 'Exclusive Hot Blood merchandise' }
];

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const slideVariants = {
    enter: { opacity: 0, x: 100, scale: 1.1 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -100, scale: 0.9 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden text-white">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,69,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,69,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      </div>

      {/* Premium Navigation */}
      <motion.nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl' : 'bg-transparent'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <img src="/images/logo1.png" alt="Hot Blood FC" className="w-14 h-14 rounded-full object-cover border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)] group-hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all" />
              <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                HOT BLOOD FC
              </span>
              <p className="text-[10px] text-red-400 tracking-[0.3em] uppercase">Kagumo • Kenya</p>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            {['Home', 'Team', 'Matches', 'Shop', 'News'].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <motion.button 
              className="p-2 text-gray-400 hover:text-white transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </motion.button>
            
           <motion.button 
  onClick={() => window.location.href = '/login'}
  className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all cursor-pointer"
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>
  Join The Pack <ArrowRight size={18} />
</motion.button>

            <button 
              className="lg:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-red-900/30"
            >
              <div className="px-6 py-4 space-y-4">
                {['Home', 'Team', 'Matches', 'Shop', 'News'].map((item) => (
                  <a key={item} href="#" className="block text-lg font-medium text-gray-300 hover:text-red-400 transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section - Auto-Sliding Premium */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].color} via-[#0a0a0a] to-[#0a0a0a]`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-red-500/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                y: [null, Math.random() * -100],
                opacity: [0.5, 0]
              }}
              transition={{ 
                duration: Math.random() * 5 + 5, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pt-20">
          <motion.div style={{ y, opacity }} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-red-400 text-sm font-semibold tracking-widest uppercase">
                <Flame size={16} className="animate-pulse" />
                <span>Est. 2001 • Tharaka-Nithi</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black leading-none">
                <span className="block text-white">PASSION</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-gradient">
                  POWER
                </span>
                <span className="block text-white">VICTORY</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 max-w-lg leading-relaxed">
                <span className="italic text-red-400 font-light">
                  "We play with fire in our hearts and blood on our boots."
                </span>
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
               onClick={() => window.location.href = '/login'}
                className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-white overflow-hidden shadow-2xl shadow-red-600/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Join The Pack <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>
              
              <motion.button 
                className="px-8 py-4 border-2 border-red-500/50 rounded-full font-semibold text-white hover:bg-red-500/10 transition-all backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Fixtures
              </motion.button>
            </motion.div>

            {/* Live Match Indicator */}
            <motion.div 
              className="flex items-center gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-red-400">Live Match</span>
              </div>
              <span className="text-sm text-gray-500">Hot Blood FC vs Mpukoni FC - 2nd Half</span>
            </motion.div>
          </motion.div>

          {/* Hero Image with 3D Effect */}
          <motion.div 
            className="relative h-[500px] lg:h-[600px]"
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10"></div>
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
            
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                src={heroSlides[currentSlide].image}
                alt="Player"
                className="w-full h-full object-contain drop-shadow-2xl"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </AnimatePresence>

            {/* Floating Stats Cards */}
   <motion.div 
  className="absolute -bottom-6 -right-6 bg-[#161616]/95 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(220,38,38,0.4)] z-20"
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 0.8 }}
  whileHover={{ y: -5, scale: 1.02 }}
>
  <div className="flex items-center gap-4">
    <div className="p-3 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-xl">
      <Trophy className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" size={32} />
    </div>
    <div>
      <AnimatePresence mode="wait">
        <motion.p 
          key={currentSlide}
          className="text-3xl font-black text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {heroSlides[currentSlide].stat.split(' ')[0]}
        </motion.p>
      </AnimatePresence>
      <p className="text-sm text-gray-300 font-medium">
        {heroSlides[currentSlide].stat.split(' ').slice(1).join(' ')}
      </p>
    </div>
  </div>
</motion.div>

            {/* Slide Indicators */}
            <div className="absolute bottom-10 right-0 flex gap-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-12 h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-red-500 to-transparent"></div>
        </motion.div>
      </section>

      {/* Features Grid - Premium Cards */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
              Built For <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Greatness</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every aspect of our club is designed to fuel the fire of champions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="group relative p-8 bg-[#161616] border border-red-900/20 rounded-3xl overflow-hidden hover:border-red-500/50 transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-orange-600/0 group-hover:from-red-600/10 group-hover:to-orange-600/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 mb-6 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:shadow-red-600/50 transition-all group-hover:scale-110">
                    <feature.icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Animated Counters */}
      <section className="py-24 bg-[#161616] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#161616] to-[#161616]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, value: '10,000+', label: 'Registered Fans', color: 'from-red-500 to-orange-500' },
              { icon: Trophy, value: '25', label: 'Years of Excellence', color: 'from-yellow-500 to-orange-500' },
              { icon: Calendar, value: '50+', label: 'Matches This Season', color: 'from-red-500 to-pink-500' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center p-8 rounded-3xl bg-[#0a0a0a]/50 border border-red-900/20 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="text-white" size={32} />
                </div>
                <motion.h3 
                  className="text-5xl font-black text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 + 0.2 }}
                >
                  {stat.value}
                </motion.h3>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Star Players - 3D Carousel Style */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex justify-between items-end mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-2">
                Star <span className="text-red-500">Players</span>
              </h2>
              <p className="text-gray-400">The talent driving our success</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-medium">
              View All <ArrowRight size={20} />
            </button>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Captain Mike', pos: 'Striker', goals: 25, assists: 12, img: '/images/players/captain-mike.png' },
              { name: 'Lewis Mwangi', pos: 'Defender', goals: 3, assists: 8, img: '/images/players/lewis-mwangi.png' },
              { name: 'Keith Muthomi', pos: 'Midfielder', goals: 18, assists: 22, img: '/images/players/fire-back.png' }
            ].map((player, idx) => (
              <motion.div
                key={idx}
                className="group relative bg-[#161616] rounded-3xl overflow-hidden border border-red-900/20 hover:border-red-500/50 transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="h-80 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent z-10"></div>
                  <img src={player.img} alt={player.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  
                  {/* Position Badge */}
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-red-600/90 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                    {player.pos}
                  </div>
                </div>
                
                <div className="p-6 relative z-20 -mt-12">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{player.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">Senior Team</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#0a0a0a] rounded-xl">
                      <p className="text-2xl font-black text-white">{player.goals}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Goals</p>
                    </div>
                    <div className="text-center p-3 bg-[#0a0a0a] rounded-xl">
                      <p className="text-2xl font-black text-red-400">{player.assists}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Assists</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20"></div>
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready To Join The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Pack?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Become part of the most passionate football community in Kenya. Register now for exclusive access to tickets, merchandise, and live updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button 
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-white text-lg shadow-2xl shadow-red-600/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Register Now
            </motion.button>
            <motion.button 
              className="px-8 py-4 border-2 border-red-500/50 rounded-full font-semibold text-white hover:bg-red-500/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="inline mr-2" size={20} />
              Visit Shop
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-[#0a0a0a] border-t border-red-900/30 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/logo.png" alt="Hot Blood FC" className="w-12 h-12 rounded-full object-cover border-2 border-red-600" />
                <div>
                  <span className="text-xl font-black text-white">HOT BLOOD FC</span>
                  <p className="text-xs text-red-400 tracking-wider">KAGUMO • KENYA</p>
                </div>
              </div>
              <p className="text-gray-500 mb-6 max-w-sm">
                The most aggressive and passionate football club in Tharaka-Nithi. 
                <span className="italic text-red-400/80 block mt-2">"We play with fire in our hearts and blood on our boots."</span>
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Facebook', 'Instagram', 'YouTube'].map((social) => (
                  <motion.a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-[#161616] border border-red-900/30 flex items-center justify-center text-gray-400 hover:text-white hover:border-red-500 transition-all"
                    whileHover={{ y: -3, scale: 1.1 }}
                  >
                    <span className="text-xs font-bold">{social[0]}</span>
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {['Home', 'Team', 'Fixtures', 'Shop', 'News', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 hover:text-red-400 transition-colors text-sm">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Newsletter</h4>
              <p className="text-gray-500 text-sm mb-4">Get the latest updates and exclusive offers.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="flex-1 px-4 py-2 bg-[#161616] border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
                <button className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-red-900/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2026 Hot Blood FC. All rights reserved.</p>
            <p className="text-red-500/60 text-sm font-medium tracking-widest">PASSION • POWER • VICTORY</p>
          </div>
        </div>
      </footer>
    </div>
  );
}