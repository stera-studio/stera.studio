/* localization: TR/EN text tables and DOM application */
import { PARAMS } from "./utils.js";

const I18N = {
  tr: {
    title: "stera studio — oyunlar yapıyoruz",
    desc: "stera studio: bağımsız bir oyun stüdyosu. ilk oyunumuz üzerinde çalışıyoruz.",
    dom: {
      "nav.games": "oyunlar", "nav.about": "hakkımızda", "nav.contact": "iletişim", "nav.minigame": "minigame",
      "tagline": "oyunlar yapıyoruz.", "hint": "kaydır ↓",
      "games.h": "oyunlar",
      "games.lead": "ilk oyunumuz üzerinde çalışıyoruz. şimdilik bu kadarını söyleyebiliriz:",
      "soon": "yakında", "verysoon": "çok yakında",
      "about.h": "hakkımızda",
      "about.lead": "stera studio, küçük ama iddialı bağımsız bir oyun stüdyosu. az kişiyiz, çok hayalimiz var. oynaması kadar yapması da keyifli oyunlar peşindeyiz — detaylar yakında.",
      "contact.h": "iletişim",
      "contact.lead": "bir fikriniz mi var? sadece merhaba mı demek istediniz?",
      "footer": "© 2026 stera studio — logomuz canlıdır, nazik olun.",
      "mg.h": "minigame",
      "mg.lead": "henüz bir oyunumuz yok ama siz sıkılmayın diye küçük bir şey hazırladık.",
      "mg.btn": "oyuna atla",
      "mg.score": "skor",
      "mg.best": "rekor",
      "mg.again": "tekrar",
      "mg.exit": "çık",
    },
    intro: "merhaba, biz stera.",
    poke: ["hihi.", "bir daha!", "gıdıklanıyorum.", "bunu sevdim.", "hey!"],
    dizzy: "of… başım döndü.",
    bored: "sıkıldım…",
    sleep: "zZz…",
    mgGo: "geliyorum!",
    mgOver: "yakalandım…",
    mgFall: "aaa… düştüm.",
    mgBye: "iyi oyundu!",
    mgWarn: "eyvah, geliyorlar!",
    mgJump: "zıpla! (boşluk / dokun)",
    mgQuips: ["beni yakalayamazsınız!", "yukarı, hep yukarı!", "daha hızlı!", "tırmanmaya devam!"],
    sections: {
      games: "oyunlarımız… yakında. söz.",
      about: "evet, bunlar biziz.",
      contact: "bize yazın, cevap veririz!",
      minigame: "sıkıldınız mı? aşağıya bakın.",
    },
  },
  en: {
    title: "stera studio — we make games",
    desc: "stera studio: an independent game studio. we're working on our first game.",
    dom: {
      "nav.games": "games", "nav.about": "about", "nav.contact": "contact", "nav.minigame": "minigame",
      "tagline": "we make games.", "hint": "scroll ↓",
      "games.h": "games",
      "games.lead": "we're working on our first game. this is all we can say for now:",
      "soon": "soon", "verysoon": "very soon",
      "about.h": "about",
      "about.lead": "stera studio is a small but ambitious independent game studio. few people, many dreams. we chase games that are as fun to make as they are to play — details soon.",
      "contact.h": "contact",
      "contact.lead": "got an idea? or just wanted to say hi?",
      "footer": "© 2026 stera studio — our logo is alive, please be gentle.",
      "mg.h": "minigame",
      "mg.lead": "we don't have a game yet, but we made a little something so you don't get bored.",
      "mg.btn": "jump in",
      "mg.score": "score",
      "mg.best": "best",
      "mg.again": "again",
      "mg.exit": "exit",
    },
    intro: "hi, we're stera.",
    poke: ["hehe.", "again!", "that tickles.", "i liked that.", "hey!"],
    dizzy: "whoa… my head is spinning.",
    bored: "i'm bored…",
    sleep: "zZz…",
    mgGo: "here i come!",
    mgOver: "they got me…",
    mgFall: "aaah… i fell.",
    mgBye: "good game!",
    mgWarn: "uh oh, they're coming!",
    mgJump: "jump! (space / tap)",
    mgQuips: ["can't catch me!", "up, always up!", "faster!", "keep climbing!"],
    sections: {
      games: "our games… soon. promise.",
      about: "yep, that's us.",
      contact: "write to us — we reply!",
      minigame: "bored? look below.",
    },
  },
};

// live binding: importers always see the current language table
export let L = I18N.en;

export function initI18n() {
  let lang =
    PARAMS.get("lang") ||
    localStorage.getItem("stera-lang") ||
    ((navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en");
  if (!I18N[lang]) lang = "en";

  const langBtn = document.getElementById("langBtn");

  function applyLang(l) {
    lang = l;
    L = I18N[l];
    try { localStorage.setItem("stera-lang", l); } catch (e) {}
    document.documentElement.lang = l;
    document.title = L.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", L.desc);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const t = L.dom[el.dataset.i18n];
      if (t) el.textContent = t;
    });
    langBtn.textContent = l;
  }

  applyLang(lang);
  langBtn.addEventListener("click", () => applyLang(lang === "tr" ? "en" : "tr"));
}
