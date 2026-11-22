import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Corporate Service Book.pdf", as the corporate world shows it */
export const CORPORATE: ServiceBook = {
  // told as a film: the footage it’s cut with (supplied to us, one shot to a loop)
  reel: {
    loops: { intro: "corp-plant", research: "corp-mill", talk: "corp-pitch" },
    services: {
      "csr-film": "corp-mill",
      "csr-impact-story": "corp-sparks",
      "brand-film": "corp-plant",
      "pr-film": "corp-pitch",
      "personal-branding": "corp-suit",
    },
    cut: { lines: ["Show the", "real work"], loop: "corp-sparks" },
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
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For companies and corporate foundations",
    title: "Let your board see the work behind the numbers.",
    text: "Documentaries about your CSR projects and the people who lead your company, filmed at the project sites and in your offices.",
  },
  intro: {
    title: "What the board sees of your projects",
    lead: "Five services: two about your CSR projects, one about the company, and two about your leaders.",
    text: [
      "In the annual report and the Business Responsibility and Sustainability Report (BRSR), most CSR projects come down to two figures, spend and reach.",
      "What you see on a field visit doesn’t fit in either. A girl in Class 7 stood up and read out a story she had written in English. The head teacher brought out the attendance register to show you more names than the year before, and the coordinator from your implementing partner knew every child’s name. At the next CSR committee meeting, the photographs from that day took up one slide.",
      "We film the children, trainees or farmers in each project and the partner’s team who run it, alongside your project figures. The other films are about the company and its leaders, for investors and the press.",
    ],
    outcomesTitle: "What the films are for",
    outcomes: [
      {
        title: "For the committee",
        text: "The CSR committee sees the outcomes at each project, next to the spend",
        icon: "chart",
      },
      {
        title: "For the public",
        text: "Customers see the work on the ground",
        icon: "heart",
      },
      {
        title: "For investors and new joiners",
        text: "How the company began, and who runs it today",
        icon: "star",
      },
      {
        title: "For the press",
        text: "Your chairman or CEO on record, talking about the company",
        icon: "person",
      },
    ],
  },
  research: {
    title: "What companies are asked to show",
    text: "Four findings on what other companies are doing, and what regulators and the public expect.",
    stats: [
      {
        figure: "Documentaries",
        text: "Brands such as Patagonia and REI fund documentary films about the causes they work on, and some have set up film studios of their own to make them.",
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
        text: "Business came out as the most trusted institution in the 2026 Edelman Trust Barometer, a survey of 34,000 people in 28 countries. Trust in a brand is more and more tied to its CEO.",
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
        text: "Since this date, a company that sells in the European Union may not make vague claims such as “green” or “eco-friendly” without proof.",
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
        text: "A company with an average CSR obligation of Rs 10 crore or more must get an independent impact assessment of each CSR project of Rs 1 crore or more, at least a year after the project ends, and place it before the board.",
        sources: [{ label: "TaxTMI", href: "https://www.taxtmi.com/article/detailed?id=13642" }],
      },
    ],
    note: "Below, the five services and who each one is made for.",
  },
  glance: {
    title: "Five services at a glance",
    columns: [
      { label: "What it’s for", key: "short" },
      { label: "Made for", key: "madeFor" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the line closest to what is being said in your office.",
    picks: [
      {
        line: "“The committee has the spend figures. They keep asking about outcomes.”",
        service: "csr-film",
      },
      {
        line: "“We’ve done good work for years. Hardly anyone outside knows.”",
        service: "csr-impact-story",
      },
      {
        line: "“Our corporate film could be about any company in our sector.”",
        service: "brand-film",
      },
      {
        line: "“The press only ever asks our chairman about the numbers.”",
        service: "pr-film",
      },
      {
        line: "“Our managing director speaks well in a room. Online, there is almost nothing.”",
        service: "personal-branding",
      },
      {
        line: "“We want the films lined up with our annual action plan.”",
        service: "csr-film",
      },
    ],
  },
  servicesTitle: "Five services",
  services: [
    {
      id: "csr-film",
      name: "CSR Film",
      short: "Show outcomes as well as spend",
      madeFor: "Your CSR committee and board",
      line: "Your CSR projects on film, with your own figures on screen.",
      tags: ["For: CSR committee, board"],
      familiar: [
        "Every year the company spends crores on CSR. The implementing partners send progress reports with a few photographs attached, and by the end of the financial year each project is a few lines in the annual report.",
        "Colleagues in sales or at the plants have rarely heard of the projects at all.",
      ],
      does: [
        "At each site we film the people the project works with and the partner’s staff who run it. Your baseline figures go on screen next to where things stand today.",
        "The full film is made for the CSR committee and the board, and it can be linked from the CSR section of the annual report. Shorter versions go on the intranet.",
      ],
      receive: [
        "One main film on your CSR programme",
        "A short film for each project",
        "Interviews with people from each project, and with your partner’s field staff",
        "Figures from your reports, on screen",
        "Drone footage and photographs of each site",
        "Short versions for your intranet and LinkedIn",
      ],
      gain: [
        "A record of each project on film",
        "A film to show at committee meetings and board reviews",
        "Something colleagues in sales and at the plants can watch",
        "Footage from the sites for anyone who asks to see a project, such as an assessor or a new board member",
      ],
      example: [
        "A manufacturing company runs a skills centre for young people from the villages near its plant, through an implementing partner. The film follows a few trainees through a welding course and into their first jobs, some of them at the plant itself. The partner’s placement figures are on screen, with the change in monthly income.",
        "The CSR team shows it at the committee meeting before it goes to the board. A shorter cut plays at the town hall at the plant.",
      ],
      fits: [
        "Your projects have run for some years and have results to show",
        "An impact assessment is due, and you want the people behind its figures on record too",
      ],
      closing: "A CSR Film usually takes 6 to 10 weeks.",
    },
    {
      id: "csr-impact-story",
      name: "CSR Impact Story",
      short: "A human-interest story from one of your projects",
      madeFor: "Customers and investors",
      line: "The story of one person your project works with, for people who will never open a CSR report.",
      tags: ["For: Customers, investors"],
      familiar: [
        "“10,000 beneficiaries reached” is the right line for the annual report. On LinkedIn, people scroll past it.",
        "Some of the people your projects work with have turned their lives around, and hardly any of your customers know. When a company speaks about its own CSR, people are quick to read it as publicity. Many CSR teams say little for that reason.",
      ],
      does: [
        "We spend time with one person from the project, at home and at work, and they tell their story on camera.",
        "The person is at the centre, because they made the change. Your company and your implementing partner are in the film, but not in front.",
      ],
      receive: [
        "A film about one person from your project",
        "A shorter version for events, and reels for LinkedIn and Instagram",
        "Photographs for your reports and press releases",
      ],
      example: [
        "A steel company runs a girls’ education programme in the villages near its plant. The film follows one girl from a tribal family who was set to leave school after Class 8. With a scholarship and a hostel place from the programme, she finished school, the first in her family to do so, and is now training as a nurse.",
        "The communications team posts it on LinkedIn and YouTube, and sends it to the regional newspapers.",
      ],
      fits: [
        "Someone in one of your projects has a story you can show",
        "You have the figures and want one person’s story to go with them",
      ],
      panels: [
        {
          title: "What each audience takes from it",
          items: [
            {
              name: "Customers",
              text: "More likely to believe a person than an ad",
            },
            {
              name: "Investors",
              text: "One outcome they can picture",
            },
            {
              name: "Employees",
              text: "Something from their own company to show their families",
            },
            {
              name: "Communities",
              text: "Their own village and neighbours on screen",
            },
          ],
        },
      ],
      closing: "A CSR Impact Story usually takes 3 to 5 weeks.",
    },
    {
      id: "brand-film",
      name: "Brand Film",
      short: "Introduce the company that makes your products",
      madeFor: "Investors and business partners",
      line: "A documentary about how your company began and how it runs today, with the people who work there on camera.",
      tags: ["For: Investors, partners"],
      familiar: [
        "The corporate video is a few years old. The website has product photographs and a short “About us” page.",
        "A new distributor knows your price list and very little else about you.",
      ],
      does: [
        "We film at your offices and plants, with your founders and with staff who have been there for years.",
        "The products stay in the background. The same film can open an investor meeting or a new joiner’s first day.",
      ],
      receive: [
        "The full Brand Film",
        "A 60-second version for events and social media",
        "A cut for ads and presentations",
        "Interviews with your founders and employees",
        "Photographs of your people and your workplace",
      ],
      gain: [
        "One film that introduces the company in a few minutes, on the website and at induction",
        "Investors and partners who have seen the people who run the company",
      ],
      example: [
        "A family-run spice company began as a stall in a market and now sells across India. The film starts with the grandfather’s first stall and ends at the factory today. On the way it visits farmers who have sold to the company for years, and a packing supervisor who has been there since the early years.",
        "It now opens the company’s home page. New joiners see it in their first week.",
      ],
      fits: [
        "Investors and partners know your products better than your company",
        "Your corporate film is out of date",
        "You are planning a listing or entering a new market",
        "The company has an anniversary coming up",
      ],
      closing: "A Brand Film usually takes 4 to 6 weeks.",
    },
    {
      id: "pr-film",
      name: "Leadership Film",
      short: "Tell one leader’s story to people who don’t know it",
      madeFor: "The press and award juries",
      line: "A documentary about one of your leaders, from the place they grew up to where they want to take the company.",
      tags: ["For: Press, award juries"],
      familiar: [
        "Everyone at the company knows how the founder started and the risks taken in the early years. The press has a few quotes from interviews, and there is a paragraph in an award citation.",
      ],
      does: [
        "We go with them to the town where they grew up and follow a few of their working days. We also talk to people who have known them for a long time.",
        "The film is for people who know the company but not the person, and it is cut for the press and for award entries.",
      ],
      receive: [
        "A documentary about the leader",
        "A shorter version for award entries",
        "Clips and reels for LinkedIn and YouTube",
        "Interviews with family, and with people who have worked alongside them",
        "Portrait photographs for the press",
        "A release plan",
      ],
      example: [
        "The founder of an agri-business grew up watching his father sell the harvest at whatever price the trader offered. His company now buys from thousands of farmers. The film goes back with him to the village, and to some of the farmers who now supply him. It ends at head office, with him talking about fairer prices.",
        "The communications team sends it to business journalists, and it goes into the company’s award entries that year.",
      ],
      fits: [
        "Only colleagues have heard how your leader started",
        "You want more than a few quotes in the business press",
        "You are preparing award entries or a major media interview",
        "A change of leadership is coming up",
      ],
      panels: [
        {
          title: "Leadership Film or Personal Branding",
          items: [
            {
              name: "Leadership Film: one documentary",
              text: "One leader’s story, made once",
            },
            {
              name: "Personal Branding: every month",
              text: "A new video each month, posted by the leader on their own accounts",
            },
          ],
        },
      ],
      closing: "A Leadership Film usually takes 8 to 12 weeks.",
    },
    {
      id: "personal-branding",
      name: "Digital Personal Branding",
      short: "Leadership visibility, one video a month",
      madeFor: "Investors and future hires",
      line: "A monthly video series for your founder or CEO, posted on their own LinkedIn and YouTube.",
      tags: ["Format: Every month", "For: Investors, future hires"],
      familiar: [
        "Your CEO has decades in the industry and clear views on where it is going. Online, there is a LinkedIn profile and a few reshared company posts.",
        "The heads of competing firms post often and are quoted in the business papers. An analyst or a job candidate who looks up your sector finds them first.",
      ],
      doesTitle: "What this service does",
      does: [
        "Once a month we film your founder or CEO talking about their work and their industry. We cut it into a longer video and short clips for them to post.",
      ],
      receive: [
        "A profile film about the leader and how they got here",
        "A video every month for LinkedIn and YouTube",
        "8 to 12 clips and reels every month",
        "Filming at their talks and panel discussions",
        "Portrait photographs",
        "A posting plan built on the subjects the leader knows best",
      ],
      gain: [
        "The leader’s views on record, under their own name",
        "Something for event organisers and journalists to find",
        "Videos candidates can watch before the interview",
        "A year of the leader’s views for investors to look up",
      ],
      example: [
        "The founder of a mid-sized technology company has built a sound business, and few people in her industry know her name. The first film is about how she started, in a three-person office. After that she is filmed once a month on hiring and on where technology work in India is heading, and she posts the videos herself.",
        "A year on, anyone who looks her up before a meeting finds twelve videos of her talking about her work.",
      ],
      fits: [
        "Your leaders have plenty to say and rarely post",
        "You are hiring, and candidates look your leaders up before they apply",
        "Your leaders speak at events and nobody films it",
        "Your sector is debating questions your leaders know well",
      ],
      closing: "Month to month, for at least 3 months.",
    },
  ],
  together: {
    title: "How you can work with us",
    text: "You can commission one film, or plan a year of films. Footage from one shoot can go into the next film.",
    ways: [
      {
        title: "One film",
        text: "Commission any of the films on its own.",
      },
      {
        title: "A partnership",
        text: "One of the plans below, which run for 3 months or longer.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Starter",
        text: "For a CSR team that needs a project filmed this quarter, or is working with us for the first time.",
        items: [
          "CSR Film: 1 project, with a short film for the project",
          "CSR Impact Story: 2 stories from the same project",
          "Short versions: reels and clips for LinkedIn and Instagram",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "When the CSR team and the communications team both have films due in the same six months.",
        items: [
          "CSR Film: up to 2 projects",
          "CSR Impact Story: 3 stories",
          "Brand or Leadership Film: choose one",
          "Personal Branding: 6 months for one leader",
        ],
      },
      {
        months: 12,
        name: "Full Partnership",
        text: "A year of films, planned from April to March around your board and reporting dates.",
        items: [
          "CSR Film: every major project, ready for the board review and the CSR section of the annual report",
          "CSR Impact Story: 6 stories, one every two months",
          "Brand Film: 1 film",
          "Leadership Film: 1 documentary about one leader",
          "Personal Branding: 12 months, up to two leaders",
        ],
      },
    ],
    path: [
      { title: "Start with one", text: "One CSR Film, or the 3-month Starter plan" },
      {
        title: "Show it to the committee",
        text: "See how the first film is received before you plan further",
      },
      {
        title: "Plan the year",
        text: "Plan next year’s films around your annual action plan",
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
      { service: "Brand Film", cells: ["1 film", "", "Brand or Leadership Film", "1 film"] },
      { service: "Leadership Film", cells: ["1 film", "", "Brand or Leadership Film", "1 film"] },
      {
        service: "Digital Personal Branding",
        cells: ["Minimum 3 months", "", "1 leader", "Up to 2 leaders"],
      },
    ],
    note: "Anything not in an option can be added at extra cost.",
    advice:
      "A CSR Film usually takes 6 to 10 weeks, and a CSR Impact Story 3 to 5 weeks. A Brand Film takes 4 to 6 weeks. The Leadership Film takes longest, 8 to 12 weeks. Personal Branding runs month to month, for a minimum of 3 months.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us about the year ahead",
    text: "Write to us about the projects you want filmed, or a leader you want better known. If your annual action plan is ready, it is a good place to begin.",
    steps: [
      { title: "Talk", text: "A call about your projects and dates" },
      { title: "Plan", text: "Which films, and when, against your reporting dates" },
      {
        title: "Film",
        text: "At your project sites and offices",
      },
    ],
  },
};
