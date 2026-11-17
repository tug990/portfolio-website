import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - NGO Service Book.pdf", as the NGO world shows it */
export const NGO: ServiceBook = {
  itemWord: "Service",
  cover: {
    kicker: "For NGOs and foundations",
    title: "Your work changes lives. Let it be seen.",
    text: "Six documentary services that help NGOs prove impact, raise funds, reach communities, and keep a permanent record of their work.",
  },
  intro: {
    title: "Every NGO faces the same quiet problem.",
    lead: "The work on the ground is real and powerful, but the people who matter most rarely see it.",
    text: [
      "Donors read long reports. Communities hear about programmes through posters and meetings. The public scrolls past. And when staff leave, years of photos and footage leave with them.",
      "Insight Lab is a non-fiction studio that works alongside NGOs for the full life of a project. We film real people doing real work, honestly, and turn it into films that help you raise funds, build trust, reach communities, and keep a permanent record of everything you achieve.",
      "Choose one service or combine them. Footage shot for one service feeds the others, so the longer we work together, the more value every field visit creates.",
    ],
    outcomesTitle: "What the six services do for you",
    outcomes: [
      { title: "Proof", text: "Show real before-and-after change", icon: "eye" },
      { title: "Funding", text: "Keep donors engaged and renewing", icon: "chart" },
      {
        title: "Participation",
        text: "Help communities understand and act",
        icon: "megaphone",
      },
      { title: "Memory", text: "Keep every stage on permanent record", icon: "archive" },
      { title: "Visibility", text: "Build a public audience online", icon: "globe" },
      { title: "Connection", text: "Make people feel the impact", icon: "heart" },
    ],
  },
  research: {
    title: "Donors want proof. Communities want their own language.",
    text: "Four findings that shape how NGOs in India should communicate today.",
    stats: [
      {
        figure: "Rs 14 lakh cr",
        text: "India’s social sector funding fell about Rs 14 lakh crore short of NITI Aayog’s estimates, and the gap is projected to grow. NGOs compete harder than ever for every rupee.",
        sources: [
          {
            label: "Bain & Company and Dasra, India Philanthropy Report 2025",
            href: "https://www.bain.com/insights/india-philanthropy-report-2025/",
          },
        ],
      },
      {
        figure: "65% vs 36%",
        text: "65% of donors want regular updates about their impact, but only 36% of nonprofits provide them. Regular donor films close that gap.",
        sources: [
          {
            label: "Bloomerang, via NonProfit PRO",
            href: "https://www.nonprofitpro.com/the-annual-appeal-isnt-dead-it-just-needs-a-strategy-makeover",
          },
        ],
      },
      {
        figure: "70%+",
        text: "of donors surveyed say they are more likely to give to a nonprofit that uses storytelling to show its mission and impact.",
        sources: [
          {
            label: "Storyraise donor survey, via Givebutter",
            href: "https://givebutter.com/blog/nonprofit-storytelling",
          },
        ],
      },
      {
        figure: "98%",
        text: "of India’s internet users accessed content in Indian languages in 2024, and rural India now makes up 57% of users. Local-language films reach the communities you serve.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2024 and 2025",
            href: "https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf",
          },
        ],
      },
    ],
    note: "What this means: donors reward NGOs that show real, regular proof of impact, and communities respond to films in their own language. That is exactly what Donor Films, Case Study Films and Community Awareness Films are built to do.",
  },
  glance: {
    title: "Six services, one story.",
    columns: [
      { label: "Made for", key: "madeFor" },
      { label: "What it does", key: "short" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Find the sentence that sounds like you, and tap it.",
    picks: [
      {
        line: "“We need to show what our project really achieved.”",
        service: "impact-documentary",
      },
      { line: "“Our donor reports are long and rarely read.”", service: "donor-film" },
      { line: "“Communities don’t take part enough.”", service: "community-awareness" },
      { line: "“We lose everything when staff leave.”", service: "archival-film" },
      { line: "“Nobody outside our sector knows us.”", service: "digital-docu-series" },
      { line: "“Our numbers don’t move people.”", service: "case-study" },
    ],
  },
  servicesTitle: "Six services",
  services: [
    {
      id: "impact-documentary",
      name: "Impact Documentary Film",
      short: "Shows the full journey",
      madeFor: "Donors, government, festivals",
      line: "The full journey of your project, from before to after, told as a film.",
      tags: ["For: Donors, government, festivals"],
      familiar: [
        "Your project took years of effort, and life on the ground is visibly better. But all you have are scattered photos, phone videos, and reports full of numbers.",
        "Nobody filmed day one, so the real before-and-after story is lost. When someone asks “Show us what you achieved,” you have no single film that captures it.",
      ],
      does: [
        "We film at every stage as the work happens: the starting conditions, the effort in between, and the final change. Because it is filmed in real time, the before-and-after is genuine, not recreated later.",
        "If your project is already running, we begin with what exists: we gather your old photos and footage, interview the people involved, and record where things stand today.",
      ],
      receive: [
        "Baseline filming before work begins",
        "Progress filming at key stages",
        "Endline filming of the final change",
        "One finished documentary",
        "A short trailer for social media and events",
        "Drone shots and photography where useful",
      ],
      gain: [
        "One powerful film showing the full value of your work",
        "Real before-and-after proof",
        "A flagship film for funders, awards and festivals",
        "A story that makes people remember you",
      ],
      example: [
        "An NGO starts a girls’ education programme in a remote tribal block where most girls leave school after Class 5. The film opens with empty classrooms and long, unsafe walks to school, follows learning centres, bicycles, and parents slowly changing their minds, and ends years later with the first batch of girls completing Class 10.",
        "The NGO screens it at its partner meeting, submits it to awards, and uses it to open conversations with new funders.",
      ],
      fits: [
        "You run a multi-year project with visible change",
        "You want one film that shows your work at its best",
        "You are near a milestone or project completion",
        "You plan to enter awards, festivals or major events",
      ],
      panels: [
        {
          title: "How the journey is filmed",
          items: [
            { name: "Baseline", text: "The place, people and problem before work begins" },
            { name: "Progress", text: "Filming at key stages of the project" },
            { name: "Endline", text: "The final change, filmed in the same places" },
            { name: "The film", text: "One cinematic documentary of the full journey" },
          ],
        },
      ],
      closing: "Your project is a journey worth telling from the first day. We film all of it.",
    },
    {
      id: "donor-film",
      name: "Donor Film",
      short: "Proves results with data",
      madeFor: "Donors and CSR partners",
      line: "Show your donors exactly what their support achieved, with facts they can trust.",
      tags: ["For: Donors and CSR partners"],
      familiar: [
        "Your donor trusted you with funds and wants to know what happened. You send a detailed report that takes weeks to prepare, and most of it is only skimmed.",
        "The donor never sees the village or the families. At renewal time, a written report alone does not make you stand out.",
      ],
      does: [
        "A Donor Film presents the measurable results of their support through statistics, facts, and ground-level reporting. Every number on screen is backed by real footage of the place and the people.",
        "A short film gets watched and forwarded inside the donor’s organisation, reaching decision-makers who would never open a 40-page report.",
      ],
      receive: [
        "Quarterly Donor Films",
        "An Annual Donor Film",
        "Key numbers turned into clear on-screen graphics",
        "Interviews with beneficiaries, staff and officials",
        "Versions for presentations, emails and events",
      ],
      gain: [
        "Donors see their impact, not just read it",
        "Better chances of grant renewal",
        "Credible reporting built on data",
        "A ready tool for new proposals and CSR pitches",
      ],
      example: [
        "An NGO brings solar lighting, clean water, and livelihood support to a hard-to-reach hill village. The Donor Film shows how many households now have light, how many more hours children study after dark, how waterborne illness has fallen, and how farm incomes have grown, each figure shown alongside the families behind it.",
        "The donor shares the film with their leadership, and the next proposal starts from proven trust.",
      ],
      fits: [
        "You report regularly to donors or CSR partners",
        "Your reports are detailed but rarely get attention",
        "You want better chances of renewal",
        "You are pitching to new funders",
      ],
      closing: "Your donors invested in change. Let them see it.",
    },
    {
      id: "community-awareness",
      name: "Community Awareness Film",
      short: "Informs and mobilises",
      madeFor: "Villages and field workers",
      line: "Films made for the community, in their own language, that inspire real action.",
      tags: ["For: Villages and field workers"],
      familiar: [
        "Your programme only succeeds if the community takes part, but participation is low. Posters go unread, pamphlets don’t connect, and field staff repeat the same message in meeting after meeting.",
        "The problem is not that people don’t care. The message hasn’t reached them in a way they understand and trust.",
      ],
      does: [
        "A Community Awareness Film is made for the community, not for donors. It is in the local language, features real people from similar villages, and explains simply what the problem is, why it matters, and what to do.",
        "Films are screened at Panchayat Bhawans, Anganwadi centres and schools, and shared on WhatsApp, travelling far beyond where your staff can reach.",
      ],
      receive: [
        "Awareness films in the local language",
        "Versions for screenings and WhatsApp",
        "Real community members, not actors",
        "Training films for field workers, where needed",
        "Content planned around your programme goals",
      ],
      gain: [
        "Higher participation in your programmes",
        "One clear message in the people’s language",
        "A tool for every field worker",
        "Lasting behaviour change",
      ],
      example: [
        "An NGO working on women’s health finds anaemia is widespread but rarely discussed. A short film in the local language, featuring a local Anganwadi worker and mothers from a nearby village, explains the causes, the warning signs, and simple prevention through iron-rich foods and supplements.",
        "Screened at the Panchayat Bhawan and shared on WhatsApp, it brings more women to health check-ups within weeks.",
      ],
      fits: [
        "Participation is lower than you need",
        "You work on health, nutrition, education, sanitation or rights",
        "You work across different local languages",
        "Your field team needs a consistent tool",
      ],
      panels: [
        {
          title: "Where these films are shown",
          items: [
            { name: "Panchayat Bhawan", text: "Village screenings and meetings" },
            { name: "Anganwadi centres", text: "Health and nutrition sessions" },
            { name: "WhatsApp", text: "Shared phone to phone" },
            { name: "Field workers", text: "A consistent tool for every visit" },
          ],
        },
      ],
      closing: "Change begins when people understand. We help them understand.",
    },
    {
      id: "archival-film",
      name: "Archival Film",
      short: "Preserves the complete record",
      madeFor: "NGO teams, future funders",
      line: "A complete, organised record of your project that stays with you for years.",
      tags: ["Duration: Full project life, 1–5 years", "For: NGO teams, future funders"],
      familiar: [
        "A programme officer who handled your project for three years has just left, and with them went the only copies of hundreds of photos and videos.",
        "An auditor asks for visual proof of work and your team spends days searching. A new team in a new district starts from scratch, because nothing was recorded in a usable way.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film and photograph every stage of your project and store everything in an organised, searchable archive, labelled by project, location, date and subject.",
        "The archive belongs to your organisation, not to any one person, and stays with you through staff and partner changes. If you already have years of scattered material, we recover and organise that too.",
      ],
      receive: [
        "Stage-by-stage filming and photography",
        "Recovery and organisation of existing material",
        "A searchable archive by project, place, date and subject",
        "A long-format before-and-after film",
        "A complete handover archive at project close",
      ],
      example: [
        "An NGO runs a five-year watershed and farming programme across several villages. Every stage is filmed: the dry fields, check-dam construction, farmer trainings, and the first irrigated harvest.",
        "When it expands to a new district, the archive trains the new team, answers an auditor in minutes, and its before-and-after film helps win funding for two similar projects.",
      ],
      fits: [
        "You run projects of two years or more",
        "You have lost material to staff changes or failed drives",
        "You plan to replicate your work elsewhere",
        "You need visual proof for audits",
      ],
      panels: [
        {
          title: "One archive, many uses",
          items: [
            { name: "Train new teams", text: "Show how a project was run, step by step" },
            { name: "Proof of record", text: "Visual evidence for audits and reporting" },
            { name: "Win new projects", text: "A before-and-after film for funders" },
            {
              name: "Future films",
              text: "Ready material for anniversary and legacy films",
            },
          ],
        },
      ],
      closing: "Your work should outlast every hard drive and every staff change.",
    },
    {
      id: "digital-docu-series",
      name: "Digital Docu-Series",
      short: "Builds a public audience",
      madeFor: "Public, CSR partners, supporters",
      line: "Your work is changing lives. It is time the world saw it.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your team works every day in villages, camps and schools, but outside your organisation very few people know about it. Posts get a few likes and are forgotten.",
        "When a new donor or CSR partner looks you up, they find little that shows the real scale of your work. The problem is not your work: it has no regular way to reach people.",
      ],
      doesTitle: "What this service does",
      does: [
        "A Digital Docu-Series turns your everyday work into a documentary series people want to follow, released one episode at a time on a regular schedule.",
        "Over time your NGO becomes a story people follow, and the series becomes your own digital IP that keeps working for you every day.",
      ],
      receive: [
        "Documentary episodes, monthly or fortnightly",
        "Results-focused versions of every episode for LinkedIn",
        "3 to 5 reels from every episode for Instagram",
        "Thumbnails, titles and captions for each platform",
        "A content plan for the whole series",
        "All footage saved to your archive",
      ],
      example: [
        "An NGO runs mobile health camps in remote tribal villages, but almost nobody outside the region knows. Each month’s episode follows the team to a new village: the journey, the patients waiting, a mother getting her child treated for the first time.",
        "Subscribers grow on YouTube, a CSR head reaches out on LinkedIn, and volunteers sign up through Instagram. Within a year the NGO has an audience, a trusted reputation, and a community.",
      ],
      fits: [
        "Your work is strong but your online presence is weak",
        "You want donors and CSR partners to find and trust you",
        "You want volunteers and supporters",
        "You have no in-house content team",
      ],
      panels: [
        {
          title: "What each platform builds for you",
          items: [
            {
              name: "YouTube: audience",
              text: "Full episodes grow subscribers and a library people find through search",
            },
            {
              name: "LinkedIn: trust",
              text: "Results-focused cuts reach CSR heads, donors and officials",
            },
            {
              name: "Instagram: community",
              text: "Emotional reels bring supporters and volunteers close",
            },
          ],
        },
      ],
      closing: "Your work is already a story worth telling. We help you tell it every month.",
    },
    {
      id: "case-study",
      name: "Case Study Film",
      short: "Touches hearts, reaches new people",
      madeFor: "Donors and new audiences",
      line: "One real life. One powerful story. The human face of your impact.",
      tags: ["For: Donors and new audiences"],
      familiar: [
        "You have helped thousands of people and your reports say so. But “5,000 women trained” is easy to forget, and numbers don’t make anyone feel what your work means.",
        "People who have never heard of your NGO have no reason to stop for statistics from an organisation they don’t know.",
      ],
      does: [
        "A Case Study Film tells the emotional story of one beneficiary or local hero: their struggle, the turning point your programme created, and where they stand today.",
        "When people see one life change, they understand the thousands behind it.",
      ],
      receive: [
        "A film following one person’s journey",
        "A short version for social media",
        "Reels and clips for every platform",
        "Still photographs for reports and press",
        "Story development with informed consent and dignity",
      ],
      example: [
        "An NGO’s livelihood programme trains rural women in tailoring. The film follows one woman who once depended on daily wage labour: her first nervous days at the centre, buying her first sewing machine, and today running a small unit that employs other women from her village.",
        "At the donor meeting it brings the room to silence. Shared online, it reaches thousands of new viewers, and several write in asking how to support the programme.",
      ],
      fits: [
        "You have strong individual stories nobody hears",
        "You want donors to feel the impact",
        "You want to reach people who don’t know you",
        "You are planning a fundraising campaign",
      ],
      panels: [
        {
          title: "Two jobs in one film",
          items: [
            {
              name: "Builds donor trust",
              text: "Donors see the human result of their support, which makes their contribution feel personal",
            },
            {
              name: "Reaches new people",
              text: "Personal stories travel on social media and in the press, introducing your NGO to people who never knew it",
            },
          ],
        },
      ],
      closing: "Behind every number is a person. We tell their story.",
    },
  ],
  together: {
    title: "How we work together",
    text: "We work with NGOs on a contract basis, not film by film. One team stays with your project, footage builds up over time, and every film costs less than commissioning it alone.",
    ways: [
      {
        title: "One team, start to finish",
        text: "The crew that films your baseline films your endline, so the change is genuine",
      },
      {
        title: "Footage that compounds",
        text: "One field visit serves many films, so costs fall over time",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Starter",
        text: "First-time partners, a short campaign, or a boost before a donor meeting.",
        items: [
          "Donor Film: 1 quarterly film",
          "Case Study Film: 1 story",
          "Awareness Film: 1 local-language film",
          "Docu-Series: 3 monthly episodes",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "Steady donor communication, stronger visibility, and a proper record.",
        items: [
          "Donor Film: 2 quarterly films",
          "Case Study Film: 2–3 stories",
          "Awareness Film: up to 3 films",
          "Docu-Series: 6 episodes",
          "Archival Film: archive setup and stage-by-stage filming",
        ],
      },
      {
        months: 12,
        name: "Full Partnership",
        text: "A funded, multi-year project that needs complete documentation and communication.",
        items: [
          "Impact Documentary: baseline and progress filming",
          "Donor Film: 4 quarterly + 1 annual",
          "Case Study Film: 4–6 stories",
          "Awareness Film: up to 6 films",
          "Docu-Series: 12 episodes",
          "Archival Film: full-year archive and film",
        ],
      },
    ],
  },
  compare: {
    title: "Compare the partnerships",
    columns: ["3 Months", "6 Months", "12 Months"],
    rows: [
      {
        service: "Impact Documentary Film",
        cells: ["", "", "Baseline + progress filming"],
      },
      { service: "Donor Film", cells: ["1", "2", "4 quarterly + 1 annual"] },
      { service: "Case Study Film", cells: ["1", "2–3", "4–6"] },
      { service: "Community Awareness Film", cells: ["1", "Up to 3", "Up to 6"] },
      {
        service: "Digital Docu-Series",
        cells: ["3 episodes", "6 episodes", "12 episodes"],
      },
      {
        service: "Archival Film",
        cells: ["", "Archive setup + filming", "Full-year archive + film"],
      },
    ],
    note: "“Not included (extra cost)” means the service is not part of that partnership, but you can still get it by paying separately.",
    advice:
      "The longer the partnership, the more value each film carries: the archive grows, the team knows your work deeply, and the story of your impact becomes complete. Most NGOs start with 3 or 6 months and move to 12 once they see the results.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Let’s tell the story of your work.",
    text: "Tell us about your project, where it stands today, and who you need to reach. We will suggest the films and partnership that fit.",
    steps: [
      { title: "Talk", text: "A short call about your project and your audiences" },
      { title: "Plan", text: "We propose the films, timeline and partnership" },
      { title: "Film", text: "One team stays with your story from the first day" },
    ],
  },
};
