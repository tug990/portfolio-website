import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - Real Estate Service Book.pdf", as the real estate world shows it */
export const REAL_ESTATE: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "re-hills", research: "re-woods", talk: "re-valley" },
    services: {
      "project-launch": "re-hills",
      "construction-progress": "re-stream",
      walkthrough: "re-woods",
      "neighbourhood-lifestyle": "re-valley",
      "homeowner-story": "re-forest",
      "developer-brand": "re-hills",
      "possession-handover": "re-stream",
    },
    cut: { lines: ["Show buyers", "what’s real"], loop: "re-valley" },
    trail: ["re-01", "re-02", "re-03", "re-04", "re-05", "re-06", "re-07"],
  },
  itemWord: "Film",
  cover: {
    kicker: "For developers and real estate brands",
    title: "We film your project from launch to possession.",
    text: "Documentary films for developers and real estate brands, made at your site and in the streets around it, with your site team and the families who buy from you.",
  },
  intro: {
    title: "Buyers can’t book what they can’t see",
    lead: "We make documentary films of your project, from the empty plot to possession day, so buyers can see the real site, the real flat and the real progress before they book.",
    text: [
      "Think of an NRI family in Dubai at midnight, round a laptop, watching a video of your sample flat that your sales team sent on WhatsApp. It was shot on a phone while walking round. It swings from the kitchen to the balcony too fast to see either, the windows are too bright to show the view, and the air conditioner is louder than the salesperson. Then they open the brochure, where the same room is a render that looks nothing like the video.",
      "The next morning a cousin forwards a message from the buyers’ WhatsApp group saying work has slowed down, even though your site team cast the ninth-floor slab that same week. Nobody outside the site saw it happen. The family likes the project, but they won’t book a home they’ve only seen in pieces, and by their next trip home your warm lead has gone cold.",
      "That’s the gap we fill. We film your sample flat, your site and the streets around it with steady cameras and clear sound, and we keep coming back as the building goes up, so a family in Dubai sees as much of your project as the buyers who drive over on a Sunday. For commercial projects we make the same films, with tenants, investors and business owners on camera. You don’t need all seven films below. Start with the one that fits where your project is today.",
    ],
    outcomesTitle: "What changes when buyers can see what you’re building",
    outcomes: [
      {
        title: "Show the real place",
        text: "The site and the area around it, filmed as they are",
        icon: "pin",
      },
      {
        title: "Prove progress",
        text: "Updates from the site every month or quarter",
        icon: "building",
      },
      {
        title: "Reach remote buyers",
        text: "NRI and outstation buyers see the flat without travelling",
        icon: "globe",
      },
      {
        title: "Prove delivery",
        text: "Finished homes and handovers to show at your next launch",
        icon: "key",
      },
    ],
  },
  research: {
    title: "The ground truth about buyers",
    text: "Before we film a project, we look at how people buy homes now and what they want to see before they pay. These four findings shape every film we make for developers.",
    stats: [
      {
        figure: "73%",
        text: "of homeowners say they’re more likely to list with an agent who uses video. Walkthroughs, neighbourhood guides, drone footage and virtual tours are the kinds of video buyers now look for.",
        sources: [
          {
            label: "Luxury Presence",
            href: "https://www.luxurypresence.com/blogs/the-benefits-of-video-content-on-your-real-estate-website",
          },
        ],
      },
      {
        figure: "48%",
        text: "of US REALTORS use drone photography or video in 2026. Aerial shots are now a normal part of selling property.",
        sources: [
          {
            label: "Webtonic",
            href: "https://www.webtonic.io/blog/real-estate-ad-creative-statistics",
          },
        ],
      },
      {
        figure: "Every quarter",
        text: "Indian developers have to file a progress report under RERA, with photographs of each building, each floor and the common areas. More buyers now check the real progress instead of going by the renders.",
        sources: [
          { label: "TaxGuru", href: "https://taxguru.in/?p=923590" },
          { label: "Brickplot", href: "https://brickplot.com/construction-progress" },
        ],
      },
      {
        figure: "54%",
        text: "of sales in India’s top eight cities in the first half of 2026 were homes priced above Rs 1 crore. NRI demand for premium homes is rising again, and buyers who live far away rely on virtual site visits.",
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
    note: "Buyers want to see the actual site, the building going up and the area around it before they put money in, and the ones who live far away need to see all of it without travelling. The seven films below are made for that. You may also have seen the claim that listings with video get “403% more inquiries”, but we couldn’t find where that number comes from, so we don’t use it.",
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
    title: "From bhoomi pujan to possession",
    text: "Each stage of a project needs something different on film. We keep everything we shoot along the way, and at possession it goes into one film of the whole project, from empty land to finished homes.",
    stages: [
      {
        name: "Before launch",
        services: ["developer-brand", "neighbourhood-lifestyle"],
        text: "Tell people who you are, and show them the area where you’re building",
      },
      {
        name: "Launch",
        services: ["project-launch", "homeowner-story"],
        text: "Show buyers the actual land, and let families from your earlier projects speak for you",
      },
      {
        name: "Sales",
        services: ["walkthrough"],
        text: "Let buyers walk through the flat from wherever they live, before they visit",
      },
      {
        name: "Construction",
        services: ["construction-progress"],
        text: "Show buyers the building going up, and use the same shoots for your RERA reports",
      },
      {
        name: "Possession",
        services: ["possession-handover"],
        text: "Film families getting their keys, and show it at your next launch",
      },
    ],
  },
  servicesTitle: "Seven films we make for developers",
  services: [
    {
      id: "project-launch",
      name: "Project Launch Film",
      short: "Introduces the project with the real land and vision",
      line: "We film the plot itself, the approach road and the people behind the project, so your launch shows buyers the land your renders stand on.",
      tags: ["Plus: Ad version"],
      familiar: [
        "Your launch is close, and the brochure and renders are ready. But every other launch in the city looks much the same, with glossy renders, stock music and a promise of “luxury living”.",
        "Buyers scroll past because they’ve seen it before.",
      ],
      does: [
        "We film the actual land, the approach road, the view from the site and the area around it, and put that footage next to your master plan and renders. The people behind the project speak on camera too.",
        "Renders show buyers what you plan to build, and the footage shows them the land and the people who will build on it.",
      ],
      receive: [
        "A launch film for events, your website and the sales office",
        "A shorter version for social media and ads",
        "Drone footage of the site and the area around it",
        "Interviews with the founder, architect or project head",
        "Vertical reels for Instagram and YouTube Shorts",
        "Your RERA registration number and QR code on every version, where your state asks for it",
      ],
      example: [
        "A developer is launching a township on the edge of a growing city. The film opens on the open land at sunrise, shot from a drone. It shows the new expressway five minutes away and the school and hospital nearby, and it ends with the founder on the site, talking about why they chose this land.",
        "The film plays at the launch event and in the sales office next to the master plan, so buyers see the plan and the land together.",
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
      line: "A short update from the site every month or quarter, filmed from the same spots each time, so buyers watch their tower go up slab by slab.",
      tags: ["Frequency: Monthly or quarterly"],
      familiar: [
        "Buyers who are paying instalments keep calling your sales team to ask how far construction has got. NRI buyers can’t come and see for themselves, and talk of delays spreads quickly in the buyers’ WhatsApp groups.",
        "Your site team gets work done every week, but nobody outside the site sees it.",
      ],
      does: [
        "We film each tower, the floors, the amenities and the common areas, from a drone and on the ground. We use the same camera positions every time, so buyers can see what has changed since the last update.",
        "Buyers who have booked can watch their home going up, and people who are still deciding can see the work is moving. RERA asks for a progress report with photographs every quarter, and the same shoots give you dated photographs for it.",
      ],
      receive: [
        "Monthly or quarterly progress films",
        "Drone footage from the same positions each time, tower by tower",
        "Dated photographs of buildings, floors and common areas",
        "A short message from the project head in each update",
        "Versions for WhatsApp, email, website and social media",
        "A time-lapse of the whole build once it’s finished",
      ],
      example: [
        "A developer sends every buyer a two-minute film from the site each quarter. It always opens on the same drone shot, so buyers can watch the towers get taller from one film to the next, and the site engineer says what was finished and what comes next.",
        "The sales team gets fewer calls about progress. NRI buyers send the films on to family back home, and some new buyers book after watching them.",
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
      line: "A steady, room-by-room tour of the sample flat and the amenities, so a family abroad can see the layout and the view from the balcony without booking a flight.",
      tags: ["For: Local, outstation and NRI buyers"],
      familiar: [
        "Your sample flat is well done, but only the people who visit ever see it. NRI families in the Gulf, the US or the UK can’t fly in just to look, and neither can buyers in other cities.",
        "Your sales team ends up spending hours on video calls, walking round the flat with a phone while the picture shakes and the sound cuts out.",
      ],
      does: [
        "We film the sample flat or a finished unit room by room, with a steady camera. Buyers see the layout, how much daylight comes in, the view from the balcony, and the finishes and fittings as they actually are.",
        "With a tour of the clubhouse and amenities added, a family can do the whole site visit at home, in their own time, and send it on to relatives.",
      ],
      receive: [
        "A walkthrough film for each unit type",
        "An amenities tour: clubhouse, pool, gym, gardens and play areas",
        "The view from different floors, filmed by drone",
        "Detail shots of finishes, fittings and materials",
        "Hindi and English voice-over, and subtitles for NRI buyers",
        "Short clips your sales team and channel partners can forward on WhatsApp",
      ],
      example: [
        "A developer gets a lot of enquiries from NRI families in Dubai and Singapore. We film a walkthrough of each flat type and a tour of the amenities, and the sales team sends a link instead of setting up live video calls.",
        "Family members watch it in different time zones. The buyers who are serious book a site visit for their next trip home, and they already know which flat they want.",
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
      line: "An ordinary weekday around your project, with the school run and the drive to work filmed on the real roads, so buyers don’t have to take the brochure’s word for the location.",
      tags: ["Plus: Landmark short films"],
      familiar: [
        "Every brochure has the same lines: “5 minutes to the highway, near top schools, close to hospitals.” Buyers have read them so often that they don’t believe them any more.",
        "A family moving from another city has no way of knowing what an ordinary day in the area is like.",
      ],
      does: [
        "We film the area around the project on an ordinary day. That means the morning drive to the business district, children walking to school, the market, the parks and cafes, the hospital and the metro station.",
        "We time the drives on the actual roads and film them, so buyers can see how long they take. It’s easier for a family to picture living somewhere once they’ve seen the streets.",
      ],
      receive: [
        "A neighbourhood film",
        "Travel times to offices, schools, hospitals and transport, filmed on the road",
        "Short films on nearby landmarks",
        "Interviews with local residents and business owners",
        "“A day in the neighbourhood” reels",
      ],
      example: [
        "A project is in a suburb that’s growing fast, but many buyers still think it’s “too far”. The film follows a 9 am drive to the IT park, which takes 18 minutes, and then goes to the international school, the new mall and the weekend market.",
        "Buyers who watch it find the area closer and easier to live in than they had thought.",
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
      line: "A family who took possession in one of your earlier projects tells new buyers, in their own words, what it was like to buy from you.",
      tags: ["Plus: Cuts"],
      familiar: [
        "What worries new buyers most is whether you’ll actually deliver what you’ve promised.",
        "Your sales team can tell them you will, but buyers believe other buyers more than they believe a salesperson.",
      ],
      does: [
        "We film a family who live in one of your completed projects. They talk about why they chose you, how buying and possession went, and what it’s like living there now.",
        "Nothing is scripted and there are no actors. New buyers hear about you from people who were in their place a few years ago.",
      ],
      receive: [
        "Homeowner story films",
        "Cuts for social media and ads",
        "A library of resident stories that grows with each project",
        "Photographs of families in their homes, with consent",
        "Filmed as a documentary, with no actors",
      ],
      example: [
        "Before a new launch, a developer asks us to film three families from a project handed over two years ago. One is a young couple in their first home, one is a retired teacher who moved to be near her children, and one is an NRI family who bought without seeing the site.",
        "The films play at the launch event and on social media, so new buyers hear about delivery from people who have already moved in.",
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
      line: "A documentary about your company and the buildings it has delivered, to open every launch and channel partner meet with.",
      tags: ["Plus: 60-second version"],
      familiar: [
        "Before they work with you, buyers, channel partners, banks and land owners all want to know who you are and whether they can trust you.",
        "You have a good track record, but it’s spread across old brochures and a page on your website that nobody reads.",
      ],
      does: [
        "We make a documentary about your company. It covers how you started, the projects you’ve delivered, how you check quality, your engineers and site teams, and the values you work by.",
        "After that you can open every launch with it, and send it to anyone who wants to know who you are.",
      ],
      receive: [
        "A brand film about your company and its track record",
        "Drone and ground footage of delivered projects",
        "Interviews with the founder, leadership, engineers and partners",
        "A 60-second version for events, launches and ads",
        "Versions for channel partner meets, bank and investor presentations",
      ],
      example: [
        "A mid-sized developer has delivered twelve projects in twenty years but isn’t well known outside its home city. The film goes back to its first building, which is still well kept, follows the quality team around a site, and has the founder talking about how the company has never missed a possession date.",
        "It plays at the start of every launch, and the company uses it when it meets buyers and land owners in a new city.",
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
      line: "Possession day on film, from the key handover to families walking into their homes for the first time, so your next launch opens with proof that you deliver.",
      tags: ["Plus: Full journey film"],
      familiar: [
        "Possession day matters more to buyers than any other day of the purchase, and it’s the best proof you have that you deliver.",
        "Families get their keys and celebrate, and afterwards all that’s left is a few shaky phone videos. You have nothing to show the next set of buyers.",
      ],
      does: [
        "We film the finished towers, the key handover, families walking into their homes for the first time, and the first weeks of people living there.",
        "You can show it at your next launch as proof that you finished this one.",
      ],
      receive: [
        "A handover film",
        "Coverage of the key handover ceremony and celebrations",
        "Short films of families getting their keys, with consent",
        "Drone footage of the completed project",
        "A film of the whole project, from empty land to finished homes",
      ],
      example: [
        "A developer finishes a 400-home project on schedule. The film opens on the drone shot of the empty land taken at the launch, goes through the progress updates buyers watched for three years, and ends with families getting their keys.",
        "The developer plays it at the launch of its next project.",
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
    title: "How we work with developers",
    text: "A project takes two to four years to build, so our contracts follow it from launch to possession rather than following the calendar. The same crew comes back to your site at each stage and films from the same spots, so the films fit together and buyers can see the same place change from one to the next.",
    ways: [
      {
        title: "A single film",
        text: "Any one of the films on its own, for example a launch film or a walkthrough of the sample flat.",
      },
      {
        title: "Contracts that follow the project",
        text: "There’s one for the launch, one that runs through construction and one for developers with several projects.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Launch Package",
        text: "For a developer getting ready to launch, through the busiest months for sales.",
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
        text: "For a project under construction. We renew it every year until possession.",
        items: [
          "Progress Films: monthly or quarterly",
          "Dated photographs: for buyers and RERA reports",
          "Walkthrough updates: as units are ready",
          "Social content: from every site visit",
          "Final year: Handover Film and a film of the whole project",
        ],
      },
      {
        months: 12,
        name: "Developer Annual",
        text: "For a developer with several projects going at once.",
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
      { title: "More projects", text: "Developer Annual Partnership" },
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
    note: "“Not included (extra cost)” means that film isn’t part of that option, but you can still get it by paying separately.",
    advice:
      "Most developers start with the Launch Package and stay on the Construction Partnership until possession. When they have several projects going at once, they move to the Developer Annual Partnership.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us where your project stands",
    text: "Tell us what stage your project is at and who’s booking, whether that’s families from across town or NRI enquiries from the Gulf. We’ll come back with the films we’d make at each stage and the contract that fits.",
    steps: [
      { title: "Visit", text: "We come to the site and go through the project with you" },
      { title: "Plan", text: "We suggest which films to make at each stage" },
      { title: "Film", text: "The same team films every stage, from the same angles" },
    ],
  },
};
