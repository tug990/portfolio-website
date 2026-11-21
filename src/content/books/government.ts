import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Government Service Book.pdf", as the government's world shows it */
export const GOVERNMENT: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "gov-lines", research: "gov-march", talk: "gov-home" },
    services: {
      "scheme-documentary": "gov-light",
      "public-awareness-film": "gov-home",
      "beneficiary-success-story": "gov-lines",
      "departmental-documentary": "gov-march",
      "district-development-film": "gov-light",
      "documentary-series": "gov-patrol",
      "policy-explainer": "gov-home",
      "commemorative-day-film": "gov-watch",
    },
    cut: { lines: ["Let people", "see the change"], loop: "gov-light" },
    trail: [
      "gov-01",
      "gov-02",
      "gov-03",
      "gov-04",
      "gov-05",
      "gov-06",
      "gov-07",
      "gov-08",
      "gov-09",
      "gov-10",
    ],
  },
  itemWord: "Film type",
  cover: {
    kicker: "For government institutions",
    title: "We film what your department does on the ground.",
    text: "We make documentary films for government departments, district administrations and public institutions. They show the scheme on the ground as clearly as the guidelines show it on paper.",
  },
  intro: {
    title: "Good work shouldn’t end up lost in a file",
    lead: "We make documentary films of your department’s work on the ground, so senior officials, citizens and the officers who come after you can see what was done instead of only reading it in a progress report.",
    text: [
      "Think of the evening the power line is switched on in the last village on your list, and a bulb lights up in a house that has never had one. Half the village comes out to see it. An old man stands under the bulb and can’t stop smiling. A girl sits down in the doorway with her schoolbook, because now she can read after dark.",
      "A few weeks later, that evening is one line in the progress report and a tick on a slide at the review meeting. Some months after that the transfer order comes, the officers who knew the whole story move to new postings, and the file goes to the record room. Whoever takes over starts with almost nothing of what happened in that village.",
      "That’s the gap we fill. We go into the field with your staff and film the work while it’s happening, so senior officials, citizens and the officers who come after you can see it for themselves. You don’t need all eight films below. Start with the one that fits what your department needs now.",
    ],
    outcomesTitle: "What changes when your work is more than a file note",
    outcomes: [
      {
        title: "Show results",
        text: "Shows what a scheme did on the ground",
        icon: "chart",
      },
      {
        title: "Inform citizens",
        text: "Speaks to people in their own language",
        icon: "megaphone",
      },
      {
        title: "Celebrate identity",
        text: "Shows a region’s crafts and culture",
        icon: "star",
      },
      {
        title: "Keep the record",
        text: "Stays with the department after transfers",
        icon: "archive",
      },
    ],
  },
  research: {
    title: "What the research says about reaching citizens",
    text: "Before we pick up a camera, we read up on how people in India go online, what they watch and when they trust what the government tells them. These four findings shape every film we make for a department.",
    stats: [
      {
        figure: "958 million",
        text: "active internet users in India in 2025. Around 548 million of them, 57%, live in rural India.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2025",
            href: "https://yourstory.com/2026/01/indias-internet-user-base-crosses-950-million-2025-iamai-report",
          },
        ],
      },
      {
        figure: "61%",
        text: "of India’s internet users watched short videos in 2025, and there were slightly more rural viewers than urban ones.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2025",
            href: "https://www.broadcastandcablesat.co.in/?p=98208",
          },
        ],
      },
      {
        figure: "98%",
        text: "of internet users in India read or watched something in an Indian language in 2024. Among urban users, 57% prefer content in Indian languages.",
        sources: [
          {
            label: "IAMAI & Kantar, Internet in India 2024",
            href: "https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf",
          },
        ],
      },
      {
        figure: "46 countries",
        text: "studied by the OECD. Its report asks governments to base public communication on evidence, and it links citizens’ trust to whether they feel the government listens to them.",
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
    note: "Most citizens will watch a film from your department on a phone, in their own language. They trust it more when it sticks to the facts and gives people like them a voice. The eight films below are made with that in mind, so the money set aside for public awareness (the IEC budget) is spent where people will actually watch.",
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
  servicesTitle: "Eight films we make for government",
  services: [
    {
      id: "scheme-documentary",
      name: "Scheme Documentary",
      short: "Shows how a scheme reached the ground and what it changed",
      line: "The dashboard has the number and the film has the household. We film the places a scheme reached, with the figures from your progress report beside the people behind them.",
      tags: ["For: Review meetings, State and Central reporting"],
      doesTitle: "What it is",
      does: [
        "We film how a scheme or programme was carried out in the field and what changed for the people it reached.",
        "The film shows where things stood before the scheme and what the department did, with the figures on screen next to what has changed. The tone is formal and factual, because it will be shown in review meetings.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Review meetings and presentations to senior officials",
        "Progress reports to the State or Central Government",
        "The department’s website and social media, and public screenings",
        "The department’s own record of the scheme",
      ],
      receiveTitle: "What you get",
      receive: [
        "A documentary on the scheme and its results",
        "Interviews with beneficiaries, field staff and officials",
        "On-screen graphics for reach, coverage and results",
        "Drone shots of the infrastructure and the area covered",
        "Short versions for social media and presentations",
      ],
      work: [
        {
          title: "Electrification in the Pahadia Janjati area",
          text: "A NABARD project bringing electricity to a particularly vulnerable tribal community in remote hill villages",
        },
        {
          title: "Electrification of Naxal-affected villages, Bastar",
          text: "For the Government of Chhattisgarh, about power reaching villages that had lived without it for decades",
        },
        {
          title: "Subhadra Yojana",
          text: "For the Government of Odisha, about the state’s flagship scheme, which gives eligible women aged 21 to 60 Rs 50,000 over five years through direct benefit transfer",
        },
      ],
    },
    {
      id: "public-awareness-film",
      name: "Public Awareness Film",
      short: "Explains health and welfare issues to citizens",
      line: "A film in Hindi or the local language that explains a health or welfare issue and what people can do about it, told by the frontline workers they already know. Departments usually fund it from their IEC budget, the money set aside for information, education and communication.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "IEC stands for Information, Education and Communication. An IEC film explains a health, nutrition, social or welfare issue in simple words and tells people what they can do about it.",
        "We film it with people from the community and local frontline workers, in places the audience knows, so people recognise themselves on screen.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Screenings at the Panchayat Bhawan, anganwadi centres, health centres and schools",
        "Shared on WhatsApp by field workers and community groups",
        "Department campaigns and observance days",
        "Training for ASHAs, anganwadi workers and other frontline staff",
      ],
      receiveTitle: "What you get",
      receive: [
        "Awareness films in Hindi and local languages",
        "Versions for screenings and for sharing on phones",
        "Interviews with doctors, frontline workers and beneficiaries",
        "Simple graphics for the main health or welfare messages",
      ],
      work: [
        {
          title: "Anemia Mukt Jharkhand",
          text: "For the Health Department, Government of Jharkhand, on the causes, signs and prevention of anaemia",
        },
        {
          title: "The importance of breastfeeding",
          text: "For the Health Department, Government of Jharkhand, encouraging mothers and families to follow healthy feeding practices",
        },
      ],
    },
    {
      id: "beneficiary-success-story",
      name: "Beneficiary Success Story",
      short: "One citizen’s life changed by a scheme",
      line: "We follow one name from the beneficiary list and show where they started and where they are now, with every fact checked so the story holds up to a spot study.",
      tags: ["Plus: Short social media version"],
      doesTitle: "What it is",
      does: [
        "We follow one person who has benefited from a scheme, such as a farmer, a woman running her own business or a student.",
        "The film shows the help they got and how their life has changed since. People understand a scheme better when they see one person it has helped.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Encouraging other eligible people to apply",
        "The department’s social media, website and public events",
        "Presentations to senior officials and visiting delegations",
        "Media features and collections of success stories",
      ],
      receiveTitle: "What you get",
      receive: [
        "A success story film",
        "A version for social media",
        "Photographs for publications and reports",
        "Filming with the person’s informed consent and with dignity",
      ],
      work: [
        {
          title: "Agriculture Department, Government of Jharkhand",
          text: "Farmers, and what agricultural initiatives changed in their fields and incomes",
        },
      ],
    },
    {
      id: "departmental-documentary",
      name: "Departmental Documentary",
      short: "The work and achievements of one department",
      line: "We show what one department does and what has changed because of it, told by its own staff and the citizens it serves.",
      tags: ["Plus: Initiative-wise short films"],
      doesTitle: "What it is",
      does: [
        "The film covers what one department is there to do and its main initiatives. It shows the people the department serves and what has changed because of its work.",
        "It’s for anyone who needs to understand what the department does, from officials and partners to the public.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Presentations, review meetings and visits by ministers or delegations",
        "Trade fairs, tourism expos, exhibitions and investor summits",
        "The department’s website and social media, and public screenings",
        "A record of what the department has done",
      ],
      areas: [
        "Tourism",
        "Art & Culture",
        "Handloom, Handicraft & Industries",
        "Education",
        "Agriculture",
      ],
      receiveTitle: "What you get",
      receive: [
        "A departmental documentary",
        "Short films on initiatives, products or destinations",
        "Interviews with officials, artisans, farmers, teachers and citizens",
        "Drone shots and close-ups, depending on the subject",
        "Versions for exhibitions and social media",
      ],
      work: [
        { title: "ODOP: Banarasi Saree (Handloom)", text: "The weavers of Varanasi" },
        {
          title: "ODOP: Bastar Dokra (Handicraft)",
          text: "The tribal artisans of Bastar who cast metal",
        },
        {
          title: "GI tag: Mirzapur Kalin (Handicraft)",
          text: "The hand-knotted carpets of Mirzapur",
        },
        {
          title: "GI tag: Sohrai of Hazaribagh (Handicraft)",
          text: "The mural art of tribal women in Hazaribagh",
        },
        {
          title: "Agriculture Department, Jharkhand (Agriculture)",
          text: "The department’s initiatives and what they changed for farmers",
        },
      ],
    },
    {
      id: "district-development-film",
      name: "District Development Film",
      short: "A district’s progress across sectors",
      line: "We bring a district’s work on roads, health, schools and water into one film, told by the people who did it, so when postings change, the record stays.",
      tags: ["Plus: Sector-wise short films"],
      doesTitle: "What it is",
      does: [
        "We film the district administration’s work in roads, health, education, livelihoods, water and welfare.",
        "The film brings many separate initiatives into one picture of how the district is changing. The officials, frontline workers and citizens involved tell it in their own words.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Presentations to the State Government, ministers and visiting officials",
        "District events, Foundation Days and public functions",
        "Award nominations for good governance and innovation",
        "A record to hand over when officers are transferred",
      ],
      receiveTitle: "What you get",
      receive: [
        "A district development film",
        "Short films on the main initiatives in each sector",
        "Drone shots of the district and the work done there",
        "Interviews with the Deputy Commissioner, officials and citizens",
      ],
      work: [
        {
          title: "Ranchi District Administration",
          text: "Filming the district’s development initiatives",
        },
        {
          title: "Khunti District Administration",
          text: "Filming the district’s development initiatives",
        },
      ],
    },
    {
      id: "documentary-series",
      name: "Documentary Series",
      short: "Large, important stories told in episodes",
      line: "When the work is too big for one film, we tell it in episodes, each about one place, theme or community, so the story keeps going after the launch event is over.",
      tags: ["Format: 3–10 episodes"],
      doesTitle: "What it is",
      does: [
        "Some government work is too big or too important for a single film, such as a programme that runs for years across a whole region.",
        "We make it as a series. Each episode is about one theme, place or community, and together the episodes show the whole picture.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "National and state communication about major programmes",
        "YouTube, official social media and broadcast channels",
        "Public screenings, conferences and policy forums",
        "A long-term record of what changed",
      ],
      receiveTitle: "What you get",
      receive: [
        "A series of 3 to 10 episodes",
        "Filming in several locations, done safely and with care for the people involved",
        "Interviews with citizens, security personnel, teachers and officials",
        "Trailers and short cuts for each episode",
      ],
      work: [
        {
          title: "Anti-Naxal initiatives in Bastar",
          text: "How the government is bringing peace, roads and services to affected areas",
        },
        {
          title: "School re-opening in Bastar",
          text: "For the Government of Chhattisgarh, about schools returning to villages where education had stopped",
        },
      ],
    },
    {
      id: "policy-explainer",
      name: "Policy Explainer Film",
      short: "New policies explained simply",
      line: "When a new policy or reform comes in, we turn the notification into plain words, with real examples of what has changed and what people need to do now.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "When a new policy, tax reform or procedure comes in, citizens and businesses need to know what has changed and how it affects them.",
        "We explain it in plain language, with real examples and simple graphics, and people come away knowing what they need to do.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Public communication when a policy or reform is launched",
        "Reaching traders, small businesses, farmers or other groups it affects",
        "Official social media, websites and helpdesks",
        "Training officials who explain the policy on the ground",
      ],
      receiveTitle: "What you get",
      receive: [
        "Explainer films on the new policy or reform",
        "Real-life examples with citizens, traders or businesses",
        "Graphics that set out the rules, steps and benefits",
        "Versions in Hindi and regional languages",
      ],
      work: [
        {
          title: "GST 2.0",
          text: "On the reforms to the Goods and Services Tax and what they mean for citizens and businesses",
        },
      ],
    },
    {
      id: "commemorative-day-film",
      name: "Commemorative Day Film",
      short: "Honours national and state observances",
      line: "For a national or state observance, an anniversary or the legacy of a historic figure, we tell the story behind the day and film the people who still honour it.",
      tags: ["Plus: Short versions for the day"],
      doesTitle: "What it is",
      does: [
        "The film tells the history behind the day and why it still matters.",
        "We also film the communities that keep its values alive today.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Official observances, state functions and public events",
        "Screenings in schools, colleges and community spaces",
        "Official social media and broadcast on the day",
        "Cultural and historical archives",
      ],
      receiveTitle: "What you get",
      receive: [
        "A commemorative film",
        "Interviews with historians, community elders and officials",
        "Filming at historic sites and celebrations",
        "Short versions for social media on the day",
      ],
      work: [
        {
          title: "Janjatiya Gaurav Diwas",
          text: "The day that honours the contribution of tribal communities and freedom fighters, marked on the birth anniversary of Bhagwan Birsa Munda",
        },
      ],
    },
  ],
  portfolio: {
    title: "Our work for government",
    text: "We’ve made films for the Central Government, three state governments, NABARD and district administrations. Tap a project to read about that type of film.",
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
    text: "We follow your department’s own process, from the file noting to the work order, and we plan the filming around your deadlines, your approval stages and the dates that matter to you, such as a review meeting or a scheme launch. The same crew stays with the work from the first visit to the final cut, so nobody in your office has to explain the scheme twice. Every figure on screen comes from your own records and is checked with your nodal officer. You approve the film at every stage, from concept and script to the rough cut and the master. We follow the rules on what can appear in a government film, from children’s identities to the map of India, and the films stay with the work and the people it reached, never with politics.",
    waysTitle: "How departments commission us",
    ways: [
      { title: "Direct assignment", text: "The department commissions us directly" },
      { title: "Tender", text: "We bid through the department’s procurement process" },
      { title: "Empanelment", text: "Through the department’s panel of empanelled agencies" },
    ],
    expect: {
      title: "What departments can expect",
      items: [
        {
          title: "Checked with you",
          text: "We check every figure and claim with the department before it goes on screen.",
        },
        {
          title: "Approval at each stage",
          text: "We share the script, the rough cut and the final film with you for approval.",
        },
        {
          title: "A formal tone",
          text: "The films are made to be shown to ministers, in review meetings and in public.",
        },
        {
          title: "Local languages",
          text: "We make versions in Hindi and regional languages for citizens.",
        },
        {
          title: "Careful filming",
          text: "We’ve filmed in remote, tribal and conflict-affected areas, and we look after people’s safety and dignity.",
        },
        {
          title: "Full handover",
          text: "You keep all the final films and the footage, sorted, as your own record.",
        },
      ],
    },
  },
  talk: {
    kicker: "Get in touch",
    title: "Tell us about the scheme on the ground",
    text: "Write to us about the scheme, department or district you have in mind, and who needs to see the film, from the review meeting to the gram sabha. We’ll come back with the films we’d make and how we’d fit them into your process and deadlines.",
    steps: [
      {
        title: "Discuss",
        text: "A call about the scheme, the deadlines and who needs to see the film",
      },
      { title: "Approve", text: "You review the script and the plan" },
      { title: "Deliver", text: "We hand over the final films and the footage, sorted" },
    ],
  },
};
