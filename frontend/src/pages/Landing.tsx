import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Nav scroll
    const nav = document.getElementById("ld-nav");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 60) nav.classList.add("ld-scrolled");
      else nav.classList.remove("ld-scrolled");
    };
    window.addEventListener("scroll", onScroll);

    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("ld-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".ld-reveal").forEach((el) => io.observe(el));

    // Carousel
    const track = document.getElementById("ld-carousel");
    const prevBtn = document.getElementById("ld-prevBtn");
    const nextBtn = document.getElementById("ld-nextBtn");
    if (track && prevBtn && nextBtn) {
      const cardWidth = () => {
        const card = track.querySelector(".ld-project-card") as HTMLElement;
        if (!card) return 504;
        return card.getBoundingClientRect().width + 24;
      };
      prevBtn.addEventListener("click", () => track.scrollBy({ left: cardWidth(), behavior: "smooth" }));
      nextBtn.addEventListener("click", () => track.scrollBy({ left: -cardWidth(), behavior: "smooth" }));
    }

    // Chips
    document.querySelectorAll("[data-chip-group]").forEach((group) => {
      group.addEventListener("click", (e) => {
        const chip = (e.target as HTMLElement).closest(".ld-chip");
        if (!chip) return;
        chip.classList.toggle("ld-chip-active");
      });
    });

    // Budget slider
    const range = document.getElementById("ld-budgetRange") as HTMLInputElement;
    const display = document.getElementById("ld-budgetDisplay");
    if (range && display) {
      const fmt = (n: string) => "₪" + Number(n).toLocaleString("he-IL");
      range.addEventListener("input", () => { display.textContent = fmt(range.value); });
    }

    // Form submit
    const form = document.getElementById("ld-quoteForm") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = form.querySelector("button[type=submit]") as HTMLButtonElement;
        const orig = btn.innerHTML;
        btn.innerHTML = "✓ נשלח בהצלחה — נחזור אליכם בקרוב";
        btn.style.background = "#5C6B47";
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ""; form.reset(); if (display) display.textContent = "₪80,000"; }, 4000);
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --ld-terracotta: #B8643E;
          --ld-terracotta-dark: #8E4A2C;
          --ld-olive: #5C6B47;
          --ld-cream: #F5EDE0;
          --ld-cream-warm: #EFE3D0;
          --ld-sand: #E8D9C0;
          --ld-wood: #3D2E1F;
          --ld-wood-light: #6B4F35;
          --ld-ink: #1F1813;
          --ld-paper: #FBF7F1;
          --ld-line: rgba(61,46,31,0.12);
          --ld-line-strong: rgba(61,46,31,0.25);
        }
        .ld-wrap * { box-sizing: border-box; }
        .ld-wrap { font-family: 'Heebo', sans-serif; background: var(--ld-paper); color: var(--ld-ink); line-height: 1.6; direction: rtl; overflow-x: hidden; }
        .ld-serif { font-family: 'Cormorant Garamond', serif; font-weight: 400; }
        .ld-mono { font-family: 'Inter', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px; font-weight: 500; }

        /* NAV */
        .ld-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 48px; display: flex; align-items: center; justify-content: space-between; transition: all 0.4s ease; background: transparent; }
        .ld-scrolled { background: rgba(251,247,241,0.92); backdrop-filter: blur(14px); padding: 14px 48px !important; border-bottom: 1px solid var(--ld-line); }
        .ld-logo { display: flex; align-items: center; gap: 10px; color: var(--ld-paper); transition: color 0.4s ease; text-decoration: none; }
        .ld-scrolled .ld-logo { color: var(--ld-ink); }
        .ld-logo-mark { width: 36px; height: 36px; border: 1.5px solid currentColor; display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; border-radius: 2px; }
        .ld-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; letter-spacing: 0.04em; }
        .ld-logo-text small { display: block; font-size: 9px; letter-spacing: 0.3em; opacity: 0.7; margin-top: -4px; font-family: 'Inter', sans-serif; }
        .ld-nav-links { display: flex; gap: 36px; align-items: center; }
        .ld-nav-links a { color: var(--ld-paper); text-decoration: none; font-size: 14px; font-weight: 400; transition: opacity 0.3s, color 0.4s; position: relative; }
        .ld-scrolled .ld-nav-links a { color: var(--ld-ink); }
        .ld-nav-links a::after { content: ''; position: absolute; bottom: -4px; right: 0; width: 0; height: 1px; background: currentColor; transition: width 0.3s ease; }
        .ld-nav-links a:hover::after { width: 100%; }
        .ld-nav-cta { padding: 10px 22px; background: var(--ld-terracotta); color: var(--ld-paper) !important; border-radius: 999px; font-size: 13px; transition: background 0.3s, transform 0.3s; cursor: pointer; border: none; font-family: inherit; }
        .ld-nav-cta:hover { background: var(--ld-terracotta-dark); transform: translateY(-1px); }
        .ld-nav-cta::after { display: none !important; }

        /* HERO */
        .ld-hero { position: relative; min-height: 100vh; display: flex; align-items: flex-end; padding: 0 48px 80px; overflow: hidden; color: var(--ld-paper); }
        .ld-hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 40%, rgba(184,100,62,0.35), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(92,107,71,0.4), transparent 55%), linear-gradient(135deg, #2a1f15 0%, #3d2e1f 40%, #4a3826 100%); z-index: 0; animation: ldZoom 20s ease-in-out infinite alternate; }
        .ld-hero-bg::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(180deg, transparent 0%, transparent 50%, rgba(31,24,19,0.3) 80%, rgba(31,24,19,0.6) 100%); }
        @keyframes ldZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        .ld-hero-content { position: relative; z-index: 2; max-width: 1400px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1.4fr 1fr; gap: 60px; align-items: end; }
        .ld-hero-eyebrow { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 24px; opacity: 0.9; }
        .ld-dot { width: 6px; height: 6px; background: var(--ld-terracotta); border-radius: 50%; }
        .ld-hero h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(56px, 8vw, 120px); line-height: 0.95; font-weight: 300; margin-bottom: 28px; letter-spacing: -0.02em; }
        .ld-hero h1 em { font-style: italic; color: var(--ld-terracotta); font-weight: 400; }
        .ld-hero-sub { font-size: 17px; line-height: 1.7; max-width: 460px; opacity: 0.88; margin-bottom: 36px; font-weight: 300; }
        .ld-hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .ld-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 32px; border-radius: 999px; font-size: 14px; font-weight: 500; text-decoration: none; transition: all 0.3s ease; cursor: pointer; border: none; font-family: inherit; }
        .ld-btn-primary { background: var(--ld-terracotta); color: var(--ld-paper); }
        .ld-btn-primary:hover { background: var(--ld-terracotta-dark); transform: translateY(-2px); box-shadow: 0 12px 30px -10px rgba(184,100,62,0.6); }
        .ld-btn-ghost { background: transparent; color: var(--ld-paper); border: 1px solid rgba(245,237,224,0.5); }
        .ld-btn-ghost:hover { background: rgba(245,237,224,0.1); border-color: var(--ld-paper); }
        .ld-arrow-circle { width: 26px; height: 26px; background: var(--ld-paper); color: var(--ld-terracotta); border-radius: 50%; display: grid; place-items: center; font-size: 14px; transition: transform 0.3s ease; }
        .ld-btn:hover .ld-arrow-circle { transform: rotate(-45deg) scale(1.1); }
        .ld-hero-meta { display: grid; gap: 32px; padding-bottom: 8px; }
        .ld-hero-stat { border-right: 1px solid rgba(245,237,224,0.25); padding-right: 20px; }
        .ld-hero-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 56px; line-height: 1; font-weight: 400; color: var(--ld-terracotta); }
        .ld-hero-stat-label { font-size: 13px; margin-top: 8px; opacity: 0.85; }
        .ld-hero-scroll { position: absolute; bottom: 32px; left: 48px; z-index: 2; display: flex; align-items: center; gap: 12px; color: var(--ld-paper); opacity: 0.7; }
        .ld-scroll-line { width: 40px; height: 1px; background: currentColor; animation: ldPulse 2s ease-in-out infinite; }
        @keyframes ldPulse { 0%, 100% { transform: scaleX(1); opacity: 0.5; } 50% { transform: scaleX(1.3); opacity: 1; } }

        /* SECTIONS */
        .ld-section { padding: 120px 48px; position: relative; }
        .ld-container { max-width: 1400px; margin: 0 auto; }
        .ld-section-eyebrow { display: flex; align-items: center; gap: 12px; color: var(--ld-terracotta); margin-bottom: 16px; }
        .ld-dash { width: 32px; height: 1px; background: currentColor; }
        .ld-section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px, 5vw, 72px); line-height: 1.05; font-weight: 300; margin-bottom: 24px; letter-spacing: -0.01em; max-width: 900px; }
        .ld-section-title em { font-style: italic; color: var(--ld-terracotta); }
        .ld-section-intro { font-size: 17px; line-height: 1.7; max-width: 560px; color: var(--ld-wood-light); font-weight: 300; }
        .ld-section-head { display: grid; grid-template-columns: 1fr auto; align-items: end; margin-bottom: 64px; gap: 40px; }

        /* ABOUT */
        .ld-about { background: var(--ld-paper); }
        .ld-about-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 80px; align-items: center; }
        .ld-about-image { position: relative; aspect-ratio: 4/5; background: linear-gradient(135deg, #d4a574 0%, #b8643e 50%, #6b4f35 100%); border-radius: 4px; overflow: visible; }
        .ld-about-image::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 24px), radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15), transparent 50%); border-radius: 4px; }
        .ld-about-placeholder { position: absolute; bottom: 24px; right: 24px; color: var(--ld-paper); font-family: 'Inter', monospace; font-size: 11px; letter-spacing: 0.2em; opacity: 0.85; text-transform: uppercase; }
        .ld-about-frame { position: absolute; inset: 16px; border: 1px solid rgba(245,237,224,0.3); }
        .ld-about-tag { position: absolute; bottom: -32px; left: -32px; background: var(--ld-olive); color: var(--ld-paper); padding: 24px 32px; border-radius: 4px; box-shadow: 0 20px 50px -20px rgba(31,24,19,0.4); max-width: 240px; }
        .ld-about-tag .num { font-family: 'Cormorant Garamond', serif; font-size: 48px; line-height: 1; font-weight: 400; }
        .ld-about-tag .lbl { font-size: 13px; margin-top: 6px; opacity: 0.9; }
        .ld-about-text h2 { margin-bottom: 32px; }
        .ld-lead { font-size: 19px; line-height: 1.7; color: var(--ld-ink); font-weight: 300; margin-bottom: 24px; }
        .ld-about-text p { color: var(--ld-wood-light); margin-bottom: 18px; font-weight: 300; }
        .ld-signature { margin-top: 36px; display: flex; align-items: center; gap: 20px; }
        .ld-signature-mark { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 36px; color: var(--ld-terracotta); line-height: 1; }
        .ld-signature-info { font-size: 13px; }
        .ld-signature-info strong { display: block; font-size: 15px; margin-bottom: 2px; }
        .ld-signature-info span { color: var(--ld-wood-light); }

        /* SERVICES */
        .ld-services { background: var(--ld-cream-warm); }
        .ld-services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--ld-line-strong); border: 1px solid var(--ld-line-strong); }
        .ld-service-card { background: var(--ld-cream-warm); padding: 48px 36px; transition: background 0.4s ease; cursor: pointer; position: relative; min-height: 320px; display: flex; flex-direction: column; }
        .ld-service-card:hover { background: var(--ld-paper); }
        .ld-service-card .num { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--ld-terracotta); letter-spacing: 0.15em; margin-bottom: 28px; }
        .ld-service-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 32px; line-height: 1.1; font-weight: 400; margin-bottom: 16px; }
        .ld-service-card .en { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px; color: var(--ld-terracotta); margin-bottom: 16px; direction: ltr; text-align: right; }
        .ld-service-card p { color: var(--ld-wood-light); font-size: 14px; line-height: 1.7; margin-bottom: auto; font-weight: 300; }
        .ld-arrow { margin-top: 32px; width: 40px; height: 40px; border: 1px solid var(--ld-line-strong); border-radius: 50%; display: grid; place-items: center; color: var(--ld-ink); transition: all 0.3s ease; font-size: 14px; }
        .ld-service-card:hover .ld-arrow { background: var(--ld-terracotta); border-color: var(--ld-terracotta); color: var(--ld-paper); transform: rotate(-45deg); }

        /* PROCESS */
        .ld-process { background: var(--ld-wood); color: var(--ld-cream); }
        .ld-process .ld-section-title { color: var(--ld-cream); }
        .ld-process .ld-section-intro { color: rgba(245,237,224,0.7); }
        .ld-process-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 32px; }
        .ld-process-step { position: relative; padding-top: 40px; border-top: 1px solid rgba(245,237,224,0.2); }
        .ld-process-step::before { content: ''; position: absolute; top: -1px; right: 0; width: 40px; height: 1px; background: var(--ld-terracotta); }
        .ld-step-num { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-style: italic; color: var(--ld-terracotta); margin-bottom: 16px; letter-spacing: 0.1em; }
        .ld-process-step h4 { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; margin-bottom: 14px; line-height: 1.2; }
        .ld-process-step p { font-size: 14px; line-height: 1.7; color: rgba(245,237,224,0.7); font-weight: 300; }

        /* PORTFOLIO */
        .ld-portfolio { background: var(--ld-paper); padding: 120px 0 120px 48px; }
        .ld-carousel-wrap { position: relative; }
        .ld-carousel-track { display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; padding-bottom: 12px; scrollbar-width: none; }
        .ld-carousel-track::-webkit-scrollbar { display: none; }
        .ld-project-card { flex: 0 0 480px; scroll-snap-align: start; cursor: pointer; transition: transform 0.4s ease; }
        .ld-project-card:hover { transform: translateY(-6px); }
        .ld-project-image { aspect-ratio: 4/5; border-radius: 4px; overflow: hidden; position: relative; margin-bottom: 20px; }
        .ld-swatch-1 { background: linear-gradient(135deg, #c8896a 0%, #8e4a2c 100%); }
        .ld-swatch-2 { background: linear-gradient(160deg, #8a9870 0%, #4a5a3a 100%); }
        .ld-swatch-3 { background: linear-gradient(135deg, #d4b896 0%, #8b6f4e 100%); }
        .ld-swatch-4 { background: linear-gradient(155deg, #a8917a 0%, #5c4a36 100%); }
        .ld-swatch-5 { background: linear-gradient(135deg, #c4a280 0%, #6b4f35 100%); }
        .ld-swatch-6 { background: linear-gradient(165deg, #b8a896 0%, #4f4438 100%); }
        .ld-project-frame { position: absolute; inset: 16px; border: 1px solid rgba(245,237,224,0.25); pointer-events: none; }
        .ld-ph-label { position: absolute; bottom: 20px; right: 20px; color: var(--ld-paper); font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.2em; opacity: 0.8; text-transform: uppercase; }
        .ld-index-num { position: absolute; top: 20px; left: 20px; color: var(--ld-paper); font-family: 'Cormorant Garamond', serif; font-size: 24px; font-style: italic; opacity: 0.85; }
        .ld-project-meta { display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px; }
        .ld-project-meta h4 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 400; line-height: 1.2; margin-bottom: 6px; }
        .ld-project-meta .tag { font-size: 12px; color: var(--ld-wood-light); letter-spacing: 0.05em; }
        .ld-project-meta .year { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 18px; color: var(--ld-terracotta); }
        .ld-carousel-controls { position: absolute; top: -100px; left: 48px; display: flex; gap: 12px; }
        .ld-carousel-btn { width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--ld-line-strong); background: transparent; color: var(--ld-ink); cursor: pointer; display: grid; place-items: center; font-size: 18px; transition: all 0.3s ease; }
        .ld-carousel-btn:hover { background: var(--ld-ink); color: var(--ld-paper); border-color: var(--ld-ink); }

        /* QUOTE */
        .ld-quote-block { padding: 100px 48px; background: var(--ld-olive); color: var(--ld-cream); text-align: center; }
        .ld-quote-block blockquote { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 4vw, 52px); line-height: 1.2; font-weight: 300; font-style: italic; max-width: 1000px; margin: 0 auto 32px; position: relative; }
        .ld-quote-block blockquote::before { content: '"'; font-size: 120px; color: var(--ld-terracotta); position: absolute; top: -40px; right: -20px; line-height: 1; opacity: 0.4; }
        .ld-quote-attr { font-size: 14px; opacity: 0.85; letter-spacing: 0.1em; }

        /* AI SECTION */
        .ld-ai-section { background: var(--ld-ink); color: var(--ld-cream); padding: 120px 48px; text-align: center; }
        .ld-ai-section .ld-section-title { color: var(--ld-cream); margin: 0 auto 24px; }
        .ld-ai-section p { color: rgba(245,237,224,0.7); font-size: 18px; max-width: 600px; margin: 0 auto 48px; font-weight: 300; line-height: 1.7; }
        .ld-ai-btn { display: inline-flex; align-items: center; gap: 12px; padding: 20px 48px; border-radius: 999px; font-size: 16px; font-weight: 600; background: var(--ld-terracotta); color: var(--ld-paper); cursor: pointer; border: none; font-family: inherit; transition: all 0.3s ease; }
        .ld-ai-btn:hover { background: var(--ld-terracotta-dark); transform: translateY(-2px); box-shadow: 0 20px 40px -15px rgba(184,100,62,0.6); }

        /* CONTACT */
        .ld-contact-section { background: var(--ld-paper); padding: 120px 48px; }
        .ld-contact-wrap { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: start; }
        .ld-contact-info h2 { margin-bottom: 24px; }
        .ld-contact-info p { font-size: 17px; line-height: 1.7; color: var(--ld-wood-light); font-weight: 300; margin-bottom: 40px; }
        .ld-info-list { display: grid; gap: 24px; margin-top: 40px; list-style: none; padding: 0; }
        .ld-info-list li { display: grid; grid-template-columns: 48px 1fr; gap: 20px; align-items: center; }
        .ld-info-icon { width: 48px; height: 48px; border: 1px solid var(--ld-line-strong); border-radius: 50%; display: grid; place-items: center; color: var(--ld-terracotta); font-size: 18px; }
        .ld-info-list strong { display: block; font-size: 15px; margin-bottom: 4px; }
        .ld-info-list span { color: var(--ld-wood-light); font-size: 14px; }
        .ld-info-list a { color: inherit; text-decoration: none; }
        .ld-form { background: var(--ld-cream-warm); padding: 48px; border-radius: 4px; }
        .ld-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .ld-form-field { display: flex; flex-direction: column; }
        .ld-form-field.full { grid-column: 1 / -1; }
        .ld-form-field label { font-size: 12px; color: var(--ld-wood-light); margin-bottom: 8px; letter-spacing: 0.05em; }
        .ld-form-field input, .ld-form-field select, .ld-form-field textarea { padding: 14px 16px; border: 1px solid var(--ld-line-strong); background: var(--ld-paper); border-radius: 2px; font-family: inherit; font-size: 14px; color: var(--ld-ink); transition: border-color 0.3s; direction: rtl; }
        .ld-form-field input:focus, .ld-form-field select:focus, .ld-form-field textarea:focus { outline: none; border-color: var(--ld-terracotta); }
        .ld-form-field textarea { resize: vertical; min-height: 120px; }
        .ld-chip { padding: 8px 16px; border: 1px solid var(--ld-line-strong); border-radius: 999px; font-size: 13px; background: var(--ld-paper); cursor: pointer; transition: all 0.2s; user-select: none; display: inline-block; }
        .ld-chip:hover { border-color: var(--ld-terracotta); }
        .ld-chip-active { background: var(--ld-terracotta); color: var(--ld-paper); border-color: var(--ld-terracotta); }
        .ld-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .ld-budget-display { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: var(--ld-terracotta); margin-bottom: 12px; }
        input[type=range].ld-range { width: 100%; -webkit-appearance: none; background: transparent; margin: 8px 0; }
        input[type=range].ld-range::-webkit-slider-runnable-track { height: 2px; background: var(--ld-line-strong); border-radius: 2px; }
        input[type=range].ld-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--ld-terracotta); border-radius: 50%; margin-top: -8px; cursor: pointer; border: 2px solid var(--ld-paper); box-shadow: 0 2px 8px rgba(184,100,62,0.4); }
        .ld-form-submit { margin-top: 16px; width: 100%; justify-content: center; }

        /* FOOTER */
        .ld-footer { background: var(--ld-ink); color: var(--ld-cream); padding: 80px 48px 32px; }
        .ld-footer-grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 60px; padding-bottom: 60px; border-bottom: 1px solid rgba(245,237,224,0.15); }
        .ld-footer h5 { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 400; margin-bottom: 24px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ld-terracotta); }
        .ld-footer ul { list-style: none; display: grid; gap: 12px; padding: 0; }
        .ld-footer ul a { color: rgba(245,237,224,0.75); text-decoration: none; font-size: 14px; transition: color 0.3s; }
        .ld-footer ul a:hover { color: var(--ld-cream); }
        .ld-footer-brand p { margin-top: 20px; font-size: 14px; line-height: 1.7; color: rgba(245,237,224,0.7); max-width: 360px; font-weight: 300; }
        .ld-social-row { display: flex; gap: 12px; margin-top: 28px; }
        .ld-social-row a { width: 40px; height: 40px; border: 1px solid rgba(245,237,224,0.2); border-radius: 50%; display: grid; place-items: center; color: var(--ld-cream); text-decoration: none; font-size: 14px; transition: all 0.3s; }
        .ld-social-row a:hover { background: var(--ld-terracotta); border-color: var(--ld-terracotta); }
        .ld-footer-bottom { max-width: 1400px; margin: 0 auto; padding-top: 32px; display: flex; justify-content: space-between; color: rgba(245,237,224,0.5); font-size: 12px; }

        /* REVEAL */
        .ld-reveal { opacity: 0; transform: translateY(30px); transition: opacity 1s ease, transform 1s ease; }
        .ld-in { opacity: 1; transform: translateY(0); }

        @media (max-width: 980px) {
          .ld-hero-content, .ld-about-grid, .ld-contact-wrap { grid-template-columns: 1fr; gap: 40px; }
          .ld-services-grid { grid-template-columns: repeat(2, 1fr); }
          .ld-process-steps { grid-template-columns: repeat(2, 1fr); }
          .ld-footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
          .ld-nav-links { display: none; }
          .ld-nav, .ld-scrolled { padding: 14px 24px !important; }
          .ld-section, .ld-contact-section, .ld-footer, .ld-quote-block, .ld-ai-section { padding-left: 24px; padding-right: 24px; }
          .ld-hero { padding: 0 24px 60px; }
          .ld-project-card { flex: 0 0 320px; }
          .ld-form-row { grid-template-columns: 1fr; }
          .ld-form { padding: 28px; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="ld-wrap">
        {/* NAV */}
        <nav className="ld-nav" id="ld-nav">
          <a href="#" className="ld-logo">
            <div className="ld-logo-mark">H</div>
            <div className="ld-logo-text">Home Design<small>INTERIOR · EXTERIOR</small></div>
          </a>
          <div className="ld-nav-links">
            <a href="#services">שירותים</a>
            <a href="#process">תהליך העבודה</a>
            <a href="#portfolio">פורטפוליו</a>
            <a href="#ai">עיצוב AI</a>
            <a href="#contact">צור קשר</a>
            <button className="ld-nav-cta" onClick={() => navigate("/app")}>נסה עכשיו</button>
          </div>
        </nav>

        {/* HERO */}
        <header className="ld-hero">
          <div className="ld-hero-bg"></div>
          <div className="ld-hero-content">
            <div>
              <div className="ld-hero-eyebrow">
                <span className="ld-dot"></span>
                <span className="ld-mono">Est. 2018 — Tel Aviv · Holon</span>
              </div>
              <h1>בית שמספר<br/>את <em>הסיפור שלך</em>.</h1>
              <p className="ld-hero-sub">
                סטודיו לעיצוב פנים וחוץ. אנחנו יוצרים מרחבים חמים וטבעיים שמאזנים בין אסתטיקה, פונקציונליות ואופי אישי — מהסלון, דרך המטבח ועד הגינה.
              </p>
              <div className="ld-hero-actions">
                <button className="ld-btn ld-btn-primary" onClick={() => navigate("/app")}>
                  נסה עיצוב AI
                  <span className="ld-arrow-circle">←</span>
                </button>
                <a href="#portfolio" className="ld-btn ld-btn-ghost">צפייה בפרויקטים</a>
              </div>
            </div>
            <div className="ld-hero-meta">
              <div className="ld-hero-stat">
                <div className="ld-hero-stat-num">120+</div>
                <div className="ld-hero-stat-label">פרויקטים שהושלמו ברחבי הארץ</div>
              </div>
              <div className="ld-hero-stat">
                <div className="ld-hero-stat-num">8</div>
                <div className="ld-hero-stat-label">שנות ניסיון בעיצוב פנים וחוץ</div>
              </div>
            </div>
          </div>
          <div className="ld-hero-scroll">
            <span className="ld-scroll-line"></span>
            <span className="ld-mono">Scroll</span>
          </div>
        </header>

        {/* ABOUT */}
        <section className="ld-section ld-about" id="about">
          <div className="ld-container">
            <div className="ld-about-grid">
              <div className="ld-about-image ld-reveal">
                <div className="ld-about-frame"></div>
                <div className="ld-about-placeholder">[ Studio Portrait ]</div>
                <div className="ld-about-tag">
                  <div className="num">8 yrs</div>
                  <div className="lbl">של חוויה, אופי ופרטים<br/>שאי אפשר לזייף</div>
                </div>
              </div>
              <div className="ld-about-text ld-reveal">
                <div className="ld-section-eyebrow">
                  <span className="ld-dash"></span>
                  <span className="ld-mono">About — אודות</span>
                </div>
                <h2 className="ld-section-title">עיצוב <em>שמרגיש בבית</em>.</h2>
                <p className="ld-lead">
                  Home Design הוא סטודיו בוטיק שמאמין שעיצוב טוב מתחיל בהקשבה. כל מרחב הוא ביוגרפיה — של אנשים, של אור, של חיי היומיום שמתרחשים בתוכו.
                </p>
                <p>אנחנו עובדים עם חומרים טבעיים — עץ, אבן, פשתן ואדמה — ומשלבים פונקציונליות מודרנית עם נשמה.</p>
                <p>הסטודיו ממוקם בחולון ומשרת לקוחות פרטיים, מסחריים, ומשרדים בכל רחבי הארץ.</p>
                <div className="ld-signature">
                  <div className="ld-signature-mark">A.B</div>
                  <div className="ld-signature-info">
                    <strong>Avi Benjana</strong>
                    <span>מייסד ומעצב ראשי</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="ld-section ld-services" id="services">
          <div className="ld-container">
            <div className="ld-section-head ld-reveal">
              <div>
                <div className="ld-section-eyebrow"><span className="ld-dash"></span><span className="ld-mono">Services — שירותים</span></div>
                <h2 className="ld-section-title">תשעה תחומי <em>התמחות</em>.</h2>
              </div>
              <p className="ld-section-intro">מהקירות החיצוניים ועד פינת הקפה — אנחנו מלווים את הפרויקט שלכם בכל קנה מידה.</p>
            </div>
            <div className="ld-services-grid ld-reveal">
              {[
                ["01","Interior Design","עיצוב פנים","תכנון מלא של חלל המגורים — קונספט, פלטה, ריהוט וגימורים."],
                ["02","Garden & Exterior","עיצוב חוץ וגינות","גינות נשימה, חצרות אורח, מרפסות וגגות."],
                ["03","Bedrooms","חדרי שינה","שלווה, אקוסטיקה, אור וטקסטיל — חדר שינה הוא פרויקט בפני עצמו."],
                ["04","Living Rooms","סלונים","הלב של הבית. תאורה רבת רבדים, ריהוט שמחבק וטקסטורות שמזמינות."],
                ["05","Kitchens","מטבחים","תכנון ארגונומי, אי מרכזי, גימורים אדמתיים וחומרים שמתיישנים יפה."],
                ["06","Bathrooms","חדרי אמבטיה","ספא ביתי שמשלב אבן, עץ ומים."],
                ["07","Lighting Design","תכנון תאורה","תאורה היא העיצוב הסמוי. שכבות של אור לכל שעה ביממה."],
                ["08","Renovations","שיפוצים","ניהול שיפוץ מקצה לקצה — תיאום קבלנים, פיקוח ועמידה בתקציב."],
                ["09","Office Spaces","משרדים","חללי עבודה שמייצרים פוקוס, יצירתיות ושייכות."],
              ].map(([num, en, he, desc]) => (
                <article className="ld-service-card" key={num}>
                  <div className="num">0{num} / 09</div>
                  <div className="en">{en}</div>
                  <h3>{he}</h3>
                  <p>{desc}</p>
                  <span className="ld-arrow">←</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="ld-section ld-process" id="process">
          <div className="ld-container">
            <div className="ld-section-head ld-reveal">
              <div>
                <div className="ld-section-eyebrow" style={{color:"var(--ld-terracotta)"}}>
                  <span className="ld-dash"></span>
                  <span className="ld-mono">Process — תהליך העבודה</span>
                </div>
                <h2 className="ld-section-title">ארבעה שלבים, <em>ליווי מלא</em>.</h2>
              </div>
              <p className="ld-section-intro">תהליך מסודר ושקוף — אנחנו יודעים מה הצעד הבא בכל רגע.</p>
            </div>
            <div className="ld-process-steps ld-reveal">
              {[
                ["Step 01 — שלב ראשון","שיחת היכרות","פגישה ללא עלות. מבינים את החלל, השגרה, התקציב והחלום."],
                ["Step 02 — שלב שני","קונספט ותכנון","פלטת חומרים, הדמיות תלת מימדיות ותוכניות עבודה מפורטות."],
                ["Step 03 — שלב שלישי","ביצוע ופיקוח","תיאום קבלנים, ביקורי שטח שבועיים ודוחות התקדמות."],
                ["Step 04 — שלב רביעי","סטיילינג ומסירה","הסידור הסופי — טקסטיל, אקססוריז, צמחים ויצירות."],
              ].map(([step, title, desc]) => (
                <div className="ld-process-step" key={step}>
                  <div className="ld-step-num">{step}</div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section className="ld-portfolio" id="portfolio">
          <div style={{maxWidth:"1400px",margin:"0 auto 64px",paddingLeft:"48px",display:"grid",gridTemplateColumns:"1fr auto",gap:"40px",alignItems:"end"}} className="ld-reveal">
            <div>
              <div className="ld-section-eyebrow"><span className="ld-dash"></span><span className="ld-mono">Portfolio — פורטפוליו</span></div>
              <h2 className="ld-section-title">פרויקטים <em>נבחרים</em>.</h2>
            </div>
            <p className="ld-section-intro">מבית פרטי בהרצליה ועד מטבח-גן בכפר.</p>
          </div>
          <div className="ld-carousel-wrap ld-reveal">
            <div className="ld-carousel-controls">
              <button className="ld-carousel-btn" id="ld-prevBtn">→</button>
              <button className="ld-carousel-btn" id="ld-nextBtn">←</button>
            </div>
            <div className="ld-carousel-track" id="ld-carousel">
              {[
                ["1","ld-swatch-1","Living · Tel Aviv","בית הרבדים","סלון ומטבח · 140 מ\"ר","'24"],
                ["2","ld-swatch-2","Garden · Hod Hasharon","גן הזית","חצר אחורית · 220 מ\"ר","'24"],
                ["3","ld-swatch-3","Kitchen · Holon","מטבח האדמה","מטבח ופינת אוכל","'23"],
                ["4","ld-swatch-4","Bedroom · Ramat Gan","שינה שקטה","חדר הורים · 32 מ\"ר","'23"],
                ["5","ld-swatch-5","Office · Herzliya","סטודיו עץ ואור","משרד · 180 מ\"ר","'24"],
                ["6","ld-swatch-6","Bathroom · Modiin","אמבט אבן","חדר אמבטיה הורים","'23"],
              ].map(([idx, swatch, loc, title, tag, year]) => (
                <article className="ld-project-card" key={idx}>
                  <div className="ld-project-image">
                    <div className={swatch} style={{position:"absolute",inset:0}}></div>
                    <div className="ld-project-frame"></div>
                    <div className="ld-index-num">0{idx}</div>
                    <div className="ld-ph-label">[ {loc} ]</div>
                  </div>
                  <div className="ld-project-meta">
                    <div><h4>{title}</h4><span className="tag">{tag}</span></div>
                    <div className="year">{year}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <section className="ld-quote-block ld-reveal">
          <blockquote>בית מעוצב היטב הוא לא רק יפה — הוא חי איתך, משתנה איתך, ומשקף בדיוק את מי שאתה.</blockquote>
          <div className="ld-quote-attr ld-serif">— פילוסופיית הסטודיו</div>
        </section>

        {/* AI SECTION */}
        <section className="ld-ai-section ld-reveal" id="ai">
          <div className="ld-section-eyebrow" style={{justifyContent:"center",color:"var(--ld-terracotta)",marginBottom:"16px"}}>
            <span className="ld-dash"></span>
            <span className="ld-mono">AI Design Tool</span>
            <span className="ld-dash"></span>
          </div>
          <h2 className="ld-section-title" style={{textAlign:"center"}}>ראו את <em>הבית שלכם</em> מחולל.</h2>
          <p>העלו תמונה של חדר — ה-AI שלנו יעצב אותו מחדש בסגנון שבחרתם ויבנה עבורכם רשימת קנייה מפורטת.</p>
          <button className="ld-ai-btn" onClick={() => navigate("/app")}>
            ✨ נסו עכשיו — בחינם
          </button>
        </section>

        {/* CONTACT */}
        <section className="ld-contact-section" id="contact">
          <div className="ld-contact-wrap">
            <div className="ld-contact-info ld-reveal">
              <div className="ld-section-eyebrow"><span className="ld-dash"></span><span className="ld-mono">Get a Quote — הצעת מחיר</span></div>
              <h2 className="ld-section-title">בואו <em>נתחיל</em>.</h2>
              <p>השאירו פרטים וניצור איתכם קשר תוך 24 שעות לפגישת היכרות חינם.</p>
              <ul className="ld-info-list">
                <li>
                  <div className="ld-info-icon">☎</div>
                  <div><strong><a href="tel:0587202052">058-720-2052</a></strong><span>זמינים א'–ה' · 09:00–18:00</span></div>
                </li>
                <li>
                  <div className="ld-info-icon">✉</div>
                  <div><strong>studio@homedesign.co.il</strong><span>נחזור אליכם תוך יום עסקים</span></div>
                </li>
                <li>
                  <div className="ld-info-icon">◉</div>
                  <div><strong>בית לחם 16, חולון</strong><span>הסטודיו פתוח לפי תיאום מראש</span></div>
                </li>
              </ul>
            </div>
            <form className="ld-form ld-reveal" id="ld-quoteForm">
              <div className="ld-form-row">
                <div className="ld-form-field"><label>שם מלא</label><input type="text" placeholder="הקלידו שם" required /></div>
                <div className="ld-form-field"><label>טלפון</label><input type="tel" placeholder="050-0000000" required /></div>
              </div>
              <div className="ld-form-row">
                <div className="ld-form-field full"><label>אימייל</label><input type="email" placeholder="name@example.com" required /></div>
              </div>
              <div className="ld-form-row">
                <div className="ld-form-field full">
                  <label>סוג הפרויקט</label>
                  <div className="ld-chip-row" data-chip-group="type">
                    {["עיצוב פנים","חוץ / גינה","מטבח","חדר אמבטיה","חדר שינה","שיפוץ מלא","משרד"].map(c => (
                      <span className="ld-chip" key={c}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ld-form-row">
                <div className="ld-form-field full">
                  <label>תקציב משוער</label>
                  <div className="ld-budget-display" id="ld-budgetDisplay">₪80,000</div>
                  <input className="ld-range" type="range" id="ld-budgetRange" min="20000" max="500000" step="5000" defaultValue="80000" />
                </div>
              </div>
              <div className="ld-form-row">
                <div className="ld-form-field full"><label>ספרו לנו על הפרויקט</label><textarea placeholder="כמה מילים על המרחב, הסגנון שאתם אוהבים, ומה החלום…"></textarea></div>
              </div>
              <button type="submit" className="ld-btn ld-btn-primary ld-form-submit">
                שלחו ונדבר
                <span className="ld-arrow-circle">←</span>
              </button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="ld-footer">
          <div className="ld-footer-grid">
            <div className="ld-footer-brand">
              <a href="#" className="ld-logo" style={{color:"var(--ld-cream)"}}>
                <div className="ld-logo-mark">H</div>
                <div className="ld-logo-text">Home Design<small>INTERIOR · EXTERIOR</small></div>
              </a>
              <p>סטודיו לעיצוב פנים וחוץ. אנחנו יוצרים מרחבים חמים שמשקפים את האנשים שגרים בהם.</p>
              <div className="ld-social-row">
                <a href="#" aria-label="Instagram">Ig</a>
                <a href="#" aria-label="Pinterest">Pi</a>
                <a href="#" aria-label="Facebook">Fb</a>
                <a href="#" aria-label="Linkedin">In</a>
              </div>
            </div>
            <div>
              <h5>שירותים</h5>
              <ul><li><a href="#services">עיצוב פנים</a></li><li><a href="#services">עיצוב חוץ</a></li><li><a href="#services">מטבחים</a></li><li><a href="#services">שיפוצים</a></li></ul>
            </div>
            <div>
              <h5>הסטודיו</h5>
              <ul><li><a href="#about">אודות</a></li><li><a href="#process">תהליך העבודה</a></li><li><a href="#portfolio">פורטפוליו</a></li><li><a href="#ai">עיצוב AI</a></li></ul>
            </div>
            <div>
              <h5>צרו קשר</h5>
              <ul><li><a href="tel:0587202052">058-720-2052</a></li><li>studio@homedesign.co.il</li><li>בית לחם 16, חולון</li><li><a href="#contact">הצעת מחיר</a></li></ul>
            </div>
          </div>
          <div className="ld-footer-bottom">
            <span>© 2026 Home Design Studio. All rights reserved.</span>
            <span>Crafted with care · Holon, IL</span>
          </div>
        </footer>
      </div>
    </>
  );
}
