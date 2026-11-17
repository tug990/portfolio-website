import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Government Service Book.pdf", as the government's world shows it */
export const GOVERNMENT: ServiceBook = {
  theme: {
    head: '"Literata", Georgia, ui-serif, serif',
    body: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    headWeight: 700,
    fonts:
      "https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,600;7..72,700&family=Source+Sans+3:wght@400;600;700&display=swap",
  },
  itemWord: "Film type",
  cover: {
    kicker: "For government institutions",
    title: "Good governance deserves to be seen.",
    text: "Eight types of documentary film we make for government departments, district administrations and public institutions, with examples from our own work.",
  },
  intro: {
    title: "Real change, recorded honestly.",
    lead: "Every day, departments deliver work that changes lives. Yet much of it stays inside files, review meetings and press notes.",
    text: [
      "Electricity reaches remote villages. Schools reopen in conflict-affected areas. Health campaigns fight anaemia. Farmers and artisans find new markets. Citizens rarely see this work, and the record of what was achieved is often lost when officers are transferred.",
      "Insight Lab is a non-fiction studio whose team has worked with the Central Government, the Government of Jharkhand, the Government of Chhattisgarh, the Government of Odisha, and district administrations.",
      "We film real people, real places and real change, honestly and respectfully, in a format suited to review meetings, public screenings and citizen communication.",
    ],
    outcomesTitle: "What our films do for departments",
    outcomes: [
      {
        title: "Show results",
        text: "Visual proof of what schemes achieved on the ground",
        icon: "chart",
      },
      {
        title: "Inform citizens",
        text: "Clear films in the languages people speak",
        icon: "megaphone",
      },
      {
        title: "Celebrate identity",
        text: "Crafts, culture and heritage of a region",
        icon: "star",
      },
      {
        title: "Keep the record",
        text: "A permanent record that survives transfers",
        icon: "archive",
      },
    ],
  },
  research: {
    title: "Citizens are online, in their own language, watching video.",
    text: "Four findings that shape how government work should be communicated today.",
    stats: [
      {
        figure: "958 million",
        text: "active internet users in India in 2025, and 57% of them, around 548 million, live in rural India.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2025",
            href: "https://yourstory.com/2026/01/indias-internet-user-base-crosses-950-million-2025-iamai-report",
          },
        ],
      },
      {
        figure: "61%",
        text: "of India’s internet users watched short videos in 2025, with rural users slightly outnumbering urban users. Short films travel where posters cannot.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2025",
            href: "https://www.broadcastandcablesat.co.in/?p=98208",
          },
        ],
      },
      {
        figure: "98%",
        text: "of internet users accessed content in Indian languages in 2024; 57% of urban users prefer it. Hindi and regional versions are essential.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2024",
            href: "https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf",
          },
        ],
      },
      {
        figure: "46 countries",
        text: "studied by the OECD, which calls for evidence-based public communication and links citizens’ trust to the sense that government listens to them.",
        sources: [
          {
            label: "OECD Report on Public Communication",
            href: "https://www.oecd.org/gov/open-government/public-communication-and-media.htm",
          },
          {
            label: "OECD public communication work",
            href: "https://www.oecd.org/gov/open-government/public-communication-and-media.htm",
          },
        ],
      },
    ],
    note: "What this means: the most effective government communication is factual, in local languages, and made for the phone. Scheme Documentaries, IEC films and Beneficiary Success Stories are built for exactly this.",
  },
  glance: {
    title: "Eight film types",
    columns: [{ label: "What it does", key: "short" }],
  },
  start: {
    title: "Not sure which one you need?",
    text: "Find the sentence closest to your need, and tap it.",
    picks: [
      { line: "“We need to show what our scheme achieved.”", service: "scheme-documentary" },
      { line: "“Citizens need to understand a health issue.”", service: "public-awareness-film" },
      { line: "“We want to promote our region’s crafts.”", service: "departmental-documentary" },
      { line: "“We must explain a new policy to the public.”", service: "policy-explainer" },
    ],
  },
  servicesTitle: "Eight film types",
  services: [
    {
      id: "scheme-documentary",
      name: "Scheme Documentary",
      short: "Shows how a scheme reached the ground and what it changed",
      line: "How a government scheme reached the ground, and what it changed.",
      tags: ["For: Review meetings, State and Central reporting"],
      doesTitle: "What it is",
      does: [
        "A Scheme Documentary records how a government scheme or programme was implemented on the ground and the change it brought to people’s lives.",
        "It covers the starting situation, the work done by the department, and the visible outcomes, supported by facts and figures. It is formal, factual, and built to stand up in review meetings.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Departmental review meetings and presentations to senior officials",
        "Reporting to the Central or State Government on scheme progress",
        "Official websites, social media handles and public screenings",
        "A permanent visual record of the scheme",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A documentary on the scheme and its outcomes",
        "Interviews with beneficiaries, field staff and officials",
        "Data graphics on reach, coverage and results",
        "Drone footage of infrastructure and coverage area",
        "Short versions for social media and presentations",
      ],
      work: [
        {
          title: "Electrification in the Pahadia Janjati area",
          text: "A NABARD project bringing electricity to a particularly vulnerable tribal community in remote hill villages",
        },
        {
          title: "Electrification of Naxal-affected villages, Bastar",
          text: "For the Government of Chhattisgarh: power reaching villages that lived without it for decades",
        },
        {
          title: "Subhadra Yojana",
          text: "For the Government of Odisha: the state’s flagship scheme giving eligible women aged 21 to 60 Rs 50,000 over five years through direct benefit transfer",
        },
      ],
    },
    {
      id: "public-awareness-film",
      name: "Public Awareness Film (IEC)",
      short: "Explains health and welfare issues to citizens",
      line: "Clear, local-language films that help citizens understand and act.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "An Information, Education and Communication (IEC) film explains a health, nutrition, social or welfare issue in simple language, and tells citizens what they can do.",
        "It features real community members, frontline workers and local settings, so people recognise themselves on screen.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Screenings at Panchayat Bhawans, Anganwadi centres, health centres and schools",
        "WhatsApp sharing through field workers and community groups",
        "Departmental campaigns and observance days",
        "Training ASHA, Anganwadi and other frontline workers",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "Awareness films in Hindi and local languages",
        "Versions for screenings and mobile sharing",
        "Interviews with doctors, frontline workers and beneficiaries",
        "Simple graphics for key health or welfare messages",
      ],
      work: [
        {
          title: "Anemia Mukt Jharkhand",
          text: "For the Health Department, Government of Jharkhand: the causes, signs and prevention of anaemia",
        },
        {
          title: "The importance of breastfeeding",
          text: "For the Health Department, Government of Jharkhand: encouraging mothers and families to adopt healthy feeding practices",
        },
      ],
    },
    {
      id: "beneficiary-success-story",
      name: "Beneficiary Success Story",
      short: "One citizen’s life changed by a scheme",
      line: "One citizen’s life, changed by a government initiative.",
      tags: ["Plus: Short social media version"],
      doesTitle: "What it is",
      does: [
        "A Beneficiary Success Story follows one real person, such as a farmer, a woman entrepreneur or a student, whose life improved through a government scheme.",
        "It shows their situation before, the support they received, and where they stand today. One honest story makes a scheme real in a way figures alone cannot.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Inspiring other eligible citizens to apply",
        "Departmental social media, websites and public events",
        "Presentations to senior officials and visiting delegations",
        "Media features and success-story compilations",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A success story film",
        "A version for social media",
        "Photographs for publications and reports",
        "Filming with informed consent and dignity",
      ],
      work: [
        {
          title: "Agriculture Department, Government of Jharkhand",
          text: "Farmers and the change brought by agricultural initiatives in their fields and incomes",
        },
      ],
    },
    {
      id: "departmental-documentary",
      name: "Departmental Documentary",
      short: "The work and achievements of one department",
      line: "The work, achievements and people of a government department.",
      tags: ["Plus: Initiative-wise short films"],
      doesTitle: "What it is",
      does: [
        "A Departmental Documentary presents the work of one government department: its mission, major initiatives, the people it serves, and the change it has created.",
        "It shows the public, officials and partners what the department does and why it matters.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Presentations, review meetings and visits by ministers or delegations",
        "Trade fairs, tourism expos, exhibitions and investor summits",
        "Official websites, social media and public screenings",
        "A permanent record of the department’s achievements",
      ],
      areas: [
        "Tourism",
        "Art & Culture",
        "Handloom, Handicraft & Industries",
        "Education",
        "Agriculture",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A departmental documentary",
        "Short films on initiatives, products or destinations",
        "Interviews with officials, artisans, farmers, teachers and citizens",
        "Drone and close-up filming suited to each subject",
        "Versions for exhibitions and social media",
      ],
      work: [
        { title: "ODOP: Banarasi Saree (Handloom)", text: "The weavers of Varanasi" },
        {
          title: "ODOP: Bastar Dokra (Handicraft)",
          text: "Tribal metal-casting artisans of Bastar",
        },
        {
          title: "GI tag: Mirzapur Kalin (Handicraft)",
          text: "The hand-knotted carpets of Mirzapur",
        },
        {
          title: "GI tag: Sohrai of Hazaribagh (Handicraft)",
          text: "Mural art of tribal women in Hazaribagh",
        },
        {
          title: "Agriculture Department, Jharkhand (Agriculture)",
          text: "Initiatives and their impact on farmers",
        },
      ],
    },
    {
      id: "district-development-film",
      name: "District Development Film",
      short: "A district’s progress across sectors",
      line: "The progress of a district, brought together in one film.",
      tags: ["Plus: Sector-wise short films"],
      doesTitle: "What it is",
      does: [
        "A District Development Film presents the work of a district administration across sectors: roads, health, education, livelihoods, water and welfare.",
        "It brings many initiatives into one clear picture of how the district is changing, told through officials, frontline workers and citizens.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Presentations to the State Government, ministers and visiting officials",
        "District events, Foundation Days and public functions",
        "Award nominations for good governance and innovation",
        "A handover record when officers are transferred",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A district development film",
        "Sector-wise short films on key initiatives",
        "Drone footage of the district and its works",
        "Interviews with the Deputy Commissioner, officials and citizens",
      ],
      work: [
        {
          title: "Ranchi District Administration",
          text: "Documenting the district’s development initiatives",
        },
        {
          title: "Khunti District Administration",
          text: "Documenting the district’s development initiatives",
        },
      ],
    },
    {
      id: "documentary-series",
      name: "Documentary Series",
      short: "Large, important stories told in episodes",
      line: "Long, important stories told in episodes.",
      tags: ["Format: 3–10 episodes"],
      doesTitle: "What it is",
      does: [
        "Some government efforts are too large or significant for a single film, such as restoring peace in a conflict-affected region or rebuilding public services there.",
        "A Documentary Series tells these stories across episodes, each focused on one theme, place or community, together building a complete and credible picture of change.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "National and state-level communication on major efforts",
        "YouTube, official social media and broadcast platforms",
        "Public screenings, conferences and policy forums",
        "A long-term historical record of significant change",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A series of 3 to 10 episodes",
        "Field filming across locations, done safely and sensitively",
        "Interviews with citizens, security personnel, teachers and officials",
        "Trailers and short cuts for each episode",
      ],
      work: [
        {
          title: "Anti-Naxal initiatives in Bastar",
          text: "How government efforts are bringing peace, roads and services to affected areas",
        },
        {
          title: "School re-opening in Bastar",
          text: "For the Government of Chhattisgarh: schools returning to villages where education had stopped",
        },
      ],
    },
    {
      id: "policy-explainer",
      name: "Policy Explainer Film",
      short: "New policies explained simply",
      line: "New policies and reforms, explained simply for every citizen.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "When the government introduces a new policy, tax reform or procedure, citizens and businesses need to understand what has changed and how it affects them.",
        "A Policy Explainer Film breaks it down into simple language, combining real-life examples with easy graphics, so people know exactly what to do.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Public communication at the launch of a policy or reform",
        "Outreach to traders, small businesses, farmers or specific groups",
        "Official social media, websites and helpdesks",
        "Training officials who explain the policy on the ground",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "Explainer films on the new policy or reform",
        "Real-life examples with citizens, traders or businesses",
        "Clear graphics for rules, steps and benefits",
        "Versions in Hindi and regional languages",
      ],
      work: [
        {
          title: "GST 2.0",
          text: "Explaining the reforms to the Goods and Services Tax and what they mean for citizens and businesses",
        },
      ],
    },
    {
      id: "commemorative-day-film",
      name: "Commemorative Day Film",
      short: "Honours national and state observances",
      line: "Honouring the days, people and history that matter to the nation.",
      tags: ["Plus: Short versions for the day"],
      doesTitle: "What it is",
      does: [
        "A Commemorative Day Film marks a national or state observance, an anniversary, or the legacy of a historic figure.",
        "It connects history with the present, showing why the day matters and how its values live on in communities today.",
      ],
      usesTitle: "Where it is used",
      uses: [
        "Official observances, state functions and public events",
        "Screenings in schools, colleges and community spaces",
        "Official social media and broadcast on the day",
        "Cultural and historical archives",
      ],
      receiveTitle: "What we deliver",
      receive: [
        "A commemorative film",
        "Interviews with historians, community elders and officials",
        "Filming at historic sites and celebrations",
        "Short versions for social media on the day",
      ],
      work: [
        {
          title: "Janjatiya Gaurav Diwas",
          text: "Honouring the contribution of tribal communities and freedom fighters, marked on the birth anniversary of Bhagwan Birsa Munda",
        },
      ],
    },
  ],
  portfolio: {
    title: "Our work for government",
    text: "Projects across the Central Government, three states, NABARD and district administrations. Tap a film type to see that page.",
    rows: [
      {
        project: "Electrification in the Pahadia Janjati area",
        for: "NABARD",
        service: "scheme-documentary",
      },
      {
        project: "Electrification of Naxal-affected villages, Bastar",
        for: "Government of Chhattisgarh",
        service: "scheme-documentary",
      },
      {
        project: "Subhadra Yojana",
        for: "Government of Odisha",
        service: "scheme-documentary",
      },
      {
        project: "Anemia Mukt Jharkhand",
        for: "Health Department, Government of Jharkhand",
        service: "public-awareness-film",
      },
      {
        project: "Importance of breastfeeding",
        for: "Health Department, Government of Jharkhand",
        service: "public-awareness-film",
      },
      {
        project: "Agricultural initiatives",
        for: "Agriculture Department, Government of Jharkhand",
        service: "beneficiary-success-story",
        note: "Agriculture",
      },
      {
        project: "ODOP: Banarasi Saree and Bastar Dokra",
        for: "Central Government",
        service: "departmental-documentary",
        note: "Handloom & Handicraft",
      },
      {
        project: "GI tag: Mirzapur Kalin and Sohrai of Hazaribagh",
        for: "Central Government",
        service: "departmental-documentary",
        note: "Handicraft",
      },
      {
        project: "District development",
        for: "Ranchi and Khunti District Administrations",
        service: "district-development-film",
      },
      {
        project: "Anti-Naxal initiatives, Bastar",
        for: "Government initiative",
        service: "documentary-series",
      },
      {
        project: "School re-opening, Bastar",
        for: "Government of Chhattisgarh",
        service: "documentary-series",
      },
      {
        project: "GST 2.0",
        for: "Central Government",
        service: "policy-explainer",
      },
      {
        project: "Janjatiya Gaurav Diwas",
        for: "Government initiative",
        service: "commemorative-day-film",
      },
    ],
  },
  together: {
    title: "How we work with government",
    text: "We follow each department’s own process for commissioning work, and shape every project around its requirements, timelines and approval stages.",
    waysTitle: "Ways we are commissioned",
    ways: [
      { title: "Direct assignment", text: "Commissioned by the department" },
      { title: "Tender", text: "Through the department’s procurement" },
      { title: "Empanelment", text: "As an empanelled agency" },
    ],
    expect: {
      title: "What departments can expect",
      items: [
        {
          title: "Facts first",
          text: "Every figure and claim is checked with the department before it appears on screen.",
        },
        {
          title: "Approval at each stage",
          text: "Script, rough cut and final film are shared for review.",
        },
        {
          title: "Formal, respectful tone",
          text: "Suited to review meetings, ministers and public platforms.",
        },
        {
          title: "Local languages",
          text: "Films in Hindi and regional languages for citizen reach.",
        },
        {
          title: "Sensitive filming",
          text: "Experience in remote, tribal and conflict-affected areas, with care for safety and dignity.",
        },
        {
          title: "Complete handover",
          text: "All final films and organised footage delivered as a permanent record.",
        },
      ],
    },
  },
  talk: {
    kicker: "Get in touch",
    title: "Let’s record the work that is changing lives.",
    text: "Tell us about your scheme, department or district, and the audiences you need to reach. We will suggest the right film and how we can work within your process.",
    steps: [
      { title: "Discuss", text: "The scheme, its audiences and timelines" },
      { title: "Approve", text: "Script and plan shared for review" },
      { title: "Deliver", text: "Final films and organised footage handed over" },
    ],
  },
};
