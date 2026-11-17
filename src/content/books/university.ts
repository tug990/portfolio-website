import type { ServiceBook } from "@/content/service-books";

/* "Insight Lab - University Service Book.pdf", as the university's world shows it */
export const UNIVERSITY: ServiceBook = {
  itemWord: "Service",
  cover: {
    kicker: "For universities and colleges",
    title: "Students choose what feels real.",
    text: "Eight services that help the right students find you, and help your university earn the trust of students, parents, faculty and partners.",
  },
  intro: {
    title: "Choosing a university is one of life’s biggest decisions.",
    lead: "Today’s students research that decision on YouTube and Instagram, long before they visit a campus or open a prospectus.",
    text: [
      "They compare, they question, and they can tell very quickly when something is just marketing.",
      "Insight Lab, a non-fiction studio by Famecast, films universities as they really are: real students, real classrooms, real research and real careers.",
      "In India the stakes are rising too. Accreditation and rankings increasingly look at outcomes such as teaching, research, student support and placements, and parents compare institutions more closely than ever. A university that can show its real work, clearly and honestly, stands apart.",
    ],
    outcomesTitle: "What the eight services do for you",
    outcomes: [
      {
        title: "Attract the right students",
        text: "Real student stories that build a following",
        icon: "people",
      },
      {
        title: "Explain your programmes",
        text: "What students learn, and where it leads",
        icon: "book",
      },
      {
        title: "Build academic reputation",
        text: "Research and faculty made visible",
        icon: "building",
      },
      {
        title: "Stay visible all year",
        text: "Events and a consistent digital presence",
        icon: "globe",
      },
    ],
  },
  research: {
    title: "Students find universities on their phones, and trust other students.",
    text: "Four findings from higher education marketing in the US, UK and beyond.",
    stats: [
      {
        figure: "62%",
        text: "of teens discover colleges through social media hashtags, and 57% follow a school’s account before they ever visit its website.",
      },
      {
        figure: "Real > polished",
        text: "Prospective students connect more with real, student-led content than with overly produced marketing. Gen Z can spot a marketing script instantly.",
      },
      {
        figure: "Peer to peer",
        text: "Universities are formalising student storyteller and ambassador programmes, because students trust students.",
      },
      {
        figure: "Proof",
        text: "Admissions teams rely on student and alumni testimonials and programme spotlights that feature faculty, outcomes, and where a programme can lead.",
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
      { line: "“Students ask what’s different here.”", service: "programme-spotlight" },
      { line: "“Our research is unknown outside journals.”", service: "research-film" },
      { line: "“Parents ask about outcomes.”", service: "alumni-story" },
      { line: "“Our highlights arrive too late to matter.”", service: "event-coverage" },
      { line: "“Our photos and videos are scattered.”", service: "campus-archive" },
      { line: "“Our pages post irregularly.”", service: "digital-presence" },
    ],
  },
  year: {
    kicker: "Across the year",
    title: "Films across the academic year",
    text: "For many programmes in India, admissions run from around January to July, and the academic year starts in July or August.",
    stages: [
      {
        name: "Before admissions",
        services: ["campus-film", "programme-spotlight"],
        text: "Introduce the university and its programmes",
      },
      {
        name: "Admissions season",
        services: ["student-life", "alumni-story"],
        text: "Build trust with students and parents",
      },
      {
        name: "New academic year",
        services: ["student-life"],
        text: "Welcome new students, keep prospects engaged",
      },
      {
        name: "Through the year",
        services: ["research-film", "campus-archive", "digital-presence"],
        text: "Build reputation, keep the record, stay visible",
      },
      {
        name: "Events and convocation",
        services: ["event-coverage"],
        text: "Celebrate milestones, create next year’s content",
      },
    ],
  },
  servicesTitle: "Eight services",
  services: [
    {
      id: "campus-film",
      name: "Campus Film",
      short: "The true character of your university",
      line: "The true character of your university, in one film.",
      tags: ["Plus: 60-sec and short cuts"],
      familiar: [
        "Your university’s video shows drone shots of buildings, a few smiling students, and a voice-over listing “world-class infrastructure” and “holistic development.”",
        "Every university’s video looks the same. Students and parents watch ten of them and remember none.",
      ],
      does: [
        "A Campus Film captures what makes your university different: its people, its spirit, its academic strengths, and daily life on campus.",
        "Real students and faculty speak in their own words. Instead of listing facilities, the film shows what it actually feels like to study and live there.",
      ],
      receive: [
        "A Campus Film for website, admissions and events",
        "A 60-second version and short cuts for social media",
        "Footage of campus, classrooms, labs, hostels and sports",
        "Interviews with the Vice-Chancellor, faculty and students",
        "Hindi and English subtitles, and international versions",
      ],
      example: [
        "A private university known mainly for engineering wants students for its newer design and management schools. Its Campus Film follows a day through three students: a morning design studio, a lab experiment, a startup pitch, and an evening cultural rehearsal.",
        "Parents say it was the first university film that showed them what their child’s life there would really be like.",
      ],
      fits: [
        "Your current video looks like everyone else’s",
        "You want to attract students to newer schools",
        "You need one film for admissions and events",
        "You recruit international students",
      ],
    },
    {
      id: "student-life",
      name: "Student Life Series",
      short: "Real students, every month on social media",
      line: "Real students, real stories, every month on your social media.",
      tags: ["Format: Episodes", "Release: Monthly or fortnightly"],
      familiar: [
        "Your Instagram and YouTube are full of event posters, notices and photos of chief guests. Prospective students follow your page to understand life there, but find nothing that speaks to them.",
        "Meanwhile, they watch other students’ videos on their phones every day.",
      ],
      does: [
        "A regular documentary series following real students: first days in the hostel, exam pressure, a club competition, an internship, a festival, told from the student’s point of view.",
        "Over time it builds a following of prospective students who feel they already know your campus.",
      ],
      receive: [
        "A documentary episode, monthly or fortnightly",
        "4 to 6 reels from every episode",
        "Student-led storytelling, with guidance rather than scripts",
        "A content plan built around the admissions calendar",
        "All footage saved to your campus archive",
      ],
      example: [
        "A university launches “First Year,” following five new students from orientation to their first exams: homesickness, new friendships, a first lab project, and a hostel Diwali celebration.",
        "Students and parents follow it through admissions season, and many mention it during counselling as the reason they applied.",
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
      short: "What a programme teaches and where it leads",
      line: "What students will actually learn, who will teach them, and where it can lead.",
      tags: ["Format: Consistent series"],
      familiar: [
        "A student is choosing between B.Tech in Computer Science at three universities. The course pages look almost identical: the same subjects, the same promises of “industry exposure.”",
        "The student cannot tell which programme is better, so the decision comes down to brand name or fees.",
      ],
      does: [
        "A Programme Spotlight shows a course or department from the inside: the faculty, labs and projects, teaching style, industry links, and where graduates go.",
        "Current students and recent graduates explain what it’s really like, so students choose your programme for the right reasons.",
      ],
      receive: [
        "A spotlight film for each programme",
        "Interviews with the HOD, faculty, students and recent graduates",
        "Footage of classes, labs, projects and field visits",
        "Short cuts for social media, counselling and education fairs",
        "A consistent series format across all programmes",
      ],
      example: [
        "A university’s B.Tech in Computer Science competes with dozens of similar programmes in its city. The spotlight shows students building apps in a coding lab, an all-night hackathon, faculty mentoring a final-year AI project, and an industry expert taking a live class.",
        "A recent graduate explains how her final-year project led to her job offer. Applications rise in the next admissions season.",
      ],
      fits: [
        "Your programmes look identical online",
        "Some programmes need more applicants",
        "Students ask “what’s different here?”",
        "You attend education fairs",
      ],
    },
    {
      id: "research-film",
      name: "Research Film",
      short: "Research made clear for everyone",
      line: "The discoveries and innovations happening in your labs, explained for everyone.",
      tags: ["For: Industry, funders, PhD applicants"],
      familiar: [
        "Your faculty and scholars are doing important work: new materials, healthcare solutions, patents, funded projects. But it lives in journal papers only specialists read.",
        "Industry partners, funding bodies, prospective PhD students and the public never hear about it.",
      ],
      does: [
        "A Research Film tells the story of a project in simple, engaging language: the problem it solves, the people behind it, the work in the lab or field, and its impact on society.",
        "It builds your reputation as a place of real knowledge creation, not just teaching.",
      ],
      receive: [
        "Research films",
        "Interviews with lead researchers, scholars and partners",
        "Footage in labs, field sites and where research is applied",
        "Simple graphics to explain complex ideas",
        "Versions for conferences, proposals, industry meetings and social media",
      ],
      example: [
        "A university’s computer science department has built an AI tool that helps doctors detect eye disease early in diabetic patients. The film follows the team from the lab to a partner hospital where the tool is tested, and features a patient whose condition was caught in time.",
        "It helps win new industry and hospital partnerships, and draws strong students to the M.Tech and PhD programmes.",
      ],
      fits: [
        "Your research is unknown outside journals",
        "You seek industry partners or funding",
        "You want stronger PhD applicants",
        "You are building your research ranking",
      ],
    },
    {
      id: "alumni-story",
      name: "Alumni Success Story",
      short: "Where graduates go, and how you helped",
      line: "Where your students go, and how your university helped them get there.",
      tags: ["Plus: Growing story library"],
      familiar: [
        "Parents ask one question above all: “What happens after graduation?”",
        "Your placement brochure shows the highest package and company logos, but parents have seen the same numbers from every university. They want real graduates and real careers.",
      ],
      does: [
        "A short documentary about a real graduate: where they came from, what they learned with you, the turning points, and where they are today.",
        "Real outcomes from real people are the strongest proof of a university’s value.",
      ],
      receive: [
        "Alumni story films",
        "Filming at the graduate’s workplace, hometown or business",
        "Short cuts for social media, counselling and parent meetings",
        "A growing library across programmes and careers",
        "Content for alumni meets and fundraising",
      ],
      example: [
        "A university films a series of alumni stories: a first-generation graduate from a small town now leading a team at a technology company, an MBA graduate who started her own company in her hometown, and a graduate who cleared the civil services.",
        "Played at counselling sessions and alumni meets, they answer parents’ real question: “Can my child also get there from here?”",
      ],
      fits: [
        "Parents ask about outcomes",
        "Your placement numbers look like everyone’s",
        "You have proud alumni stories",
        "You run alumni meets or fundraising",
      ],
    },
    {
      id: "event-coverage",
      name: "Event Coverage",
      short: "Every campus event, shared while it matters",
      line: "Every important event on campus, filmed, edited and shared while it still matters.",
      tags: ["Delivery: Same-day or next-day reels", "Plus: Live streaming"],
      familiar: [
        "Universities host events almost every week: convocation, fests, sports meets, conferences, guest lectures, hackathons, placement drives.",
        "Most are recorded as long, unedited footage or a few phone photos. By the time anything is posted, the moment has passed.",
      ],
      doesTitle: "What this service does",
      does: [
        "We cover your events in documentary style, focusing on the people and emotions as much as the stage: a graduate’s family in the audience, a team winning a hackathon, a packed hall for a guest lecture.",
        "Highlights arrive fast, often the same day, while people are still talking about the event.",
      ],
      receive: [
        "Highlight films for each event",
        "Same-day or next-day reels for Instagram, Shorts and LinkedIn",
        "Full recordings of keynotes and key sessions",
        "Shareable moments: medal winners, speakers, families",
        "Professional event photography",
        "Live streaming of major events, where required",
      ],
      example: [
        "At convocation, we film not only the ceremony but a first-generation graduate and her parents, who travelled from their village for the day. Shared that evening, the highlight film becomes the university’s most-watched post.",
        "The same month, the tech fest and a national conference keep social media active, and clips from all three feed the next admissions campaign.",
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
              text: "Convocation, foundation day, conferences, seminars, guest lectures",
            },
            {
              name: "Student life",
              text: "Fests, cultural nights, sports meets, clubs, hackathons",
            },
            { name: "Careers", text: "Placement drives, industry summits, MoUs, alumni meets" },
            {
              name: "Institutional",
              text: "Visits, delegations, accreditation teams, inaugurations",
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
      line: "A complete, organised visual record of your university’s activities, year after year.",
      tags: ["Format: Ongoing", "Plus: Year-end summary film"],
      familiar: [
        "When an accreditation visit, ranking submission or anniversary comes up, departments scramble for photos and videos of past events, workshops and outreach.",
        "Files sit on staff laptops, half are lost, and nobody can find footage from three years ago.",
      ],
      doesTitle: "What this service does",
      does: [
        "A running visual record of everything across the university: academic events, workshops, outreach, new facilities, research and student achievements.",
        "Every file is labelled by department, date and activity, found in minutes, and stays with the university through staff changes.",
      ],
      receive: [
        "Regular photo and video documentation of key activities",
        "A searchable archive by department, date and activity",
        "Year-end summary films for each school or the university",
        "Visual material ready for accreditation visits, rankings and annual reports",
        "Recovery and organisation of past years’ material",
      ],
      example: [
        "As its accreditation cycle approaches, a university finds its record of outreach, workshops and student activities scattered across dozens of devices. We recover and organise five years of material and set up a running archive.",
        "The next time it prepares for a visit or an anniversary, the visual record is ready in minutes.",
      ],
      fits: [
        "Your photos and videos are scattered",
        "An accreditation cycle is approaching",
        "Staff changes have cost you material",
        "You need material for rankings and reports",
      ],
    },
    {
      id: "digital-presence",
      name: "Digital Presence (Organic Growth)",
      short: "Organic growth on every platform",
      line: "A strong, active and consistent presence on every platform students use.",
      tags: ["Format: Monthly", "Growth: Organic, not paid ads"],
      familiar: [
        "Your official pages exist, but posting is irregular: five notices one week, nothing for a month. Departments run pages in different styles.",
        "Prospective students find an inactive, confusing presence, while competing universities post daily and reply to every comment.",
      ],
      doesTitle: "What this service does",
      does: [
        "One consistent, professional voice online. We plan, produce and publish content every month, drawing on all our other services, and keep your pages active, especially during admissions.",
        "Organic growth, not paid ads. We grow your pages through real content students choose to follow. If you work with an advertising agency, we work alongside them: we create, they promote.",
      ],
      receive: [
        "A monthly calendar planned around admissions",
        "12 to 20 reels and posts every month",
        "Captions, thumbnails and hashtags",
        "Admission-season content, ready for your ad agency to promote",
        "A monthly report on reach, followers, engagement and enquiries",
        "Choose: we produce and you publish, or we produce and publish",
      ],
      example: [
        "A university’s Instagram had irregular posts and little engagement. After six months, it posts consistently, runs a weekly student story, shares event highlights within hours, and answers admission queries in comments and messages.",
        "During admissions, social enquiries rise, and students tell counsellors they followed the page for months before applying.",
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
            { name: "LinkedIn", text: "Reputation: research, placements, VC’s voice" },
            { name: "Website", text: "Fresh videos for homepage, programme and news pages" },
          ],
        },
      ],
      closing: "Be present every day, not just at admissions.",
    },
  ],
  together: {
    title: "How we work together",
    text: "Any service can be booked on its own. Our contracts follow the academic calendar, so films are ready exactly when students and parents are deciding.",
    ways: [
      {
        title: "On its own",
        text: "Any film on its own, such as one Campus Film or one Programme Spotlight. Digital Presence runs monthly, minimum 3 months.",
      },
      {
        title: "Contracts around the academic year",
        text: "An Admissions Sprint, a full Admissions Cycle, or the whole Academic Year.",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Admissions Sprint",
        text: "Strong content for the upcoming admissions season, or a first project with us.",
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
        text: "The full cycle, from first enquiries to orientation.",
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
        text: "One partner for all storytelling and documentation, all year.",
        items: [
          "Campus Film: 1, refreshed",
          "Spotlights: every major programme",
          "Alumni Stories: 8",
          "Student Life: 12 episodes",
          "Research Films: up to 4",
          "Events: convocation, fest + 6",
          "Campus Archive: full year",
          "Digital Presence: 12 months, we publish",
        ],
      },
    ],
    path: [
      { title: "Start", text: "3-Month Admissions Sprint" },
      { title: "See results", text: "Enquiries and applications respond" },
      { title: "Grow", text: "12-Month Academic Year Partnership" },
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
      { service: "Research Film", cells: ["1 film", "", "", "Up to 4 films"] },
      {
        service: "Event Coverage",
        cells: ["1 event", "", "Up to 3 events", "Convocation, fest + 6 events"],
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
      "Most universities start with the 3-Month Admissions Sprint and move to the 12-Month Academic Year Partnership once they see the results in their admissions season.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Let’s show students the university you really are.",
    text: "Tell us about your programmes, your students and your admissions calendar. We will suggest the services and contract that fit your year.",
    steps: [
      { title: "Talk", text: "Your goals, programmes and admissions calendar" },
      { title: "Plan", text: "A content plan mapped to the academic year" },
      { title: "Film", text: "Real students, real stories, all year" },
    ],
  },
};
