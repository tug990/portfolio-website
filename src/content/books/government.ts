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
    kicker: "For government departments and district administrations",
    title: "We film your department’s work in the field.",
    text: "We also make them for state missions and PSUs (public sector undertakings). A scheme is filmed where it is implemented, with its beneficiaries on camera and the figures from the progress report on screen.",
  },
  intro: {
    title: "What the progress report can’t show",
    lead: "We film schemes while they are being implemented, for senior officials and for citizens.",
    text: [
      "When the last hamlet on the list gets power, the district reaches saturation, and the progress report records it in one row. At the next review it is 100 per cent against the target, on one slide.",
      "The line has taken months of work, and you drive out for the switching-on. Half the village is outside when the first bulb comes on. A girl brings her schoolbook to the doorway.",
      "Then the transfer order comes. You and the officers who were there move to new postings, and the file goes to the record room. Handover notes, where they are written at all, carry the figure. Your successor will know that the hamlet was electrified, and very little else about it.",
      "We go out with your field staff while the line is being laid, and again for the switching-on. The film goes on record in the office.",
    ],
    outcomesTitle: "What departments use the films for",
    outcomes: [
      {
        title: "Reviews",
        text: "Senior officials see the scheme on the ground",
        icon: "chart",
      },
      {
        title: "In the local language",
        text: "A scheme explained to citizens in Hindi or the language of the district",
        icon: "megaphone",
      },
      {
        title: "For other districts",
        text: "Another district can see how it was done and replicate it",
        icon: "star",
      },
      {
        title: "After the transfer",
        text: "The films stay with the office when the charge changes hands",
        icon: "archive",
      },
    ],
  },
  research: {
    title: "What the research says about reaching citizens",
    text: "Four figures on how people in India watch video, and on what makes citizens trust public communication.",
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
        text: "of India’s internet users watched short videos in 2025. Rural viewers slightly outnumbered urban ones.",
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
        text: "in the OECD (Organisation for Economic Co-operation and Development) report on public communication, which links citizens’ trust in government to whether they feel the government listens to them.",
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
    note: "So a film meant for citizens should work on a phone screen, and in an Indian language.",
  },
  glance: {
    title: "Eight film types",
    columns: [{ label: "What it does", key: "short" }],
  },
  start: {
    title: "Where to start",
    text: "Tap the sentence closest to what your office needs now.",
    picks: [
      {
        line: "“I want to show the next review meeting what the scheme has done on the ground.”",
        service: "scheme-documentary",
      },
      {
        line: "“Poshan Maah starts next month, and our anganwadi workers need a film to show in the villages.”",
        service: "public-awareness-film",
      },
      {
        line: "“We want visitors at the trade fair to see how our district’s craft is made.”",
        service: "departmental-documentary",
      },
      {
        line: "“The district is sending a nomination for the Prime Minister’s Awards, and we need the work on film.”",
        service: "district-development-film",
      },
      {
        line: "“A new rule has been notified, and people keep coming to the office to ask what they have to do.”",
        service: "policy-explainer",
      },
    ],
  },
  servicesTitle: "Eight films we make for departments and districts",
  services: [
    {
      id: "scheme-documentary",
      name: "Scheme Documentary",
      short: "How a scheme was implemented in the field, and what it changed",
      line: "The figures from the progress report go on screen beside the beneficiaries and the work in the field.",
      tags: ["For: review meetings, in the state and at the Centre"],
      doesTitle: "What it is",
      does: [
        "A film of one scheme or programme and its beneficiaries.",
        "It begins with the baseline, then follows your field staff through the implementation. The tone is formal and factual. It is made to be shown at a review meeting, with senior officials or the minister in the room.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Presentations to senior officials",
        "Reviews in the state and at the Centre",
        "The department’s website and social media",
        "The department’s record of the scheme",
      ],
      receiveTitle: "What you get",
      receive: [
        "A documentary on the scheme and what it achieved",
        "Interviews with beneficiaries and field staff",
        "On-screen graphics of the figures",
        "Drone shots of the infrastructure and the area covered",
        "Short versions for social media and for the slides at a review meeting",
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
      short: "Explains a health or welfare issue to citizens",
      line: "A film in Hindi or the local language, with the ASHA (Accredited Social Health Activist) or anganwadi worker explaining what families should do.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "An IEC (information, education and communication) film on a single issue, such as anaemia, in simple words.",
        "We film it in villages of the district where it will be shown, with local people and frontline workers. The audience knows the lane on screen, and often knows the worker by name.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Screenings at the anganwadi centre and the panchayat office",
        "Forwarded on WhatsApp by field workers and community groups",
        "The department’s campaigns and observance days",
        "Training ASHAs and anganwadi workers",
      ],
      receiveTitle: "What you get",
      receive: [
        "Awareness films in Hindi and local languages",
        "Versions for screenings and for sharing on phones",
        "Interviews with doctors and frontline workers",
        "Simple graphics for the main messages",
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
      short: "One beneficiary, from where they started to where they are now",
      line: "We film one person from your beneficiary list, for the eligible families in the district who have not yet applied.",
      tags: ["Plus: Short social media version"],
      doesTitle: "What it is",
      does: [
        "The subject might be a woman from a self-help group who now runs her own business.",
        "It shows the benefit she received, and her life and work since.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Enrolment drives and camps",
        "The department’s social media and public events",
        "Presentations to senior officials and visiting delegations",
        "Media features and the department’s collection of success stories",
      ],
      receiveTitle: "What you get",
      receive: [
        "A success story film",
        "A version for social media",
        "Photographs for publications and reports",
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
      short: "What one department does, and for whom",
      line: "A film of your department’s work, with its staff and the artisans or farmers it works with on camera.",
      tags: ["Plus: Initiative-wise short films"],
      doesTitle: "What it is",
      does: [
        "For a handloom or handicraft department, it could follow one craft chosen under One District One Product (ODOP), or one with a Geographical Indication (GI) tag, in the workshop and at the trade fair.",
        "A newly posted officer can watch it in the first week, and so can an investor at a state summit.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Visits by ministers or delegations",
        "Trade fairs and investor summits",
        "The department’s website and social media",
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
        "Short films on each initiative, such as one product or one tourist destination",
        "Interviews with officials, and with artisans or farmers",
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
      short: "A district’s work across departments, in one film",
      line: "The district administration’s work, sector by sector, with frontline workers and citizens on camera.",
      tags: ["Plus: Sector-wise short films"],
      doesTitle: "What it is",
      does: [
        "In the monthly reviews the district’s work comes up one department and one scheme at a time. It is rarely seen whole.",
        "The film puts it together, sector by sector.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Presentations to the State Government and visiting officials",
        "The district’s Foundation Day and other public functions",
        "Nominations for awards such as the Prime Minister’s Awards for Excellence in Public Administration",
        "A record for the district",
      ],
      receiveTitle: "What you get",
      receive: [
        "A district development film",
        "Short films on the main initiatives in each sector",
        "Drone shots of the district and the work done there",
        "Interviews with citizens and frontline workers, and with the Deputy Commissioner or Collector on what the district set out to do",
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
      short: "A large programme, told in episodes",
      line: "A programme that runs for years, or across a whole region, filmed as a series of episodes.",
      tags: ["Format: 3–10 episodes"],
      doesTitle: "What it is",
      does: [
        "Each episode stays with one place or one community.",
        "The episodes can be released one at a time as the work moves on.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "IEC for flagship programmes, at the national and state level",
        "Official YouTube channels and broadcast",
        "National conferences and workshops",
        "A record of the programme over the years",
      ],
      receiveTitle: "What you get",
      receive: [
        "A series of 3 to 10 episodes",
        "Filming in several locations",
        "Interviews with the people the programme involves, such as security personnel or teachers",
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
      short: "A new policy or rule, explained in plain words",
      line: "We explain a newly notified policy or rule, with real examples of what people now have to do.",
      tags: ["Languages: Hindi and regional"],
      doesTitle: "What it is",
      does: [
        "A tax reform is one case, where traders need to know what is different on the day it comes into force.",
        "A trader or a farmer on screen goes through it as it applies to them, and simple graphics set out the steps.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "When a policy or reform is launched",
        "Reaching the traders or farmers it affects",
        "Official websites and helpdesks",
        "Training the officials and helpdesk staff who explain it to the public",
      ],
      receiveTitle: "What you get",
      receive: [
        "Explainer films on the new policy or reform",
        "Real-life examples with citizens or traders",
        "Graphics that set out the rules and the steps",
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
      short: "The history behind a national or state observance",
      line: "For a national or state observance, or a department’s own anniversary, we film the history behind the day, and the communities who mark it.",
      tags: ["Plus: Short versions for the day"],
      doesTitle: "What it is",
      does: [
        "A film about the people the day honours, and why the date was chosen.",
        "Elders from the communities who mark the day speak about it on camera.",
      ],
      usesTitle: "Where it’s used",
      uses: [
        "Official observances and state functions",
        "Screenings in schools",
        "Official social media and broadcast on the day",
        "Cultural and historical archives",
      ],
      receiveTitle: "What you get",
      receive: [
        "A commemorative film",
        "Interviews with historians and community elders",
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
    text: "These films were made for the Central Government and three state governments, and for the National Bank for Agriculture and Rural Development (NABARD) and two district administrations. Tap a project to read about its type of film.",
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
    title: "How we work with your department",
    text: "We film in the blocks and villages where the scheme was implemented.",
    ways: [
      {
        title: "Hard-to-reach areas",
        text: "We have filmed in remote tribal villages and in areas affected by Left Wing Extremism (LWE)",
      },
      {
        title: "Who speaks in the film",
        text: "Mostly frontline workers and beneficiaries",
      },
      {
        title: "Two audiences",
        text: "Senior officials and a gram sabha need different cuts of the same film",
      },
    ],
    expect: {
      title: "What your department receives",
      items: [
        {
          title: "Local languages",
          text: "Versions in Hindi and in the regional language of the area where the film will be shown.",
        },
        {
          title: "Short versions",
          text: "Short cuts of each film for social media and WhatsApp.",
        },
        {
          title: "Full handover",
          text: "The final films and all the footage, sorted and labelled, handed over as the department’s own record.",
        },
      ],
    },
  },
  talk: {
    kicker: "Get in touch",
    title: "Tell us about the scheme on the ground",
    text: "Write to us, or have your nodal officer write, about the scheme or the district, and the date you need the film by. It helps to know where it will be shown first, at a review meeting or in the villages.",
    steps: [
      { title: "Discussion", text: "The scheme, and who the film is for" },
      { title: "Filming", text: "While the work is under way" },
      { title: "Delivery", text: "Films and footage to your office" },
    ],
  },
};
