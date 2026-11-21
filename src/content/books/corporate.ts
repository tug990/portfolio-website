import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Corporate Service Book.pdf", as the corporate world shows it */
export const CORPORATE: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "corp-faces", research: "corp-river", talk: "corp-rain" },
    services: {
      "csr-film": "corp-grazing",
      "csr-impact-story": "corp-herd",
      "brand-film": "corp-road",
      "pr-film": "corp-faces",
      "personal-branding": "corp-rain",
    },
    cut: { lines: ["Show the", "real work"], loop: "corp-river" },
    trail: [
      "corp-01",
      "corp-02",
      "corp-03",
      "corp-04",
      "corp-05",
      "corp-06",
      "corp-07",
      "corp-08",
      "corp-09",
      "corp-10",
      "corp-11",
      "corp-12",
      "corp-13",
      "corp-14",
      "corp-15",
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For companies and leadership teams",
    title: "Let people see what your company does.",
    text: "Documentary films about your CSR work and the people who lead your company, the parts of the business that don’t fit on a balance sheet.",
  },
  intro: {
    title: "Your CSR deserves more than a line item",
    lead: "We make documentary films of your company’s CSR projects, its story and its leaders, so your board, customers and staff can see the work instead of only reading about it in the annual report.",
    text: [
      "Think of your last visit to a project site. The schoolchildren were waiting at the gate of the first village. A girl read out a story she had written in English, and the head teacher showed you a register with more names in it than last year. In the next village, a farmer walked you along the new channel that brings water to his field in summer. On the drive back, you couldn’t stop talking about it.",
      "Three months later, the whole day went into the CSR section of the annual report. The children became a number in a table, and the farmer’s field became one more line item in the CSR spend. At the CSR committee meeting, one slide of field photos went past in about eight seconds. Your customers and most of your own staff never heard about it.",
      "That’s the gap we fill. We go to your project sites and film the people your projects reach, so your board, your customers and your own staff can see the work for themselves. We also make films about the company and the people who lead it, for the investor deck, the annual general meeting and LinkedIn. You don’t need all five films below. Start with the one your company needs most this year.",
    ],
    outcomesTitle: "What changes when the work gets out of the annual report",
    outcomes: [
      { title: "Proof", text: "Shows what your CSR money did", icon: "chart" },
      {
        title: "Market trust",
        text: "Helps customers and investors trust you",
        icon: "heart",
      },
      { title: "Identity", text: "Tells people who you are", icon: "star" },
      {
        title: "Visible leaders",
        text: "Makes your leaders known outside the company",
        icon: "person",
      },
    ],
  },
  research: {
    title: "What’s changing for companies",
    text: "Before we plan a film with a company, we look at what its board, its customers and the law now ask of it. These four findings shape every film we make for companies.",
    stats: [
      {
        figure: "Documentaries",
        text: "Brands like Patagonia, Dove and REI pay for documentary films about the causes they care about, and some have set up their own film studios to make them, because people skip adverts but will watch a documentary.",
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
        text: "people in 28 countries were surveyed for the 2026 Edelman Trust Barometer. Business came out as the most trusted institution, and trust in a brand is more and more tied to its CEO.",
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
        text: "Since this date, EU rules ban vague claims like “green” or “eco-friendly” unless a company can prove them. Footage of the work on the ground is one way to back a claim up.",
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
        text: "In India, a company whose average CSR obligation is Rs 10 crore or more has to get an independent impact assessment of every CSR project worth Rs 1 crore or more, and put it before the Board.",
        sources: [{ label: "TaxTMI", href: "https://www.taxtmi.com/article/detailed?id=13642" }],
      },
    ],
    note: "A company now has to show the work behind what it says, and people trust it more when they know who leads it. The CSR Film and the CSR Impact Story put that work on screen, and the PR Film and Digital Personal Branding introduce your leaders to people who don’t know them yet.",
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
  servicesTitle: "Five films we make for companies",
  services: [
    {
      id: "csr-film",
      name: "CSR Film",
      short: "Prove CSR impact with facts and data",
      madeFor: "Board, CSR committee, employees",
      line: "An impact assessment with faces, filmed at your project sites, with the numbers on screen beside the people they reached.",
      tags: ["For: Board, CSR committee, employees"],
      familiar: [
        "Your company spends crores on CSR every year. The NGO partners send a report and a few photos, and it all goes into a section of the annual report that few people read.",
        "When the board asks what the money did, there isn’t much to show them. Your own employees often don’t know the projects exist.",
      ],
      does: [
        "We go to the project sites and film the people the money reached, from how things were at the start to where they are now. The numbers on reach and results go on screen alongside them.",
        "You can use it at the board review, in the annual report, on your website and with your staff. If you commission an independent impact assessment, the film adds visual evidence to it. It doesn’t replace the assessment.",
      ],
      receive: [
        "One main CSR Film",
        "A short film for each project",
        "Interviews with the people each project reached",
        "On-screen credit for your implementing partner, and written consent from everyone we film",
        "On-screen graphics for reach, spend and results",
        "Drone footage and photography",
        "Short cuts for LinkedIn and Instagram",
      ],
      gain: [
        "Clear proof of what the CSR budget achieved",
        "Strong support for board reviews and reporting",
        "Pride among employees",
        "A reputation built on real work",
      ],
      example: [
        "A manufacturing company runs a skills centre for young people from the villages near its plant. The film follows a few of them through training in welding, electrical work and machine operation, and on to their first jobs, some of them at the plant itself. The number trained, the number placed and the change in their income are shown on screen.",
        "The company shows it at the board meeting, puts it in the annual report and posts it on LinkedIn.",
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
      madeFor: "Customers, investors and the public",
      line: "The last mile, told in the first person by someone your project reached, for the customers and investors who will never open a CSR report.",
      tags: ["For: Customers, investors, the public"],
      familiar: [
        "A line like “10,000 beneficiaries reached” works in a board report. Customers, investors and the public scroll past it.",
        "More people now choose companies that do some good. Yours does, but most people outside the company never get to see it.",
      ],
      does: [
        "We follow one person your CSR project has helped and tell their story: where they started, what the project changed for them and where they are now.",
        "The CSR Film gives the board the numbers. This film is for customers, investors and the public, who will never read a CSR report.",
      ],
      receive: [
        "A film following one person",
        "A version for social media and events",
        "Reels and clips for LinkedIn, Instagram and YouTube",
        "Photographs for your reports, website and press",
        "Informed consent, and care in how the person is shown",
      ],
      example: [
        "A steel company pays for girls’ schooling in the villages around its plant. The film follows one girl from a tribal family who was about to leave school after Class 8. A scholarship and a hostel place from the company kept her in school, and she is now training to be a nurse. She is the first in her family to finish school.",
        "The company shares it on LinkedIn and YouTube, and the regional papers pick up her story.",
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
      line: "Your “About us” page as a documentary, with the people who built the company telling how it started and how it runs today.",
      tags: ["For: Customers, investors, partners"],
      familiar: [
        "Everyone inside the company knows how it started and what it took to get here. Your website shows product photos, stock images and a short “About us” page.",
        "Customers, investors and partners know what you sell. Most of them don’t know who you are.",
      ],
      does: [
        "We film your founders, your staff and your customers at your offices and your factory, with no actors and nothing scripted for them to read. The film covers where the company came from and how it works today.",
        "It doesn’t sell any one product, so you can use it wherever you introduce the company, on the website, in pitches or at a trade fair.",
      ],
      receive: [
        "The full Brand Film",
        "A 60-second version for events and social media",
        "A cut for ads and introductions",
        "Interviews with founders, leaders, employees and customers",
        "Photographs of your people and your workplace",
      ],
      gain: [
        "A memorable identity that sets you apart",
        "Stronger trust with investors and partners",
        "One film for website, events and pitches",
        "A story employees are proud to share",
      ],
      example: [
        "A family-run spice company started as a small shop and is now a national brand. The film goes from the grandfather’s first stall to the factory today. It visits the farmers the company buys from and talks to staff who have worked there for decades.",
        "The company puts it at the top of its home page and plays it at trade fairs and in meetings with distributors and investors.",
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
      madeFor: "The press, award juries, new audiences",
      line: "A documentary about one of your leaders, from where they grew up to where they’re taking the company, with room for everything a press release cuts.",
      tags: ["For: New audiences, media, award juries"],
      familiar: [
        "Everyone in the company knows how your founder started, the risks they took and where they want to take the business. Outside the company, very few people do.",
        "A press interview gets a few quotes and an award gets a paragraph. The whole story hasn’t been told anywhere.",
      ],
      does: [
        "We make a documentary about one leader. We go back with them to where they grew up, talk to the people who know them, film how they work now and ask where they want to take the company.",
        "Nobody gives a prepared speech. The film is meant for people who haven’t heard of the leader or the company, and it reaches them through the press, award entries and social media.",
      ],
      receive: [
        "A documentary about the leader",
        "A version for media, events and juries",
        "Clips and reels for LinkedIn, YouTube and Instagram",
        "Interviews with family, colleagues, partners and people their work has affected",
        "Portrait photographs for the press",
        "A plan for where and when to release it",
      ],
      example: [
        "The founder of an agri-business grew up watching his father sell crops at poor prices. His company now buys from thousands of farmers. The film goes back with him to his village, meets some of the farmers who supply him and spends a working day with him at head office. It ends with him talking about fairer prices for farmers.",
        "The company puts it out on YouTube and LinkedIn, sends it to business journalists and includes it in its award entries.",
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
      madeFor: "Investors, industry peers, future hires",
      line: "Every month we film your founder or CEO talking shop, and cut it into videos for them to post on LinkedIn, YouTube and Instagram.",
      tags: ["Format: Monthly content", "For: Investors, industry, talent"],
      familiar: [
        "Your CEO has decades of experience and plenty to say, but online there’s a LinkedIn profile and a few reshared posts.",
        "The heads of competing companies post regularly, speak at events and get quoted in the papers. When investors, journalists and job candidates look around, they find those leaders first.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film your founder, CEO or senior leaders every month, talking about their work and their industry, and cut it into videos and short clips for them to post.",
        "Nothing is scripted and we don’t turn them into an advert. They talk the way they would in a meeting.",
      ],
      receive: [
        "A profile film about the leader and how they got here",
        "A video every month for LinkedIn and YouTube",
        "8 to 12 clips and reels every month",
        "Filming at their talks, panels and other events",
        "Portrait photographs",
        "A plan for what to post, based on what the leader knows best",
      ],
      gain: [
        "A respected leader who lifts the company’s reputation",
        "More speaking, media and partnership invitations",
        "Easier hiring of talented people",
        "Greater investor and client confidence",
      ],
      example: [
        "The founder of a mid-sized technology company has built a good business but is barely known outside it. We make a profile film about how she started in a three-person office. After that we film her once a month talking about technology, leadership and hiring in India, and she posts the videos.",
        "Over the year more people follow her on LinkedIn, she gets asked to speak at events, and the company gets more job applications and partnership enquiries.",
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
    title: "How we work with companies",
    text: "You can book one film on its own or work with us for a few months. On a longer partnership the same team keeps coming back and gets to know your projects and your people, and footage from one shoot carries forward into the next film, so each one costs less. We plan the year around your CSR budget, so the films are ready before the board review.",
    ways: [
      {
        title: "One film",
        text: "Book any film on its own. A CSR Film for one project takes less than three months.",
      },
      {
        title: "A partnership",
        text: "3, 6 or 12 months with the same team. Footage from earlier shoots goes into later films.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "CSR Starter",
        text: "For a company that needs its CSR filmed this quarter, or is working with us for the first time.",
        items: [
          "CSR Film: 1 project, with on-screen numbers and a short film for the project",
          "CSR Impact Story: 2 stories from the same project",
          "Social cuts: reels and clips for LinkedIn and Instagram",
          "Not included: Brand Film, PR Film and Personal Branding, available at extra cost.",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "For a company that wants its CSR filmed and its leaders better known at the same time.",
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
        text: "All your films with one studio, planned around your financial year.",
        items: [
          "CSR Film: every major project, ready for board review and the CSR report",
          "CSR Impact Story: 6 stories, one every two months",
          "Brand Film: 1 film",
          "PR Film: 1 documentary about one leader",
          "Personal Branding: 12 months, up to two leaders",
        ],
      },
    ],
    path: [
      { title: "Begin with one", text: "One CSR Film, or the 3-month CSR Starter" },
      {
        title: "See how it goes",
        text: "Show the first films to your board and staff, and post them",
      },
      {
        title: "Plan the year",
        text: "Move to a 12-month partnership if the first films worked for you",
      },
    ],
  },
  compare: {
    title: "Compare the options",
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
    note: "“Not included (extra cost)” means it isn’t part of that option, but you can still add it and pay for it separately.",
    advice:
      "A CSR Film usually takes 6–10 weeks, a CSR Impact Story 3–5 weeks, a Brand Film 4–6 weeks and a PR Film 8–12 weeks. Personal Branding carries on month to month, for at least 3 months.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us what’s on your agenda this year",
    text: "Send us a note about your CSR projects, the leaders you’d like people to know and when your next board review comes up. We’ll come back with the films we’d make and a plan for your year.",
    steps: [
      { title: "Talk", text: "A short call about your company and who you need to reach" },
      { title: "Plan", text: "We suggest the films, the timing and the option that suits you" },
      { title: "Film", text: "The same team films everything, from the first shoot to the last" },
    ],
  },
};
