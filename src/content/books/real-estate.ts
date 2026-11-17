import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Real Estate Service Book.pdf", as the real estate world shows it */
export const REAL_ESTATE: ServiceBook = {
  theme: {
    head: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
    body: '"Manrope", ui-sans-serif, system-ui, sans-serif',
    headWeight: 700,
    fonts:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Manrope:wght@400;500;700&display=swap",
  },
  itemWord: "Film",
  cover: {
    kicker: "For developers and real estate brands",
    title: "Buyers trust what they can see.",
    text: "Seven films that follow a project from the first day of launch to the day families receive their keys.",
  },
  intro: {
    title: "A home is the biggest purchase most families ever make.",
    lead: "Yet most real estate marketing still runs on computer renders, brochures and promises. Buyers have learned to be careful.",
    text: [
      "They want to see the real site, the real progress, and the real people behind a project before they commit.",
      "Insight Lab, a non-fiction studio by Famecast, films what is real: the land, the construction, the neighbourhood, the homeowners, and the developer’s track record.",
      "These films build the one thing that sells real estate faster than anything else: trust. The same films work for commercial projects too, with the focus on tenants, investors and business owners.",
    ],
    outcomesTitle: "What these seven films do for you",
    outcomes: [
      {
        title: "Show the real place",
        text: "Land, location and neighbourhood, as they are",
        icon: "pin",
      },
      {
        title: "Prove progress",
        text: "Regular, honest updates from the site",
        icon: "building",
      },
      {
        title: "Reach remote buyers",
        text: "NRI and outstation families decide from anywhere",
        icon: "globe",
      },
      {
        title: "Prove delivery",
        text: "Homeowners and handovers become proof for the next project",
        icon: "key",
      },
    ],
  },
  research: {
    title: "Buyers worldwide now expect to see before they visit.",
    text: "Four findings shape how developers should use film today.",
    stats: [
      {
        figure: "73%",
        text: "of homeowners say they are more likely to list with an agent who uses video. Walkthroughs, neighbourhood guides, drone footage and virtual tours are now the standard types buyers look for.",
        sources: [
          {
            label: "Luxury Presence",
            href: "https://www.luxurypresence.com/blogs/the-benefits-of-video-content-on-your-real-estate-website",
          },
        ],
      },
      {
        figure: "48%",
        text: "of US REALTORS use drone photography or video in 2026. Aerial footage has become a mainstream part of property marketing.",
        sources: [
          {
            label: "Webtonic",
            href: "https://www.webtonic.io/blog/real-estate-ad-creative-statistics",
          },
        ],
      },
      {
        figure: "Every quarter",
        text: "RERA requires Indian developers to file progress reports with photographs of each building, each floor and common areas. Buyers increasingly check real progress, not renders.",
        sources: [
          { label: "TaxGuru", href: "https://taxguru.in/?p=923590" },
          { label: "Brickplot", href: "https://brickplot.com/construction-progress" },
        ],
      },
      {
        figure: "54%",
        text: "of sales in India’s top eight cities in the first half of 2026 were homes above Rs 1 crore, with NRI demand for premium homes rising again. Remote buyers rely on virtual site visits.",
        sources: [
          {
            label: "Business Standard",
            href: "https://www.business-standard.com/industry/news/gulf-turmoil-sends-nri-homebuyers-back-to-india-amid-luxury-housing-demand-126082501597_1.html",
          },
          {
            label: "Rustomjee",
            href: "https://rustomjee.com/blog/virtual-site-visit-luxury-property-india",
          },
        ],
      },
    ],
    note: "A caution: the widely repeated claim that listings with video get “403% more inquiries” has no clear original source, so we do not rely on it. The real case is simpler: buyers, especially those who cannot visit, want to see the truth before they invest.",
  },
  glance: {
    title: "Seven films at a glance",
    columns: [{ label: "What it does", key: "short" }],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the sentence closest to your need.",
    picks: [
      { line: "“We are about to launch a new project.”", service: "project-launch" },
      { line: "“Buyers often ask us about progress.”", service: "construction-progress" },
      {
        line: "“Many of our enquiries are from NRI or outstation families.”",
        service: "walkthrough",
      },
      { line: "“Buyers doubt our location.”", service: "neighbourhood-lifestyle" },
      { line: "“New buyers doubt that we will deliver.”", service: "homeowner-story" },
      { line: "“Our track record is strong but scattered.”", service: "developer-brand" },
      { line: "“Our project is nearing completion.”", service: "possession-handover" },
    ],
  },
  year: {
    kicker: "Across the project",
    title: "Films across the life of a project",
    text: "Each stage needs a different film. Footage from every stage builds toward the final journey film.",
    stages: [
      {
        name: "Before launch",
        services: ["developer-brand", "neighbourhood-lifestyle"],
        text: "Build credibility and show the location",
      },
      {
        name: "Launch",
        services: ["project-launch", "homeowner-story"],
        text: "Create early interest and trust",
      },
      {
        name: "Sales",
        services: ["walkthrough"],
        text: "Help local, outstation and NRI buyers decide",
      },
      {
        name: "Construction",
        services: ["construction-progress"],
        text: "Keep buyers confident, support RERA updates",
      },
      {
        name: "Possession",
        services: ["possession-handover"],
        text: "Prove delivery, celebrate homeowners",
      },
    ],
  },
  servicesTitle: "Seven films",
  services: [
    {
      id: "project-launch",
      name: "Project Launch Film",
      short: "Introduces the project with the real land and vision",
      line: "Introduce your project with the real land, the real location and a clear vision.",
      tags: ["Plus: Ad version"],
      familiar: [
        "Your new project is about to launch. The brochure is ready and the renders look beautiful. But every competitor’s launch looks the same: glossy renders, generic music, and the same promises of “luxury living.”",
        "Buyers scroll past because nothing feels real.",
      ],
      does: [
        "A Project Launch Film combines your vision with real footage: the actual land, the approach roads, the views from the site, the surrounding area, and the people behind the project.",
        "Renders show what the project will be. Real footage shows that it is real, and that the developer is serious.",
      ],
      receive: [
        "A launch film for events, website and sales offices",
        "A version for social media and ads",
        "Drone footage of the site, location and surroundings",
        "Interviews with the founder, architect or project head",
        "Vertical reels for Instagram and YouTube Shorts",
      ],
      example: [
        "A developer is launching a residential township on the edge of a growing city. The film opens with drone shots of the open land at sunrise, shows the new expressway five minutes away, visits the nearby school and hospital, and ends with the founder on site explaining why he chose this land.",
        "Real footage, combined with the master plan, gives buyers confidence from day one.",
      ],
      fits: [
        "You are about to launch a new project",
        "Your launch material relies only on renders",
        "You want to stand apart from competitor launches",
        "You want buyers to trust the location",
      ],
    },
    {
      id: "construction-progress",
      name: "Construction Progress Film",
      short: "Shows buyers their home is really being built",
      line: "Show buyers, every month or quarter, that their home is really being built.",
      tags: ["Frequency: Monthly or quarterly"],
      familiar: [
        "Buyers who have paid instalments keep calling: “How far has construction reached?” NRI buyers cannot visit at all, and rumours of delays spread in buyer WhatsApp groups.",
        "Your site team makes real progress every week, but nobody outside the site sees it.",
      ],
      does: [
        "A regular, honest update from the site. Drone and ground footage show each tower, floor, amenity and common area, filmed from the same angles every time so the change is clear.",
        "It keeps existing buyers confident and convinces new ones. It also fits RERA, which requires quarterly progress reports with photographs: the same shoots supply clear, dated visuals.",
      ],
      receive: [
        "Monthly or quarterly progress films",
        "Fixed-angle drone footage, tower by tower",
        "Dated photographs of buildings, floors and common areas",
        "A short message from the project head in each update",
        "Versions for WhatsApp, email, website and social media",
        "A time-lapse of the full construction journey at completion",
      ],
      example: [
        "A developer sends a two-minute progress film to all buyers every quarter. It opens with the same drone shot each time, so buyers can watch the towers rise, and the site engineer explains what was completed and what comes next.",
        "Calls to the sales team drop, NRI buyers forward the films to family, and new buyers say the updates convinced them to book.",
      ],
      fits: [
        "Your project is under construction",
        "Buyers often ask about progress",
        "You have NRI or outstation buyers",
        "You want stronger visuals for RERA updates",
      ],
      panels: [
        {
          title: "How each update is built",
          items: [
            {
              name: "Fixed-angle drone",
              text: "The same shots every time, so progress is obvious",
            },
            { name: "Ground footage", text: "Towers, floors, amenities and common areas" },
            { name: "Site voice", text: "The engineer explains what’s done and next" },
            { name: "Sent to buyers", text: "WhatsApp, email, website and social media" },
          ],
        },
      ],
      closing: "Every update is a promise kept, on camera.",
    },
    {
      id: "walkthrough",
      name: "Walkthrough & Virtual Site Visit",
      short: "Lets buyers walk through from anywhere",
      line: "Let buyers walk through the home from anywhere in the world.",
      tags: ["For: Local, outstation and NRI buyers"],
      familiar: [
        "Your sample flat is beautifully done, but only buyers who visit ever see it. NRI families in the Gulf, the US or the UK, and buyers in other cities, cannot travel just to look.",
        "Your sales team spends hours on video calls, walking around with a phone, with shaky footage and poor sound.",
      ],
      does: [
        "A calm, professionally filmed tour of the sample flat or completed unit, room by room: the layout, natural light, balcony views, finishes and fittings, exactly as they are.",
        "With a tour of the clubhouse and amenities, it becomes a complete virtual site visit that families watch at their own pace and share with each other.",
      ],
      receive: [
        "A walkthrough film for each unit type",
        "An amenities tour: clubhouse, pool, gym, gardens and play areas",
        "Real views from different floors, filmed by drone",
        "Detail shots of finishes, fittings and materials",
        "Hindi and English voice-over, and subtitles for NRI buyers",
        "Short clips for the sales team to share on WhatsApp",
      ],
      example: [
        "A developer gets many enquiries from NRI families in Dubai and Singapore. We film a walkthrough of each flat type and a tour of the amenities, and the sales team now sends a link instead of arranging live video calls.",
        "Families watch together across time zones, and serious buyers book a site visit on their next trip home, already sure of what they want.",
      ],
      fits: [
        "You have NRI or outstation enquiries",
        "Your sales team relies on live video calls",
        "Your sample flat or amenities are ready",
        "You want buyers to arrive already convinced",
      ],
    },
    {
      id: "neighbourhood-lifestyle",
      name: "Neighbourhood & Lifestyle Film",
      short: "Shows real life around the project",
      line: "People do not just buy a flat. They buy a neighbourhood and a way of life.",
      tags: ["Plus: Landmark short films"],
      familiar: [
        "Every brochure lists the same things: “5 minutes to the highway, near top schools, close to hospitals.” Buyers have read these lines so often they no longer believe them.",
        "Families from other cities have no idea what daily life in the area actually feels like.",
      ],
      does: [
        "We show real life around the project: the morning drive to the business district, children walking to school, the local market, parks, cafes, hospitals and the metro station.",
        "Distances and travel times are filmed on the road, as they really are. Buyers stop reading claims and start picturing their own life there.",
      ],
      receive: [
        "A neighbourhood film",
        "Real, filmed travel times to offices, schools, hospitals and transport",
        "Short films on individual landmarks",
        "Interviews with local residents and business owners",
        "“A day in the neighbourhood” reels",
      ],
      example: [
        "A project is in a fast-growing suburb many buyers still think is “too far.” The film follows a real 9 am commute, showing the 18-minute drive to the IT park, then visits the international school, the new mall and a weekend market.",
        "Buyers who saw it say the location felt closer and more liveable than they expected.",
      ],
      fits: [
        "Buyers doubt your location",
        "Your brochure claims sound like everyone else’s",
        "You sell to families from other cities",
        "Your area is growing fast",
      ],
    },
    {
      id: "homeowner-story",
      name: "Homeowner Story",
      short: "Real families in delivered projects",
      line: "Real families in your delivered projects, speaking in their own words.",
      tags: ["Plus: Cuts"],
      familiar: [
        "A new buyer’s biggest fear is simple: “Will this developer deliver what they promise?”",
        "Your sales team can say “yes” a hundred times, but buyers trust other buyers far more than a salesperson.",
      ],
      does: [
        "A short documentary about a real family living in one of your completed projects: why they chose you, how buying and possession went, and what life is like today.",
        "Honest, unscripted stories from real residents are the most convincing proof a developer can offer.",
      ],
      receive: [
        "Homeowner story films",
        "Cuts for social media and ads",
        "A growing library of resident stories across projects",
        "Photographs of families in their homes, with consent",
        "Documentary-style filming, never staged with actors",
      ],
      example: [
        "Before a new launch, a developer films three families from a project delivered two years ago: a young couple in their first home, a retired teacher who moved closer to her children, and an NRI family who bought without visiting.",
        "Their stories play at the launch event and on social media, and answer buyers’ biggest doubt before they ask.",
      ],
      fits: [
        "You have delivered projects with happy residents",
        "New buyers doubt delivery",
        "You are preparing a new launch",
        "You want proof, not promises",
      ],
    },
    {
      id: "developer-brand",
      name: "Developer Brand Film",
      short: "The developer’s track record and values",
      line: "Your track record, your values, and the people behind every project.",
      tags: ["Plus: 60-second version"],
      familiar: [
        "Buyers, channel partners, banks and land owners all ask the same question before working with you: “Who is this developer, and can we trust them?”",
        "Your track record is strong, but it is scattered across old brochures and a website page nobody reads.",
      ],
      does: [
        "A documentary-style story of your company: how it started, the projects you have delivered, your quality standards, your engineers and site teams, and the values that guide you.",
        "Every project you launch from then on carries the credibility of this film.",
      ],
      receive: [
        "A brand film on your journey and track record",
        "Drone and ground footage of delivered projects",
        "Interviews with the founder, leadership, engineers and partners",
        "A 60-second version for events, launches and ads",
        "Versions for channel partner meets, bank and investor presentations",
      ],
      example: [
        "A mid-sized developer has delivered twelve projects over twenty years but is little known outside its home city. Its Brand Film revisits its first building, now a well-kept community, follows its quality team on site, and features the founder on never missing a possession date.",
        "It opens every launch and helps win the trust of buyers and land owners in a new city.",
      ],
      fits: [
        "You are entering a new city or market",
        "Partners and banks ask about your record",
        "Your track record is strong but scattered",
        "You launch several projects a year",
      ],
    },
    {
      id: "possession-handover",
      name: "Possession & Handover Film",
      short: "The moment a promise becomes a home",
      line: "The moment a promise becomes a home.",
      tags: ["Plus: Full journey film"],
      familiar: [
        "Possession day is the most emotional moment in a buyer’s journey and the strongest proof of a developer’s reliability.",
        "Families receive their keys and celebrate. But the moment passes, captured only on shaky phone videos, and the developer has nothing to show future buyers.",
      ],
      does: [
        "We capture completion and the joy of families receiving their homes: the finished towers, the key handover, families stepping in, and the first days of community life.",
        "It is the final chapter of the project’s story, and the opening proof for the next one.",
      ],
      receive: [
        "A handover film",
        "Coverage of the key handover ceremony and celebrations",
        "Short films of families receiving their homes, with consent",
        "Drone footage of the completed project",
        "A full journey film, from empty land to finished homes",
      ],
      example: [
        "A developer completes a 400-home project on schedule. The film opens with the drone shot of empty land from the launch, moves through the progress updates buyers watched for three years, and ends with families receiving their keys.",
        "It becomes the centrepiece of the next launch: proof, not promise.",
      ],
      fits: [
        "Your project is nearing completion",
        "You want proof of on-time delivery",
        "You plan another launch soon",
        "You want to celebrate your homeowners",
      ],
    },
  ],
  together: {
    title: "How we work together",
    text: "A project runs for two to four years, so our contracts follow its stages, not a fixed calendar. One team films every stage from the same angles, so every film connects.",
    ways: [
      {
        title: "A single film",
        text: "Any film on its own, such as one Launch Film or one walkthrough of a sample flat.",
      },
      {
        title: "Contracts built around the project",
        text: "Launch, construction and annual options that follow how developers plan.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Launch Package",
        text: "A developer preparing a launch, covering the busiest sales period.",
        items: [
          "Brand Film: 1, if you don’t have one",
          "Neighbourhood Film: 1 with landmark cuts",
          "Launch Film: 1 with social versions",
          "Walkthroughs: every unit type + amenities",
          "Homeowner Stories: 2 from past projects",
        ],
      },
      {
        months: 12,
        name: "Construction Partnership",
        text: "A project under construction. Renewed every year until possession.",
        items: [
          "Progress Films: monthly or quarterly",
          "Dated photographs: for buyers and RERA reports",
          "Walkthrough updates: as units are ready",
          "Social content: from every site visit",
          "Final year: Handover Film and full journey film",
        ],
      },
      {
        months: 12,
        name: "Developer Annual",
        text: "A developer running several projects at once.",
        items: [
          "One contract covering all projects",
          "Launch films: every new project",
          "Progress Films: every project under construction",
          "Homeowner Stories: an ongoing library",
          "Brand Film: refreshed every year",
        ],
      },
    ],
    path: [
      { title: "Launch", text: "3-Month Launch Package" },
      { title: "Build", text: "12-Month Construction Partnership" },
      { title: "Scale", text: "Developer Annual Partnership" },
    ],
  },
  compare: {
    title: "Compare the packages",
    columns: ["Single film", "3-Month Launch", "12-Month Construction", "Developer Annual"],
    rows: [
      {
        service: "Developer Brand Film",
        cells: ["1 film", "1, if needed", "", "Refreshed yearly"],
      },
      {
        service: "Project Launch Film",
        cells: ["1 film", "1 film", "", "Every new project"],
      },
      {
        service: "Neighbourhood & Lifestyle",
        cells: ["1 film", "1 film", "", "Every new project"],
      },
      {
        service: "Walkthrough & Site Visit",
        cells: ["1 film", "Every unit type", "Updates as units are ready", "Every project"],
      },
      {
        service: "Construction Progress",
        cells: ["1 update", "", "Monthly or quarterly", "Every project under construction"],
      },
      {
        service: "Homeowner Story",
        cells: ["1 story", "2 stories", "", "Ongoing library"],
      },
      {
        service: "Possession & Handover",
        cells: ["1 film", "", "In the final year", "Every completed project"],
      },
    ],
    note: "“Not included (extra cost)” means the service is not part of that option, but you can still get it by paying separately.",
    advice:
      "Most developers start with the Launch Package, continue with the Construction Partnership through to possession, and move to a Developer Annual Partnership as they take on more projects.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Let’s show buyers what’s real.",
    text: "Tell us about your project, where it stands, and who your buyers are. We will suggest the films and contract that fit its stage.",
    steps: [
      { title: "Visit", text: "We see the site and understand the project" },
      { title: "Plan", text: "Films mapped to every stage, launch to possession" },
      { title: "Film", text: "One team, the same angles, the full story" },
    ],
  },
};
