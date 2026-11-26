/* Add a project = add an object here. It appears on /projects and gets its own /projects/<slug> page. */
export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  featured?: boolean;
  image?: string; // its thumbnail (1920 x 1080), e.g. "/work/my-film.webp" in public/work/: its card, its page, its gallery screen
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
  "Financial Inclusion": "chart",
  "Folk Art": "leaf",
  "Heritage Crafts": "handshake",
  Hospitality: "home",
  "Inclusive Growth": "people",
  "Income and Inclusivity": "chart",
  Infrastructure: "chart",
  "Khelo India": "chart",
  "Kitchen Gardens": "sprout",
  Livelihoods: "handshake",
  "Mother and Child Health": "heart",
  "Museum and Archive": "home",
  "Music Heritage": "heart",
  "Next Generation": "sprout",
  "Nutrition Security": "leaf",
  "One District One Product": "chart",
  "Public Participation": "people",
  "Public Safety": "home",
  Rehabilitation: "heart",
  "Rural Electrification": "home",
  "Rural Enterprises": "handshake",
  Sports: "people",
  "Sustainable Rural Growth": "sprout",
  "Tribal Development": "people",
  "Urban Sanitation": "home",
  "Waste Management": "leaf",
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
  The films, in the order the Work page shows them: first Banarasi Saree,
  Mirzapur Carpet, Pandum Cafe, Mallakhamb, Khushbu Nag and Om Prakash Sahu,
  then the rest. Nutrition Garden was written from the film itself, as it has
  no write-up yet (Better World Foundation's, with the Khunti district
  administration, as its closing card says); most come from "All Project Page
  Details (12 Films)"; Banarasi Shehnai and Maa Subhadra from the films
  themselves (their subtitles and on-screen names). Last come three from 2023,
  written from their pictures: NABARD's Raushni Ki Raah Par, SIDHKOFED's
  Namkum LAMPS and the Jharkhand government's The Ashrita Purti Story. More
  are made but not yet released by the client: `UPCOMING`, below. Each plays from its YouTube
  link (`youtube`), with its thumbnail (`image`). Still to come for all of
  them, so not shown yet: the real release year (2026 is a placeholder),
  stills (the frames to take are noted by each), credits, and for most, how we
  got in. Their clients: Rising of Bastar, the Chhattisgarh government; Karanj
  Oil, MLINDA; Maa Subhadra, the Odisha government; the rest, the central
  government.
*/
export const PROJECTS: Project[] = [
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
    youtube: "https://youtu.be/UMAlKaI9NPQ",
    image: "/work/banarasi-saree.webp",
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
    slug: "mirzapur-carpet",
    title: "Mirzapur Carpet",
    summary:
      "The carpet weavers of Mirzapur, their loom work and the fairs that bring them buyers.",
    year: 2026,
    tags: ["ODOP film"],
    client: "Central Govt. of India",
    duration: "6:11",
    place: "Mirzapur, Uttar Pradesh",
    youtube: "https://youtu.be/5OEbdC1OcSA",
    image: "/work/mirzapur-carpet.webp",
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
    slug: "pandum-cafe",
    title: "Pandum Cafe",
    summary:
      "A brick-walled cafe in Bastar run as a place of dignity, livelihood and a second chance.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:46",
    place: "Bastar, Chhattisgarh",
    youtube: "https://youtu.be/L7yCpe_eYXM",
    image: "/work/pandum-cafe.webp",
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
    slug: "mallakhamb",
    title: "Mallakhamb",
    summary:
      "Children in Abujhmad take up the pole sport of mallakhamb, with a coach who says his dream is not dead yet.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:15",
    place: "Abujhmad, Chhattisgarh",
    youtube: "https://youtu.be/bgoLjkpqujQ",
    image: "/work/mallakhamb.webp",
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
    slug: "khushbu-nag",
    title: "Khushbu Nag",
    summary:
      "A young Bastar athlete and the people around her, in a region where sport is only now getting support.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "4:43",
    place: "Bastar, Chhattisgarh",
    youtube: "https://youtu.be/3YlufA888qk",
    image: "/work/khushbu-nag.webp",
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
    slug: "om-prakash-sahu",
    title: "Om Prakash Sahu",
    summary: "One man's long walk away from the gun and toward a livelihood in Gumla.",
    year: 2026,
    tags: ["Rise of Hope series"],
    client: "Central Govt. of India",
    duration: "5:00",
    place: "Gumla, Jharkhand",
    youtube: "https://youtu.be/aW0vNmOQRzQ",
    image: "/work/om-prakash-sahu.webp",
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
    slug: "nutrition-garden",
    title: "Nutrition Garden",
    summary:
      "In Khunti, Jharkhand, families and anganwadi centres grow gardens of greens, vegetables and fruit, so that mothers and young children eat better.",
    year: 2026,
    tags: ["Case study film"],
    client: "Better World Foundation",
    duration: "4:43",
    place: "Khunti, Jharkhand",
    youtube: "https://youtu.be/ZGZk_bpPfrc",
    image: "/work/nutrition-garden.webp",
    themes: themes(
      "Nutrition Security",
      "Mother and Child Health",
      "Kitchen Gardens",
      "Women Empowerment",
      "Sustainable Rural Growth",
    ),
    body: [
      "Poshan baadi means nutrition garden. The film opens on the sun rising over water, then on young children and their mothers, at home and at the anganwadi. Then the work: ground dug and prepared, compost made, seeds sown, each crop named on screen as it goes in: spinach, bathua, amaranth, fenugreek, mint, mustard, tomato; carrot and radish in a round garden seen from above; gourds and beans along the fence; papaya and lemon trees. Water runs down the channels, women gather and cook the harvest, and the film ends at the anganwadi, where a child is fed. Its closing card reads: Fostering Nutrition Security of Khunti.",
    ],
    story: chapters(
      "Can a patch of ground beside a home or an anganwadi put greens, vegetables and fruit on a child's plate every day?",
      "The film carries the marks of the Khunti district administration and Better World Foundation, so it was made with their support.",
      "Low shots from the soil as seeds are sown, each crop named on screen in Hindi beside a small drawing of it, the round garden from the air, and quiet scenes at the anganwadi and at home by a window.",
    ),
    // (written from the film's pictures: add a quote, and check the words, once there's a write-up)
    // stills to take: the title over the sunrise (0:04), the greens named as they're sown (2:10), the round garden from the air (2:28)
  },
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
    youtube: "https://youtu.be/KXoRbAmZ_QA",
    image: "/work/rising-of-bastar.webp",
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
    youtube: "https://youtu.be/wE6e9CZA9XQ",
    image: "/work/light-over-shadows.webp",
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
    youtube: "https://youtu.be/HhOFYqJnLTw",
    image: "/work/dharti-aaba.webp",
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
    youtube: "https://youtu.be/XzON6b9pbXk",
    image: "/work/karanj-oil-gumla.webp",
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
    youtube: "https://youtu.be/yBvg38qOidM",
    image: "/work/dokra-art.webp",
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
    youtube: "https://youtu.be/OoOk-3AkCr4",
    image: "/work/sohrai-khovar.webp",
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
    slug: "banarasi-shehnai",
    title: "Banarasi Shehnai",
    summary:
      "The shehnai of Banaras, the sound of Ustad Bismillah Khan, from the hands that make it to the young players taking it up again.",
    year: 2026,
    tags: ["Heritage film"],
    client: "Central Govt. of India",
    duration: "7:56",
    place: "Varanasi, Uttar Pradesh",
    youtube: "https://youtu.be/L1NT1F1L4s4",
    image: "/work/banarasi-shehnai.webp",
    themes: themes(
      "Music Heritage",
      "Heritage Crafts",
      "Artisan Livelihoods",
      "Next Generation",
      "Cultural Heritage",
    ),
    body: [
      "The Ganga at dawn opens the film, a boatman singing to the river, and a reminder that UNESCO named Varanasi a Creative City of Music in 2015. Then the shehnai, the sound of Ustad Bismillah Khan, remembered by his daughter Zarina Begum in his old home. Ramesh Kumar, whose father was known as Baba Shehnai Master, shows how each one is made: teak for its natural sweetness, sheesham for the smaller ones, every hole measured to be exactly the same. Players such as Kuvar Prasanna recall a time when hardly any artists were left to play it. With a GI tag from the Central Government, the shehnai of Banaras has a new identity, and young players like Krish Bangde are learning it again.",
    ],
    story: chapters(
      "What happens to a sacred sound when the hands that make it, and the people who play it, begin to disappear?",
      "The film sits with a shehnai maker in his workshop and with the players who carry the tradition on, in Banaras.",
      "Dawn on the Ganga, close shots of hands boring and measuring the wood, and night performances on the ghats, with English subtitles over Hindi.",
    ),
    quote: {
      text: "Son, learn how to make it. Playing it is important too.",
      name: "Ramesh Kumar",
      role: "recalling his father",
    },
    // (confirm the client)
    // stills to take: the boat at dawn (0:40), the shehnai played close (3:35), the young player on the boat (7:55)
  },
  {
    slug: "maa-subhadra",
    title: "Maa Subhadra",
    summary:
      "Women across Odisha on what the Subhadra Yojana has let them build, in the name of the goddess Maa Subhadra.",
    year: 2026,
    tags: ["Impact film"],
    client: "Odisha Govt.",
    duration: "5:45",
    place: "Odisha",
    youtube: "https://youtu.be/VOQh5L8DDK0",
    image: "/work/maa-subhadra.webp",
    themes: themes(
      "Women Empowerment",
      "Financial Inclusion",
      "Rural Enterprises",
      "Livelihoods",
      "Cultural Heritage",
    ),
    body: [
      "Odisha has worshipped Maa Subhadra for generations, and the film opens at the Rath Yatra, with thousands pulling the chariots' ropes. Then it asks where her strength is seen today, and finds it in women: Kukumina Das, mocked when she started a masala business; Tapaswini Behra, who can now earn her own money at her sewing machine; Prabhati Behra, who bought clay and colours for her idols; and a shopkeeper who now stocks more of what her customers ask for. Each was supported by the Subhadra Yojana, which the film says gives every eligible woman ₹10,000 a year for five years and has reached more than one crore women across Odisha. This is the film's Hindi version.",
    ],
    story: chapters(
      "Where is the strength of a goddess seen today, in a state that has worshipped her for centuries?",
      "The women in the film speak about their own work, and what the support changed for them.",
      "The Rath Yatra from the air and from within the crowd, then warm interiors of kitchens, workshops and shops, with English subtitles over the Hindi.",
    ),
    quote: { text: "The money I received has helped me a lot.", name: "Prabhati Behra" },
    // stills to take: the chariots at the Rath Yatra (0:30), Kukumina Das with turmeric (1:25), painting an idol (5:30)
  },
  // the last three, at the end of the Work page as asked: their year is their YouTube release
  {
    slug: "pahariya-raushni-ki-raah",
    title: "Raushni Ki Raah Par: Pahariya Janjati",
    summary:
      "NABARD's film from the hill villages of the Pahariya: their fields and poultry, a pond dug for water, and light in their homes.",
    year: 2023,
    tags: ["Impact film"],
    client: "NABARD",
    duration: "6:10",
    youtube: "https://youtu.be/c84_t_Ux9jo",
    image: "/work/pahariya-raushni-ki-raah.webp",
    themes: themes(
      "Tribal Development",
      "Sustainable Rural Growth",
      "Rural Enterprises",
      "Rural Electrification",
    ),
    body: [
      "Raushni ki raah par means on the path of light. NABARD presents the film, which opens on hills and forest at sunrise and its title, Pahariya Janjati: the Pahariya, a tribe of the hills. In their villages it meets the people who speak in it: a woman at the door of her house, a board with NABARD's mark on the wall beside her; a young farmer in his field of vegetables and peas; a man sitting among his hens. From the air there's a pond dug in red earth; inside a dark home an old woman sits by a lit bulb, and outside another house a solar light stands on a pole. It ends on the hills and on Mahatma Gandhi's words: The future of India lies in its villages.",
    ],
    story: chapters(
      "What does the path to light look like for the Pahariya, in their villages in the hills?",
      null,
      "Hills at sunrise and the forest floor, the villages from the air, people speaking at their homes and in their fields, and Mahatma Gandhi's words to close.",
    ),
    // (written from the film's pictures, as its Hindi isn't subtitled: confirm where it was filmed, the people's names, and add a quote)
    // its thumbnail: the man by the lit bulb (5:34); stills to take: the title over the hills (0:05), the farmer in his field (3:12), the pond from the air (5:10)
  },
  {
    slug: "namkum-lamps",
    title: "Sahkarita Se Swavalamban: Namkum LAMPS",
    summary:
      "Self-reliance through cooperation: Namkum LAMPS, a cooperative society near Ranchi, and the farmers it serves, from fertiliser to the market.",
    year: 2023,
    tags: ["Case study film"],
    client: "SIDHKOFED",
    duration: "10:46",
    place: "Namkum, Ranchi, Jharkhand",
    youtube: "https://youtu.be/KTqYs6pCp2g",
    image: "/work/namkum-lamps.webp",
    themes: themes(
      "Rural Enterprises",
      "Financial Inclusion",
      "Inclusive Growth",
      "Sustainable Rural Growth",
    ),
    body: [
      "Sahkarita se swavalamban means self-reliance through cooperation. The film opens on the hills, a waterfall and paddy being planted, then comes to Namkum LAMPS, a large-area multipurpose cooperative society, its yellow walls painted with IFFCO's fertiliser sale centre and the line khaad to khaad, beema bhi saath: fertiliser, and insurance too. Inside, sacks of fertiliser are stacked, records are kept on a computer, and women at the counter look after the members who come in. The manager, Niraj Kumar by the nameplate on his door, talks about the society's work, and an animated card sets out the seven principles of cooperation that make a LAMPS a support to the village economy. It closes in a vegetable market and on the words sahkar se satat vikas: lasting growth through cooperation.",
    ],
    story: chapters(
      "How does a village cooperative society help its farmers stand on their own feet?",
      null,
      "Wide views of the hills and paddy fields, the society's yellow building and its counter, interviews in its office, and an animated card on the seven principles of cooperation, in Hindi.",
    ),
    // (written from the film's pictures, as its Hindi isn't subtitled: confirm the manager's name and add a quote)
    // its thumbnail: the woman with paddy seedlings (10:22); stills to take: the title over the hills (0:02), the society's building (3:01), the market (10:27)
  },
  {
    slug: "ashrita-purti",
    title: "The Ashrita Purti Story",
    summary:
      "Ashrita Purti has been an ASHA worker, a Sahiya, in her village in Khunti since 2006, visiting mothers and young children and getting malnourished children care.",
    year: 2023,
    tags: ["Case study film"],
    client: "Jharkhand Govt.",
    duration: "4:37",
    place: "Khunti, Jharkhand",
    youtube: "https://youtu.be/wB5jMm0SgvE",
    image: "/work/ashrita-purti.webp",
    themes: themes("Mother and Child Health", "Nutrition Security", "Women Empowerment"),
    body: [
      "Ashrita Purti is an Accredited Social Health Activist, an ASHA, known in Jharkhand as a Sahiya, and has been one since 2006; when she started, she says, her husband and mother-in-law didn't support her. Her village in Khunti has about 1,100 people. She surveys eligible couples, advises pregnant women to take their vaccinations, holds the village health, sanitation and nutrition days and the committee and mothers' meetings, and visits the homes of pregnant women and of children aged three to fifteen months. When she finds a severely malnourished child, she advises the mother to take the child to the malnutrition treatment centre. The film follows her to the Nutrition on Wheels van, the anganwadi and the hospital, where a baby is born. Its closing card: since 2021, through the Nutrition on Wheels (CMAM) programme, 1,149 malnourished children have recovered in Khunti and Dhanbad.",
    ],
    story: chapters(
      "What does an ASHA worker's day hold, in a village in Khunti?",
      null,
      "Ashrita walking the lanes of her village, the village from the air with its population on screen, interviews at her door, the Nutrition on Wheels van and a newborn at the hospital, with English subtitles over Hindi.",
    ),
    quote: {
      text: "All I yearn for is to see the happiness in the faces of others.",
      name: "Ashrita Purti",
      role: "ASHA worker (Sahiya), Khunti",
    },
    // its thumbnail: Ashrita lifting a baby under the tree (4:22); stills to take: Ashrita at her door (1:32), the Nutrition on Wheels van (1:51), the newborn (4:10)
  },
];

/*
  Films we've made that the client hasn't released yet: on the Work page only,
  at its foot under "Upcoming projects", their cards locked (the picture, no
  film, no page). They're kept out of `PROJECTS`, so nothing else on the site
  lists or plays them, and their YouTube links are kept out of the site and of
  this repository, which is public (some are unlisted). When one is released,
  add its link as `youtube` and move it into `PROJECTS`.
*/
export const UPCOMING: Project[] = [
  {
    slug: "banarasi-wooden-toys",
    title: "Banarasi Wooden Toys",
    summary:
      "The lacquered wooden toys of Banaras, nearly lost to cheap machine-made ones, and how a GI tag and training brought their makers back.",
    year: 2026,
    tags: ["Heritage film"],
    client: "Central Govt. of India",
    duration: "8:07",
    place: "Varanasi, Uttar Pradesh",
    // its YouTube link is kept out of the site and this (public) repository till the client releases it
    image: "/work/banarasi-wooden-toys.webp",
    themes: themes(
      "Heritage Crafts",
      "Artisan Livelihoods",
      "Export Markets",
      "Next Generation",
      "Cultural Heritage",
    ),
    body: [
      "In a world full of screens, the film asks how a simple wooden toy can still keep a child's curiosity alive. In the workshops of Varanasi, Rameshwar Singh, whose ancestors made toys for kings and for the crowds at the Ram Leela, shows how wood that arrives in lengths of eight or ten feet becomes a toy: cut, turned, sanded, coloured with non-toxic lacquer and polished with a bamboo or kewra leaf. There was a time when the toys stopped selling, and makers sat by the roadside or left to drive rickshaws and autos. Artisan cards, fairs in Delhi, Mumbai and Kolkata, a GI tag and a training scheme have brought them back, and one shop's toys now go as far as Dubai.",
    ],
    story: chapters(
      "Can a wooden toy hold its own against a phone, and keep a centuries-old craft alive?",
      "The film spends its time in family workshops and toy shops in Varanasi, with makers from three generations.",
      "Close shots of the lathe and the lacquer, warm workshop interiors, the crowded lanes of Varanasi and children at play, with English subtitles over Hindi.",
    ),
    quote: { text: "Our ancestors even worked for the kings.", name: "Rameshwar Singh" },
    // (confirm the client)
    // stills to take: the spinning top (3:25), the painted dolls (5:10), the boy at the toy shop (8:05)
  },
  {
    slug: "lucknow-swachh-bharat",
    title: "Lucknow: Swachh Bharat Mission",
    summary:
      "How Lucknow cleared its mountains of garbage and climbed from 44th in the Swachh Survekshan to among the three cleanest cities in India.",
    year: 2026,
    tags: ["Impact film"],
    client: "Central Govt. of India",
    duration: "9:39",
    place: "Lucknow, Uttar Pradesh",
    // its YouTube link is kept out of the site and this (public) repository till the client releases it
    image: "/work/lucknow-swachh-bharat.webp",
    themes: themes(
      "Urban Sanitation",
      "Waste Management",
      "Public Participation",
      "Infrastructure",
      "Cultural Heritage",
    ),
    body: [
      "From the Swachh Bharat Mission's series The Stories of Transformation. Lucknow has always been known as a city of etiquette and culture, but the film admits that this identity had started to blur, with a dumping yard grown into a mountain. Then, in 2014, the Swachh Bharat Mission began. We follow Durgawati, a sanitation worker with Lucknow Nagar Nigam for ten years, and Swati Dwivedi, a ward in-charge in Zone 3, as waste is collected from every household, sorted into bottles, plastics, metal, glass and board, compacted at transfer stations and taken to the Shivri plant. Around 18.5 lakh metric tonnes of old waste are processed, a command centre and the 1533 helpline take complaints, and where garbage once stood 25 to 30 metres high there is now a park. The film ends on the city's climb from 44th in the Swachh Survekshan to among the three cleanest cities in the country.",
    ],
    story: chapters(
      "What does it take to turn a city's mountains of garbage back into parks, and who does the work every morning?",
      "The film follows the people who keep the city clean, from a sanitation worker and a ward in-charge to the engineers at the plants and the officials who run the mission.",
      "Lucknow's monuments and streets open the film, the years of garbage turn to black and white, and colour returns with the sorting lines, the command centre and aerial views of the new park, with English subtitles over Hindi.",
    ),
    quote: {
      text: "My work looks easy to people, but it is not.",
      name: "Durgawati",
      role: "sanitation worker, Lucknow Nagar Nigam",
    },
    // (confirm the client: the Swachh Bharat Mission's film, with Lucknow's Nagar Nigam)
    // stills to take: the sweeper against the sky (2:00), the sorting line (3:50), the park from the air (8:30)
  },
  {
    slug: "vishwakarma-the-creators",
    title: "Vishwakarma: The Creators",
    summary:
      "A 400-year-old craft of Varanasi that its people gave a pink colour, and the artisans the PM Vishwakarma Yojana is helping to carry it on.",
    year: 2026,
    tags: ["Impact film"],
    client: "Central Govt. of India",
    duration: "13:08",
    place: "Varanasi, Uttar Pradesh",
    image: "/work/vishwakarma-the-creators.webp",
    body: [
      "Varanasi lit at night, and a craft four hundred years old that the people here gave a pink colour, its drawing designed first. The artisans who learnt it from their ancestors tell of a time they wondered if learning it was a mistake; the PM Vishwakarma Yojana's training and stipend, and a stall at an international trade show, follow.",
    ],
    // (written from the film's English subtitles, for when it's released: check the words then, and write its story)
    // its thumbnail: sunrise over the Ganga (0:57)
  },
  {
    slug: "solar-revolution",
    title: "Solar Revolution: India's Rise in the Solar Era",
    summary:
      "Rooftop solar under PM Surya Ghar in Lucknow: homes that now make their own power, and bills brought down to zero.",
    year: 2026,
    tags: ["Impact film"],
    client: "Central Govt. of India",
    duration: "12:05",
    place: "Lucknow, Uttar Pradesh",
    image: "/work/solar-revolution.webp",
    body: [
      "Power cuts around the world open the film; then Lucknow, where a beneficiary, a solar consultant and families with panels on their roofs talk about life before and after PM Surya Ghar: technical approval within seven to fifteen days, the motor, the AC and the cooler running, and, it says, 1.7 million families with zero bills.",
    ],
    // (written from the film's English subtitles, for when it's released: check the words then, and write its story)
    // its thumbnail: the solar farm from the air (12:02)
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
