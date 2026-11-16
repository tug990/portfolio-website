/* Add a project = add an object here. It appears on /projects and gets its own /projects/<slug> page. */
export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  featured?: boolean;
  image?: string; // poster or still hung in the gallery, e.g. "/work/my-film.webp" (put the file in public/work/)
  client?: string; // who it was made for (the Work page groups films by this)
  series?: string; // the programme, campaign or series it belongs to (shown under its title on the Work page)
  duration?: string; // the film's length, e.g. "07:32": a badge on its thumbnails, and on its page (meta line, Duration)
  place?: string; // where it was filmed, e.g. "Bastar, Chhattisgarh" (its page's meta line)
  trailer?: string; // a short silent clip (15–30 s, 720p MP4) that plays in the gallery frame
  video?: string; // a video file, e.g. "/work/my-film.mp4", shown on the project page
  youtube?: string; // a YouTube link: plays on its gallery screen (muted, looped; a `trailer` wins) and, with sound, atop the case study
  link?: string; // watch / live link
  repo?: string; // secondary link
  body: string[]; // the opening paragraphs of the case study

  // The rest of the case study (all optional):
  format?: string; // e.g. "Feature documentary, 92 min"
  stills?: string[]; // frames from the film, e.g. ["/work/my-film-1.webp", ...]. Leave out for stand-ins
  story?: { heading: string; text: string[] }[]; // short chapters: the question, the access, the making...
  quote?: { text: string; name: string; role?: string }; // from someone in the film, or the client
  credits?: { role: string; name: string }[];
  // "In This Film" on its page: what it's about, each with a small drawn icon
  themes?: { label: string; icon: ThemeIcon }[];
};

/* The icons a theme can have ("In This Film"): simple line drawings. */
export type ThemeIcon =
  "leaf" | "people" | "sprout" | "handshake" | "chart" | "heart" | "drop" | "home";

/* Stand-in chapters, quote and credits (Murga Fight, the showreel), until real ones are written. */
const SAMPLE_CASE = {
  themes: [
    { label: "Women Empowerment", icon: "leaf" },
    { label: "Rural Enterprises", icon: "people" },
    { label: "Climate Resilience", icon: "sprout" },
    { label: "Income & Inclusivity", icon: "handshake" },
    { label: "Sustainable Rural Growth", icon: "chart" },
  ] as Project["themes"],
  story: [
    {
      heading: "The question",
      text: [
        "What the film set out to understand, in two or three sentences. The thing you didn't know when you started, and why it mattered enough to spend a year finding out.",
      ],
    },
    {
      heading: "Getting in",
      text: [
        "How you earned access: the months of visits before the camera came out, the person who opened the door, and what you promised them.",
      ],
    },
    {
      heading: "Making it",
      text: [
        "The approach on the ground: a small crew, available light, long takes. One moment from the shoot that changed the film.",
      ],
    },
  ],
  quote: {
    text: "A line from someone in the film, or the person who commissioned it. The sentence that says what it meant to them.",
    name: "Name Surname",
    role: "Subject of the film",
  },
  credits: [
    { role: "Director", name: "Name Surname" },
    { role: "Producer", name: "Name Surname" },
    { role: "Cinematography", name: "Name Surname" },
    { role: "Editor", name: "Name Surname" },
    { role: "Sound", name: "Name Surname" },
    { role: "Music", name: "Name Surname" },
  ],
};

/* Each theme's icon ("In This Film"), so a theme looks the same on every film. */
const THEME_ICONS: Record<string, ThemeIcon> = {
  "Artisan Livelihoods": "people",
  "Climate Resilience": "leaf",
  "Community Coaching": "handshake",
  "Conflict Affected Areas": "people",
  "Conflict to Development": "sprout",
  "Conflict to Opportunity": "sprout",
  Connectivity: "chart",
  "Cultural Heritage": "home",
  "Drinking Water": "drop",
  Education: "sprout",
  "Export Markets": "chart",
  "Fashion and Markets": "chart",
  "Folk Art": "leaf",
  "Heritage Crafts": "handshake",
  Hospitality: "home",
  "Income and Inclusivity": "chart",
  "Inclusive Growth": "people",
  Infrastructure: "chart",
  "Khelo India": "chart",
  Livelihoods: "handshake",
  "Museum and Archive": "home",
  "Next Generation": "sprout",
  "One District One Product": "chart",
  "Public Safety": "home",
  Rehabilitation: "heart",
  "Rural Electrification": "home",
  "Rural Enterprises": "handshake",
  Sports: "people",
  "Sustainable Rural Growth": "sprout",
  "Tribal Development": "people",
  "Weaver Livelihoods": "people",
  "Women Empowerment": "heart",
  Youth: "sprout",
};
const themes = (...labels: string[]): Project["themes"] =>
  labels.map((label) => ({ label, icon: THEME_ICONS[label] ?? "chart" }));

/* A film's story: the question it asks, how we got in (where we know), how it was made. */
const chapters = (question: string, gettingIn: string | null, makingIt: string) =>
  [
    { heading: "The question", text: [question] },
    gettingIn ? { heading: "Getting in", text: [gettingIn] } : null,
    { heading: "Making it", text: [makingIt] },
  ].filter((c): c is { heading: string; text: string[] } => c !== null);

/*
  The films. The twelve from "All Project Page Details (12 Films)": still to
  come for each, so not shown yet: the real release year (2026 is a
  placeholder), a way to play it here (a YouTube link, `youtube`, or a video
  file; until then its page shows a stand-in), stills (the frames to take
  are noted by each), credits, and for most, how we got in. Their clients:
  Rising of Bastar, the Chhattisgarh government; Karanj Oil, MLINDA; the
  other ten, the central government. Then Murga Fight and the showreel.
*/
export const PROJECTS: Project[] = [
  {
    slug: "rising-of-bastar",
    title: "Rising of Bastar",
    summary:
      "A look at how Bastar is moving from Naxal fear to roads, towers and surrenders, told by police, villagers and a former Naxal member.",
    year: 2026,
    tags: ["Impact film"],
    client: "Chhattisgarh Govt.",
    duration: "5:03",
    place: "Bastar, Chhattisgarh",
    themes: themes(
      "Conflict to Development",
      "Rehabilitation",
      "Connectivity",
      "Public Safety",
      "Inclusive Growth",
    ),
    body: [
      "Bastar has been in the news for decades for the wrong reasons. This film opens on misty forest and village paths, moves through newspaper cuttings of the violence, and then shows what has changed. A senior officer explains how departments work together. On-screen figures count 521 mobile towers and more than 1,589 surrenders. The film ends on a district town where, in its own words, development is not a promise.",
    ],
    story: chapters(
      "What does it take for a region known for conflict to be known for something else, and do the people living there feel the change?",
      "The film carries the Chhattisgarh government emblem, so it was made with the state's support. The people who speak, from a police chief to a man who once joined the Naxalites, speak in their own words.",
      "Aerial shots of the forest open the film, followed by archive newspaper pages and interviews in homes and offices, with subtitles in English. Hindi on-screen graphics carry the numbers.",
    ),
    quote: { text: "And that is why I joined the Naxalites.", name: "A man from Bastar" },
    // stills to take: the child in the mist (2:15), the former Naxal (2:47), the town from the air (4:50)
  },
  {
    slug: "light-over-shadows",
    title: "Light Over Shadows: Battling Fear in Bastar",
    summary:
      "Villages that once lived in the dark of Naxal fear now have electricity, brought by linemen working in difficult terrain.",
    year: 2026,
    tags: ["Impact film"],
    client: "Central Govt. of India",
    duration: "4:40",
    place: "Bastar, Chhattisgarh",
    themes: themes(
      "Rural Electrification",
      "Conflict Affected Areas",
      "Infrastructure",
      "Rehabilitation",
      "Inclusive Growth",
    ),
    body: [
      "In Bastar, darkness was both a fact and a fear. The film follows the engineers and linemen who climbed poles and crossed streams to reach villages that had gone without power. A woman says every home in her village now has electricity. A single oil lamp becomes the image of what has returned, and a television bulletin on rehabilitation shows a new path for those who came back.",
    ],
    story: chapters(
      "What does it mean for a village to switch on a light for the first time, and who risked what to make that happen?",
      "The film speaks with village residents and the field staff who work in the area.",
      "The film uses slow shots of forest roads, dark villages and a burning lamp, with lines like the one about a single lamp dispelling darkness carried as subtitles.",
    ),
    quote: { text: "Now every home has electricity.", name: "A village woman" },
    // stills to take: the oil lamp (1:38), the lineman on the pole (2:48), the woman in the green garden (3:58)
  },
  {
    slug: "dharti-aaba",
    title: "Dharti Aaba: A Vision Becoming Reality",
    summary:
      "A tribal community tells its own story of water, school and small enterprise, framed by the vision named in the title.",
    year: 2026,
    tags: ["Impact film"],
    client: "Central Govt. of India",
    duration: "9:24",
    place: "Tribal India",
    themes: themes(
      "Tribal Development",
      "Rural Enterprises",
      "Drinking Water",
      "Education",
      "Women Empowerment",
    ),
    body: [
      "It begins with soil in a farmer's hand and a memorial pillar at sunset. A young girl says water now reaches every house. A schoolboy talks about how far the village has come, and a woman who has grown mushrooms for two years explains what the work has done for her family. The film ends with a meeting with the Prime Minister and a tribal woman artisan.",
    ],
    story: chapters(
      "When a national vision for tribal communities reaches a single village, what does it look like in a girl's tap, a boy's classroom and a woman's mushroom shed?",
      "The film is subtitled in Hindi and speaks with several generations in one community.",
      "It mixes wide golden hour landscapes with close interviews at home and at work, and uses Hindi subtitles throughout so the voices stay in their own language.",
    ),
    quote: {
      text: "Everyone has been given facilities, water reaches every home.",
      name: "A girl from the village",
      role: "translated from the Hindi",
    },
    // stills to take: the hand in the soil (0:56), the memorial pillar (2:49), the mushroom shed (7:31)
  },
  {
    slug: "karanj-oil-gumla",
    title: "Karanj Oil, Gumla",
    summary:
      "More than 624 women in Gumla turned a forest seed into a producer company with a solar-powered centre.",
    year: 2026,
    tags: ["Case study film"],
    client: "MLINDA Charitable Trust",
    duration: "3:52",
    place: "Gumla, Jharkhand",
    themes: themes(
      "Women Empowerment",
      "Rural Enterprises",
      "Climate Resilience",
      "Income and Inclusivity",
      "Sustainable Rural Growth",
    ),
    body: [
      "The seeds of the karanj tree were once gathered and sold for very little. The film follows more than 624 women who organised as a producer company, learned to process the pods with a machine and now run a collection centre. Solar panels power the work, and on-screen figures state that the project prevented 13,687.3 kg of carbon emissions.",
    ],
    story: chapters(
      "Can a forest seed that women already knew how to gather become a steady income when they own the process?",
      "The film speaks with the women collectors, the people running the collection centre and a woman who explains the process.",
      "Drone views of the solar site, close shots of seeds falling from the machine and subtitled interviews shot in the centre and in a living room.",
    ),
    quote: {
      text: "Break open the pod and bring the Karanj seeds.",
      name: "A woman describing the work",
    },
    // stills to take: the seed collector (0:23), the machine (1:32), the solar site from the air (2:42)
  },
  {
    slug: "dokra-art",
    title: "Dokra Art",
    summary:
      "How Bastar's lost-wax metal casting is made, from wax thread to furnace, and what One District One Product recognition means for the artisans.",
    year: 2026,
    tags: ["ODOP film"],
    client: "Central Govt. of India",
    duration: "4:00",
    place: "Bastar, Chhattisgarh",
    themes: themes(
      "Heritage Crafts",
      "One District One Product",
      "Artisan Livelihoods",
      "Rural Enterprises",
      "Cultural Heritage",
    ),
    body: [
      "Dokra is one of the oldest metal-casting methods in the world, linked in the film to the sculptures of Mohenjo-daro and Harappa. We follow Bastar artisans through each step: wax pulled into thin threads, the wax model covered in clay, then the heat of the furnace. The film also asks what it means for the craft to be named under One District One Product, and ends on the faces of the artisans themselves.",
    ],
    story: chapters(
      "How does a craft that is thousands of years old find buyers today, and what changes when it is officially recognised?",
      "The film spends its time inside artisans' workshops and homes.",
      "The film opens on sparks in a furnace and moves to close shots of hands working wax and clay. A grid of artisan portraits closes it, with English subtitles over Hindi speech.",
    ),
    quote: { text: "Getting ODOP for Bastar Dokra is a commendable step.", name: "An artisan" },
    // stills to take: the Dokra figures (0:57), the wax threads (1:35), the clay work (2:12)
  },
  {
    slug: "sohrai-khovar",
    title: "Sohrai-Khovar: A Living Heritage",
    summary:
      "Sohrai and Khovar, the wall paintings of Jharkhand, kept alive by a young painter, a teacher of women and a museum curator.",
    year: 2026,
    tags: ["Heritage film"],
    client: "Central Govt. of India",
    duration: "4:58",
    place: "Jharkhand",
    themes: themes(
      "Folk Art",
      "Cultural Heritage",
      "Women Empowerment",
      "Next Generation",
      "Museum and Archive",
    ),
    body: [
      "Sohrai and Khovar are the folk paintings of Jharkhand, made with a handful of earth colours. The film introduces Adam Imam, a young painter giving the art a modern face, Alka Imam, who teaches it to women, and Gustav Imam, curator of the Sanskriti Museum, who explains what the state almost lost. A painted heron and fish explain a village belief about why the heron cannot eat the fish.",
    ],
    story: chapters(
      "What does it take to keep a village wall painting alive when the walls themselves are changing?",
      null,
      "Named title cards introduce each speaker, with painting close-ups, a museum wall of archived art and a final scene of young people in front of a painted wall.",
    ),
    quote: {
      text: "It's an art, it's a gift to the state.",
      name: "Gustav Imam",
      role: "curator, Sanskriti Museum",
    },
    // (confirm Adam, Alka and Gustav Imam are happy to be named on the site)
    // stills to take: Adam Imam painting (0:30), the heron and fish (1:58), the museum wall (3:28)
  },
  {
    slug: "khushbu-nag",
    title: "Khushbu Nag",
    summary:
      "A young Bastar athlete and the people around her, in a region where sport is only now getting support.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:43",
    place: "Bastar, Chhattisgarh",
    themes: themes(
      "Sports",
      "Women Empowerment",
      "Youth",
      "Khelo India",
      "Conflict to Opportunity",
    ),
    body: [
      "The film opens on barbed wire and mist, then moves to a young athlete whose name fills the title card. Voices from her community explain how hard it was to progress without support and how that is now changing. A closing card places her rise within Khelo India and the Bastar Olympics.",
    ],
    story: chapters(
      "What happens to talent in a place that has long been seen only through conflict, once a track and a coach arrive?",
      "The film follows one young athlete and speaks with those around her.",
      "A silhouette against the sun carries the title, followed by interviews, training ground shots and a final card in English.",
    ),
    quote: { text: "However, that is changing now.", name: "From the film" },
    // stills to take: the silhouette title (0:51), the athlete's interview (1:47), the closing card (4:34)
  },
  {
    slug: "mallakhamb",
    title: "Mallakhamb",
    summary:
      "Children in Abujhmad take up the pole sport of mallakhamb, with a coach who says his dream is not dead yet.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:15",
    place: "Abujhmad, Chhattisgarh",
    themes: themes(
      "Sports",
      "Youth",
      "Khelo India",
      "Conflict to Opportunity",
      "Community Coaching",
    ),
    body: [
      "Mallakhamb is a sport of gymnastics done on a wooden pole, and in Abujhmad it has become a way for children to find a future. Coaches go out looking for young talent. Durgeshwari Kumeti shares the medals her team has won, and a coach talks about his own dream. The film ends on the Abujhmad Mallakhamb Academy team, with a note on Khelo India and the Bastar Olympics.",
    ],
    story: chapters(
      "Can a village sport in a conflict-affected area give children a reason to stay, train and dream?",
      "The film is built around the academy, its coach and its young athletes.",
      "Children lined up on a dusty ground open the film, followed by interviews at the pole, in front of a painted gym wall and on a tyre. A team photograph closes it.",
    ),
    quote: { text: "My dream is not dead yet.", name: "A coach" },
    // stills to take: the children in a line (0:46), the man at the pole (1:36), Durgeshwari Kumeti (2:25)
  },
  {
    slug: "om-prakash-sahu",
    title: "Om Prakash Sahu",
    summary: "One man's long walk away from the gun and toward a livelihood in Gumla.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "5:00",
    place: "Gumla, Jharkhand",
    themes: themes(
      "Rehabilitation",
      "Livelihoods",
      "Rural Enterprises",
      "Conflict to Opportunity",
      "Inclusive Growth",
    ),
    body: [
      "The title card begins with the words “From Gun”, and the film follows one man from that past toward a settled life. Om Prakash Sahu recalls a moment when a pistol was aimed at him. The film then moves to open farmland and water, where he and the people around him now earn a living.",
    ],
    story: chapters(
      "What does it take for someone who lived with violence to build a life that other people trust?",
      "The film rests on one man's willingness to tell his story.",
      "Slow aerial shots of land and water, a black title card that builds letter by letter, and a seated interview in a village setting with English subtitles.",
    ),
    quote: { text: "He stepped forward, drew a pistol, and aimed at me.", name: "From the film" },
    // (confirm the full title)
    // stills to take: the seated interview (1:12), the land and water from the air (3:30), the man in the white shirt (4:15)
  },
  {
    slug: "pandum-cafe",
    title: "Pandum Cafe",
    summary:
      "A brick-walled cafe in Bastar run as a place of dignity, livelihood and a second chance.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:46",
    place: "Bastar, Chhattisgarh",
    themes: themes(
      "Rehabilitation",
      "Women Empowerment",
      "Rural Enterprises",
      "Hospitality",
      "Conflict to Opportunity",
    ),
    body: [
      "The staff of the cafe tell us how they came to work there. One of them says that with her own earnings she can now buy the clothes she wears. A closing card states that the focus has been on both security and rehabilitation, and describes the cafe as a place of dignity, livelihood and second chance.",
    ],
    story: chapters(
      "What does a second chance look like when it is a job, a uniform and a salary?",
      "The people in the film speak about their own lives.",
      "Interviews are shot against warm red brick inside the cafe, with a logo shot and a night exterior for the final card.",
    ),
    quote: {
      text: "Now I'm able to both buy and wear them.",
      name: "A member of the cafe's staff",
    },
    // stills to take: the man at the cafe's logo (0:51), the woman in the yellow shirt (1:48), the second interview (2:42)
  },
  {
    slug: "mirzapur-carpet",
    title: "Mirzapur Carpet",
    summary:
      "The carpet weavers of Mirzapur, their loom work and the fairs that bring them buyers.",
    year: 2026,
    tags: ["ODOP film"],
    client: "Central Govt. of India",
    duration: "6:11",
    place: "Mirzapur, Uttar Pradesh",
    themes: themes(
      "Heritage Crafts",
      "One District One Product",
      "Artisan Livelihoods",
      "Export Markets",
      "Rural Enterprises",
    ),
    body: [
      "The film opens on a wide view of the river and the city, then goes down to the looms. We watch hands trim a carpet with long shears and hear weavers say that work used to come only from time to time. The India Carpet Expo appears as a new meeting place between weavers and buyers, and the film closes on the hard-working hands behind every carpet.",
    ],
    story: chapters(
      "How does a craft that depends on steady orders keep its weavers in work?",
      "The film sits beside weavers at their looms.",
      "Low-angle shots through the loom threads, close shots of tools on the carpet pile, and archive footage of the expo, with English subtitles over Hindi.",
    ),
    quote: { text: "Work was not available from time to time.", name: "A weaver" },
    // stills to take: the river at the start (0:03), the shears on the carpet (1:07), the weaver through the loom (2:20)
  },
  {
    slug: "banarasi-saree",
    title: "Banarasi Saree: Threads of Timeless Tradition",
    summary:
      "The Banarasi saree as a global fashion icon, seen through its showrooms and the weavers behind it.",
    year: 2026,
    tags: ["ODOP film"],
    client: "Central Govt. of India",
    duration: "6:14",
    place: "Varanasi, Uttar Pradesh",
    themes: themes(
      "Heritage Crafts",
      "One District One Product",
      "Weaver Livelihoods",
      "Fashion and Markets",
      "Cultural Heritage",
    ),
    body: [
      "The Banarasi saree has become an icon of global fashion. The film visits showrooms where buyers treat a saree as a collectible, and workshops where weavers talk about the years when work became scarce and how they were connected to markets. It ends the way the city ends its day, with the evening aarti on the ghats.",
    ],
    story: chapters(
      "What does it take for a craft to be loved around the world and still keep its weavers in steady work?",
      "The film moves between showroom owners and weavers.",
      "Aerial views of the ghats open the film, with a title over a red saree and the Ganga. Interviews run in showrooms and loom sheds, and the aarti closes it.",
    ),
    quote: { text: "It becomes a collectible piece for them.", name: "A speaker at a showroom" },
    // stills to take: the ghats at the start (0:01), the weaver in the loom shed (3:33), the aarti (6:03)
  },
  {
    slug: "murga-fight",
    title: "Murga Fight",
    summary: "A non-fiction impact film based on the cockfight culture of Bastar.",
    year: 2020,
    tags: ["Non-fiction", "Impact film"],
    client: "Famecast",
    featured: true,
    youtube: "https://youtu.be/P_hKXgQoj0k",
    link: "https://youtu.be/P_hKXgQoj0k",
    ...SAMPLE_CASE,
    body: [
      "Describe the story and the question it set out to answer.",
      "Describe how it was made: the access, the team, the approach.",
      "Share where it was released and how it was received.",
    ],
  },
  {
    slug: "showreel",
    title: "Showreel",
    summary: "A reel of Famecast's work.",
    year: 2026,
    tags: ["Showreel"],
    featured: true,
    client: "Famecast",
    youtube: "https://youtu.be/n1VZJdnV594",
    link: "https://youtu.be/n1VZJdnV594",
    ...SAMPLE_CASE,
    body: ["Write the story of this project here."],
  },
];

/*
  The gallery's walls hold six films: the first six above. (Everything is on
  the Work page; reorder the list to change what hangs in the room.)
*/
export const GALLERY_FILMS = PROJECTS.slice(0, 6);

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

/* The project after this one, wrapping round to the first. */
export const nextProject = (slug: string) => {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return PROJECTS[(i + 1) % PROJECTS.length];
};
