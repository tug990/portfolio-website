import { WORK_CLIENTS } from "./site";

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

/* Stand-in chapters, quote and credits for the sample projects, until real ones are written. */
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

export const PROJECTS: Project[] = [
  // The first screen (left wall, nearest the entrance), playing from YouTube.
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
    slug: "sample-series",
    title: "Sample Series",
    summary: "Replace this with your next piece of work.",
    year: 2025,
    tags: ["Series", "Branded"],
    featured: true,
    ...SAMPLE_CASE,
    body: ["Write the story of this project here."],
  },
  // On the far wall (left screen), playing from YouTube on the wall and in its case study.
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
  // Placeholders so the gallery's six screens are full. Replace or delete them.
  {
    slug: "sample-portrait",
    title: "Sample Portrait",
    summary: "A character documentary. Replace with a real one-line description.",
    year: 2025,
    tags: ["Documentary", "Short"],
    ...SAMPLE_CASE,
    body: ["Write the story of this project here."],
  },
  {
    slug: "sample-investigation",
    title: "Sample Investigation",
    summary: "A longer investigative piece. Replace with your own.",
    year: 2025,
    tags: ["Documentary", "Feature"],
    ...SAMPLE_CASE,
    body: ["Write the story of this project here."],
  },
  {
    slug: "sample-brand-film",
    title: "Sample Brand Film",
    summary: "A true story told for a brand. Replace with your own.",
    year: 2024,
    tags: ["Branded", "Short"],
    ...SAMPLE_CASE,
    body: ["Write the story of this project here."],
  },
  // More placeholders, so the Work page shows a full listing (20 films), spread
  // across the clients so each "Initiatives of" badge has films to show.
  // PLACEHOLDERS ONLY: replace each with a real film (or delete it) before this
  // goes live, or the site shows "Sample Film" under real clients' names.
  ...Array.from({ length: 14 }, (_, i): Project => {
    const n = String(i + 7).padStart(2, "0");
    return {
      slug: `sample-film-${n}`,
      title: `Sample Film ${n}`,
      summary: "A placeholder film. Replace with a real one.",
      year: 2025 - (i % 4),
      tags: [["Documentary", "Impact film", "Campaign", "Series"][i % 4]],
      client: WORK_CLIENTS[i % WORK_CLIENTS.length].name,
      ...SAMPLE_CASE,
      body: ["Write the story of this project here."],
    };
  }),
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
