import type { ServiceBook } from "@/content/service-books";

/*
  The educational institution's Service Book: schools, colleges, universities and every place of
  learning. Adapted from "Insight Lab - University Service Book.pdf" to take in schools too (its
  research findings are the book's, as sourced); as the world shows it.
*/
export const EDUCATION: ServiceBook = {
  // told as a film: the shots from our films it's cut with
  reel: {
    loops: { intro: "edu-class", research: "edu-chores", talk: "edu-morning" },
    services: {
      "campus-film": "edu-walk",
      "student-life": "edu-ready",
      "programme-spotlight": "edu-class",
      "research-film": "edu-chores",
      "alumni-story": "edu-siblings",
      "event-coverage": "edu-yard",
      "campus-archive": "edu-morning",
      "digital-presence": "edu-ready",
    },
    cut: { lines: ["Let students", "see the place"], loop: "edu-walk" },
    trail: [
      "edu-01",
      "edu-02",
      "edu-03",
      "edu-04",
      "edu-05",
      "edu-06",
      "edu-07",
      "edu-08",
      "edu-09",
      "edu-10",
      "edu-11",
      "edu-12",
      "edu-13",
      "edu-14",
      "edu-15",
      "edu-16",
      "edu-17",
      "edu-18",
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For educational institutions",
    title: "Show students what it’s like to study with you.",
    text: "We make documentary films for schools, colleges and universities, in your classrooms and labs, with the students and teachers who spend their days there.",
  },
  intro: {
    title: "Most families never make it to your open house",
    lead: "We make documentary films of your school, college or university with your own students and teachers, so families can see what it’s really like to study with you before they apply.",
    text: [
      "Think of your last open house. A chemistry teacher let a parent try the experiment her class did that morning. A boy who hardly speaks in class explained the robot his club built to anyone who stopped. Someone’s grandmother wandered into the music room and stayed for the whole choir practice. The families who came went home knowing what your place is really like.",
      "Many more never come at all. They decide at the kitchen table, late at night, scrolling through one video after another, and most of those videos look alike, with the buildings filmed from a drone and a voice-over about world-class facilities. Your prospectus lists the labs and the results, but none of what your open-house visitors saw reaches them.",
      "That’s the gap we fill. We spend time with your students and teachers and film ordinary days as they happen, so the family at the kitchen table sees what the family at the open house saw. Colleges and universities also end up with a dated, well-kept record of the year, ready when your internal quality cell (IQAC) sits down to write its annual quality report. You don’t need all eight films below. Start with the one that fits where you are in the year.",
    ],
    outcomesTitle: "What changes when families can see inside your classrooms",
    outcomes: [
      {
        title: "Attract the right students",
        text: "Lets students hear from students like them",
        icon: "people",
      },
      {
        title: "Explain what you teach",
        text: "Shows what each course is like and where it leads",
        icon: "book",
      },
      {
        title: "Build your reputation",
        text: "Shows your teachers, research and results",
        icon: "building",
      },
      {
        title: "Stay visible all year",
        text: "Keeps your pages active between admissions",
        icon: "globe",
      },
    ],
  },
  research: {
    title: "What students check before they fill in the form",
    text: "Before we plan a film, we read what’s known about how young people choose where to study. These four findings are about colleges and universities in the US, the UK and elsewhere, and they’re the reason our films are made with your own students, in their own words.",
    stats: [
      {
        figure: "62%",
        text: "of teenagers come across colleges through hashtags on social media. 57% follow a college’s account before they’ve looked at its website.",
      },
      {
        figure: "Real > polished",
        text: "Students looking at colleges pay more attention to videos made with real students than to heavily produced adverts. Young people can tell straight away when someone is reading from a marketing script.",
      },
      {
        figure: "Peer to peer",
        text: "Universities are turning student ambassadors and storytellers into formal programmes, because students trust other students.",
      },
      {
        figure: "Proof",
        text: "Admissions teams use testimonials from students and alumni, and films about single programmes that show the teachers, the results and where the course can lead.",
      },
    ],
    sources: [
      {
        label: "Campus Technology",
        href: "https://campustechnology.com/articles/sponsored-content/202608-beyond-the-feed-how-higher-ed-turns-social-media-into-a-measurable-enrollment-engine.aspx",
      },
      {
        label: "Level Agency",
        href: "https://www.level.agency/perspectives/short-form-video-higher-education-marketing/",
      },
      {
        label: "Caylor Solutions",
        href: "https://www.caylor-solutions.com/the-future-of-higher-ed-video-marketing/",
      },
      {
        label: "The PIE News",
        href: "https://thepienews.com/student-storytellers-and-creator-schemes-gain-ground-in-higher-education-marketing/",
      },
      {
        label: "Lorraine Gregory",
        href: "https://lorrainegregory.com/insights/articles/details/how-university-and-college-admissions-teams-are-using-video-to-compete-for-students",
      },
    ],
  },
  glance: {
    title: "Eight services at a glance",
    columns: [{ label: "What it does", key: "short" }],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the sentence closest to your need.",
    picks: [
      { line: "“Our video looks like everyone else’s.”", service: "campus-film" },
      { line: "“Our social media is mostly notices and posters.”", service: "student-life" },
      { line: "“Parents ask what’s different here.”", service: "programme-spotlight" },
      { line: "“Our students’ projects and research go unseen.”", service: "research-film" },
      { line: "“Parents ask where our students go.”", service: "alumni-story" },
      { line: "“Our highlights arrive too late to matter.”", service: "event-coverage" },
      { line: "“Our photos and videos are scattered.”", service: "campus-archive" },
      { line: "“Our pages post irregularly.”", service: "digital-presence" },
    ],
  },
  year: {
    kicker: "Across the year",
    title: "Films that keep to your timetable",
    text: "In India, many schools take admissions from about December to March and start the year in April or June. Many colleges and universities take admissions from about January to July and start in July or August. We plan the filming around your own dates, so each film is ready before it’s needed.",
    stages: [
      {
        name: "Before admissions",
        services: ["campus-film", "programme-spotlight"],
        text: "Families get to know you and your courses before they apply",
      },
      {
        name: "Admissions season",
        services: ["student-life", "alumni-story"],
        text: "Students and parents hear from your students and former students while they decide",
      },
      {
        name: "New academic year",
        services: ["student-life"],
        text: "The series follows new students through their first weeks, and next year’s applicants watch along",
      },
      {
        name: "Through the year",
        services: ["research-film", "campus-archive", "digital-presence"],
        text: "We film research as it happens, add to the archive and keep your pages posting",
      },
      {
        name: "Annual days, fests and convocation",
        services: ["event-coverage"],
        text: "We film the big days, and the footage goes into next year’s admissions",
      },
    ],
  },
  servicesTitle: "Eight films we make for schools and colleges",
  services: [
    {
      id: "campus-film",
      name: "Campus Film",
      short: "The true character of your institution",
      line: "Your open house, all year round. We film an ordinary day with your students and teachers, so families at home can see how the place really works.",
      tags: ["Plus: 60-sec and short cuts"],
      familiar: [
        "Most institution videos are drone shots of the buildings, a few smiling students and a voice-over about “world-class infrastructure” and “holistic development”.",
        "Parents and students watch ten of these and can’t remember which was which.",
      ],
      does: [
        "We spend time with your students, teachers and staff and film what an ordinary day there looks like.",
        "They talk in their own words. The film shows lessons, labs and daily life instead of a list of facilities.",
      ],
      receive: [
        "A Campus Film for your website, admissions and events",
        "A 60-second version and short cuts for social media",
        "Footage of classrooms, labs, libraries, playgrounds, hostels and sports",
        "Interviews with your principal or Vice-Chancellor, teachers and students",
        "Hindi and English subtitles, and versions for international audiences",
      ],
      example: [
        "A day school in a growing city wants parents to see more than its board results. The film follows three children through one school day. They lead the morning assembly, get a science experiment wrong and then right, and spend the afternoon on music and football.",
        "The school plays it at its open house and puts it on the admissions page, so parents can see what their child’s day there would be like.",
      ],
      fits: [
        "Your current video looks like everyone else’s",
        "You want students and parents to see your everyday life",
        "You need one film for admissions and events",
        "You recruit students from other cities or abroad",
      ],
    },
    {
      id: "student-life",
      name: "Student Life Series",
      short: "Real students, every month on social media",
      line: "We follow a few students from the first day of term to the last exam, in a new episode every month or fortnight, so next year’s batch gets to know this year’s.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your Instagram and YouTube are mostly event posters, notices and photos of chief guests.",
        "Students and parents follow the page to see what life there is like and find very little. The videos they do watch every day are made by other students.",
      ],
      does: [
        "We follow a few students through the year and film what happens to them: a first day, exams, a club competition, a science fair, an internship, a festival. Each episode is told from the student’s side.",
        "Students who are thinking of applying follow the series and get to know the place before they visit.",
      ],
      receive: [
        "A documentary episode, monthly or fortnightly",
        "4 to 6 reels from every episode",
        "Students telling their own stories, with our help and no script (and parents’ consent for younger students)",
        "A plan for the series built around your admissions calendar",
        "All footage saved to your campus archive",
      ],
      example: [
        "A university starts a series called “First Year” that follows five new students from orientation to their first exams. There’s homesickness, new friends, a first lab project and Diwali in the hostel.",
        "It runs through admissions season, and the admissions office sends families to it when they ask what student life is like.",
      ],
      fits: [
        "Your social media is mostly notices and posters",
        "You want prospective students to follow you",
        "You want peer-to-peer stories",
        "You have no in-house content team",
      ],
      panels: [
        {
          title: "What each platform does",
          items: [
            { name: "YouTube: audience", text: "Full episodes build a following" },
            { name: "Instagram: community", text: "Reels reach young students" },
            { name: "LinkedIn: reputation", text: "Cuts for parents, recruiters and partners" },
          ],
        },
      ],
      closing: "Students trust students. Let yours tell the story.",
    },
    {
      id: "programme-spotlight",
      name: "Programme Spotlight Film",
      short: "What a course or stream teaches, and where it leads",
      line: "We film one course, stream or department from the inside, so a student comparing it with others can see how it’s taught and where it leads.",
      tags: ["Format: Consistent series"],
      familiar: [
        "A student comparing a B.Tech in Computer Science at three colleges, or a parent comparing the science stream at three schools, finds pages that look almost the same. The subjects match, and so do the promises of “industry exposure” and “all-round development”.",
        "They can’t tell which is better, so the choice comes down to the name or the fees.",
      ],
      does: [
        "We film the course from the inside: the teachers, the labs and projects, how classes are taught, the links with industry and where students go next.",
        "Current students and recent graduates say what it’s really like, so students pick the course for the right reasons.",
      ],
      receive: [
        "A spotlight film for each course, stream or department",
        "Interviews with the head of department, teachers, students and recent graduates",
        "Footage of classes, labs, projects and field visits",
        "Short cuts for social media, counselling and education fairs",
        "The same format for every course, so they sit together as a series",
      ],
      example: [
        "A university’s B.Tech in Computer Science competes with dozens of similar courses in the same city. The film shows students building apps in the coding lab, an all-night hackathon, a teacher working with a final-year group on an AI project, and a visiting engineer taking a class.",
        "A recent graduate talks about how her final-year project led to her first job. The university uses the film at education fairs and in counselling sessions.",
      ],
      fits: [
        "Your programmes look identical online",
        "Some courses or streams need more applicants",
        "Students and parents ask “what’s different here?”",
        "You attend education fairs",
      ],
    },
    {
      id: "research-film",
      name: "Research and Innovation Film",
      short: "Research and student projects made clear",
      line: "We follow one piece of research or one student project from the lab to the people it helps, and explain it in words a Class 10 student could follow.",
      tags: ["For: Industry, funders, students, research applicants"],
      familiar: [
        "Your teachers, research scholars and students work on new materials, healthcare tools, patents and prize-winning science projects. Most of that work stays in journal papers, on notice boards or in the trophy cabinet.",
        "Industry partners, funding bodies, students thinking of applying and the public rarely hear about it.",
      ],
      does: [
        "We film one project and explain it in plain language: the problem it deals with, the people working on it, the work in the lab or the field, and who it helps.",
        "Over time these films show that your institution does original work as well as teaching.",
      ],
      receive: [
        "Research and innovation films",
        "Interviews with researchers, teachers, students and partners",
        "Filming in labs, workshops, field sites and wherever the work is put to use",
        "Simple graphics where an idea is hard to explain",
        "Versions for conferences, proposals, industry meetings and social media",
      ],
      example: [
        "A university’s computer science department has built an AI tool that helps doctors spot eye disease early in patients with diabetes. The film follows the team from the lab to a partner hospital where the tool is being tested, and talks to a patient whose condition was caught in time.",
        "The department shows it in meetings with hospitals and companies, and puts it on the M.Tech and PhD admissions pages.",
      ],
      fits: [
        "Your research and student projects go unseen",
        "You seek industry partners or funding",
        "You want stronger applicants",
        "You are building your ranking or reputation",
      ],
    },
    {
      id: "alumni-story",
      name: "Alumni Success Story",
      short: "Where your students go, and how you helped",
      line: "We catch up with one of your former students, from the batch of 2026 or the batch of 1996, and film where your classrooms took them.",
      tags: ["Plus: Growing story library"],
      familiar: [
        "The question parents ask most is where this will take their child.",
        "Your brochure has the toppers, the highest package and the company logos, and so does everyone else’s. Parents want to see real former students and what they’re doing now.",
      ],
      does: [
        "We make a short documentary about one former student: where they came from, what they learned with you, what changed for them and where they are today.",
        "A former student talking about their own life is easier to believe than a brochure.",
      ],
      receive: [
        "Alumni story films",
        "Filming at the former student’s workplace, hometown or business",
        "Short cuts for social media, counselling and parent meetings",
        "A growing library across courses and careers",
        "Films for alumni meets and fundraising",
      ],
      example: [
        "A school makes a set of films about its former students. One is a first-generation graduate from a small town who now leads a team at a technology company. One is a woman who started her own company in her hometown, and one cleared the civil services.",
        "The school plays them at parent meetings, counselling sessions and alumni meets, where parents can see where students from the same classrooms have gone.",
      ],
      fits: [
        "Parents ask about outcomes",
        "Your results and placements look like everyone’s",
        "You have proud alumni stories",
        "You run alumni meets or fundraising",
      ],
    },
    {
      id: "event-coverage",
      name: "Event Coverage",
      short: "Every event, shared while it matters",
      line: "We film your annual day or convocation, the audience as well as the stage, and send the highlights the same day or the next, while the parents’ WhatsApp group is still talking about it.",
      tags: ["Delivery: Same-day or next-day reels", "Plus: Live streaming"],
      familiar: [
        "There’s an event almost every week, whether it’s annual day, sports day, a fest, convocation, a guest lecture or a placement drive.",
        "Most of them end up as long unedited recordings or a few phone photos, posted after everyone has moved on.",
      ],
      doesTitle: "What this service does",
      does: [
        "We film your events as documentaries, watching the people as closely as the stage: a graduate’s family in the audience, a child on stage for the first time at annual day, a team winning a hackathon.",
        "The highlights are often ready the same day, while people are still talking about it.",
      ],
      receive: [
        "Highlight films for each event",
        "Same-day or next-day reels for Instagram, Shorts and LinkedIn",
        "Full recordings of the main talks and sessions",
        "Short clips of medal winners, speakers and families",
        "Event photography",
        "Live streaming of big events, if you need it",
      ],
      example: [
        "At a university’s convocation we film the ceremony, and we also follow one graduate, the first in her family to get a degree, and her parents, who have come in from their village for the day. The highlight film goes up that evening.",
        "The same month we cover the tech fest and a national conference, and clips from all three go into the next admissions campaign.",
      ],
      fits: [
        "You host frequent events",
        "Highlights arrive too late to matter",
        "You need recordings for records",
        "You want events to feed admissions content",
      ],
      panels: [
        {
          title: "Events we cover",
          items: [
            {
              name: "Academic",
              text: "Convocation, graduation, foundation day, conferences, seminars, guest lectures",
            },
            {
              name: "Student life",
              text: "Annual days, fests, cultural nights, sports days, clubs, science fairs, hackathons",
            },
            {
              name: "Careers",
              text: "Placement drives, career fairs, industry summits, MoUs, alumni meets",
            },
            {
              name: "Institutional",
              text: "Visits, delegations, inspections, accreditation teams, inaugurations",
            },
          ],
        },
      ],
      closing: "Share the moment while it still matters.",
    },
    {
      id: "campus-archive",
      name: "Campus Archive",
      short: "An organised record, year after year",
      line: "We photograph and film what goes on across your institution through the year and keep it labelled in one place, so the next inspection or NAAC visit doesn’t start with a hunt through old laptops.",
      tags: ["Format: Ongoing", "Plus: Year-end summary film"],
      familiar: [
        "When an accreditation visit, a board or affiliation inspection, a ranking submission or an anniversary comes up, everyone starts hunting for photos and videos of old events, workshops and outreach.",
        "The files are on staff laptops, half of them are lost, and nobody can find anything from three years ago.",
      ],
      doesTitle: "What this service does",
      does: [
        "We photograph and film what goes on across the institution through the year: academic events, workshops, outreach, new facilities, research and student achievements.",
        "Every file is labelled by department, date and activity, so it can be found in minutes. The archive belongs to the institution and stays when staff leave.",
      ],
      receive: [
        "Regular photos and video of the main activities",
        "A searchable archive by department, date and activity",
        "Year-end summary films for each department, school or the whole institution",
        "A dated record of the year, ready for the AQAR, inspections and annual reports",
        "Photographs tagged with date and place, filed by department and event",
        "Gathering and sorting material from past years",
      ],
      example: [
        "A college has an accreditation visit coming up and finds its photos and videos of outreach, workshops and student activities spread across dozens of phones and laptops. We gather and sort five years of material and keep adding to the archive from then on.",
        "When the next visit or anniversary comes round, the material is already there.",
      ],
      fits: [
        "Your photos and videos are scattered",
        "An accreditation or inspection is approaching",
        "Staff changes have cost you material",
        "You need material for rankings and reports",
      ],
    },
    {
      id: "digital-presence",
      name: "Digital Presence (Organic Growth)",
      short: "Organic growth on every platform",
      line: "Each month we plan and make short films and posts for your pages, with more during admissions, so your Instagram stops looking like the notice board.",
      tags: ["Format: Monthly", "Growth: Organic, not paid ads"],
      familiar: [
        "You have official pages, but posting comes and goes, with five notices one week and nothing for a month. Each department runs its own page in its own style.",
        "Students and parents who look you up find pages that look forgotten, while other institutions post every day and reply to comments.",
      ],
      doesTitle: "What this service does",
      does: [
        "Each month we plan and make posts for your pages, using material from our other films, so they stay active and read as one institution. There’s more of it during admissions.",
        "We grow your pages without paid ads, through posts people choose to follow. If you work with an advertising agency, we work alongside them. We make the content and they promote it.",
      ],
      receive: [
        "A monthly calendar planned around admissions",
        "12 to 20 reels and posts every month",
        "Captions, thumbnails and hashtags",
        "Admission-season content, ready for your ad agency to promote",
        "A monthly report on reach, followers, engagement and enquiries",
        "Either we make it and you post it, or we do both",
      ],
      example: [
        "A school’s Instagram posts now and then and gets little response. We run it for six months. In that time it starts posting regularly, has a student story every week, puts up event highlights within hours and answers admission questions in the comments and messages.",
        "By admissions season, parents who look the school up find a page that’s up to date.",
      ],
      fits: [
        "Your pages post irregularly",
        "Departments post in different styles",
        "You want organic growth, not just ads",
        "Admissions season needs constant presence",
      ],
      panels: [
        {
          title: "How each platform works for you",
          items: [
            { name: "Instagram", text: "Community: student life, events, campus moments" },
            { name: "YouTube", text: "Audience: full films and series found through search" },
            {
              name: "LinkedIn",
              text: "Reputation: research, results, placements, your leaders’ voice",
            },
            { name: "Website", text: "Fresh videos for homepage, programme and news pages" },
          ],
        },
      ],
      closing: "Be present every day, not just at admissions.",
    },
  ],
  together: {
    title: "How you can work with us",
    text: "You can book a single film, or keep us with you for one admissions season or the whole academic year. Our contracts follow your calendar, so each film is ready before families make up their minds, and footage we shoot for one film can be used in the others.",
    ways: [
      {
        title: "On its own",
        text: "Book a single film, like one Campus Film or one Programme Spotlight. Digital Presence is monthly, for at least 3 months.",
      },
      {
        title: "Contracts that follow the academic year",
        text: "Choose a 3-month Admissions Sprint, a 6-month Admissions Cycle or a 12-month Academic Year.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Admissions Sprint",
        text: "For the coming admissions season, or as a first project with us.",
        items: [
          "Campus Film: 1 with short cuts",
          "Programme Spotlights: up to 3",
          "Alumni Stories: 2",
          "Student Life Series: 3 episodes",
          "Digital Presence: 3 months, we produce",
        ],
      },
      {
        months: 6,
        name: "Admissions Cycle",
        text: "Covers everything from the first enquiries to orientation.",
        items: [
          "Campus Film: 1 with short cuts",
          "Programme Spotlights: up to 6",
          "Alumni Stories: 4",
          "Student Life Series: 6 episodes",
          "Event Coverage: up to 3 events",
          "Digital Presence: 6 months, we produce",
        ],
      },
      {
        months: 12,
        name: "Academic Year",
        text: "One team films and keeps records for you through the whole year.",
        items: [
          "Campus Film: 1, refreshed",
          "Spotlights: every major programme",
          "Alumni Stories: 8",
          "Student Life: 12 episodes",
          "Research and Innovation Films: up to 4",
          "Events: annual day or convocation, fest + 6",
          "Campus Archive: full year",
          "Digital Presence: 12 months, we publish",
        ],
      },
    ],
    path: [
      { title: "Start", text: "3-Month Admissions Sprint" },
      { title: "See how it went", text: "Look at enquiries and applications after the season" },
      { title: "Stay for the year", text: "12-Month Academic Year Partnership" },
    ],
  },
  compare: {
    title: "Compare the packages",
    columns: ["On its own", "3-Month Sprint", "6-Month Cycle", "12-Month Partnership"],
    rows: [
      { service: "Campus Film", cells: ["1 film", "1 film", "1 film", "1 film, refreshed"] },
      {
        service: "Programme Spotlight",
        cells: ["1 programme", "Up to 3", "Up to 6", "Every major programme"],
      },
      {
        service: "Student Life Series",
        cells: ["1 episode", "3 episodes", "6 episodes", "12 episodes"],
      },
      {
        service: "Alumni Success Story",
        cells: ["1 story", "2 stories", "4 stories", "8 stories"],
      },
      { service: "Research and Innovation Film", cells: ["1 film", "", "", "Up to 4 films"] },
      {
        service: "Event Coverage",
        cells: ["1 event", "", "Up to 3 events", "Annual day or convocation, fest + 6 events"],
      },
      { service: "Campus Archive", cells: ["Setup and recovery", "", "", "Full year"] },
      {
        service: "Digital Presence",
        cells: [
          "Monthly, minimum 3 months",
          "3 months, we produce",
          "6 months, we produce",
          "12 months, we produce and publish",
        ],
      },
    ],
    note: "“Not included (extra cost)” means the service is not part of that option, but you can still get it by paying separately.",
    advice:
      "The films get better the longer we work together, because the archive grows and we get to know your institution. Most institutions start with the 3-Month Admissions Sprint and move to the 12-Month Academic Year Partnership once they’ve seen how their admissions season went.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us what the prospectus leaves out",
    text: "Tell us about your students, when your admissions open and what you’ve tried so far. We’ll come back with the films we’d make, and when in the year we’d make them.",
    steps: [
      { title: "Talk", text: "A short call about your courses and your admissions calendar" },
      { title: "Plan", text: "We suggest which films to make, and when in the year" },
      { title: "Film", text: "We film with your students and teachers through the year" },
    ],
  },
};
