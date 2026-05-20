"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "taklifnomaa_bot";

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!mounted) return null;

  const units = [
    { label: "kun", value: timeLeft.days },
    { label: "soat", value: timeLeft.hours },
    { label: "daqiqa", value: timeLeft.minutes },
    { label: "soniya", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              key={value}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="w-14 sm:w-16 h-14 sm:h-16 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center"
            >
              <span className="text-2xl sm:text-3xl font-serif text-gold font-medium">
                {String(value).padStart(2, "0")}
              </span>
            </motion.div>
            <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-charcoal/50 mt-1.5">{label}</span>
          </div>
          {i < 3 && <span className="text-gold/50 text-xl font-light mx-0.5 mb-4">:</span>}
        </div>
      ))}
    </div>
  );
}

function MonogramSeal({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "w-14 h-14" : "w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]";

  return (
    <div className={`relative ${dimensions} ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFFDF6] via-[#F6EFD8] to-[#E9D08A] shadow-[0_8px_20px_rgba(0,0,0,0.18)] border border-white/60" />
      <div className="absolute inset-[6px] rounded-full border border-gold/35" />
      <div className="absolute inset-[12px] rounded-full bg-gradient-to-br from-white/85 to-[#F9F3E6] border border-gold/20 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-full h-full text-gold">
          <span className="absolute left-1/2 top-[18%] -translate-x-1/2 text-[8px] sm:text-[9px] tracking-[0.35em] uppercase opacity-75">J</span>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-serif italic">&</span>
          <span className="absolute left-1/2 bottom-[14%] -translate-x-1/2 text-[8px] sm:text-[9px] tracking-[0.35em] uppercase opacity-75">G</span>
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.7l6.8-4.4" />
      <path d="M8.6 13.3l6.8 4.4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}


export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInvitationPreview, setShowInvitationPreview] = useState(false);
  const [openingStep, setOpeningStep] = useState<0 | 1 | 2>(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  const rotateX = useTransform(mouseY, [-200, 200], [15, -15]);
  const rotateY = useTransform(mouseX, [-200, 200], [-15, 15]);
  const openTimersRef = useRef<number[]>([]);
  const sparkleSeed = openingStep >= 1 ? 1 : 0;
  const sparkles = useMemo(() => {
    if (shouldReduceMotion || sparkleSeed === 0) return [];

    return Array.from({ length: 24 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 24;
      const velocity = 40 + Math.random() * 80;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity + Math.random() * 30;

      return {
        key: i,
        x,
        y,
        scale: Math.random() * 0.8 + 0.4,
        duration: 0.6 + Math.random() * 0.4,
      };
    });
  }, [shouldReduceMotion, sparkleSeed]);

  const isInAppBrowser = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Telegram|FBAN|FBAV|Instagram|Line|WebView|wv/i.test(navigator.userAgent || '');
  }, []);

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

    openTimersRef.current.push(window.setTimeout(() => {
      setOpeningStep(2);
    }, 500));

    openTimersRef.current.push(window.setTimeout(() => {
      setIsOpen(true);
    }, 1300));
  };

  const [hasRsvpd, setHasRsvpd] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('has_rsvpd');
    if (stored === 'true') {
      setHasRsvpd(true);
      const storedFirstName = window.localStorage.getItem('rsvpd_firstName');
      if (storedFirstName) setFirstName(storedFirstName);

      const storedAttendance = window.localStorage.getItem('rsvpd_attendance');
      if (storedAttendance === 'yes' || storedAttendance === 'no') {
        setAttendance(storedAttendance);
      } else if (storedFirstName) {
        setAttendance('yes');
        window.localStorage.setItem('rsvpd_attendance', 'yes');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      openTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      openTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!showInvitationPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInvitationPreview(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInvitationPreview]);

  // Build a direct URL to the server-generated PDF for sharing/opening in external viewers
  const getShareUrl = () => {
    const path = `/api/rsvp?firstName=${encodeURIComponent(firstName)}&attendance=yes`;
    if (typeof window === 'undefined') return path;
    return `${location.origin}${path}`;
  };

  const getBotLink = () => {
    const bytes = new TextEncoder().encode(firstName.trim() || 'Mehmon');
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    const base64 = typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');

    const payload = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${payload}`;
  };

  const openInNewTab = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {}
    }
  };

  const handleOpenExternalBrowser = () => {
    openInNewTab(getShareUrl());
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard?.writeText(shareUrl);
      alert('Link nusxalandi. Uni Telegramga yuborishingiz yoki brauzerda ochishingiz mumkin.');
    } catch {
      alert('Linkni nusxalab bo‘lmadi. Iltimos, manzilni qo‘lda nusxa oling.');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = getShareUrl();

      // Prefer sharing a URL (works in many in-app browsers including Telegram)
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Taklifnoma', text: 'Sizni taklif qilamiz', url: shareUrl });
          return;
        } catch (err) {
          console.warn('navigator.share failed with URL, falling back', err);
        }
      }

      // Fallback: open the PDF URL in a new tab so the user can use the viewer's native save/share
      openInNewTab(shareUrl);
    } catch (err) {
      console.error('Error sharing:', err);
      // Final fallback: copy link to clipboard
      const shareUrl = getShareUrl();
      try {
        await navigator.clipboard?.writeText(shareUrl);
        alert('Link nusxalandi. Tashqi brauzerda oching yoki paste qilib ulashing.');
      } catch {
        alert("Ulashishda xatolik yuz berdi. Iltimos, linkni qo'lda nusxa oling.");
      }
    }
  };

  const handleDownload = async () => {
    try {
      const shareUrl = getShareUrl();
      // Open inline PDF in viewer (more reliable in in-app browsers than programmatic blob downloads)
      openInNewTab(shareUrl);
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Yuklab olish amalga oshmadi. Iltimos, tashqi brauzerda oching.');
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
        body: JSON.stringify({ firstName, attendance }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error('RSVP request failed:', errorBody ?? response.statusText);
        alert("Javob yuborilmadi. Iltimos qayta urinib ko'ring.");
        return;
      }

      window.localStorage.setItem('has_rsvpd', 'true');
      window.localStorage.setItem('rsvpd_firstName', firstName);
      window.localStorage.setItem('rsvpd_attendance', attendance);

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-3 sm:p-8 md:p-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-bronze/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Visually hidden PNG template generator */}
      {firstName && (
      <div className="overflow-hidden absolute top-[-9999px] left-[-9999px] z-[-999]" aria-hidden="true">
        <div className="w-[800px] h-[1131px] bg-cream flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
          {/* Use the SVG invitation artwork as the capture base */}
          <Image
            src="/taklifnoma.svg"
            alt="Invitation template"
            fill
            priority
            unoptimized
            className="absolute inset-0 object-cover"
          />
          {openingStep >= 1 && !shouldReduceMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-[-35%] w-[35%] rotate-12 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-2xl"
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: "320%", opacity: [0, 0.75, 0] }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          )}

          <div className="relative z-10 w-full h-full flex flex-col items-center">
            <MonogramSeal size="md" className="absolute top-[14%] left-1/2 -translate-x-1/2" />
            {firstName && (
              <div className="absolute top-[67.5%] w-full flex flex-col items-center">
                <p className="text-[28px] font-serif font-bold italic text-[#6B111A] leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
                  {firstName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <AnimatePresence mode="wait">
        {!isOpen && !hasRsvpd ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -40, filter: "blur(12px)" }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 100, damping: 20 }}
            className="cursor-pointer z-50 flex flex-col items-center justify-center group [perspective:2000px] touch-manipulation select-none"
            onClick={handleOpenSequence}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={0}
            aria-label="Taklifnomani ochish"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenSequence();
              }
            }}
          >
            {/* Minimalist Envelope Container */}
            <motion.div
              style={shouldReduceMotion ? undefined : { rotateX, rotateY }}
              whileHover={shouldReduceMotion || openingStep !== 0 ? {} : { scale: 1.02, y: -12 }}
              className="relative w-[min(20rem,calc(100vw-2rem))] h-56 sm:w-[28rem] sm:h-72 bg-[#EAE3D6] shadow-[0_20px_60px_-15px_rgba(212,175,55,0.4)] hover:shadow-[0_30px_70px_-15px_rgba(212,175,55,0.5)] transition-shadow duration-500 rounded-md flex items-center justify-center border border-gold/30 [transform-style:preserve-3d]"
            >

              {/* Luxurious Inner Texture */}
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none rounded-md"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10l10-10 10 10-10 10L0 10zm10 8.5L1.5 10 10 1.5 18.5 10 10 18.5z' fill='%23d4af37' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: '20px 20px'
                }}
              ></div>

              {openingStep >= 1 && !shouldReduceMotion && (
                <motion.div
                  className="absolute inset-0 z-[12] pointer-events-none overflow-hidden rounded-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-[-40%] w-[35%] rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-2xl"
                    initial={{ x: 0 }}
                    animate={{ x: "360%" }}
                    transition={{ duration: 1.9, ease: "easeInOut" }}
                  />
                </motion.div>
              )}

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
                  <h2 className="text-bronze text-[10px] sm:text-xs tracking-[0.3em] uppercase">Visol Oqshomi</h2>
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
                transition={shouldReduceMotion ? { duration: 0.3 } : { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute top-0 left-0 w-full h-full origin-top pointer-events-none drop-shadow-[0_8px_12px_rgba(0,0,0,0.15)]"
              >
                <div className="w-full h-full bg-[#F2EBE1]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 55%)' }}></div>
              </motion.div>

              {/* Sparkle Burst */}
              {sparkles.length > 0 && (
                <div className="absolute top-[53%] left-1/2 w-0 h-0 z-50 pointer-events-none">
                  {sparkles.map((sparkle) => (
                      <motion.div
                        key={sparkle.key}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: 0,
                          scale: sparkle.scale,
                          x: sparkle.x,
                          y: sparkle.y + 40
                        }}
                        transition={{ duration: sparkle.duration, ease: "easeOut" }}
                        className="absolute w-1.5 h-1.5 bg-gradient-to-tr from-gold to-[#FFF8D6] rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]"
                      />
                  ))}
                </div>
              )}

              {/* Seal */}
              <div className="absolute top-[52%] sm:top-[53%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <motion.div
                  animate={{
                    scale: openingStep >= 1 ? 1.5 : 1,
                    opacity: openingStep >= 1 ? 0 : 1
                  }}
                  transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 0.4, ease: "easeOut" }}
                >
                  <MonogramSeal size="sm" className="group-hover:scale-110 transition-transform duration-500 ease-out" />
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              animate={{ opacity: openingStep >= 1 ? 0 : 1 }}
              className="mt-12 text-charcoal/50 tracking-[0.4em] text-xs uppercase animate-pulse font-medium"
            >
              Ochish uchun bosing
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
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(205,127,50,0.08),transparent_45%)] pointer-events-none"></div>
              {/* Decorative corner borders */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-gold/60 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-gold/60 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-gold/60 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-gold/60 rounded-br-lg"></div>

                <div className="pt-4 pb-8 sm:pb-12">
                <div className="w-24 h-[1px] bg-gold/40 mx-auto mb-8 sm:mb-12"></div>
                
                {/* Bismillah or Arabic text from template if needed, but keeping it minimalist */}
                <p className="text-[#6B111A] text-[10px] tracking-[0.4em] mb-6 uppercase font-bold">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>

                <p className="text-charcoal/80 text-base sm:text-lg leading-relaxed font-light max-w-xl mx-auto whitespace-pre-line">
                  <span className="text-[#6B111A] tracking-[0.3em] uppercase text-xs sm:text-sm font-bold block mb-8">
                    ASSALOMU ALAYKUM !
                  </span>
                  QADRLI VA AZIZ MEHMONIMIZ !{"\n"}
                  GO&apos;ZAL HAYOT OSTONASIDA POK NIYATLAR, EZGU ORZULAR VA SAMIMIY TILAKLAR ILA HAYOTIMIZNI BOSHLAMOQCHIMIZ !
                </p>
 
                {/* Couple Names */}
                <div className="text-center py-6 sm:py-10">
                  <h1 className="text-3xl sm:text-5xl text-[#6B111A] font-serif tracking-tighter leading-tight uppercase font-bold italic">
                    JAMSHIDBEK <br/> & <br/> GULSHODA
                  </h1>
                </div>
 
                <p className="text-charcoal/80 text-base sm:text-lg leading-relaxed font-light max-w-xl mx-auto whitespace-pre-line italic">
                  LARNING NIKOH TO&apos;YLARI MUNOSABATI BILAN 6-7 IYUN KUNLARI BO&apos;LIB O&apos;TADIGAN &quot;QIZ BAZMIGA&quot; HAMDA UNUTILMAS NIKOH VA BAXT KECHAMIZGA TAKLIF ETAMIZ.{"\n\n"}
                  HURMAT VA EHTIROM BILAN
                </p>
 
                {/* Signature */}
                <div className="mt-8">
                  <p className="text-3xl sm:text-4xl text-[#6B111A] font-serif font-bold italic">Jamshidbek & Gulshoda</p>
                </div>
 
                <div className="w-24 h-[1px] bg-gold/40 mx-auto mt-8 sm:mt-12"></div>
              </div>

              {/* Event Schedule */}
              <div className="space-y-8 pb-6">

                {/* Qiz Bazmi */}
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.3em] uppercase text-bronze font-medium">Qiz Bazmi</p>
                  <p className="text-3xl sm:text-4xl font-serif text-charcoal/90 font-medium tracking-wide">13:00</p>
                  <p className="text-lg sm:text-xl font-medium text-charcoal/80">06.06.2026</p>
                </div>

                {/* Nikoh Oqshomi */}
                <div className="w-24 h-[1px] bg-gold/40 mx-auto my-4"></div>
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.3em] uppercase text-bronze font-medium">Nikoh Oqshomi</p>
                  <p className="text-lg sm:text-xl font-medium text-charcoal/80">07.06.2026</p>
                  <div className="pt-2 space-y-1">
                    <p className="text-base font-medium text-charcoal/90">Norin kapa MAXMUDJON OTA ZAMIN to&apos;yxonasi</p>
                    <p className="text-charcoal/70 font-light text-sm sm:text-base">Namangan viloyati, Norin tumani</p>
                  </div>
                </div>

                {/* Countdown Timer */}
                <CountdownTimer targetDate="2026-06-06T13:00:00" />

                <div className="w-24 h-[1px] bg-gold/40 mx-auto my-4"></div>

                {/* Map Section */}
                <div className="w-full max-w-sm mx-auto h-64 border border-gold/20 bg-cream/50 rounded overflow-hidden shadow-inner relative group">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.838507361817!2d71.8921803765636!3d40.93091497136087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDU1JzUxLjMiTiA3McKwNTMnMzEuOCJF!5e0!3m2!1suz!2s!4v1715490000000!5m2!1suz!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Wedding Venue Location"
                    className="grayscale-[0.2] contrast-[1.1] brightness-[0.95]"
                  ></iframe>
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=40.930915,71.894369"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/90 hover:bg-white text-gold text-[10px] px-3 py-1.5 rounded-full shadow-sm border border-gold/20 transition-all font-medium uppercase tracking-wider"
                    >
                      Xaritada ochish
                    </a>
                  </div>
                </div>
              </div>

              <div className="w-24 h-[1px] bg-gold/40 mx-auto my-8 sm:my-10"></div>

              <div className="space-y-6 pb-6 relative z-10">
                {hasRsvpd ? (
                  <div className="w-full max-w-md mx-auto space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
                      <MonogramSeal size="sm" className="scale-90" />
                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif text-gold mb-2 tracking-wide">
                      {attendance === 'yes' ? 'Rahmat! Sizni kutamiz' : 'Rahmat!'}
                    </h3>
                    <p className="text-charcoal/80 mb-8 font-light text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                      {attendance === 'yes'
                        ? 'Javobingiz qabul qilindi. Taklifnomangizni saqlab oling yoki do‘stlaringiz bilan ulashing.'
                        : 'Javobingiz qabul qilindi. Sizni bu baxtli kunda ko‘rishdan xursand bo‘lamiz.'}
                    </p>

                    {isInAppBrowser && attendance === 'yes' && (
                      <div className="mb-5 rounded-2xl border border-gold/20 bg-white/70 px-4 py-3 text-left shadow-sm">
                        <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed">
                          <span className="font-semibold text-gold">Telegram browser detected:</span>{' '}
                          if the share or download button feels limited, tap <span className="font-semibold">Open in external browser</span> or{' '}
                          copy the link and send it to friends.
                        </p>
                      </div>
                    )}

                    {attendance === 'yes' ? (
                      <div className="flex flex-col space-y-4 pt-4">
                        <button
                          onClick={() => setShowInvitationPreview(true)}
                          type="button"
                          className="group w-full rounded-2xl border border-gold/30 bg-white/65 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                        >
                          <span className="relative mx-auto block aspect-[800/1131] w-full max-w-[13rem] overflow-hidden rounded-xl border border-gold/20 bg-cream shadow-md">
                            <Image
                              src="/taklifnoma.svg"
                              alt="Shaxsiy taklifnoma"
                              fill
                              sizes="13rem"
                              unoptimized
                              className="object-cover"
                            />
                            <span className="absolute top-[67.5%] left-0 right-0 z-10 text-center text-[10px] font-serif font-bold italic leading-none text-[#6B111A] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                              {firstName}
                            </span>
                          </span>
                          <span className="mt-3 block text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
                            Taklifnomani ko&apos;rish
                          </span>
                        </button>

                        <a
                          href={getBotLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-[#229ED9] hover:bg-[#168AC0] text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl shadow-md tracking-[0.12em] uppercase text-xs sm:text-sm font-medium"
                        >
                          Taklifnomani Telegram orqali olish
                        </a>
                        <button
                          onClick={handleShare}
                          type="button"
                          className="w-full bg-gradient-to-r from-gold to-[#DDBB54] hover:from-bronze hover:to-gold text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl shadow-md tracking-[0.15em] uppercase text-xs sm:text-sm font-medium"
                        >
                          Taklifnomani Ulashish
                        </button>
                        <button
                          onClick={handleDownload}
                          type="button"
                          className="w-full bg-transparent border border-gold/70 text-gold hover:bg-gold hover:text-white px-10 py-4 rounded-full transition-all duration-300 tracking-[0.15em] uppercase text-xs sm:text-sm font-medium"
                        >
                          Yuklab Olish
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={handleOpenExternalBrowser}
                            type="button"
                            className="w-full bg-white/70 hover:bg-white border border-gold/25 text-gold px-6 py-3 rounded-full transition-colors duration-300 tracking-[0.12em] uppercase text-[11px] sm:text-xs font-medium"
                          >
                            Tashqi brauzerda ochish
                          </button>
                          <button
                            onClick={handleCopyLink}
                            type="button"
                            className="w-full bg-white/70 hover:bg-white border border-gold/25 text-gold px-6 py-3 rounded-full transition-colors duration-300 tracking-[0.12em] uppercase text-[11px] sm:text-xs font-medium"
                          >
                            Linkni nusxalash
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs tracking-[0.25em] uppercase text-bronze/70 font-medium">
                        Sizga samimiy tilaklarimizni yo‘llaymiz
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-8">
                    <p className="text-charcoal/70 text-sm sm:text-base font-light leading-relaxed text-center tracking-wide whitespace-pre-line">HAYOTIMIZNING BU BAXTIYOR KUNIDA{'\n'}BIZ BILAN BO&apos;LISHINGIZDAN UMIDVORMIZ.</p>

                    <div className="w-full">
                      <input
                        type="text"
                        placeholder="Ismingiz"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full bg-transparent border-0 border-b border-gold/50 focus:border-gold focus:ring-0 px-0 py-2 text-charcoal placeholder-charcoal/40 outline-none transition-colors"
                      />
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
                          checked={attendance === 'yes'}
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
                          checked={attendance === 'no'}
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
                        "Tasdiqlash va Olish"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personalized invitation preview */}
      <AnimatePresence>
        {showInvitationPreview && attendance === 'yes' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-md"
            onClick={() => setShowInvitationPreview(false)}
          >
            <div className="absolute right-4 top-4 z-20 flex gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownload();
                }}
                type="button"
                aria-label="Taklifnomani yuklab olish"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/90 text-[#6B111A] shadow-lg transition-colors hover:bg-white"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleShare();
                }}
                type="button"
                aria-label="Taklifnomani ulashish"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/90 text-[#6B111A] shadow-lg transition-colors hover:bg-white"
              >
                <ShareIcon />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setShowInvitationPreview(false);
                }}
                type="button"
                aria-label="Yopish"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/90 text-[#6B111A] shadow-lg transition-colors hover:bg-white"
              >
                <CloseIcon />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="relative aspect-[800/1131] overflow-hidden rounded-xl bg-cream shadow-2xl"
              style={{ width: 'min(88vw, calc(82vh * 800 / 1131), 34rem)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src="/taklifnoma.svg"
                alt="Shaxsiy taklifnoma"
                fill
                sizes="(max-width: 640px) 88vw, 34rem"
                priority
                unoptimized
                className="object-cover"
              />
              <div className="absolute top-[67.5%] left-0 right-0 z-10 text-center">
                <p className="font-serif text-[clamp(1rem,3.5vw,1.65rem)] font-bold italic leading-none text-[#6B111A] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                  {firstName}
                </p>
              </div>
            </motion.div>
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
                className="bg-gradient-to-br from-[#FFFDF8] via-[#FDF6E9] to-[#F7EED8] p-8 sm:p-12 rounded-[1.75rem] shadow-[0_30px_90px_-30px_rgba(91,64,15,0.45)] max-w-sm w-full text-center border border-gold/25 relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_35%),radial-gradient(circle_at_bottom,rgba(205,127,50,0.08),transparent_35%)]"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gold/20">
                  <span className="text-3xl">✨</span>
                </div>
                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mb-6"></div>
                <h3 className="text-2xl font-serif text-gold mb-2 tracking-wide">Rahmat!</h3>
                <p className="text-charcoal/80 mb-8 font-light leading-relaxed">
                  Javobingiz qabul qilindi. Sizni kutib qolamiz!
                </p>
                {attendance === 'yes' ? (
                  <div className="space-y-3 mb-6">
                    <a
                      href={getBotLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#229ED9] hover:bg-[#168AC0] text-white py-3 rounded-full uppercase tracking-[0.14em] text-xs font-medium transition-all duration-300 shadow-md"
                    >
                      Taklifnomani Telegram orqali olish
                    </a>
                    <button
                      onClick={handleShare}
                      type="button"
                      className="w-full bg-gradient-to-r from-gold to-[#DDBB54] hover:from-bronze hover:to-gold text-white py-3 rounded-full uppercase tracking-[0.18em] text-xs font-medium transition-all duration-300 shadow-md"
                    >
                      Taklifnomani Ulashish
                    </button>
                    <button
                      onClick={handleDownload}
                      type="button"
                      className="w-full bg-white/60 hover:bg-white text-gold border border-gold/30 py-3 rounded-full uppercase tracking-[0.18em] text-xs font-medium transition-all duration-300"
                    >
                      Yuklab Olish
                    </button>
                  </div>
                ) : null}
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-transparent border border-gold/25 text-gold hover:bg-gold hover:text-white py-3 rounded-full uppercase tracking-[0.18em] text-xs font-medium transition-colors"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
