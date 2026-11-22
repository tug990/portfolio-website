import type { ServiceBook } from "@/content/service-books";

/*
  The educational institution's Service Book: schools, colleges, universities and every place of
  learning. Adapted from "Insight Lab - University Service Book.pdf" to take in schools too (its
  research findings are the book's, as sourced); as the world shows it.
*/
export const EDUCATION: ServiceBook = {
  // told as a film: the footage it’s cut with (supplied to us, one shot to a loop)
  reel: {
    loops: { intro: "edu-campus", research: "edu-classroom", talk: "edu-student" },
    services: {
      "campus-film": "edu-school",
      "student-life": "edu-student",
      "programme-spotlight": "edu-classroom",
      "research-film": "edu-roofs",
      "alumni-story": "edu-campus",
      "event-coverage": "edu-school",
      "campus-archive": "edu-roofs",
      "digital-presence": "edu-student",
    },
    cut: { lines: ["Let students", "see the place"], loop: "edu-campus" },
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
    ],
  },
  itemWord: "Service",
  cover: {
    kicker: "For schools, colleges and universities",
    title: "A normal day at your school or college, on film, for families who can’t visit.",
    text: "We shoot documentary films in your classrooms and labs, with your own students and teachers.",
  },
  intro: {
    title: "Many families who look you up never come for a campus tour",
    lead: "Our films take them round your campus from home.",
    text: [
      "Families who come for a campus tour walk past classes. One is halfway through a practical in the chemistry lab, and the choir is rehearsing in the music room. By the time they reach the admissions office, they mostly ask about fees and the bus.",
      "The rest look you up on a phone late at night, along with every other school or college on their list. The videos and prospectuses show much the same labs and toppers. Shortlists often get made that night, before anyone calls the admissions office.",
      "A parent watching at home sees roughly what the tour would have shown her, and your counsellors have something besides the prospectus to send after an enquiry. In a college or university the same footage is also a dated record of the year, for the quality cell (IQAC) and its yearly quality report (AQAR).",
    ],
    outcomesTitle: "Where the films get used",
    outcomes: [
      {
        title: "Applicants",
        text: "They hear from students a year or two ahead of them",
        icon: "people",
      },
      {
        title: "Counselling sessions",
        text: "Your counsellors can show a course being taught, and what its graduates do now",
        icon: "book",
      },
      {
        title: "Parents",
        text: "Your teachers at the board, in the middle of a lesson",
        icon: "building",
      },
      {
        title: "Website and social media",
        text: "Something new to post between one admission season and the next",
        icon: "globe",
      },
    ],
  },
  research: {
    title: "What students look at before they apply",
    text: "The research below is on how young people choose a college. It comes from colleges and universities abroad, mostly in the United States and the United Kingdom, and it’s the reason students do the talking in our films.",
    stats: [
      {
        figure: "62%",
        text: "of teenagers come across colleges through hashtags on social media. 57% follow a college’s account before they’ve looked at its website.",
      },
      {
        figure: "Unscripted",
        text: "Applicants pay more attention to videos with real students in them than to heavily produced ads. They notice straight away when someone is reading from a marketing script.",
      },
      {
        figure: "Student ambassadors",
        text: "Universities are setting up formal student ambassador and student storyteller programmes.",
      },
      {
        figure: "Course films",
        text: "Admissions teams use testimonials from students and alumni. They also use short films about a single course that show who teaches it and what its students go on to do.",
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
    text: "Pick the one you’ve heard in your own office.",
    picks: [
      { line: "“Our admissions video looks like everyone else’s.”", service: "campus-film" },
      { line: "“Our Instagram is mostly circulars and chief guests.”", service: "student-life" },
      { line: "“Some of our courses aren’t filling their seats.”", service: "programme-spotlight" },
      {
        line: "“Our faculty publish, but nobody outside hears about it.”",
        service: "research-film",
      },
      { line: "“Parents keep asking where our students end up.”", service: "alumni-story" },
      {
        line: "“Annual day was in December. The video went up in January.”",
        service: "event-coverage",
      },
      { line: "“Before every inspection we hunt for old photos.”", service: "campus-archive" },
      {
        line: "“Nothing goes up on our website or Instagram for weeks.”",
        service: "digital-presence",
      },
    ],
  },
  year: {
    kicker: "Across the year",
    title: "Films planned around your admissions calendar",
    text: "We plan backwards from your own admission dates, whether forms open in December or counselling runs into July.",
    stages: [
      {
        name: "Before admissions open",
        services: ["campus-film", "programme-spotlight"],
        text: "Families are drawing up shortlists, and the campus film and the course films should already be out",
      },
      {
        name: "Admissions season",
        services: ["student-life", "alumni-story"],
        text: "Enquiries and walk-ins come in, and your counsellors send a student episode or an alumni story as the follow-up",
      },
      {
        name: "New academic year",
        services: ["student-life"],
        text: "The series starts with the new batch at induction or orientation and stays with them through the first weeks. Next year’s applicants watch it too",
      },
      {
        name: "Through the year",
        services: ["research-film", "campus-archive", "digital-presence"],
        text: "Research and student projects are filmed while the work is still going on. The footage is filed in your archive and used on your website and Instagram",
      },
      {
        name: "Annual day, fests and convocation",
        services: ["event-coverage"],
        text: "Highlights from each event, kept for next year’s admissions films",
      },
    ],
  },
  servicesTitle: "The eight services",
  services: [
    {
      id: "campus-film",
      name: "Campus Film",
      short: "A working day on your campus, from the first class to the last",
      line: "We film a single day with you. Your counsellors send the film to families who can’t make the campus tour.",
      tags: ["Plus: a 60-second version and short clips"],
      familiar: [
        "Most admission videos open with a drone over the main building and a voice-over about the “lush green campus”.",
        "A parent watches ten of these in an evening and can’t tell you afterwards which school was which.",
      ],
      does: ["Nobody is given lines to read.", "The labs are filmed with a class in them."],
      receive: [
        "The Campus Film, for your website and for counselling sessions",
        "A 60-second version, and short clips for social media",
        "Footage of the campus in use, from the classrooms and labs to the hostels and the sports ground",
        "Interviews with your principal or Vice-Chancellor, and with teachers and students",
        "Hindi and English subtitles, and versions for families applying from abroad",
      ],
      example: [
        "A day school’s prospectus is mostly its board results. The film follows three children through one Wednesday. They lead the morning assembly, and their science experiment works on the third try. After lunch one goes to music practice and the other two play football.",
        "The admissions office plays it at the start of each campus tour and sends it to parents who enquire online.",
      ],
      fits: [
        "Your admissions video opens with a drone shot",
        "You’d like parents to see a class in progress",
        "You want one film to use at admissions and at events",
        "Many of your students come from other cities or from abroad",
      ],
    },
    {
      id: "student-life",
      name: "Student Life Series",
      short: "A few of your students, followed through the year",
      line: "We follow a few students from the first day of the session to the last exam, and put out an episode every month or fortnight.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your Instagram is mostly circulars and photos of chief guests receiving bouquets.",
        "Applicants follow the page to see what student life is like, and there’s very little of it there.",
      ],
      does: [
        "One month the episode is about a club competition, the next it’s the run-up to exams. Each one is told from the student’s side.",
        "An applicant who has followed the series turns up for the campus tour already knowing a few names.",
      ],
      receive: [
        "A documentary episode, monthly or fortnightly",
        "4 to 6 reels from every episode",
        "Students telling their own stories, unscripted",
        "A plan for the series, worked out against your admissions calendar",
        "All the footage, filed in your campus archive",
      ],
      example: [
        "A university starts a series called “First Year” and follows five new students from induction to their first semester exams. One of them is homesick for most of August. Another spends Diwali in the hostel because the trains home are full.",
        "The series is still running when the next admissions open. When parents ask about hostel life, the admissions office sends them that episode.",
      ],
      fits: [
        "You’d like applicants to follow you on Instagram",
        "Parents ask what hostel life is like",
        "You don’t have a media team of your own",
      ],
      panels: [
        {
          title: "What each platform does",
          items: [
            {
              name: "YouTube",
              text: "Full episodes, which families find through search and follow",
            },
            {
              name: "Instagram",
              text: "Reels, which school and college students watch every day",
            },
            {
              name: "LinkedIn",
              text: "Short clips for parents, and for recruiters",
            },
          ],
        },
      ],
    },
    {
      id: "programme-spotlight",
      name: "Programme Spotlight Film",
      short: "What a course or stream teaches, and where it leads",
      line: "We film one course or department as its students take it, and find out where its graduates went.",
      tags: ["Format: One series, the same for every course"],
      familiar: [
        "A student comparing B.Tech computer science at three colleges finds three pages that say nearly the same thing. A parent comparing the science stream at three schools has the same trouble. The subjects match, and so do the phrases “industry exposure” and “all-round development”.",
        "In the end they choose on the name or the fees.",
      ],
      does: [
        "We sit in on lectures and lab sessions. The HOD explains what the course sets out to teach.",
        "Current students and recent graduates say what the course is actually like, the difficult semesters included.",
      ],
      receive: [
        "A spotlight film for each course or stream",
        "Interviews with the head of department and teachers, and with students and recent graduates",
        "Footage of classes and labs, and of field visits where the course has them",
        "Short clips for education fairs and social media",
        "One format for every course, and the films sit together as a series",
      ],
      example: [
        "A university’s computer science course is one of dozens like it in the same city. The film spends a night at the hackathon in the coding lab, and a morning with a teacher and her final-year group on their artificial intelligence project. An engineer from a software company takes one of the classes.",
        "A graduate from two years ago explains how her final-year project got her first job. The admissions team shows the film at education fairs and in counselling sessions.",
      ],
      fits: [
        "Students can’t tell your course from the one across town",
        "Some courses or streams have seats to fill",
        "Parents ask what’s different about your course",
        "Your team goes to education fairs and school visits",
      ],
    },
    {
      id: "research-film",
      name: "Research and Innovation Film",
      short: "Your research and student projects, explained plainly",
      line: "We follow one piece of research or one student project from the lab to the people it’s meant to help, in words a Class 10 student could follow.",
      tags: ["For: Funders and industry partners, and applicants to your research programmes"],
      familiar: [
        "Your faculty publish papers and file patents, and your students win at science fairs. Most of that stays in a journal or the trophy cabinet.",
        "The companies and funding bodies you’d like to work with rarely hear about it, and nor do the students who might apply.",
      ],
      does: ["Over a year or two the films become a record of the research done on your campus."],
      receive: [
        "Research and innovation films",
        "Interviews with the researchers and the people they work with",
        "Filming in the lab and wherever the work is put to use",
        "Simple graphics where an idea is hard to explain",
        "Versions for conferences and funding proposals, and short clips for social media",
      ],
      example: [
        "A university’s computer science department has built a tool that uses artificial intelligence to help doctors spot eye disease early in patients with diabetes. The film follows the team from the lab to a partner hospital where the tool is being tested, and talks to a patient who was screened with it.",
        "The department shows the film in meetings with hospitals and companies, and puts it on its PG and PhD admission pages.",
      ],
      fits: [
        "Your research and student projects go unseen",
        "You’re looking for industry partners or research funding",
        "You want stronger applicants for research programmes",
        "You want people outside academia to understand your work",
      ],
    },
    {
      id: "alumni-story",
      name: "Alumni Success Story",
      short: "Where your former students are now",
      line: "We film one of your former students where they live and work today, from last year’s batch or one that passed out thirty years ago, and ask them about their time with you.",
      tags: [],
      familiar: [
        "The question your counsellors hear most from parents is where this will take their child.",
        "The brochure has the toppers and the highest placement package. Parents would rather meet someone who sat in your classrooms ten years ago.",
      ],
      does: [
        "The film is a short documentary about one former student, starting in the town they came from and ending wherever they work now.",
        "They tell it themselves, and there’s no narrator.",
      ],
      receive: [
        "Alumni story films",
        "Filming at the former student’s workplace and in their hometown",
        "Short clips for counselling sessions and parent meetings",
        "A set of alumni films across courses and careers",
        "Films for alumni meets and fundraising",
      ],
      example: [
        "A school films several of its former students. One grew up above his father’s hardware shop and now leads a team at a software company. Another cleared the civil services exam on her third attempt.",
        "The school plays them in counselling sessions, and again at the alumni meet.",
      ],
      fits: [
        "Parents ask where your students end up",
        "Parents only see your results and placement figures",
        "You know former students who’d agree to be filmed",
        "You run alumni meets or fundraising",
      ],
    },
    {
      id: "event-coverage",
      name: "Event Coverage",
      short: "Your events, as highlights and full recordings",
      line: "We film your annual day or convocation, the audience as well as the stage, and send the highlights the same day or the next.",
      tags: ["Delivery: Same-day or next-day reels", "Plus: Live streaming"],
      familiar: [
        "Something is on almost every week. If it isn’t sports day, it’s a guest lecture.",
        "Most of it ends up as a two-hour recording nobody edits, or a few phone photos posted a fortnight later.",
      ],
      doesTitle: "What this service does",
      does: [
        "At annual day one camera stays on the audience, on the parents in the fourth row filming their daughter’s first time on stage.",
      ],
      receive: [
        "Highlight films for each event",
        "Reels for Instagram and YouTube Shorts",
        "Full recordings of the main talks and sessions",
        "Short clips of the speakers and the medal winners",
        "Event photography",
        "Live streaming of big events, if you need it",
      ],
      example: [
        "At a university’s convocation we film the ceremony. We also stay with one graduate and her parents, who have come in from their village for the day. She’s a first-generation graduate.",
        "The same month there’s the tech fest and a national conference. Clips from all three go into the archive.",
      ],
      fits: [
        "You have events almost every week",
        "Your event videos go up too late",
        "You need full recordings for your records",
        "You want event footage you can use again later",
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
              text: "Placement drives, career fairs, industry summits, MoU signings, alumni meets",
            },
            {
              name: "Institutional",
              text: "Visits, delegations, inspections, accreditation peer team visits, inaugurations",
            },
          ],
        },
      ],
    },
    {
      id: "campus-archive",
      name: "Campus Archive",
      short: "Your photos and videos, labelled and kept in one place",
      line: "We photograph and film what goes on across your institution through the year, and keep it labelled in one place, by department and date.",
      tags: ["Format: Ongoing", "Plus: Year-end summary film"],
      familiar: [
        "An accreditation visit from NAAC or an affiliation inspection is announced, and someone in the office starts looking for photographs of an outreach camp from three years ago.",
        "They turn out to be on the phone of a teacher who has since left, or on a laptop that went for repair.",
      ],
      doesTitle: "What this service does",
      does: [
        "Through the year we photograph and film what happens on campus and off it, from department workshops to outreach in nearby villages.",
        "None of it lives on a staff member’s phone.",
      ],
      receive: [
        "Regular photos and video of the main activities",
        "An archive you can search by department or date",
        "Year-end summary films, for a department or for the whole institution",
        "A dated record of the year for the AQAR and the annual report",
        "Geo-tagged photographs, filed by department and event",
        "Gathering and sorting material from past years",
      ],
      example: [
        "A college has its peer team visit in four months, and five years of outreach photographs are spread over dozens of phones. We collect and sort what can still be found, and keep adding to the archive after that.",
        "Two years later comes the college’s silver jubilee, and nobody has to ask for old photographs on the staff WhatsApp group.",
      ],
      fits: [
        "Your photos and videos are spread across staff phones and laptops",
        "An accreditation visit or inspection is coming up",
        "You’ve lost material when staff left",
        "You need material for annual reports and the AQAR",
      ],
    },
    {
      id: "digital-presence",
      name: "Digital Presence",
      short: "Your website and social media, kept up every month",
      line: "Each month we plan and make short films and posts for your website and social media, with more during admissions. Your Instagram stops looking like the notice board outside the office.",
      tags: ["Format: Monthly", "No paid ads"],
      familiar: [
        "The official Instagram posts five notices in one week and then nothing for a month. Each department meanwhile runs a page of its own, in its own style.",
        "A parent who looks you up finds an account that seems forgotten. The school down the road posts every day and answers comments.",
      ],
      doesTitle: "What this service does",
      does: [
        "Each month we plan the posts and make them, mostly from footage already shot for your other films. The department pages stop looking like they belong to different colleges.",
        "We don’t run paid ads. If you already have an advertising agency or a media team, they carry on as before and can promote what we make.",
      ],
      receive: [
        "A monthly calendar planned around your admissions dates",
        "12 to 20 reels and posts every month",
        "Captions and hashtags, and a thumbnail for each video",
        "Admission-season films and posts, ready for your ad agency to promote",
        "A monthly report on followers and reach, and on the enquiries that came through social media",
        "Either we make it and you post it, or we do both",
      ],
      example: [
        "A school’s Instagram posts now and then, and hardly anyone responds. We run it for six months, with a student story every week.",
        "When admissions open in December, the account a parent finds was last updated that morning.",
      ],
      fits: [
        "Weeks go by with nothing posted",
        "Departments post in different styles",
        "You need to post every day during admissions",
      ],
      panels: [
        {
          title: "What goes where",
          items: [
            { name: "Instagram", text: "Student life and events on campus" },
            { name: "YouTube", text: "Full films and series that families find through search" },
            {
              name: "LinkedIn",
              text: "Research and placements, and posts from your principal or Vice-Chancellor",
            },
            { name: "Website", text: "New videos for your homepage and course pages" },
          ],
        },
      ],
    },
  ],
  together: {
    title: "One film, or the whole year",
    text: "You can book a single film, or keep us for an admissions season or the full academic year. The dates come from your calendar, and footage shot for one film gets used in the others.",
    ways: [
      {
        title: "On its own",
        text: "Book a single film, such as one Campus Film or one Programme Spotlight. Digital Presence is monthly, for at least 3 months.",
      },
      {
        title: "For a season or the whole year",
        text: "Choose a 3-Month Admissions Sprint, a 6-Month Admissions Cycle or a 12-Month Academic Year.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Admissions Sprint",
        text: "For the coming admissions season, or as a first try.",
        items: [
          "Campus Film: 1 with short clips",
          "Programme Spotlights: up to 3",
          "Alumni Stories: 2",
          "Student Life Series: 3 episodes",
          "Digital Presence: 3 months, we produce",
        ],
      },
      {
        months: 6,
        name: "Admissions Cycle",
        text: "From the first enquiries of the season to orientation.",
        items: [
          "Campus Film: 1 with short clips",
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
        text: "All eight services, across the full academic year.",
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
      { title: "First season", text: "3-Month Admissions Sprint" },
      { title: "After admissions close", text: "Look at the enquiries and applications" },
      { title: "If it worked", text: "12-Month Academic Year" },
    ],
  },
  compare: {
    title: "Compare the packages",
    columns: ["On its own", "3-Month Sprint", "6-Month Cycle", "12-Month Academic Year"],
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
      {
        service: "Campus Archive",
        cells: ["Setup, and sorting past years’ photos", "", "", "Full year"],
      },
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
    note: "Anything marked “Not included” can be added for a separate fee.",
    advice:
      "For a first season the 3-Month Admissions Sprint is enough. When admissions close, compare the enquiries and applications with last year’s before deciding on anything longer.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Start with your admission dates",
    text: "Send them over, and tell us which classes or courses still have seats. We’ll reply with what to film first, and when.",
    steps: [
      { title: "Talk", text: "Your dates, and the seats that are hard to fill" },
      {
        title: "Plan",
        text: "Which films, and in which month",
      },
      {
        title: "Film",
        text: "On campus, then the edit",
      },
    ],
  },
};
