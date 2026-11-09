/* Add a project = add an object here. It appears on /projects and gets its own /projects/<slug> page. */
export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  featured?: boolean;
  image?: string; // poster or still hung in the gallery, e.g. "/work/my-film.webp" (put the file in public/work/)
  client?: string; // who it was made for
  trailer?: string; // a short silent clip (15–30 s, 720p MP4) that plays in the gallery frame
  video?: string; // a video file, e.g. "/work/my-film.mp4", shown on the project page
  link?: string; // watch / live link
  repo?: string; // secondary link
  body: string[]; // the opening paragraphs of the case study

  // The rest of the case study (all optional):
  format?: string; // e.g. "Feature documentary, 92 min"
  stills?: string[]; // frames from the film, e.g. ["/work/my-film-1.webp", ...]. Leave out for stand-ins
  story?: { heading: string; text: string[] }[]; // short chapters: the question, the access, the making...
  quote?: { text: string; name: string; role?: string }; // from someone in the film, or the client
  credits?: { role: string; name: string }[];
};

/* Stand-in chapters, quote and credits for the sample projects, until real ones are written. */
const SAMPLE_CASE = {
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
  {
    slug: "sample-documentary",
    title: "Sample Documentary",
    summary: "A short one-line description of the film and why it matters.",
    year: 2026,
    tags: ["Documentary", "Feature"],
    format: "Feature documentary, 92 min",
    client: "Famecast",
    featured: true,
    link: "https://example.com",
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
  {
    slug: "sample-short",
    title: "Sample Short",
    summary: "Another placeholder entry to show the list layout.",
    year: 2024,
    tags: ["Short"],
    featured: true,
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
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

/* The project after this one, wrapping round to the first. */
export const nextProject = (slug: string) => {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return PROJECTS[(i + 1) % PROJECTS.length];
};
