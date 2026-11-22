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
    kicker: "For real estate developers",
    title: "Films of your projects, from launch to possession.",
    text: "Documentary films shot on your sites, for launch week and for every lead your sales team and channel partners are following up.",
  },
  intro: {
    title: "Most of your leads see the project on a phone first",
    lead: "We shoot your projects at every stage, and your sales team and channel partners send the films to NRI and outstation leads who can’t get to site.",
    text: [
      "Monday sales review after launch weekend. The sample flat was full on Saturday and walk-ins were good. Then the leads report. A long list of NRI enquiries from Dubai and Singapore, and outstation leads, and most of them never turned into a site visit. Your channel partners say the same about theirs. All the team had to send them was a shaky phone video of the sample flat, windows a white glare, and a brochure where the same room is a render.",
      "Meanwhile, on a tower two years into construction, the ninth-floor slab is cast and the demand letters go out. By the next morning someone in the buyers’ WhatsApp group has posted that work has slowed down, and your CRM team spends the week on the phone about it. The progress is all there in your quarterly RERA photos. The WhatsApp group went by the rumour.",
      "We shoot the site, the sample flat and the roads around it properly, and keep coming back as each tower goes up. Your sales team and channel partners get films they can send to any lead, and a family in Dubai sees what the Sunday walk-ins see. On commercial projects the films go to your leasing team, with occupiers and investors on camera.",
    ],
    outcomesTitle: "What your team can show buyers",
    outcomes: [
      {
        title: "Your location",
        text: "The site and the approach roads, as they are today",
        icon: "pin",
      },
      {
        title: "Progress on site",
        text: "Each tower, floor by floor, as it goes up",
        icon: "building",
      },
      {
        title: "The flat, from anywhere",
        text: "NRI and outstation buyers walk the sample flat from home",
        icon: "globe",
      },
      {
        title: "Homes you’ve delivered",
        text: "Handover day, and the families moving in",
        icon: "key",
      },
    ],
  },
  research: {
    title: "What buyers check before they book",
    text: "Two figures from the US market, two from India.",
    stats: [
      {
        figure: "73%",
        text: "of US home sellers say they’d rather list with an agent who uses video. US buyers now expect walkthroughs, virtual tours, neighbourhood guides and drone footage.",
        sources: [
          {
            label: "Luxury Presence",
            href: "https://www.luxurypresence.com/blogs/the-benefits-of-video-content-on-your-real-estate-website",
          },
        ],
      },
      {
        figure: "48%",
        text: "of realtors in the US use drone photography or video in 2026.",
        sources: [
          {
            label: "Webtonic",
            href: "https://www.webtonic.io/blog/real-estate-ad-creative-statistics",
          },
        ],
      },
      {
        figure: "Every quarter",
        text: "your RERA progress report goes up with photographs of every tower, floor by floor, and the common areas. More buyers now check those photos before they trust a render.",
        sources: [
          { label: "TaxGuru", href: "https://taxguru.in/?p=923590" },
          { label: "Brickplot", href: "https://brickplot.com/construction-progress" },
        ],
      },
      {
        figure: "54%",
        text: "of homes sold in India’s top eight cities in the first half of 2026 were priced above Rs 1 crore. NRI demand at the top end is climbing again, and NRI and outstation buyers lean on virtual site visits.",
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
    note: "Before they pay a booking amount, buyers want to see the site and the roads to it, and NRI and outstation buyers want to do that without flying in.",
  },
  glance: {
    title: "Seven films at a glance",
    columns: [{ label: "What it does", key: "short" }],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the line that sounds most like your last sales review.",
    picks: [
      {
        line: "“Launch is a few months away and all we have is renders.”",
        service: "project-launch",
      },
      {
        line: "“Every demand letter brings a round of calls about progress.”",
        service: "construction-progress",
      },
      {
        line: "“A lot of our enquiries are NRI or outstation, and they don’t come for site visits.”",
        service: "walkthrough",
      },
      {
        line: "“Walk-ins keep saying the location is too far.”",
        service: "neighbourhood-lifestyle",
      },
      {
        line: "“Buyers ask at every site visit if we’ll deliver on time.”",
        service: "homeowner-story",
      },
      {
        line: "“Our next launch is in a new city.”",
        service: "developer-brand",
      },
      { line: "“Possession is coming up on one of our projects.”", service: "possession-handover" },
    ],
  },
  year: {
    kicker: "Across the project",
    title: "What each stage needs",
    text: "Before launch, the job is selling the location. Two years in, buyers want to see slabs going up. At possession, the footage from every stage is cut into one film of the project.",
    stages: [
      {
        name: "Before launch",
        services: ["developer-brand", "neighbourhood-lifestyle"],
        text: "Your company and the area, in front of channel partners and buyers before the price list is out",
      },
      {
        name: "Launch",
        services: ["project-launch", "homeowner-story"],
        text: "The site at launch, and families from your delivered projects on camera",
      },
      {
        name: "Sales",
        services: ["walkthrough"],
        text: "A walkthrough your sales team and channel partners send to buyers before the site visit",
      },
      {
        name: "Construction",
        services: ["construction-progress"],
        text: "Buyers watch the building go up, slab by slab",
      },
      {
        name: "Possession",
        services: ["possession-handover"],
        text: "Families getting their keys, and the finished towers",
      },
    ],
  },
  servicesTitle: "Seven films we make for developers",
  services: [
    {
      id: "project-launch",
      name: "Project Launch Film",
      short: "The site as it is today, for launch week",
      line: "Your site, with your founder or project head on camera, for launch week.",
      tags: ["Plus: Ad version"],
      familiar: [
        "Launch date is fixed, the brochure is printed, and every other launch in the city this quarter has the same glossy render film over stock music.",
        "Buyers and channel partners have seen that film many times over, and they scroll straight past it.",
      ],
      does: [
        "We shoot the plot as it stands today, from the approach road in, and cut that footage in with your master plan. One of your people speaks on camera, usually the founder or the project head, sometimes the architect.",
      ],
      receive: [
        "The launch film, for the event and for your website and sales gallery after it",
        "A shorter cut for social media and ads",
        "Drone footage of the land and what’s around it",
        "Interviews with your founder, and with the architect or project head",
        "Vertical reels for Instagram and YouTube Shorts",
      ],
      example: [
        "A township launch on the edge of a growing city. The film opens on a drone shot of the open land, then drives out to the new expressway, past the school and the hospital. It ends on the founder standing on the plot, saying why the company bought this land.",
        "At the launch event it plays next to the master plan, and it stays on in the sales gallery after. Channel partners forward the short cut to their buyers.",
      ],
      fits: [
        "Your launch is in the next few months",
        "You have nothing from the site itself yet",
        "Other projects in your city are launching the same quarter",
      ],
    },
    {
      id: "construction-progress",
      name: "Construction Progress Film",
      short: "Films from site, every month or quarter",
      line: "A short film from each site every month or quarter. Buyers watch their tower go up a floor at a time.",
      tags: ["Frequency: Monthly or quarterly"],
      familiar: [
        "A slab gets cast, the demand letter goes out, and buyers call to ask if it’s really done. NRI buyers can’t come and check.",
        "Your site team gets work done every week that nobody outside the gate sees.",
      ],
      does: [
        "We film every tower from fixed camera positions, by drone and on the ground, and go inside to the floors and common areas. The amenities get filmed as they come up.",
        "Your CRM team sends it with the demand letter, and sales uses it with buyers who haven’t booked yet. The same shoots give you dated photographs for your quarterly RERA report.",
      ],
      receive: [
        "Progress films, monthly or quarterly",
        "Drone footage from fixed positions, tower by tower",
        "Dated photographs of every floor and the common areas",
        "A few words from the site engineer in each update",
        "Versions for WhatsApp, email, your website and social pages",
        "A time-lapse of the whole build once it’s finished",
      ],
      example: [
        "Each buyer gets a two-minute film from site with the demand letter for each stage. It opens on the same drone angle every time, and the towers are a little higher in each one. Then the site engineer says what got finished and what’s next.",
        "Sales plays the same films to people still deciding. NRI buyers forward them to family back in India.",
      ],
      fits: [
        "Your project is under construction",
        "Buyers call about progress after each demand letter",
        "You have NRI or outstation buyers",
      ],
      panels: [
        {
          title: "How each update is built",
          items: [
            {
              name: "Fixed-angle drone",
              text: "The change since the last update is easy to spot",
            },
            { name: "Ground footage", text: "Inside each tower, and the amenities" },
            { name: "The site engineer", text: "Says what’s done and what’s next" },
            {
              name: "Sent to buyers",
              text: "With each demand letter, on WhatsApp and email",
            },
          ],
        },
      ],
    },
    {
      id: "walkthrough",
      name: "Walkthrough & Virtual Site Visit",
      short: "The sample flat, for buyers who can’t visit",
      line: "Your sample flat and amenities, filmed room by room. Your sales team and channel partners send it to any buyer who can’t make it to site.",
      tags: ["For: Local, outstation and NRI buyers"],
      familiar: [
        "Plenty of your enquiries are NRI (Gulf, US, UK) or outstation. Nobody flies in just to see a sample flat.",
        "So the sales team does after-hours video calls, walking the flat with a phone, the picture shaking, the sound dropping in the bedroom.",
      ],
      does: [
        "We film the sample flat, or a finished unit, in the daylight it gets, with the view from the balcony. Finishes and fittings get their own close shots.",
        "Add a tour of the clubhouse and amenities, and a family gets through most of a site visit from home, then forwards it to the relatives who have a say.",
      ],
      receive: [
        "A walkthrough film for each unit type",
        "A tour of the clubhouse and every amenity around it",
        "The view from different floors, filmed by drone",
        "Close shots of the fittings and materials",
        "Hindi and English voice-over, with subtitles",
        "Short clips to forward on WhatsApp",
      ],
      example: [
        "A developer gets a lot of its enquiries from NRI families in Dubai and Singapore. We film a walkthrough of each unit type and an amenities tour. The sales team sends a link instead of setting up a video call.",
        "A buyer in Dubai and his parents back home watch the same film when it suits them. The next call with sales starts from the flat they’ve already seen.",
      ],
      fits: [
        "A lot of your enquiries are NRI or outstation",
        "Your sales team relies on live video calls",
        "Your sample flat or amenities are ready",
      ],
    },
    {
      id: "neighbourhood-lifestyle",
      name: "Neighbourhood & Lifestyle Film",
      short: "An ordinary day around the project",
      line: "An ordinary weekday around your project, with the school drop and the office commute driven and timed on screen.",
      tags: ["Plus: Landmark short films"],
      familiar: [
        "“Too far.” Your sales team hears it from walk-ins every weekend. Every brochure in the market says “5 minutes to the highway, near top schools”, and buyers stopped reading those lines a long time ago.",
        "A family relocating from another city has no idea what a Tuesday morning there looks like.",
      ],
      does: [
        "We film a weekday in the area. The morning drive to the IT park, the school drop, the nearest hospital, the metro station, the market in the evening.",
      ],
      receive: [
        "A neighbourhood film",
        "Timed drives to the places buyers ask about, filmed on the road",
        "Short films on nearby landmarks",
        "Interviews with local residents and shop owners",
        "“A day in the neighbourhood” reels",
      ],
      example: [
        "The project is in a fast-growing suburb, and walk-ins still call it “too far”. The film does the 9 am drive to the IT park with the clock running on screen. After that it visits the international school and the new mall, and ends at the weekend market.",
        "It runs in the sales gallery, and goes out to every buyer who brought up the distance.",
      ],
      fits: [
        "Buyers or channel partners doubt your location",
        "Your brochure lines sound like everyone else’s",
        "You sell to families from other cities",
        "Your area is growing fast",
      ],
    },
    {
      id: "homeowner-story",
      name: "Homeowner Story",
      short: "Families from your delivered projects, on camera",
      line: "A family who took possession in one of your earlier projects tells new buyers what buying from you was like.",
      tags: ["Plus: Short versions"],
      familiar: [
        "“Will you hand over on time, and will it look like the brochure?” Your sales team gets asked this at nearly every site visit.",
        "The salesperson says yes. Buyers would sooner hear it from someone who already lives in one of your buildings.",
      ],
      does: [
        "We film families living in one of your completed projects. They talk about why they picked you and how it went from booking to possession, and we film them at home.",
        "New buyers hear about you from people who stood in the same sales gallery a few years ago.",
      ],
      receive: [
        "Homeowner story films",
        "Short cuts for social media and ads",
        "More resident stories with each project you hand over",
        "Photographs of families in their homes",
      ],
      example: [
        "Ahead of a new launch, a developer has us film families from a project handed over two years earlier. A young couple in their first home. An NRI family who booked without ever seeing the site.",
        "Both films play at the launch event and go out on social media.",
      ],
      fits: [
        "Families in your delivered projects are happy to speak",
        "New buyers doubt you’ll deliver",
        "You have a new launch coming",
      ],
    },
    {
      id: "developer-brand",
      name: "Developer Brand Film",
      short: "Your company’s track record, on film",
      line: "A documentary on your company and what it has delivered. It opens launches and channel partner meets.",
      tags: ["Plus: 60-second version"],
      familiar: [
        "First launch in a new city, and nobody there knows your name. Channel partners want to know you deliver before they push your project. So do the banks and the landowners.",
        "Your record is good. It’s also scattered across old brochures and the About us page.",
      ],
      does: [
        "We go back to the company’s first project and through the ones it has handed over since. We follow a quality check on site and film the engineers and site teams who do the work.",
        "It can open every launch and NRI roadshow you do, and it’s the link you send when a channel partner or a bank asks who you are.",
      ],
      receive: [
        "A brand film on your company and its track record",
        "Drone and ground footage of delivered projects",
        "Interviews with your founder and leadership, and with engineers and partners",
        "A 60-second cut for launches and ads",
        "Versions for channel partner meets, and for bank and investor presentations",
      ],
      example: [
        "Strong record in its home city, first launch in a new one. The film goes back to the company’s first building, still well kept, and follows the quality team round a live site. The founder talks through the checks they just ran.",
        "It opens the launch there. The local team uses it at channel partner meets and in meetings with landowners.",
      ],
      fits: [
        "You are entering a new city or market",
        "Channel partners and banks ask about your record",
        "Your track record is strong but scattered",
        "You launch several projects a year",
      ],
    },
    {
      id: "possession-handover",
      name: "Possession & Handover Film",
      short: "Handover day, on film",
      line: "Possession day on film, with the key handover and families walking in for the first time.",
      tags: ["Plus: Film of the whole project"],
      familiar: [
        "Possession is the day your buyers have counted down to since booking, and proof that you deliver.",
        "Keys get handed over and families celebrate. A month later, what marketing has from the day is a few shaky phone videos.",
      ],
      does: [
        "We film the finished towers and the key handover, then families opening their front doors for the first time. We come back in the first weeks to film people living there.",
        "It can open your next launch.",
      ],
      receive: [
        "A handover film",
        "Coverage of the key handover and the celebrations",
        "Short films of families getting their keys",
        "Drone footage of the completed project",
        "A film of the whole project, from empty land to finished homes",
      ],
      example: [
        "Handover on a large housing project. The film opens on the drone shot of the empty land taken at launch, then moves through the progress updates buyers watched during construction. It ends on families getting their keys.",
        "The developer plays it at the launch of its next project.",
      ],
      fits: [
        "Your project is close to possession",
        "Buyers on your other projects ask about delivery dates",
        "Another launch is coming soon",
        "You want to mark the day for your homeowners",
      ],
    },
  ],
  together: {
    title: "How we work with developers",
    text: "We come back to your site at every stage and shoot from the same spots each time.",
    ways: [
      {
        title: "A single film",
        text: "Any one film on its own, say a launch film or a sample flat walkthrough.",
      },
      {
        title: "Films that follow the project",
        text: "One project, start to finish, or several running at once.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Launch Package",
        text: "For a project about to launch. Runs from pre-launch through launch and the first months of sales.",
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
        text: "For a project under construction, a year at a time until possession.",
        items: [
          "Progress Films: monthly or quarterly",
          "Dated photographs: for buyers and RERA reports",
          "Walkthrough updates: as units are ready",
          "Social content: from every shoot",
          "Final year: Handover Film and a film of the whole project",
        ],
      },
      {
        months: 12,
        name: "Developer Annual",
        text: "For developers with several projects live at once, in one city or across a few.",
        items: [
          "Every live project covered",
          "Launch films: every new project",
          "Progress Films: every project under construction",
          "Homeowner Stories: more with each handover",
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
    note: "Anything marked “Not included” can be added separately.",
    advice:
      "One project: Launch Package, then Construction Partnership till possession. Several projects live: Developer Annual.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us where your projects stand",
    text: "Tell us which projects are launching and which are under construction, and where the enquiries are coming from. We’ll say which film fits each one.",
    steps: [
      { title: "Visit", text: "We come to site and walk the project with your team" },
      { title: "Plan", text: "A film for each stage, from launch week to handover" },
      { title: "Film", text: "We shoot each stage as the project reaches it" },
    ],
  },
};
