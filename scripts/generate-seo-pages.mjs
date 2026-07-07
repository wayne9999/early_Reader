import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const siteUrl = "https://myreadnest.org";
const lastmod = "2026-07-05";

const sharedLinks = [
  { href: "/", label: "Home" },
  { href: "/online-reading-games/", label: "Reading games" },
  { href: "/reading-practice/", label: "Reading practice" },
  { href: "/phonics-practice/", label: "Phonics" },
  { href: "/sight-words/", label: "Sight words" },
  { href: "/pricing/", label: "Pricing" }
];

const pages = [
  {
    slug: "reading-practice",
    priority: "0.9",
    title: "Reading Practice for Kids | Kindergarten, First Grade, and Second Grade | ReadNest",
    description:
      "ReadNest reading practice helps kindergarten, first grade, and second grade children follow personalized paths for sight words, phonics, sentence fluency, and confidence.",
    h1: "Personalized reading practice for kids",
    eyebrow: "5 to 10 minute reading routines",
    hero:
      "ReadNest gives early elementary learners short reading practice sessions that adapt around grade level, reading goals, recent misses, sight words, phonics blending, sentence reading, and fluency.",
    sections: [
      {
        title: "What children practice",
        body:
          "Children work through short, friendly activities that make reading feel manageable instead of overwhelming.",
        bullets: [
          "Recognizing high-frequency sight words with large, readable text.",
          "Blending sounds into CVC words, blends, and early fluency words.",
          "Reading short sentences with listen-again support.",
          "Repeating missed words without making practice feel like a test."
        ]
      },
      {
        title: "Why parents use it",
        body:
          "Parents can start with free reading and memory activities, then use progress summaries and paid personalized paths when they need deeper guidance.",
        bullets: [
          "Clear next-step practice instead of guessing what to review.",
          "Short sessions that fit after school, tutoring, or bedtime routines.",
          "A calmer way to build confidence for children who are still learning."
        ]
      }
    ],
    faq: [
      ["What grade levels is this reading practice built for?", "ReadNest is built for kindergarten, first grade, and second grade readers."],
      ["Can children try reading practice for free?", "Yes. Reading and memory activities are available as free starter practice."]
    ],
    ctaHref: "/#/reading",
    ctaLabel: "Try free reading practice"
  },
  {
    slug: "online-reading-games",
    priority: "0.9",
    title: "Online Reading Games for Kids | ReadNest",
    description:
      "ReadNest offers personalized online reading games for K-2 kids, including sight words, phonics, memory games, voice activities, and progress support.",
    h1: "Online reading games that feel like play",
    eyebrow: "Sight words, phonics, memory, and voice activities",
    hero:
      "ReadNest turns early literacy practice into short online games that children can repeat without pressure while parents and teachers see useful progress signals.",
    sections: [
      {
        title: "Free starter activities",
        body: "Families can try ReadNest before subscribing, with enough value to understand how the app helps.",
        bullets: [
          "Reading practice with read-aloud support.",
          "Memory matching for attention and school-ready routines.",
          "Signed-in free activities for rhymes, sounds, and sentences."
        ]
      },
      {
        title: "Paid personalized practice",
        body:
          "Family Plus unlocks deeper student practice. Teacher Pro adds classroom insight tools for assigned learners.",
        bullets: [
          "Story Steps and Word Garden for comprehension and vocabulary.",
          "Echo Reader and Voice Quest for premium listening practice.",
          "Progress history, printable practice, and future premium packs."
        ]
      }
    ],
    faq: [
      ["Are these reading games educational?", "Yes. Each game targets a core early-literacy skill such as sight words, phonics, fluency, sequencing, or vocabulary."],
      ["How long should a child practice?", "ReadNest is designed for short 5 to 10 minute sessions."]
    ],
    ctaHref: "/#/reading",
    ctaLabel: "Play a free activity"
  },
  {
    slug: "kindergarten-reading",
    priority: "0.9",
    title: "Kindergarten Reading Practice App | ReadNest",
    description:
      "ReadNest helps kindergarten readers follow a personalized starter path for sight words, letter sounds, rhyming, memory, and simple sentence confidence.",
    h1: "Kindergarten reading practice that starts gently",
    eyebrow: "Early sounds, short words, and confidence",
    hero:
      "Kindergarten readers need simple, encouraging practice with sounds, short words, rhymes, memory, and early print confidence. ReadNest keeps the work brief and playful.",
    sections: [
      {
        title: "Kindergarten skills ReadNest supports",
        body: "The app focuses on concrete early-reading moves that children can repeat successfully.",
        bullets: [
          "Beginning sounds and short vowel words.",
          "Common sight words with large text.",
          "Rhyming and listening practice.",
          "Memory games that support attention and routines."
        ]
      },
      {
        title: "A calmer home practice path",
        body:
          "Parents can use ReadNest to create a consistent daily habit without turning reading into a long worksheet session.",
        bullets: [
          "Start free with reading and memory.",
          "Upgrade when the child needs more personalization.",
          "Connect with a teacher when extra guidance is useful."
        ]
      }
    ],
    faq: [
      ["Is ReadNest too hard for kindergarten?", "No. Starter practice uses short words, clear buttons, read-aloud support, and simple prompts."],
      ["Does it replace classroom reading instruction?", "No. ReadNest supports practice at home and teacher review; it is not a replacement for school instruction."]
    ],
    ctaHref: "/#/account",
    ctaLabel: "Start a child profile"
  },
  {
    slug: "first-grade-reading",
    priority: "0.9",
    title: "First Grade Reading Practice | ReadNest",
    description:
      "ReadNest helps first grade readers practice sight words, phonics, short sentences, rhyming, fluency, and personalized next-step reading goals.",
    h1: "First grade reading practice for growing confidence",
    eyebrow: "Sight words, sounds, and sentences",
    hero:
      "First grade readers often need repeated practice that feels successful. ReadNest helps children review sight words, blend sounds, and read short sentences with confidence.",
    sections: [
      {
        title: "Skills for first grade readers",
        body: "ReadNest supports the transition from single-word practice to sentence fluency.",
        bullets: [
          "Sight word recognition and repeated exposure.",
          "Phonics blending and beginning sound review.",
          "Rhymes and word families.",
          "Sentence order and early fluency."
        ]
      },
      {
        title: "Progress adults can understand",
        body:
          "Parents and teachers can see what the child practiced, where they missed, and what needs another short session.",
        bullets: [
          "Recent activity history.",
          "Strength and needs-practice summaries.",
          "Teacher dashboards for assigned students."
        ]
      }
    ],
    faq: [
      ["Can ReadNest help with sight words?", "Yes. Sight word recognition and repeated word exposure are part of the reading path."],
      ["Can parents use it without a teacher?", "Yes. Parents can start a child profile and add a teacher later."]
    ],
    ctaHref: "/#/reading",
    ctaLabel: "Try first grade practice"
  },
  {
    slug: "second-grade-reading",
    priority: "0.85",
    title: "Second Grade Reading Practice | ReadNest",
    description:
      "ReadNest supports second grade readers with sentence fluency, vocabulary, story order, word meaning, memory, and progress insight for families and teachers.",
    h1: "Second grade reading practice for fluency and meaning",
    eyebrow: "From decoding toward understanding",
    hero:
      "Second grade readers still need practice that connects words to meaning. ReadNest supports fluency, vocabulary, story order, and confidence-building review.",
    sections: [
      {
        title: "Second grade practice areas",
        body: "ReadNest focuses on skills that help children move beyond word-by-word reading.",
        bullets: [
          "Sentence fluency and sentence order.",
          "Vocabulary and word meaning.",
          "Story sequencing and comprehension habits.",
          "Listening practice with premium voice activities."
        ]
      },
      {
        title: "Useful for intervention and tutoring",
        body:
          "Teachers and tutors can use activity history to find patterns and plan focused 5-minute practice sessions.",
        bullets: [
          "Missed words and practice patterns.",
          "Assigned student summaries.",
          "Report-ready progress notes for families."
        ]
      }
    ],
    faq: [
      ["Is ReadNest only for beginners?", "No. It supports kindergarten through second grade, including vocabulary, sentence fluency, and story order."],
      ["Does it provide teacher insights?", "Teacher Pro unlocks assigned-student dashboards, analysis, and report exports."]
    ],
    ctaHref: "/#/support",
    ctaLabel: "Compare reading plans"
  },
  {
    slug: "phonics-practice",
    priority: "0.9",
    title: "Phonics Practice for Kids | Sound Blending App | ReadNest",
    description:
      "ReadNest phonics practice helps kids hear beginning sounds, blend letters into words, sort sounds, and build early decoding confidence.",
    h1: "Phonics practice that helps sounds click",
    eyebrow: "Beginning sounds and blending",
    hero:
      "ReadNest helps children listen for sounds, blend letters into words, and connect phonics practice to real reading moments.",
    sections: [
      {
        title: "Phonics skills in ReadNest",
        body: "Each practice loop stays short so children can hear, choose, and repeat without overload.",
        bullets: [
          "Beginning sound sorting.",
          "CVC blending such as cat, sun, map, and run.",
          "Consonant blends and digraphs in growing levels.",
          "Rhyming practice for word families."
        ]
      },
      {
        title: "Why short phonics games help",
        body:
          "Young readers often need many calm repetitions. ReadNest gives that repetition through play, not pressure.",
        bullets: [
          "Hear the prompt.",
          "Choose the matching sound or word.",
          "Review missed patterns again later."
        ]
      }
    ],
    faq: [
      ["Does ReadNest teach phonics?", "ReadNest gives phonics practice and review. It supports instruction but does not replace a teacher."],
      ["Can children hear the sounds?", "Yes. Reading and activity prompts include listen controls where supported by the browser."]
    ],
    ctaHref: "/#/reading",
    ctaLabel: "Try phonics practice"
  },
  {
    slug: "sight-words",
    priority: "0.9",
    title: "Sight Word Practice for Kids | ReadNest",
    description:
      "ReadNest helps early readers practice sight words with large text, listen support, sentence examples, repetition, and parent-visible progress.",
    h1: "Sight word practice kids can repeat",
    eyebrow: "Large words, clear sentences, and quick wins",
    hero:
      "Sight words become easier when children see, hear, and use them in short sentences. ReadNest keeps that practice simple and encouraging.",
    sections: [
      {
        title: "How sight word practice works",
        body: "Children see a word, hear it, blend or chunk it, and read it in a sentence.",
        bullets: [
          "Large readable word cards.",
          "Listen controls for words and sentences.",
          "Short sentences that match the current word.",
          "Progress tracking for known and repeated words."
        ]
      },
      {
        title: "Built for daily review",
        body:
          "Sight word practice works best when it is frequent and brief. ReadNest is designed for a few minutes at a time.",
        bullets: [
          "Free starter word practice.",
          "Personalized review for signed-in children.",
          "Teacher-visible progress for assigned students."
        ]
      }
    ],
    faq: [
      ["What are sight words?", "Sight words are common words children learn to recognize quickly so reading becomes smoother."],
      ["Does ReadNest show words in sentences?", "Yes. Reading practice includes short sentence examples tied to the current word."]
    ],
    ctaHref: "/#/reading",
    ctaLabel: "Practice sight words"
  },
  {
    slug: "memory-games",
    priority: "0.8",
    title: "Memory Games for Kids | Reading and School-Ready Practice | ReadNest",
    description:
      "ReadNest memory games help kids strengthen focus, recall, school-ready routines, and confidence alongside early reading practice.",
    h1: "Memory games that support early reading habits",
    eyebrow: "Focus, recall, and school-ready ideas",
    hero:
      "ReadNest memory games give children a quick matching activity that supports attention and recall while staying connected to school-ready habits.",
    sections: [
      {
        title: "What the memory game practices",
        body: "The board uses simple pairs so children can focus on remembering, matching, and finishing a short game.",
        bullets: [
          "Card matching and recall.",
          "Healthy habits and classroom routines.",
          "Turn-taking patience and completion.",
          "Progress signals for activity history."
        ]
      },
      {
        title: "Why it belongs in a reading app",
        body:
          "Reading requires attention, working memory, and confidence. A short memory game can warm up those skills before word practice.",
        bullets: [
          "Useful as a calm starter activity.",
          "Free for guests.",
          "Tracked for signed-in learners."
        ]
      }
    ],
    faq: [
      ["Is the memory game free?", "Yes. Guests can try the memory game without creating an account."],
      ["Does it track progress?", "Signed-in learners can have activity history stored for dashboard summaries."]
    ],
    ctaHref: "/#/memory",
    ctaLabel: "Try the memory game"
  },
  {
    slug: "teacher-dashboard",
    priority: "0.8",
    title: "Teacher Reading Dashboard for Student Progress | ReadNest",
    description:
      "ReadNest Teacher Pro helps teachers track assigned student reading progress, strengths, growth areas, intervention planning, reports, and AI-supported learning analysis.",
    h1: "Teacher reading dashboard for assigned students",
    eyebrow: "Student progress without a data maze",
    hero:
      "ReadNest Teacher Pro gives teachers a focused dashboard for assigned student reading progress, strengths, growth areas, reports, and intervention planning.",
    sections: [
      {
        title: "Teacher Pro tools",
        body: "The teacher dashboard is built for the human in the loop: a teacher who can turn data into better support.",
        bullets: [
          "Assigned student roster and progress snapshots.",
          "Strengths and needs-practice signals.",
          "Report exports for parent sharing.",
          "AI-supported analysis when consent and backend workflows are enabled."
        ]
      },
      {
        title: "Privacy-aware student data",
        body:
          "Teachers should only see students assigned to them. Student activity history is used to support learning, not to diagnose children.",
        bullets: [
          "Role-based dashboard access.",
          "Assigned-student boundaries.",
          "Educational support language, not medical diagnosis."
        ]
      }
    ],
    faq: [
      ["Can teachers see every student?", "No. Teachers should only access students assigned to them."],
      ["Does Teacher Pro include reports?", "Yes. Teacher Pro includes report exports for assigned students."]
    ],
    ctaHref: "/#/account",
    ctaLabel: "Create teacher account"
  },
  {
    slug: "reading-intervention",
    priority: "0.8",
    title: "Reading Intervention Support for Early Readers | ReadNest",
    description:
      "ReadNest supports early reading intervention with short practice, missed-word history, phonics patterns, teacher dashboards, and parent progress summaries.",
    h1: "Reading intervention support that stays practical",
    eyebrow: "Short practice, clearer next steps",
    hero:
      "ReadNest helps adults see what a child practiced, what they missed, and what to try next during home practice, tutoring, or classroom support.",
    sections: [
      {
        title: "Intervention-friendly signals",
        body: "The goal is not to overwhelm teachers or families. It is to make the next 5-minute practice session clearer.",
        bullets: [
          "Missed words and phonics patterns.",
          "Recent practice history.",
          "Strengths and needs-practice summaries.",
          "Suggested home practice steps."
        ]
      },
      {
        title: "Important safety boundary",
        body:
          "ReadNest is educational support. It is not a medical, clinical, or diagnostic service.",
        bullets: [
          "Use teacher judgment and family context.",
          "Keep child data private.",
          "Use AI suggestions only as support when enabled."
        ]
      }
    ],
    faq: [
      ["Is ReadNest a diagnostic reading test?", "No. It is educational practice support, not a diagnostic service."],
      ["Can teachers use it for intervention planning?", "Teacher Pro supports intervention planning for assigned students."]
    ],
    ctaHref: "/#/support",
    ctaLabel: "See intervention tools"
  },
  {
    slug: "caregiver-progress",
    priority: "0.8",
    title: "Parent Reading Progress Tracking | ReadNest",
    description:
      "ReadNest gives parents and caregivers simple reading progress summaries, strengths, needs-practice areas, weekly activity, and suggested home practice.",
    h1: "Parent-friendly reading progress tracking",
    eyebrow: "Know what to celebrate and what to practice next",
    hero:
      "ReadNest helps caregivers understand a child’s reading practice without needing to interpret a complicated data dashboard.",
    sections: [
      {
        title: "What caregivers can see",
        body: "Progress summaries focus on practical language and next steps.",
        bullets: [
          "Recent activities and completed practice.",
          "Strengths and areas that need review.",
          "Suggested 5-minute home practice.",
          "Teacher connection options when support is needed."
        ]
      },
      {
        title: "Designed for emotional moments",
        body:
          "Reading struggles can feel heavy at home. ReadNest keeps feedback encouraging, specific, and brief.",
        bullets: [
          "Small wins are visible.",
          "Practice stays short.",
          "Parents are not left guessing."
        ]
      }
    ],
    faq: [
      ["Can parents manage a child profile?", "Yes. Parents can create a child reader space and track progress."],
      ["Can parents connect to a teacher?", "Students can browse teachers and request assignment when the workflow is enabled."]
    ],
    ctaHref: "/#/account",
    ctaLabel: "Create a parent account"
  },
  {
    slug: "pricing",
    priority: "0.75",
    title: "ReadNest Pricing | Free Reader, Family Plus, and Teacher Pro",
    description:
      "ReadNest pricing includes a free starter reading path, Family Plus for personalized premium practice, and Teacher Pro for dashboards, reports, and intervention planning.",
    h1: "ReadNest pricing",
    eyebrow: "Start free, upgrade when the path needs more support",
    hero:
      "ReadNest starts with useful free practice, then offers paid plans for families and teachers who need deeper personalization, clearer progress insight, and more guided support.",
    sections: [
      {
        title: "Free Reader",
        body: "Free starter practice gives families a useful first experience before they subscribe.",
        bullets: ["Reading and memory activities.", "Signed-in Rhymes, Sounds, and Sentences.", "Basic dashboard signals."]
      },
      {
        title: "Family Plus and Teacher Pro",
        body:
          "Family Plus is $7 per month for deeper student practice. Teacher Pro is $19 per month for classroom insight.",
        bullets: [
          "Family Plus: all student activities, printable plans, and personalized practice.",
          "Teacher Pro: student dashboards, report exports, intervention planning, and AI-supported recommendations when enabled.",
          "Subscriptions can be canceled through the billing portal when configured."
        ]
      }
    ],
    faq: [
      ["Can families start free?", "Yes. ReadNest includes a useful free starter tier."],
      ["Are subscriptions monthly?", "Yes. Family Plus and Teacher Pro are monthly plans."]
    ],
    ctaHref: "/#/support",
    ctaLabel: "Compare plans"
  }
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replaceAll("</script", "<\\/script");
}

function renderPage(page) {
  const canonical = `${siteUrl}/${page.slug}/`;
  const faqEntities = page.faq.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer
    }
  }));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.h1,
      description: page.description,
      url: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: "ReadNest",
        url: siteUrl
      },
      about: {
        "@type": "SoftwareApplication",
        name: "ReadNest",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ReadNest",
          item: `${siteUrl}/`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.h1,
          item: canonical
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntities
    }
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ReadNest" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/brand/readnest-bird-book.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${siteUrl}/brand/readnest-bird-book.png" />
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <title>${escapeHtml(page.title)}</title>
    <style>
      :root {
        color: #202338;
        background: #fffaf1;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; line-height: 1.6; }
      a { color: inherit; }
      .page { min-height: 100vh; background: radial-gradient(circle at top left, #fff1b8, transparent 32rem), #fffaf1; }
      .nav, .hero, .section, .footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      .nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0; }
      .brand { display: flex; align-items: center; gap: 10px; font-weight: 900; text-decoration: none; }
      .brand img { width: 44px; height: 44px; border-radius: 12px; }
      .links { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.95rem; color: #5f6277; }
      .links a { text-decoration: none; }
      .links a:hover { color: #202338; }
      .hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.75fr); gap: 42px; align-items: center; padding: 54px 0 42px; }
      .eyebrow { color: #168f88; font-size: 0.82rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 10px; }
      h1 { font-size: clamp(2.5rem, 7vw, 5.1rem); line-height: 0.98; margin: 0; letter-spacing: 0; }
      .hero p { color: #5f6277; font-size: 1.2rem; max-width: 680px; }
      .cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
      .button { border: 0; border-radius: 999px; color: white; background: #ff6158; box-shadow: 0 16px 36px rgba(255, 97, 88, 0.24); display: inline-flex; font-weight: 900; padding: 14px 22px; text-decoration: none; }
      .button.secondary { background: white; color: #202338; border: 1px solid #ece6dc; box-shadow: none; }
      .mascot-card { background: linear-gradient(135deg, #ffcf6e, #ffafc8 48%, #8adfff); border: 8px solid white; border-radius: 28px; padding: 28px; box-shadow: 0 22px 60px rgba(32, 35, 56, 0.14); }
      .mascot-card img { display: block; width: 100%; max-width: 340px; margin: 0 auto; border-radius: 18px; }
      .section { padding: 34px 0; }
      .section h2 { font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.05; margin: 0 0 12px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .card { background: white; border: 1px solid #ece6dc; border-radius: 20px; padding: 24px; box-shadow: 0 10px 34px rgba(32, 35, 56, 0.06); }
      .card p { color: #5f6277; margin-top: 0; }
      ul { padding-left: 1.2rem; margin-bottom: 0; }
      li { margin: 0.35rem 0; }
      .faq { background: #f2fff9; border-radius: 24px; padding: 28px; }
      details { background: white; border-radius: 16px; padding: 16px 18px; margin: 12px 0; border: 1px solid #d7efe7; }
      summary { cursor: pointer; font-weight: 900; }
      .footer { border-top: 1px solid #ece6dc; color: #6b6e82; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px; margin-top: 44px; padding: 28px 0 40px; }
      @media (max-width: 780px) {
        .nav { align-items: flex-start; flex-direction: column; }
        .hero { grid-template-columns: 1fr; padding-top: 28px; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="nav">
        <a class="brand" href="/">
          <img src="/brand/readnest-icon-192.png" alt="" />
          <span>ReadNest</span>
        </a>
        <nav class="links" aria-label="Related reading resources">
          ${sharedLinks.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("\n          ")}
        </nav>
      </header>
      <main>
        <section class="hero">
          <div>
            <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
            <h1>${escapeHtml(page.h1)}</h1>
            <p>${escapeHtml(page.hero)}</p>
            <div class="cta-row">
              <a class="button" href="${page.ctaHref}">${escapeHtml(page.ctaLabel)}</a>
              <a class="button secondary" href="/#/support">See plans</a>
            </div>
          </div>
          <aside class="mascot-card" aria-label="ReadNest mascot">
            <img src="/brand/readnest-bird-book.png" alt="ReadNest bird mascot sitting on an open book." />
          </aside>
        </section>
        <section class="section">
          <div class="grid">
            ${page.sections
              .map(
                (section) => `<article class="card">
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.body)}</p>
              <ul>
                ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>
            </article>`
              )
              .join("\n            ")}
          </div>
        </section>
        <section class="section">
          <div class="faq">
            <p class="eyebrow">Common questions</p>
            <h2>Answers before you start</h2>
            ${page.faq
              .map(
                ([question, answer]) => `<details>
              <summary>${escapeHtml(question)}</summary>
              <p>${escapeHtml(answer)}</p>
            </details>`
              )
              .join("\n            ")}
          </div>
        </section>
      </main>
      <footer class="footer">
        <span>ReadNest helps K-2 children build reading confidence through short, personalized practice.</span>
        <span><a href="/#/privacy">Privacy</a> · <a href="/#/children-privacy">Children's privacy</a> · <a href="/#/support">Support</a></span>
      </footer>
    </div>
  </body>
</html>
`;
}

async function writeSeoPages() {
  await Promise.all(
    pages.map(async (page) => {
      const pageDir = join(publicDir, page.slug);
      await mkdir(pageDir, { recursive: true });
      await writeFile(join(pageDir, "index.html"), renderPage(page), "utf8");
    })
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}/${page.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  await writeFile(join(publicDir, "sitemap.xml"), sitemap, "utf8");
}

await writeSeoPages();
