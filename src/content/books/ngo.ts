import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - NGO Service Book.pdf", as the NGO world shows it */
export const NGO: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "ngo-mothers", research: "ngo-paddy", talk: "ngo-care" },
    services: {
      "impact-documentary": "ngo-fields",
      "donor-film": "ngo-ward",
      "community-awareness": "ngo-centre",
      "archival-film": "ngo-sowing",
      "digital-docu-series": "ngo-home",
      "case-study": "ngo-mothers",
    },
    cut: { lines: ["Let people", "see the work"], loop: "ngo-paddy" },
    trail: [
      "ngo-01",
      "ngo-02",
      "ngo-03",
      "ngo-04",
      "ngo-05",
      "ngo-06",
      "ngo-07",
      "ngo-08",
      "ngo-09",
      "ngo-10",
      "ngo-11",
      "ngo-12",
      "ngo-13",
      "ngo-14",
      "ngo-15",
      "ngo-16",
      "ngo-17",
      "ngo-18",
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For NGOs and foundations",
    title: "Let people see the work you do.",
    text: "Documentary films for NGOs and foundations, made in the villages where your work happens, with the people it reaches.",
  },
  intro: {
    title: "What happens in the field stays in the field",
    lead: "We make documentary films of your NGO’s work in the field, so donors, partners and the public can see the change your team creates instead of only reading about it in a report.",
    text: [
      "Think of an ordinary field day. Your team leaves before sunrise and reaches the village as the women gather at the anganwadi centre. A health worker weighs the babies one by one. A mother asks the question she was too shy to ask last month. A girl who had stopped going to school says she wants to go back. By evening your team is on the road home, tired, with a notebook full of what they saw.",
      "A month later, that whole day becomes a few lines in a report and a photo of people sitting in a row. The donor who paid for it reads the report, and almost nothing of what happened in the village reaches them.",
      "That’s the gap we fill. We go into the field with your team and film the work as it happens, so the people who fund you, the community you serve and your own staff can see it for themselves. You don’t need all six films below. Start with the one that fits where your project is today.",
    ],
    outcomesTitle: "What changes when people can see your work",
    outcomes: [
      { title: "Proof", text: "Shows the before and after", icon: "eye" },
      { title: "Funding", text: "Helps donors renew", icon: "chart" },
      { title: "Participation", text: "Gets more people to take part", icon: "megaphone" },
      { title: "Memory", text: "Keeps a record of every stage", icon: "archive" },
      { title: "Visibility", text: "Builds an audience online", icon: "globe" },
      { title: "Connection", text: "Makes people care", icon: "heart" },
    ],
  },
  research: {
    title: "The numbers behind the numbers",
    text: "Before we pick up a camera, we read what donors and communities say they need. These four findings shape every NGO film we make.",
    stats: [
      {
        figure: "Rs 14 lakh cr",
        text: "That’s how far India’s social sector funding fell short of what NITI Aayog estimates is needed, and the gap is expected to grow. Funding is getting harder to win.",
        sources: [
          {
            label: "Bain & Company and Dasra, India Philanthropy Report 2025",
            href: "https://www.bain.com/insights/india-philanthropy-report-2025/",
          },
        ],
      },
      {
        figure: "65% vs 36%",
        text: "65% of donors want regular updates on what their money did. Only 36% of nonprofits send them.",
        sources: [
          {
            label: "Bloomerang, via NonProfit PRO",
            href: "https://www.nonprofitpro.com/the-annual-appeal-isnt-dead-it-just-needs-a-strategy-makeover",
          },
        ],
      },
      {
        figure: "70%+",
        text: "of donors in one survey said they’re more likely to give to a nonprofit that tells stories about its work.",
        sources: [
          {
            label: "Storyraise donor survey, via Givebutter",
            href: "https://givebutter.com/blog/nonprofit-storytelling",
          },
        ],
      },
      {
        figure: "98%",
        text: "of internet users in India read or watched something in an Indian language in 2024. Rural India now makes up 57% of users.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2024 and 2025",
            href: "https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf",
          },
        ],
      },
    ],
    note: "Put together, it’s simple. Donors want to hear from you often and see the people behind the numbers, and communities listen when the film speaks their language. The six films below are built around that.",
  },
  glance: {
    title: "Where do you start?",
    columns: [
      { label: "Made for", key: "madeFor" },
      { label: "What it does", key: "short" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Which of these have you said? Tap it.",
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
  servicesTitle: "Six films we make for NGOs",
  services: [
    {
      id: "impact-documentary",
      name: "Impact Documentary Film",
      short: "Shows the full journey",
      madeFor: "Donors, government, festivals",
      line: "You have the theory of change. We film the change itself, from baseline to endline, so anyone can see it.",
      tags: ["For: Donors, government, festivals"],
      familiar: [
        "Most projects only get filmed near the end. By then nobody can show what the place looked like before.",
        "So you’re left with phone videos and a report, and nothing that shows the change properly.",
      ],
      does: [
        "We film at the start, a few times along the way, and at the end, in the same places and with the same people. The before and after are real because we were there for both.",
        "If your project has already started, we work with the photos and footage you have and film where things stand now.",
      ],
      receive: [
        "Baseline filming before work begins",
        "Progress filming at key stages",
        "Endline filming of the final change",
        "One finished documentary",
        "A short trailer for social media and events",
        "Drone shots and photography where useful",
        "Written consent from everyone we film, and nobody shown in a way they wouldn’t be proud of",
      ],
      gain: [
        "One powerful film showing the full value of your work",
        "Real before-and-after proof",
        "A flagship film for funders, awards and festivals",
        "A story that makes people remember you",
      ],
      example: [
        "An NGO starts a girls’ education programme in a tribal block where most girls leave school after Class 5. The film opens on empty classrooms and the long walk to school. It follows the learning centres, the bicycles and the parents who slowly change their minds, and it ends years later when the first batch of girls finishes Class 10.",
        "The NGO shows it at its partner meeting, sends it to awards and plays it when it meets new funders.",
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
      closing: "Your project is a journey from its very first day. We film all of it.",
    },
    {
      id: "donor-film",
      name: "Donor Film",
      short: "Proves results with data",
      madeFor: "Donors and CSR partners",
      line: "The donor report your donors will actually finish, taking them to the families their money reached, with the numbers beside them.",
      tags: ["For: Donors and CSR partners"],
      familiar: [
        "A donor report takes weeks to write and most of it gets skimmed.",
        "Your donor never sees the village or meets the families, so at renewal time they’re deciding from a document.",
      ],
      does: [
        "We film the place and the people, and show the numbers that matter alongside them.",
        "It’s short enough that people watch it to the end and forward it inside the donor’s organisation, including to people who’d never open a 40-page report.",
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
        "An NGO brings solar lights, clean water and help with farming to a hill village that’s hard to reach. The donor film shows how many homes now have light, how much longer children study after dark, how much less waterborne illness there is and how farm incomes have changed, next to the families those numbers belong to.",
        "The donor shows the film to their leadership, and the next proposal is an easier conversation.",
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
      line: "Messages that travel further than your field staff can, in the local language, with neighbours on screen, made for the panchayat screening and the WhatsApp forward.",
      tags: ["For: Villages and field workers"],
      familiar: [
        "A programme only works if people take part. Posters don’t do much, and field staff end up giving the same talk at every meeting.",
        "Usually people do care. The message just hasn’t reached them in a way they trust.",
      ],
      does: [
        "We make these films for the community, not for donors. They’re in the local language, feature people from nearby villages, and explain the problem and what to do about it in plain terms.",
        "They get shown at the Panchayat Bhawan, anganwadi centres and schools, and then they travel on WhatsApp.",
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
        "An NGO working on women’s health finds that anaemia is common but nobody talks about it. We make a short film in the local language with an anganwadi worker and mothers from a nearby village. It explains the causes, the warning signs, and how iron-rich food and supplements help.",
        "It’s shown at the Panchayat Bhawan and shared on WhatsApp, and within a few weeks more women are coming in for check-ups.",
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
      line: "Your project’s memory, filmed, labelled and kept, so it doesn’t leave when your staff do.",
      tags: ["Duration: Full project life, 1–5 years", "For: NGO teams, future funders"],
      familiar: [
        "When a programme officer leaves, the photos and videos on their laptop often leave with them.",
        "Then an auditor asks for proof, or a new team in another district has to start from scratch.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film and photograph each stage of the project and keep everything in one archive, searchable by project, place, date and subject.",
        "The archive belongs to your organisation. If you already have years of scattered material, we can sort that out too.",
      ],
      receive: [
        "Stage-by-stage filming and photography",
        "Recovery and organisation of existing material",
        "A searchable archive by project, place, date and subject",
        "A long-format before-and-after film",
        "A complete handover archive at project close",
      ],
      example: [
        "An NGO runs a five-year watershed and farming programme across several villages. We film every stage: the dry fields, the check dams going up, the farmer trainings and the first harvest with irrigation.",
        "When the programme moves to a new district, the new team learns from the footage. An auditor’s question takes minutes to answer, and the before-and-after film goes into funding proposals for two similar projects.",
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
      line: "A new episode of your work every month, for the followers you already have and the funders you haven’t met yet.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your team is out in villages, camps and schools every week, and hardly anyone outside the organisation knows.",
        "When a new donor or CSR partner looks you up, there isn’t much for them to find.",
      ],
      doesTitle: "What this service does",
      does: [
        "We turn your everyday work into a documentary series, released once a month or every two weeks.",
        "Each episode is cut for YouTube, with shorter versions for Instagram and LinkedIn. After a year you have a library of films people can find and share.",
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
        "An NGO runs mobile health camps in remote tribal villages, and almost nobody outside the region knows. Each month’s episode goes with the team to a different village: the drive in, the queue of patients, a mother getting her child treated for the first time.",
        "Over the year the YouTube channel picks up subscribers, a CSR head gets in touch on LinkedIn, and volunteers sign up through Instagram.",
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
      line: "Scale is a number. We film one person inside it, from where they started to where they are now.",
      tags: ["For: Donors and new audiences"],
      familiar: [
        "“5,000 women trained” is true and it’s in your report, but nobody remembers a number like that.",
        "People who haven’t heard of you won’t stop for a statistic either.",
      ],
      does: [
        "We follow one person and tell their story: where they started, what your programme changed, and where they are now.",
        "Seeing one life change helps people understand the many behind the number.",
      ],
      receive: [
        "A film that follows one person over time",
        "A short version for social media",
        "Reels and clips for every platform",
        "Still photographs for reports and press",
        "Story development with informed consent and dignity",
      ],
      example: [
        "An NGO’s livelihood programme trains rural women in tailoring. The film follows one woman who used to work as a daily wage labourer: her first nervous days at the centre, the day she buys her own sewing machine, and the small unit she runs now, where other women from her village work too.",
        "The NGO shows it at a donor meeting and shares it online, and people who had never heard of the programme write in to ask how they can help.",
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
    title: "How we work with NGOs",
    text: "We work with you over months rather than one film at a time. We plan the shoots around your field calendar and your reporting dates, so the film is ready before the donor report is due. The same crew keeps coming back, gets to know the people in your programme, and every visit adds footage to the next film, so each one costs less than it would on its own.",
    ways: [
      {
        title: "The same crew throughout",
        text: "The people who film the start of your project film the end, in the same places",
      },
      {
        title: "Footage gets reused",
        text: "One field visit gives us material for several films, so each one costs less",
      },
      {
        title: "Filmed with dignity",
        text: "People see their footage before anyone else does, anyone can say no, and we never make a village look poorer than it is",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Starter",
        text: "For a first project together, a short campaign, or a donor meeting coming up.",
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
        text: "Regular films for your donors, more people seeing your work, and a proper record.",
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
        text: "For a funded project that runs a year or more and should be filmed from start to end.",
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
      "The films get better the longer we work together, because the archive grows and the team gets to know your work. Most NGOs start with 3 or 6 months and move to 12 once they’ve seen the first films.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us where your story is",
    text: "Tell us about the project, the people in it and who needs to see it. We’ll come back with the films we’d make and how we’d make them.",
    steps: [
      { title: "Talk", text: "A short call about your project and who you need to reach" },
      { title: "Plan", text: "We suggest which films to make, and when" },
      { title: "Film", text: "The same team films your project from the first day" },
    ],
  },
};
