/* Add a project = add an object here. It appears on /projects and gets its own /projects/<slug> page. */
export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  featured?: boolean;
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
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
