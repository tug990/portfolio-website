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
  body: string[]; // paragraphs for the case-study page
};

export const PROJECTS: Project[] = [
  {
    slug: "sample-documentary",
    title: "Sample Documentary",
    summary: "A short one-line description of the film and why it matters.",
    year: 2026,
    tags: ["Documentary", "Feature"],
    featured: true,
    link: "https://example.com",
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
    body: ["Write the story of this project here."],
  },
  {
    slug: "sample-short",
    title: "Sample Short",
    summary: "Another placeholder entry to show the list layout.",
    year: 2024,
    tags: ["Short"],
    featured: true,
    body: ["Write the story of this project here."],
  },
  // Placeholders so the gallery's six screens are full. Replace or delete them.
  {
    slug: "sample-portrait",
    title: "Sample Portrait",
    summary: "A character documentary. Replace with a real one-line description.",
    year: 2025,
    tags: ["Documentary", "Short"],
    body: ["Write the story of this project here."],
  },
  {
    slug: "sample-investigation",
    title: "Sample Investigation",
    summary: "A longer investigative piece. Replace with your own.",
    year: 2025,
    tags: ["Documentary", "Feature"],
    body: ["Write the story of this project here."],
  },
  {
    slug: "sample-brand-film",
    title: "Sample Brand Film",
    summary: "A true story told for a brand. Replace with your own.",
    year: 2024,
    tags: ["Branded", "Short"],
    body: ["Write the story of this project here."],
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
