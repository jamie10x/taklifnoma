"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { toPng } from "html-to-image";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [openingStep, setOpeningStep] = useState<0 | 1 | 2>(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-200, 200], [15, -15]);
  const rotateY = useTransform(mouseX, [-200, 200], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (openingStep > 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleOpenSequence = () => {
    if (openingStep !== 0) return;
    setOpeningStep(1);

    setTimeout(() => {
      setOpeningStep(2);
    }, 500);

    setTimeout(() => {
      setIsOpen(true);
    }, 1300);
  };

  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);

  const pngRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('has_rsvpd');
    if (stored === 'true') {
      setHasRsvpd(true);
      const storedFirstName = localStorage.getItem('rsvpd_firstName');
      const storedLastName = localStorage.getItem('rsvpd_lastName');
      if (storedFirstName) setFirstName(storedFirstName);
      if (storedLastName) setLastName(storedLastName);
    }
  }, []);

  const getAssets = async () => {
    let currentPng = pngDataUrl;
    if (!currentPng && pngRef.current) {
      currentPng = await toPng(pngRef.current, { cacheBust: true, quality: 1.0 });
      setPngDataUrl(currentPng);
    }

    let currentPdf = pdfBlob;
    if (!currentPdf && firstName && lastName) {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, attendance: 'yes', isRegenerate: true }),
      });
      if (response.ok) {
        currentPdf = await response.blob();
        setPdfBlob(currentPdf);
      }
    }

    return { currentPng, currentPdf };
  };

  const handleShare = async () => {
    try {
      const { currentPng } = await getAssets();
      if (!currentPng) return;

      if (navigator.share && navigator.canShare) {
        const response = await fetch(currentPng);
        const blob = await response.blob();
        const file = new File([blob], `Taklifnoma_${firstName}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Taklifnoma',
            text: 'Mening maxsus taklifnomam!',
          });
        } else {
          throw new Error('Share not supported for this file type.');
        }
      } else {
        alert('Web Share API sizning qurilmangizda qollab-quvvatlanmaydi. Iltimos pastdagi yuklab olish tugmasidan foydalaning.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Ulashishda xatolik yuz berdi.');
    }
  };

  const handleDownload = async () => {
    try {
      const { currentPng, currentPdf } = await getAssets();

      if (currentPng) {
        const a = document.createElement('a');
        a.href = currentPng;
        a.download = `Taklifnoma_${firstName}_${lastName}.png`;
        a.click();
      }

      if (currentPdf) {
        const url = window.URL.createObjectURL(currentPdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Taklifnoma_${firstName}_${lastName}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendance) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, attendance }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong');
      }

      if (attendance === 'yes') {
        const blob = await response.blob();
        setPdfBlob(blob);

        if (pngRef.current) {
          const dataUrl = await toPng(pngRef.current, { cacheBust: true, quality: 1.0 });
          setPngDataUrl(dataUrl);
        }
      }

      localStorage.setItem('has_rsvpd', 'true');
      localStorage.setItem('rsvpd_firstName', firstName);
      localStorage.setItem('rsvpd_lastName', lastName);

      setHasRsvpd(true);
      setShowModal(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-bronze/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Visually hidden PNG template */}
      <div className="overflow-hidden absolute top-[-9999px] left-[-9999px] z-[-999]">
        <div ref={pngRef} className="w-[800px] h-[1200px] bg-cream flex flex-col items-center justify-center relative">
          <div className="absolute inset-8 border-4 border-gold/30"></div>
          <div className="absolute top-12 left-12 w-24 h-24 border-t-4 border-l-4 border-gold/60"></div>
          <div className="absolute top-12 right-12 w-24 h-24 border-t-4 border-r-4 border-gold/60"></div>
          <div className="absolute bottom-12 left-12 w-24 h-24 border-b-4 border-l-4 border-gold/60"></div>
          <div className="absolute bottom-12 right-12 w-24 h-24 border-b-4 border-r-4 border-gold/60"></div>

          <div className="px-24 flex flex-col items-center justify-center h-full">
            <h2 className="text-bronze tracking-[0.4em] uppercase text-xl font-medium mb-12">
              TOGETHER WITH THEIR FAMILIES
            </h2>
            <h1 className="text-8xl text-gold font-serif mb-16 text-center leading-tight">
              Jamie & [Bride's Name]
            </h1>
            <div className="w-32 h-[2px] bg-gold/40 mx-auto mb-16"></div>
            <p className="text-charcoal/80 text-3xl leading-relaxed font-light max-w-2xl text-center mb-16">
              Qadrli mehmon! Biz o'z taqdirimizni birlashtirib, yangi hayotga qadam qo'ymoqdamiz.
            </p>
            <p className="text-4xl font-serif text-charcoal mb-4">Saturday, September 24th</p>
            <p className="text-2xl text-charcoal/80 font-light mb-16">at Four O'Clock in the afternoon</p>

            {(firstName || lastName) && (
              <div className="mt-8 pt-12 border-t-2 border-gold/20 w-3/4 flex flex-col items-center">
                <p className="text-charcoal/60 text-xl tracking-widest uppercase mb-6">Maxsus Mehmon</p>
                <p className="text-5xl font-serif text-gold">{firstName} {lastName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isOpen && !hasRsvpd ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -40, filter: "blur(12px)" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="cursor-pointer z-50 flex flex-col items-center justify-center group [perspective:2000px]"
            onClick={handleOpenSequence}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Minimalist Envelope Container */}
            <motion.div
              style={{ rotateX, rotateY }}
              whileHover={openingStep === 0 ? { scale: 1.02, y: -12 } : {}}
              className="relative w-80 h-56 sm:w-[28rem] sm:h-72 bg-[#EAE3D6] shadow-[0_20px_60px_-15px_rgba(212,175,55,0.4)] hover:shadow-[0_30px_70px_-15px_rgba(212,175,55,0.5)] transition-shadow duration-500 rounded-md flex items-center justify-center border border-gold/30 [transform-style:preserve-3d]"
            >

              {/* Luxurious Inner Texture */}
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none rounded-md"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10l10-10 10 10-10 10L0 10zm10 8.5L1.5 10 10 1.5 18.5 10 10 18.5z' fill='%23d4af37' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: '20px 20px'
                }}
              ></div>

              {/* Mini Card Sliding Out */}
              <motion.div
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: openingStep >= 2 ? -120 : 0,
                  opacity: openingStep >= 1 ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute w-[85%] h-[85%] bg-white rounded shadow-lg z-10 p-2 flex items-center justify-center"
              >
                <div className="w-full h-full border border-gold/40 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-cream/30">
                  <h2 className="text-bronze text-[10px] sm:text-xs tracking-[0.3em] uppercase">Together with their families</h2>
                  <h1 className="text-gold font-serif text-3xl sm:text-4xl">J&G</h1>
                </div>
              </motion.div>

              {/* Envelope Front Pocket Layers (Flawless Clip-Path construction) */}
              <div className="absolute inset-0 z-20 pointer-events-none drop-shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="absolute top-0 left-0 w-full h-full bg-[#EBE4D8]" style={{ clipPath: 'polygon(0 0, 51% 51%, 0 100%)' }} />
                <div className="absolute top-0 left-0 w-full h-full bg-[#EBE4D8]" style={{ clipPath: 'polygon(100% 0, 49% 51%, 100% 100%)' }} />
                <div className="absolute top-0 left-0 w-full h-full bg-[#E3DBCB]" style={{ clipPath: 'polygon(0 100%, 50% 49%, 100% 100%)' }} />
              </div>

              {/* Envelope Flap (Top) */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{
                  rotateX: openingStep >= 1 ? 180 : 0,
                  zIndex: openingStep >= 1 ? 5 : 30
                }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute top-0 left-0 w-full h-full origin-top pointer-events-none drop-shadow-[0_8px_12px_rgba(0,0,0,0.15)]"
              >
                <div className="w-full h-full bg-[#F2EBE1]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 55%)' }}></div>
              </motion.div>

              {/* Sparkle Burst */}
              {openingStep >= 1 && (
                <div className="absolute top-[53%] left-1/2 w-0 h-0 z-50 pointer-events-none">
                  {[...Array(24)].map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 24;
                    const velocity = 40 + Math.random() * 80;
                    const x = Math.cos(angle) * velocity;
                    const y = Math.sin(angle) * velocity + (Math.random() * 30);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: 0,
                          scale: Math.random() * 0.8 + 0.4,
                          x,
                          y: y + 40 // gravity drop
                        }}
                        transition={{ duration: 0.6 + Math.random() * 0.4, ease: "easeOut" }}
                        className="absolute w-1.5 h-1.5 bg-gradient-to-tr from-gold to-[#FFF8D6] rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]"
                      />
                    );
                  })}
                </div>
              )}

              {/* Seal */}
              <div className="absolute top-[52%] sm:top-[53%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <motion.div
                  animate={{
                    scale: openingStep >= 1 ? 1.5 : 1,
                    opacity: openingStep >= 1 ? 0 : 1
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gold via-[#E5C158] to-bronze rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-white/40 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <span className="text-white font-serif italic text-lg sm:text-xl drop-shadow-md">J&G</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              animate={{ opacity: openingStep >= 1 ? 0 : 1 }}
              className="mt-12 text-charcoal/50 tracking-[0.4em] text-xs uppercase animate-pulse font-medium"
            >
              Tap to open
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.15 }}
            className="w-full max-w-3xl z-10"
          >
            <GlassCard className="w-full text-center space-y-8 relative overflow-hidden px-6 sm:px-12 py-12 sm:py-16">
              {/* Decorative corner borders */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-gold/60 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-gold/60 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-gold/60 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-gold/60 rounded-br-lg"></div>

              <div className="space-y-4">
                <h2 className="text-bronze tracking-[0.3em] uppercase text-xs sm:text-sm font-medium">
                  TOGETHER WITH THEIR FAMILIES
                </h2>
                <h1 className="text-5xl sm:text-7xl text-gold font-serif pt-6 pb-4 drop-shadow-sm leading-tight">
                  Jamie & [Bride's Name]
                </h1>
              </div>

              <div className="py-6 sm:py-10">
                <div className="w-24 h-[1px] bg-gold/40 mx-auto mb-8 sm:mb-12"></div>
                <p className="text-charcoal/80 text-base sm:text-lg leading-relaxed font-light max-w-xl mx-auto">
                  Qadrli mehmon! Biz o'z taqdirimizni birlashtirib, yangi hayotga qadam qo'ymoqdamiz. Biz uchun eng muhim bo'lgan ushbu kunda sizni o'zimizning shaxsiy bayramimizda ko'rishdan bag'oyat xursand bo'lamiz.
                </p>
                <div className="w-24 h-[1px] bg-gold/40 mx-auto mt-8 sm:mt-12"></div>
              </div>

              <div className="space-y-6 pb-6">
                {/* Event Details */}
                <div className="space-y-3">
                  <p className="text-xl sm:text-2xl font-serif text-charcoal">
                    [Insert Date]
                  </p>
                  <p className="text-charcoal/80 font-medium tracking-wide">
                    18:00 <span className="font-light italic text-sm">(Kechki bazm)</span>
                  </p>
                  <div className="pt-2 space-y-1">
                    <p className="text-lg font-medium text-charcoal">The Grand Palace</p>
                    <p className="text-charcoal/70 font-light text-sm sm:text-base">Namangan, Uzbekistan</p>
                  </div>

                  {/* Minimalist Map Placeholder */}
                  <div className="mt-6 w-full max-w-sm mx-auto h-32 border border-gold/20 bg-cream/50 rounded flex items-center justify-center">
                    <p className="text-gold/60 text-xs tracking-widest uppercase font-medium">Map Placeholder</p>
                  </div>
                </div>

                <div className="w-24 h-[1px] bg-gold/40 mx-auto my-8 sm:my-10"></div>

                {hasRsvpd ? (
                  <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">✅</span>
                    </div>
                    <h3 className="text-2xl font-serif text-gold mb-2">Siz allaqachon ro'yxatdan o'tgansiz!</h3>
                    <p className="text-charcoal/80 mb-8 font-light text-sm sm:text-base">
                      Taklifnomangizni do'stlaringiz bilan ulashing yoki saqlab oling.
                    </p>

                    <div className="flex flex-col space-y-4 pt-4">
                      <button
                        onClick={handleShare}
                        className="w-full bg-gold hover:bg-bronze text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl shadow-md tracking-[0.15em] uppercase text-xs sm:text-sm font-medium"
                      >
                        Share Invitation
                      </button>
                      <button
                        onClick={handleDownload}
                        className="w-full bg-transparent border border-gold text-gold hover:bg-gold hover:text-white px-10 py-4 rounded-full transition-all duration-300 tracking-[0.15em] uppercase text-xs sm:text-sm font-medium"
                      >
                        Download Files
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-8">
                    <h3 className="text-xl font-serif text-charcoal text-center tracking-wide">RSVP</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col text-left">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full bg-transparent border-0 border-b border-gold/50 focus:border-gold focus:ring-0 px-0 py-2 text-charcoal placeholder-charcoal/40 outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full bg-transparent border-0 border-b border-gold/50 focus:border-gold focus:ring-0 px-0 py-2 text-charcoal placeholder-charcoal/40 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 text-left w-full mx-auto max-w-xs">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${attendance === 'yes' ? 'border-gold bg-gold' : 'border-gold/50 group-hover:border-gold'}`}>
                          {attendance === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <input
                          type="radio"
                          name="attendance"
                          value="yes"
                          className="hidden"
                          onChange={() => setAttendance('yes')}
                          required
                        />
                        <span className="text-charcoal/80 text-sm">Ha, albatta</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${attendance === 'no' ? 'border-gold bg-gold' : 'border-gold/50 group-hover:border-gold'}`}>
                          {attendance === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <input
                          type="radio"
                          name="attendance"
                          value="no"
                          className="hidden"
                          onChange={() => setAttendance('no')}
                          required
                        />
                        <span className="text-charcoal/80 text-sm">Afsuski, qatnasha olmayman</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-10 w-full bg-gold hover:bg-bronze text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl shadow-md tracking-[0.15em] uppercase text-xs sm:text-sm font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md h-14"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "RSVP & Get Invitation"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thank You Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-cream p-8 sm:p-12 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gold/30 relative"
            >
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🥂</span>
              </div>
              <h3 className="text-2xl font-serif text-gold mb-2">Thank You!</h3>
              <p className="text-charcoal/80 mb-8 font-light">
                Javobingiz qabul qilindi. Sizni kutib qolamiz!
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gold hover:bg-bronze text-white py-3 rounded-full uppercase tracking-widest text-xs font-medium transition-colors"
              >
                Yopish
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
