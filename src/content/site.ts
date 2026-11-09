/* Edit this file to make the site yours. Copy below is placeholder. */
export const SITE = {
  name: "Insight Lab",
  role: "A non-fiction studio by Famecast",
  tagline: "Where the light comes through.",
  description:
    "Insight Lab is a non-fiction studio by Famecast. A portfolio of documentaries, series and stories rooted in what is real.",
  email: "hello@insightlab.example",
  url: "https://example.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
};

export const EXPERTISE = [
  {
    title: "Development",
    text: "Ideas shaped into stories worth telling, with research done before anything is filmed.",
  },
  {
    title: "Documentary Production",
    text: "Feature films, series and shorts, from first interview to final cut.",
  },
  {
    title: "Branded Non-Fiction",
    text: "True stories for brands and creators, told with a documentary eye.",
  },
  { title: "Post-Production", text: "Edit, grade, sound and delivery under one roof." },
];

export const APPROACH = [
  {
    from: "Answers first",
    to: "Questions first",
    text: "We ask better questions before pointing a camera at anything.",
  },
  {
    from: "Make it loud",
    to: "Make it matter",
    text: "Every creative decision has to earn its place on screen.",
  },
  {
    from: "Good enough",
    to: "Never settle",
    text: "We keep refining until the story feels true.",
  },
];

export const FAQ = [
  {
    q: "What kinds of projects do you take on?",
    a: "Documentaries, docu-series and branded non-fiction. Replace this with your own answer.",
  },
  { q: "How long does a project take?", a: "Replace this with your typical timeline." },
  { q: "Who owns the work?", a: "Replace this with your rights and licensing policy." },
];

/* Work history: shown on the About page and on the gallery wall beside the door.
   Newest first. `place` is optional. */
export const HISTORY: { years: string; title: string; place?: string }[] = [
  { years: "2024 – now", title: "Founded Insight Lab", place: "Famecast" },
  { years: "2021 – 2024", title: "Replace with a role", place: "Company or project" },
  { years: "2018 – 2021", title: "Replace with a role", place: "Company or project" },
];
