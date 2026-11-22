import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - NGO Service Book.pdf", as the NGO world shows it */
export const NGO: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "ngo-mothers", research: "ngo-paddy", talk: "ngo-sowing" },
    services: {
      "impact-documentary": "ngo-fields",
      "donor-film": "ngo-home",
      "community-awareness": "ngo-paddy",
      "archival-film": "ngo-sowing",
      "digital-docu-series": "ngo-fields",
      "case-study": "ngo-mothers",
    },
    cut: { lines: ["Let people", "see the work"], loop: "ngo-paddy" },
    trail: [
      "ngo-03",
      "ngo-04",
      "ngo-05",
      "ngo-06",
      "ngo-07",
      "ngo-08",
      "ngo-09",
      "ngo-10",
      "ngo-14",
      "ngo-17",
      "ngo-18",
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For NGOs and foundations",
    title: "Let your donors see what your team does in the field.",
    text: "Documentary films shot in the villages and bastis where your programmes run.",
  },
  intro: {
    title: "Most of your funders never see the field",
    lead: "We make documentary films of your programmes for the donors and CSR partners who only ever see the report.",
    text: [
      "Take an ordinary Tuesday in the field. Your team leaves before sunrise and gets to the anganwadi centre just as the mothers are coming in. The anganwadi worker weighs the babies one by one. A girl who dropped out after Class 5 tells your coordinator she wants to go back. Your coordinator writes it up in her notebook on the way home.",
      "A month later the quarterly report falls due, in the funder’s template (every funder has its own), and that Tuesday becomes three lines and a photo of people sitting in a row on a durrie. Your CSR partner has never been to the village. At renewal, their committee will go mostly on that report. By then your coordinator may have moved on, with the photos still on her phone.",
      "The report isn’t going away. We go out with your team on a day like that Tuesday, and we film it. Your donors get the report as usual, with a film to go with it.",
    ],
    outcomesTitle: "Where the films help",
    outcomes: [
      {
        title: "Before and after",
        text: "The same places, filmed at the start and at the end",
        icon: "eye",
      },
      {
        title: "Renewals",
        text: "A film the renewal committee can watch before it decides",
        icon: "chart",
      },
      {
        title: "Turnout",
        text: "A film your field staff can show at every meeting",
        icon: "megaphone",
      },
      {
        title: "The record",
        text: "Every stage of a project, filmed and kept in one place",
        icon: "archive",
      },
      {
        title: "Being found",
        text: "Films about your work online, for new funders to find",
        icon: "globe",
      },
      { title: "The people", text: "People from your programme doing the talking", icon: "heart" },
    ],
  },
  research: {
    title: "What the research says",
    text: "Money is harder to raise, and donors want to hear how the work is going between reports.",
    stats: [
      {
        figure: "Rs 14 lakh cr",
        text: "The gap between what India’s social sector receives and what NITI Aayog estimates it needs. The report expects it to grow.",
        sources: [
          {
            label: "Bain & Company and Dasra, India Philanthropy Report 2025",
            href: "https://www.bain.com/insights/india-philanthropy-report-2025/",
          },
        ],
      },
      {
        figure: "65% vs 36%",
        text: "In a US survey, 65% of donors wanted regular updates on what their money did, and only 36% of nonprofits sent them.",
        sources: [
          {
            label: "Bloomerang, via NonProfit PRO",
            href: "https://www.nonprofitpro.com/the-annual-appeal-isnt-dead-it-just-needs-a-strategy-makeover",
          },
        ],
      },
      {
        figure: "70%+",
        text: "of donors in a US survey said they were more likely to give to a nonprofit that tells stories about its work.",
        sources: [
          {
            label: "Storyraise donor survey, via Givebutter",
            href: "https://givebutter.com/blog/nonprofit-storytelling",
          },
        ],
      },
      {
        figure: "98%",
        text: "of internet users in India read or watched something in an Indian language in 2024. Rural India now makes up 57% of all users.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2024 and 2025",
            href: "https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf",
          },
        ],
      },
    ],
    note: "The last figure matters for the Community Awareness Film, which travels from phone to phone in the local language.",
  },
  glance: {
    title: "Six films at a glance",
    columns: [
      { label: "Made for", key: "madeFor" },
      { label: "What it does", key: "short" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the line you’ve heard in your own office.",
    picks: [
      {
        line: "“The funder keeps asking what actually changed. We know, but we can’t show it.”",
        service: "impact-documentary",
      },
      {
        line: "“Three weeks on the quarterly report, and I doubt anyone read past page two.”",
        service: "donor-film",
      },
      {
        line: "“The same few people come to every meeting. Our field staff are tired of giving the same talk.”",
        service: "community-awareness",
      },
      {
        line: "“When our programme officer left, three years of photos went with her phone.”",
        service: "archival-film",
      },
      {
        line: "“A CSR team looked us up last month. There was almost nothing to find.”",
        service: "digital-docu-series",
      },
      {
        line: "“The funder wants case stories. Our reports are all numbers.”",
        service: "case-study",
      },
    ],
  },
  servicesTitle: "Six films we make for NGOs",
  services: [
    {
      id: "impact-documentary",
      name: "Impact Documentary Film",
      short: "One project, from start to end",
      madeFor: "Funders and government partners",
      line: "We film your project when it starts and keep coming back to the same places until it ends.",
      tags: ["For: Funders and government partners"],
      familiar: [
        "Most projects get filmed at the very end, usually because the closing report needs a video. By then the place has changed, and there’s no footage of how it looked at the start.",
        "Your field team’s phone clips are fine for the WhatsApp group. A funder deciding on phase two needs to see the same place before and after.",
      ],
      does: [
        "We start filming at your baseline and finish at your endline, with a few visits in between. Each visit, we go back to the families we filmed last time, in the same spots.",
        "If the project started a year ago, we work from whatever photos and videos your team already has and film where things stand today.",
      ],
      receive: [
        "Filming at baseline, before the work begins",
        "Filming at the main stages while the project runs",
        "Endline filming when the project closes",
        "One finished documentary",
        "A short trailer for social media and events",
        "Drone shots and photographs, where they help",
      ],
      gain: [
        "The whole project in one film, baseline to endline",
        "Before-and-after shots of the same places and people",
        "A film to take to funder meetings and send with proposals",
        "A film you can enter for awards and festivals",
      ],
      example: [
        "An NGO starts a girls’ education programme in a tribal block where most girls stop after primary school. The film opens on the school in the first year, and the girls who still come. Over the next few years it follows the new learning centres, and the fathers who took a long time to come round. It ends when the first batch of girls sits the Class 10 board exams.",
        "The NGO shows it at its annual partners’ meet, and the fundraising team carries it on a laptop to meetings with new funders.",
      ],
      fits: [
        "Your project runs for several years, and the change shows on the ground",
        "You want one main film about the organisation’s work",
        "The project is near a milestone, or near its end",
        "You’re thinking of entering awards or film festivals",
      ],
    },
    {
      id: "donor-film",
      name: "Donor Film",
      short: "Your progress report, on film",
      madeFor: "Donors and CSR partners",
      line: "A short film of your progress report, with the families the grant reached on screen and your own figures next to them.",
      tags: ["For: Donors and CSR partners"],
      familiar: [
        "Your team spends weeks putting each report into the funder’s format.",
        "The CSR committee has a document and a few photos to go on.",
      ],
      does: [
        "We film the people the grant reached, where they live. The figures on screen are the ones already in your reports and monitoring data.",
        "It’s short. Your contact at the funder can forward it to the people who sign off on renewals, most of whom were never going to open a 40-page report.",
      ],
      receive: [
        "A short film each quarter, timed to your reporting dates",
        "A longer film at the end of the year, for the annual report and partner meetings",
        "Your key figures as simple on-screen graphics",
        "Interviews with community members, field staff and local officials",
        "Versions to play at events and to send by email",
      ],
      gain: [
        "Your donors see where the grant went",
        "A film the CSR committee can watch at renewal",
        "Footage you can reuse in new proposals",
      ],
      example: [
        "An NGO brings solar lights and clean drinking water to a hill village the jeep can’t reach in the monsoon. The film puts the NGO’s own figures on screen, like the number of homes with light now and the extra hours children study after dark.",
        "The company’s CSR manager plays it for the CSR committee before they discuss phase two.",
      ],
      fits: [
        "You send reports to donors or CSR partners every quarter, or close to it",
        "Your reports are thorough and get skimmed anyway",
        "A grant you depend on is coming up for renewal",
        "You’re writing to new funders",
      ],
    },
    {
      id: "community-awareness",
      name: "Community Awareness Film",
      short: "Local-language films for meetings and WhatsApp",
      madeFor: "Communities and your field team",
      line: "Short films in the local language, made to be shown at village meetings and passed from phone to phone.",
      tags: ["For: Communities and your field team"],
      familiar: [
        "The posters fade on the panchayat wall, and your field staff give the same talk at meeting after meeting.",
        "People listen more when it’s someone from their own village saying it.",
      ],
      does: [
        "These films are made for the people in your programme villages, with their own neighbours on screen. They say plainly what to look out for and what to do.",
        "Your team screens them at the Panchayat Bhawan or the anganwadi centre.",
      ],
      receive: [
        "Awareness films in the local language",
        "Versions for screenings and for phones",
        "People from the community on screen, not actors",
        "Training films for your field team, where needed",
        "Films planned around the behaviour change your programme works on",
      ],
      example: [
        "An NGO’s women’s health programme is working on anaemia, which is common in its villages and rarely talked about. We make a short film in the local language with an anganwadi worker and a few mothers from a nearby village. It covers how to spot anaemia, and how iron-rich food and IFA tablets help.",
        "The field team plays it at anganwadi meetings, on a phone or a borrowed projector, and shares it on the village WhatsApp groups.",
      ],
      fits: [
        "Fewer people take part than the programme needs",
        "Your programme depends on behaviour change, around health or nutrition for example",
        "You work in more than one local language",
        "Your field team needs one message they can take to every meeting",
      ],
      panels: [
        {
          title: "Where they get shown",
          items: [
            { name: "Panchayat Bhawan", text: "Screenings and gram sabha meetings" },
            { name: "Anganwadi centres", text: "Health and nutrition sessions" },
            { name: "WhatsApp", text: "Shared phone to phone" },
            { name: "Field workers", text: "The same film at every visit" },
          ],
        },
      ],
    },
    {
      id: "archival-film",
      name: "Archival Film",
      short: "The whole project, on record",
      madeFor: "Your team and future funders",
      line: "Every stage of your project on film, in one archive that belongs to your organisation.",
      tags: ["Duration: Full project life, 1–5 years", "For: Your team and future funders"],
      familiar: [
        "Whoever gets the annual report each year ends up scrolling back through old WhatsApp groups for photos.",
        "Then an auditor asks for evidence from three years ago. Or the team taking the programme to a new district starts from scratch, with nothing to show them how it was done.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film and photograph each stage of the project and keep it all in one archive you can search.",
        "The archive is your organisation’s. If you have years of photos sitting on old laptops and hard drives in a cupboard, we can sort those too.",
      ],
      receive: [
        "Stage-by-stage filming and photography",
        "Sorting and labelling of the material you already have",
        "A searchable archive by project, place, date and subject",
        "A before-and-after film of the whole project",
        "The complete archive handed over when the project closes",
      ],
      example: [
        "An NGO runs a five-year watershed programme across several villages. We film it from the dry fields of the first summer to the first harvest after the check dams fill.",
        "Years later the NGO starts the same work in a new district, and the new team watches how it was done the first time. When the auditor asks for evidence, it’s there, labelled by village and date.",
      ],
      fits: [
        "Your projects run for a year or more",
        "You’ve lost photos to staff leaving, or to a hard drive that died",
        "You plan to take the work to new districts",
        "Auditors and funders ask you for photos and records",
      ],
      panels: [
        {
          title: "How the archive gets used",
          items: [
            { name: "Train new teams", text: "Show how a project was run, step by step" },
            { name: "Audits", text: "Dated photos and footage from every stage" },
            { name: "New proposals", text: "A before-and-after film to send with them" },
            {
              name: "Future films",
              text: "Footage for anniversary films and annual reports",
            },
          ],
        },
      ],
    },
    {
      id: "digital-docu-series",
      name: "Digital Docu-Series",
      short: "Regular episodes people can find online",
      madeFor: "Supporters and CSR partners",
      line: "A short documentary episode about your work every month, or every two weeks.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your team is in the villages every day, and hardly anyone outside the organisation sees it.",
        "When a CSR team is drawing up its shortlist and looks you up, they find your website and not much else.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film the everyday work of your programme as a documentary series.",
        "Each episode goes on YouTube, with shorter cuts for Instagram and LinkedIn. By the end of the year there are a dozen or more films about your work online.",
      ],
      receive: [
        "Documentary episodes, monthly or fortnightly",
        "A LinkedIn cut of every episode that opens with your key figures",
        "3 to 5 reels from every episode for Instagram",
        "Thumbnails and captions for each platform",
        "A plan for the whole series",
        "All footage saved to your archive",
      ],
      example: [
        "An NGO runs mobile health camps in tribal villages a long way from any town, and it’s barely known outside the district. Each month the episode follows the van to a different village, from the drive in to the last patient of the day.",
        "When the fundraising lead writes to a CSR head, she attaches the LinkedIn cut of the latest one.",
      ],
      fits: [
        "Very little of your work is online",
        "You want CSR teams to find you when they search",
        "You want more volunteers and supporters",
        "There’s nobody in-house to make videos",
      ],
      panels: [
        {
          title: "What goes where",
          items: [
            {
              name: "YouTube",
              text: "Full episodes, all in one place",
            },
            {
              name: "LinkedIn",
              text: "Shorter cuts that open with your key figures, for CSR heads and donors",
            },
            {
              name: "Instagram",
              text: "Reels for supporters and volunteers",
            },
          ],
        },
      ],
    },
    {
      id: "case-study",
      name: "Case Study Film",
      short: "One person’s story",
      madeFor: "Donors, and people who don’t know you yet",
      line: "The case stories from your reports, made into films. Each one follows a single person your programme worked with, over time.",
      tags: ["For: Donors, and people who don’t know you yet"],
      familiar: [
        "“5,000 women trained” is true, and it’s in every report you send. Nobody remembers it a week later.",
        "And someone who’s never heard of you will scroll straight past a number.",
      ],
      does: [
        "We follow one person over several months, at home and at work, and the film is mostly them talking about where they started and where they are now.",
      ],
      receive: [
        "A film that follows one person over time",
        "A short version for social media",
        "Reels and clips",
        "Photographs for reports and the press",
      ],
      example: [
        "An NGO’s livelihood programme trains women in tailoring. The film follows one of them, who used to do daily wage work, from her first week at the centre to the small unit she runs now. Other women from her village work there too.",
        "The NGO plays it at the start of its donor meetings, and puts it out online during its fundraising campaign.",
      ],
      fits: [
        "Your field team knows stories that never make it out of the field",
        "You want donors to meet one person the programme worked with",
        "You want to reach people who don’t know you",
        "A fundraising campaign is coming up",
      ],
      panels: [
        {
          title: "Two uses for one film",
          items: [
            {
              name: "For your donors",
              text: "They meet one person from the programme they fund",
            },
            {
              name: "For people who don’t know you",
              text: "One person’s story is easier to share than a statistic, online or with a journalist",
            },
          ],
        },
      ],
    },
  ],
  together: {
    title: "How we work with NGOs",
    text: "The plans below run from three months to a year.",
    ways: [
      {
        title: "Timed to your reports",
        text: "Plans built around your next report or proposal",
      },
      {
        title: "One trip, several films",
        text: "Footage from a single field visit goes into more than one film",
      },
      {
        title: "In the field with your team",
        text: "We go out with your field team and film the work they do",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Starter",
        text: "A first project together, or films ready in time for a campaign or a big donor meeting.",
        items: [
          "Donor Film: 1 quarterly film",
          "Case Study Film: 1 story",
          "Community Awareness Film: 1 local-language film",
          "Digital Docu-Series: 3 monthly episodes",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "Enough films that your donors hear from you every quarter, and a proper record of the project while it runs.",
        items: [
          "Donor Film: 2 quarterly films",
          "Case Study Film: 2–3 stories",
          "Community Awareness Film: up to 3 films",
          "Digital Docu-Series: 6 episodes",
          "Archival Film: archive setup and stage-by-stage filming",
        ],
      },
      {
        months: 12,
        name: "Full Partnership",
        text: "For a funded project of a year or longer, filmed from its baseline through the year.",
        items: [
          "Impact Documentary Film: baseline and progress filming",
          "Donor Film: 4 quarterly + 1 annual",
          "Case Study Film: 4–6 stories",
          "Community Awareness Film: up to 6 films",
          "Digital Docu-Series: 12 episodes",
          "Archival Film: full-year archive and film",
        ],
      },
    ],
  },
  compare: {
    title: "Compare the plans",
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
    note: "Any film not in a plan can be added, at extra cost.",
    advice: "If a year is too long to start with, take 3 or 6 months around your next report.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us about your programme",
    text: "Send us a few lines about the project, and when your next report or proposal is due. We’ll reply with the films that would suit it.",
    steps: [
      { title: "Talk", text: "You tell us about the programme and who needs to see it" },
      {
        title: "Plan",
        text: "We suggest which films to make, and when",
      },
      {
        title: "Film",
        text: "The shoot, with your field team",
      },
    ],
  },
};
