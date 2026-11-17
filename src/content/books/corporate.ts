import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Corporate Service Book.pdf", as the corporate world shows it */
export const CORPORATE: ServiceBook = {
  theme: {
    head: '"Cormorant Garamond", Georgia, ui-serif, serif',
    body: '"Jost", ui-sans-serif, system-ui, sans-serif',
    headWeight: 600,
    fonts:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500;600&display=swap",
  },
  itemWord: "Service",
  cover: {
    kicker: "For companies and leadership teams",
    title: "Real stories build stronger companies.",
    text: "Five film services that turn your CSR, your company story, and your leaders into trust that the market can see.",
  },
  intro: {
    title: "People trust what companies do, not what they advertise.",
    lead: "Your CSR changes lives, your founders built something remarkable, and your teams are proud. But these stories rarely leave the building.",
    text: [
      "They stay inside annual reports, internal emails, and event photos, and never reach the customers, investors, employees, and partners who should see them.",
      "Insight Lab is a non-fiction studio by Famecast, built for companies. We bring documentary honesty to corporate storytelling: real people, real places, and real work, filmed with care.",
      "The five services are built around what companies need most, from CSR reporting to leadership visibility. Choose one, or combine them into a partnership.",
    ],
    outcomesTitle: "What the five services do for you",
    outcomes: [
      { title: "Proof", text: "Show what your CSR spend achieved, with data", icon: "chart" },
      {
        title: "Market trust",
        text: "Let people feel your impact through real lives",
        icon: "heart",
      },
      { title: "Identity", text: "Tell the real story of your company", icon: "star" },
      {
        title: "Visible leaders",
        text: "Give your founders a voice the world hears",
        icon: "person",
      },
    ],
  },
  research: {
    title: "Global companies moved from advertising to documentary storytelling.",
    text: "Real stories earn trust that ads no longer can. Four shifts shape how the best companies communicate today.",
    stats: [
      {
        figure: "Documentaries",
        text: "Brands such as Patagonia, Dove and REI fund documentary-style films around the causes they care about, and some have set up their own film studios, because audiences skip ads but watch real stories.",
        sources: [
          {
            label: "CNBC",
            href: "https://www.cnbc.com/2021/06/19/why-big-companies-like-doordash-3m-and-hp-are-making-films.html",
          },
          {
            label: "TheWrap",
            href: "https://www.thewrap.com/brands-movies-shows-partnerships-product-placement",
          },
        ],
      },
      {
        figure: "34,000",
        text: "People in 28 countries surveyed for the 2026 Edelman Trust Barometer, which ranks business as the most trusted institution and finds trust in a brand increasingly tied to its CEO.",
        sources: [
          {
            label: "Edelman",
            href: "https://www.edelman.com/index.php/news-awards/2026-edelman-trust-barometer-society-slides-into-insularity",
          },
          {
            label: "Creative Salon",
            href: "https://creative.salon/articles/features/edelman-trust-barometer-anna-vogt-mainardo-de-nardis",
          },
        ],
      },
      {
        figure: "27 Sep 2026",
        text: "Since this date, EU rules ban vague claims like “green” or “eco-friendly” unless a company can prove them. Filmed, on-ground evidence of real impact is exactly the proof companies now need.",
        sources: [
          { label: "PwC", href: "https://blog.pwc.it/?p=23418" },
          {
            label: "Carbon Trust",
            href: "https://www.carbontrust.com/news-and-insights/insights/ecgt-directive-explained-what-organisations-who-sell-in-europe-should-know-and-do",
          },
        ],
      },
      {
        figure: "Rs 10 cr",
        text: "In India, companies with an average CSR obligation of Rs 10 crore or more must commission independent impact assessments of CSR projects worth Rs 1 crore or more, placed before the Board.",
        sources: [{ label: "TaxTMI", href: "https://www.taxtmi.com/article/detailed?id=13642" }],
      },
    ],
    note: "Insight Lab’s services are built on these shifts: proof through the CSR Film, trust through the CSR Impact Story, and visible leadership through the PR Film and Digital Personal Branding.",
  },
  glance: {
    title: "Five services at a glance",
    columns: [
      { label: "The need it answers", key: "short" },
      { label: "Made for", key: "madeFor" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Find the sentence that sounds like you, and tap it.",
    picks: [
      { line: "“Our board wants proof of what CSR achieved.”", service: "csr-film" },
      { line: "“Customers don’t know the good we do.”", service: "csr-impact-story" },
      { line: "“Our website and pitches feel generic.”", service: "brand-film" },
      { line: "“The world doesn’t know our founder’s vision.”", service: "pr-film" },
      { line: "“Our leaders are invisible on LinkedIn.”", service: "personal-branding" },
      { line: "“We need all of it, planned for the year.”", service: "csr-film" },
    ],
  },
  servicesTitle: "Five services",
  services: [
    {
      id: "csr-film",
      name: "CSR Film",
      short: "Prove CSR impact with facts and data",
      madeFor: "Board, CSR committee, employees",
      line: "Your CSR spend is creating real change. Show it.",
      tags: ["For: Board, CSR committee, employees"],
      familiar: [
        "Every year your company invests crores in CSR: schools, health camps, water, skills, livelihoods. Your NGO partners send reports and a few photos, which end up in a section of the annual report few people read.",
        "Your board asks what the money achieved. Employees don’t know. Customers and investors never hear about it.",
      ],
      does: [
        "A CSR Film documents your projects on the ground with real beneficiaries, real locations and real results: the starting conditions, the work, and the outcomes, presented with clear data on reach and impact.",
        "The result is credible visual proof of your CSR investment, ready for the board, the annual report, your website, employees and the public. For companies that commission independent impact assessments, it adds visual evidence; it does not replace the assessment.",
      ],
      receive: [
        "A main CSR Film",
        "Project-wise short films",
        "Beneficiary stories and testimonials",
        "Data graphics on reach, spend and outcomes",
        "Drone footage and photography",
        "Social media cuts for LinkedIn and Instagram",
      ],
      gain: [
        "Clear proof of what the CSR budget achieved",
        "Strong support for board reviews and reporting",
        "Pride among employees",
        "A reputation built on real work",
      ],
      example: [
        "A manufacturing company funds a skill-training centre for rural youth near its plant. The film follows young people from villages with few job options, through training in welding, electrical work and machine operation, to their first jobs, some at the company’s own plant, with on-screen data on youth trained, placements and income growth.",
        "It is screened at the board meeting, featured in the annual report, and becomes one of the company’s most-viewed LinkedIn posts of the year.",
      ],
      fits: [
        "You run CSR projects directly or through NGOs",
        "You need stronger proof for your board",
        "Your CSR work is strong but unknown",
        "You want stakeholders to see your commitment",
      ],
      closing: "Good work deserves to be seen. We put your CSR on record.",
    },
    {
      id: "csr-impact-story",
      name: "CSR Impact Story",
      short: "Build market trust through one real life",
      madeFor: "Customers, investors, public",
      line: "One life changed by your company. The story that earns trust in the market.",
      tags: ["For: Customers, investors, the public"],
      familiar: [
        "Your CSR Film proves your impact with data for the board. But customers, investors and the public don’t connect with “10,000 beneficiaries reached.” They scroll past.",
        "People increasingly choose companies that genuinely care. Your company does care, but the market cannot feel it.",
      ],
      does: [
        "A CSR Impact Story tells the emotional story of one real person whose life changed through your CSR project: their struggle, the turning point your support created, and where they stand today.",
        "The CSR Film is proof, for the board. The Impact Story is trust, for the market. Together they show what your company did and why it matters.",
      ],
      receive: [
        "A film following one beneficiary",
        "A version for social media and events",
        "Reels and clips for LinkedIn, Instagram and YouTube",
        "Photographs for reports, website and press",
        "Story development with informed consent and dignity",
      ],
      example: [
        "A steel company supports girls’ education in the villages around its plant. The film follows one girl from a tribal family who was about to drop out after Class 8. With the company’s scholarship and hostel, she continued and is now training to become a nurse, the first in her family to finish school.",
        "Shared on LinkedIn and YouTube and picked up by regional media, it brings comments from people who never thought of the company as more than a steel maker.",
      ],
      fits: [
        "Your CSR creates visible change in people’s lives",
        "You want the market, not just the board, to see it",
        "You want content people will watch and share",
        "You have CSR data but no human story",
      ],
      panels: [
        {
          title: "How it builds trust in the market",
          items: [
            { name: "Customers", text: "A true story is more believable than any advertisement" },
            {
              name: "Investors",
              text: "Genuine social responsibility builds long-term confidence",
            },
            {
              name: "Employees",
              text: "Staff feel proud to work for a company that changes lives",
            },
            { name: "Communities", text: "Goodwill in the regions where you operate" },
          ],
        },
      ],
      closing: "Numbers prove your CSR. One story makes the world believe in it.",
    },
    {
      id: "brand-film",
      name: "Brand Film",
      short: "Tell the real story of the company",
      madeFor: "Customers, investors, partners",
      line: "The real story of your company, told with honesty and heart.",
      tags: ["For: Customers, investors, partners"],
      familiar: [
        "Your company has a strong story: how it started, the challenges it overcame, the people who built it. But visitors see product brochures, stock images and a short “About Us.”",
        "Investors, partners and customers know what you sell. They don’t know who you are or why you do it.",
      ],
      does: [
        "A Brand Film tells your story in documentary style. No actors, no scripted slogans: your real people, real workplace and real journey, shaped into a film that shows what makes you different.",
        "It sits above product advertising. It doesn’t sell a product; it builds belief in the company behind every product.",
      ],
      receive: [
        "A Brand Film",
        "A 60-second version for events and social media",
        "A cut for ads and introductions",
        "Interviews with founders, leaders, employees and customers",
        "Photography of your people and workplace",
      ],
      gain: [
        "A memorable identity that sets you apart",
        "Stronger trust with investors and partners",
        "One film for website, events and pitches",
        "A story employees are proud to share",
      ],
      example: [
        "A family-run spice company that began as a small shop is now a national brand. Its Brand Film follows the journey from the grandfather’s first stall to today’s modern facility, the farmers it sources from, and employees who have stayed for decades, with values unchanged for three generations.",
        "It now opens the website homepage and plays at trade fairs and distributor and investor meetings.",
      ],
      fits: [
        "Customers and investors don’t know your story",
        "Your website and pitches feel generic",
        "You are entering a new market or raising funds",
        "You are marking a milestone",
      ],
      closing: "Products can be copied. Your story cannot. We tell it.",
    },
    {
      id: "pr-film",
      name: "PR Film",
      short: "Take a leader’s vision to new audiences",
      madeFor: "New audiences, media, award juries",
      line: "The vision of one leader, told as a documentary that reaches new audiences.",
      tags: ["For: New audiences, media, award juries"],
      familiar: [
        "Your founder has built something remarkable: early struggles, risks taken, and a clear vision for the future. People inside the company know this story. The outside world does not.",
        "Interviews give a few quotes and awards give a paragraph. Nowhere is the full story told in a way that stays with people.",
      ],
      does: [
        "A PR Film is a vision film about one leader, shot as a case-study documentary: where they come from, the turning points, how they lead, the lives their work has touched, and where they want to take the company.",
        "No scripted speeches. Its main job is to reach new audiences, people who discover the leader and the company through a story that moves them.",
      ],
      receive: [
        "A documentary portrait",
        "A version for media, events and juries",
        "Clips and reels for LinkedIn, YouTube and Instagram",
        "Interviews with family, colleagues, partners and people impacted",
        "Portrait photography for press",
        "A release plan to reach new audiences",
      ],
      example: [
        "The founder of an agri-business grew up watching his father struggle with poor prices. Today his company works with thousands of farmers. The film returns with him to his home village, meets the farmers who supply him, follows a day of decisions at headquarters, and closes with his vision for fair markets.",
        "Released on YouTube and LinkedIn and featured by business media, it introduces thousands of new viewers to the founder and becomes the centrepiece of the company’s award entries.",
      ],
      fits: [
        "Your leader’s journey and vision are unknown",
        "You want to reach beyond your existing network",
        "You are preparing for awards or major media",
        "You are marking a milestone or transition",
      ],
      panels: [
        {
          title: "PR Film or Digital Personal Branding?",
          items: [
            {
              name: "PR Film: one complete documentary",
              text: "The definitive story of the leader and their vision, made to open doors with new audiences, media, juries and investors",
            },
            {
              name: "Personal Branding: every month",
              text: "Ongoing content that keeps the leader visible and active on LinkedIn, YouTube and Instagram",
            },
          ],
        },
      ],
      closing: "Every great company begins with one person’s vision. We tell it to the world.",
    },
    {
      id: "personal-branding",
      name: "Digital Personal Branding",
      short: "Keep leaders visible every month",
      madeFor: "Investors, industry, talent",
      line: "People trust people. Make your leaders visible.",
      tags: ["Format: Monthly content", "For: Investors, industry, talent"],
      familiar: [
        "Your CEO has decades of experience and strong ideas, but online their presence is a LinkedIn profile with a few reshared posts.",
        "Leaders from competing companies post regularly, speak at events and are quoted in the media. Investors, talent and journalists seek them out, while yours stays invisible.",
      ],
      doesTitle: "What this service does",
      does: [
        "Digital Personal Branding builds a strong, honest public presence for your founder, CEO or senior leaders, through a steady stream of content filmed around their real ideas and work.",
        "Not a hard sell or a polished advertisement: the real person and their real thinking, shared consistently.",
      ],
      receive: [
        "A leader profile film on their journey and vision",
        "Monthly thought-leadership videos for LinkedIn and YouTube",
        "8 to 12 clips and reels every month",
        "Coverage of keynotes, panels and stage appearances",
        "Professional portrait photography",
        "A content plan built on the leader’s strengths",
      ],
      gain: [
        "A respected leader who lifts the company’s reputation",
        "More speaking, media and partnership invitations",
        "Easier hiring of talented people",
        "Greater investor and client confidence",
      ],
      example: [
        "The founder of a mid-sized technology company has built a strong business but is barely known outside it. We film her journey from a three-person office, then help her publish short monthly videos on leadership, technology and building teams in India.",
        "Within a year she has a strong LinkedIn following, receives speaking invitations, and the company sees more quality job applications and partnership enquiries.",
      ],
      fits: [
        "Your leaders have strong ideas but little presence",
        "You want to attract investors, partners or talent",
        "Your leaders’ stage moments are never captured",
        "You want your leadership seen as industry voices",
      ],
      panels: [
        {
          title: "What each platform builds",
          items: [
            {
              name: "LinkedIn: authority",
              text: "Thought-leadership videos that investors, clients and peers follow",
            },
            {
              name: "YouTube: depth",
              text: "Longer conversations that show the leader’s thinking in full",
            },
            {
              name: "Instagram: connection",
              text: "Human moments that young professionals relate to",
            },
          ],
        },
      ],
      closing: "Behind every great company is a person worth knowing. We make them known.",
    },
  ],
  together: {
    title: "How we work together",
    text: "Any service can be booked on its own. Partnerships keep one team on your account, build a growing footage library, and lower the cost of every film. CSR sits at the centre, because CSR budgets return every year.",
    ways: [
      {
        title: "A single project",
        text: "Any service on its own. One CSR Film for one project fits comfortably within three months.",
      },
      {
        title: "A partnership",
        text: "3, 6 or 12 months, with one team, a growing library and lower cost per film.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "CSR Starter",
        text: "A company that needs its CSR work filmed this quarter, or is new to us.",
        items: [
          "CSR Film: 1 project, with data graphics and project cuts",
          "CSR Impact Story: 2 stories from the same project",
          "Social cuts: reels and clips for LinkedIn and Instagram",
          "Not included: Brand Film, PR Film and Personal Branding, available at extra cost.",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "Show CSR work and build public reputation together.",
        items: [
          "CSR Film: up to 2 projects",
          "CSR Impact Story: 3 stories",
          "Brand or PR Film: choose one",
          "Personal Branding: 6 months for one leader",
        ],
      },
      {
        months: 12,
        name: "Full Partnership",
        text: "One partner for all storytelling, planned around the financial year.",
        items: [
          "CSR Film: every major project, ready for board review and the CSR report",
          "CSR Impact Story: 6 stories, one every two months",
          "Brand Film: 1 film",
          "PR Film: 1 vision documentary",
          "Personal Branding: 12 months, up to two leaders",
        ],
      },
    ],
    path: [
      { title: "Start", text: "A single CSR Film or the 3-month CSR Starter" },
      { title: "See results", text: "Board, employees and the market respond" },
      { title: "Grow", text: "Move to a 12-month partnership" },
    ],
  },
  compare: {
    title: "Compare the packages",
    columns: ["Single project", "3 Months", "6 Months", "12 Months"],
    rows: [
      {
        service: "CSR Film",
        cells: ["1 project", "1 project", "Up to 2 projects", "Every major project"],
      },
      {
        service: "CSR Impact Story",
        cells: ["1 story", "2 stories", "3 stories", "6 stories"],
      },
      { service: "Brand Film", cells: ["1 film", "", "Brand or PR Film", "1 film"] },
      { service: "PR Film", cells: ["1 film", "", "Brand or PR Film", "1 film"] },
      {
        service: "Digital Personal Branding",
        cells: ["Minimum 3 months", "", "1 leader", "Up to 2 leaders"],
      },
    ],
    note: "“Not included (extra cost)” means the service is not part of that option, but you can still get it by paying separately.",
    advice:
      "Typical timelines: CSR Film 6–10 weeks, CSR Impact Story 3–5 weeks, Brand Film 4–6 weeks, PR Film 8–12 weeks, Personal Branding ongoing (minimum 3 months).",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Let’s show the world what your company really does.",
    text: "Tell us about your CSR projects, your story and your leaders. We will suggest the films and partnership that fit your year.",
    steps: [
      { title: "Talk", text: "A short call about your goals and audiences" },
      { title: "Plan", text: "We propose films, timeline and package" },
      { title: "Film", text: "One team tells your story with honesty" },
    ],
  },
};
