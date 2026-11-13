/* Edit this file to make the site yours. Copy below is placeholder. */
export const SITE = {
  name: "Insight Lab",
  role: "A non-fiction studio by Famecast",
  tagline: "Where the light comes through.",
  description:
    "Insight Lab is a non-fiction studio by Famecast. A portfolio of documentaries, series and stories rooted in what is real.",
  email: "info@insightlab.media",
  url: "https://example.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
};

/* About page headline: each word hangs on its own card. */
export const ABOUT_HEADLINE = "We film what is real";
export const ABOUT_INTRO =
  "Insight Lab, a non-fiction studio by Famecast. Documentaries, series and true stories, told with care from first question to final cut.";

/* About page, "Expertise": `tags` is the small line under each description. */
export const EXPERTISE = [
  {
    title: "Development",
    text: "Ideas shaped into stories worth telling, with the research done before anything is filmed.",
    tags: "Research, access, treatments, pitching",
  },
  {
    title: "Documentary Production",
    text: "Feature films, series and shorts, from the first interview to the final cut.",
    tags: "Features, docu-series, shorts",
  },
  {
    title: "Branded Non-Fiction",
    text: "True stories for brands and creators, told with a documentary eye.",
    tags: "Brand films, campaigns, creator series",
  },
  {
    title: "Post-Production",
    text: "Edit, grade, sound and delivery under one roof.",
    tags: "Edit, colour, sound, delivery",
  },
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

/* About page, "Our story": the work history timeline. Oldest first.
   `year` places it on the timeline; `years` is how the date reads. */
export const HISTORY: {
  year: number;
  years: string;
  title: string;
  place: string;
  text: string;
}[] = [
  {
    year: 2018,
    years: "2018 to 2021",
    title: "Replace with a role",
    place: "Company or project, City",
    text: "One or two sentences about what you did here and what you learned.",
  },
  {
    year: 2021,
    years: "2021 to 2024",
    title: "Replace with a role",
    place: "Company or project, City",
    text: "One or two sentences about what you did here and what you learned.",
  },
  {
    year: 2024,
    years: "2024 to present",
    title: "Insight Lab opens",
    place: "Famecast, India",
    text: "A non-fiction studio for documentaries, series and true stories.",
  },
];

/* About page, "In their words". `image` is optional (a portrait in public/). */
export const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
  company: string;
  image?: string;
}[] = [
  {
    quote: "Replace this with something a collaborator or client said about working with you.",
    name: "Name Surname",
    role: "Role",
    company: "Company",
  },
  {
    quote: "A second quote. Keep each one to two or three sentences.",
    name: "Name Surname",
    role: "Role",
    company: "Company",
  },
];

/* About page, "Worked with": who you made things for. */
export const CLIENTS: { year: number; name: string; field: string; work: string }[] = [
  { year: 2025, name: "Client one", field: "Field", work: "Documentary, series" },
  { year: 2024, name: "Client two", field: "Field", work: "Brand film" },
  { year: 2024, name: "Client three", field: "Field", work: "Docu-series" },
  { year: 2023, name: "Client four", field: "Field", work: "Short film" },
  { year: 2022, name: "Client five", field: "Field", work: "Campaign" },
];

/* About page, "At the bench": the team. `image` is optional (a portrait in public/). */
export const TEAM: {
  name: string;
  role: string;
  image?: string;
  links: { label: string; href: string }[];
}[] = [
  {
    name: "Your name",
    role: "Founder, director",
    links: [{ label: "Instagram", href: "https://instagram.com/" }],
  },
  {
    name: "Team member",
    role: "Producer",
    links: [{ label: "LinkedIn", href: "https://linkedin.com/" }],
  },
  {
    name: "Team member",
    role: "Editor",
    links: [{ label: "Vimeo", href: "https://vimeo.com/" }],
  },
];
export const TEAM_INTRO =
  "Replace this with a line about the team: where you work from and how you work together.";

/* About page, "Awards". `project` is a slug from projects.ts: hovering the
   prize shows that project's image. Leave the list empty to hide the section. */
export const AWARDS: { name: string; result: string; year: number; project?: string }[] = [
  { name: "Festival or award", result: "Winner", year: 2025, project: "sample-documentary" },
  { name: "Festival or award", result: "Official selection", year: 2024, project: "sample-series" },
  { name: "Festival or award", result: "Nominee", year: 2024, project: "sample-short" },
];

/* Work page (/projects): the words at the top. */
export const WORK_PAGE = {
  eyebrow: "Our work",
  headline: "Stories that\ncreate impact.", // \n: where the line breaks on wider screens
  intro: "Documentaries, impact films and campaigns for people, communities and change.",
};

/*
  The studio's clients. On the Work page, "Initiatives of": a glass pill per
  client, in this order (ClientBadge in components/work/WorkUI.tsx), and
  picking one shows only that client's films (a film is theirs when its
  `client` in projects.ts is exactly this `name`). On a film's page, the
  client card: their emblem, their name (in `color`), and `about`.

    mark        their emblem, exactly as on their badge (cut out, background
                removed), in public/clients/marks/
    markIsLogo  the mark is their whole logo, name included (no words beside it)
    small, big  the words beside the emblem on their pill, as on their badge:
                a small line above, a big line in `color`
    rule        the line under the words: India's tricolour, or SIDHKOFED's
    color       their name's colour
    about       a line about them on a film's page (optional)
*/
export type WorkClient = {
  name: string;
  mark: string;
  markIsLogo?: boolean;
  small?: string;
  big?: string;
  rule?: "tricolour" | "sidhkofed";
  color: string;
  about?: string;
};
export const WORK_CLIENTS: WorkClient[] = [
  {
    name: "Central Govt. of India",
    mark: "/clients/marks/central-govt-of-india.webp",
    small: "Central",
    big: "Govt. of India",
    rule: "tricolour",
    color: "#15172b",
  },
  {
    name: "Chhattisgarh Govt.",
    mark: "/clients/marks/chhattisgarh-govt.webp",
    small: "Government of",
    big: "Chhattisgarh",
    rule: "tricolour",
    color: "#14592a",
  },
  {
    name: "Jharkhand Govt.",
    mark: "/clients/marks/jharkhand-govt.webp",
    small: "Government of",
    big: "Jharkhand",
    rule: "tricolour",
    color: "#14522a",
  },
  {
    name: "Odisha Govt.",
    mark: "/clients/marks/odisha-govt.webp",
    small: "Government of",
    big: "Odisha",
    rule: "tricolour",
    color: "#13256b",
  },
  {
    name: "NABARD",
    mark: "/clients/marks/nabard.webp",
    small: "National Bank for Agriculture and Rural Development",
    big: "NABARD",
    color: "#176b2c",
    about: "Rural development, livelihoods and sustainable growth.",
  },
  {
    name: "SIDHKOFED",
    mark: "/clients/marks/sidhkofed.webp",
    big: "SIDHKOFED",
    rule: "sidhkofed",
    color: "#14522a",
  },
  {
    name: "MLINDA Charitable Trust",
    mark: "/clients/marks/mlinda.webp",
    markIsLogo: true,
    color: "#111111",
  },
  {
    name: "Better World Foundation",
    mark: "/clients/marks/better-world-foundation.webp",
    markIsLogo: true,
    color: "#13426b",
  },
];

/* Footer call to action. */
export const CTA = {
  title: "Tell us the story you want to tell.",
  call: { label: "Book a call", href: "mailto:info@insightlab.media?subject=A%20call" },
};
