import type { PerspectiveId } from "@/content/site";
import { CORPORATE } from "@/content/books/corporate";
import { GOVERNMENT } from "@/content/books/government";
import { NGO } from "@/content/books/ngo";
import { REAL_ESTATE } from "@/content/books/real-estate";
import { EDUCATION } from "@/content/books/education";

/*
  The Service Books: one for each of the About page's perspectives, the
  studio's printed guide to what it makes for them (Insight Lab - <who>
  Service Book.pdf), as a perspective's world shows it (ServiceBook.tsx).
  Each book is a file of its own in content/books/. Its words are the
  book's own; its type and colours are the site's, not the printed book's. A part a book doesn't
  have is left out (Government has no packages, but its portfolio and the
  ways it's commissioned).
*/

export type OutcomeIcon =
  | "people"
  | "person"
  | "book"
  | "building"
  | "globe"
  | "film"
  | "chart"
  | "heart"
  | "eye"
  | "megaphone"
  | "pin"
  | "archive"
  | "star"
  | "check"
  | "key"
  | "flag";

export type Link = { label: string; href: string };

export type Service = {
  id: string;
  name: string;
  /* at a glance: what it does (or, as the corporate book, the need it answers) */
  short: string;
  /* at a glance: who it's made for, where the book says */
  madeFor?: string;
  /* the line under its name on its own page */
  line: string;
  /* small labels: format, release, who it's for */
  tags: string[];
  /* "Does this sound familiar?" */
  familiar?: string[];
  /* "What this film does" (or `doesTitle`: "What this service does", "What it is") */
  does: string[];
  doesTitle?: string;
  /* "Where it is used" (Government) */
  uses?: string[];
  usesTitle?: string;
  /* a row of small labels: the sectors it's made for (Government) */
  areas?: string[];
  /* "What you receive" (or `receiveTitle`: "What we deliver") */
  receive: string[];
  receiveTitle?: string;
  /* "What you gain" */
  gain?: string[];
  /* "A real example" */
  example?: string[];
  /* "Our work": the studio's own projects of this kind (Government) */
  work?: { title: string; text: string }[];
  /* "Is this right for you?" */
  fits?: string[];
  /* panels of their own: how the journey is filmed, what each platform does, the events covered… */
  panels?: { title: string; items: { name: string; text: string }[] }[];
  closing?: string;
};

/*
  The book told as a film (the About page, StoryFilm.tsx): the shots it's cut with (loops in
  public/about/loops/, by name: <name>-wide / -tall / -reel .mp4 and .jpg).
*/
export type Reel = {
  /* the shots behind the introduction, the research and the closing, in black and white (on a
     phone a shot with people close to the camera is shown whole) */
  loops: { intro: string; research: string; talk: string };
  /* each service's shot (behind its scene in the film, and at the top of its details), by its id */
  services: Record<string, string>;
  /* a few words cut out of the page with a film inside them (the loop's name), before the films */
  cut: { lines: string[]; loop: string };
  /* stills from the films that follow the cursor over the opening photograph
     (public/about/trail/<name>.jpg) */
  trail: string[];
};

export type ServiceBook = {
  /* told as a film: the loops it's cut with (see Reel) */
  reel?: Reel;
  /* what each is called: "Service", "Film type", "Film" ("Service 3 of 8") */
  itemWord: string;
  cover: { kicker: string; title: string; text: string };
  intro: {
    title: string;
    lead: string;
    text: string[];
    outcomesTitle: string;
    outcomes: { title: string; text: string; icon: OutcomeIcon }[];
  };
  research: {
    title: string;
    text: string;
    stats: { figure: string; text: string; sources?: Link[] }[];
    /* "What this means: …", or a caution, under the findings */
    note?: string;
    /* sources for the findings as a whole, where they aren't each one's */
    sources?: Link[];
  };
  /* the services at a glance: its title, and its columns after the name (`short`, `madeFor`) */
  glance: {
    title: string;
    columns: { label: string; key: "short" | "madeFor" }[];
  };
  /* "Not sure where to start?": the sentence closest to your need, and the service it opens */
  start: { title: string; text: string; picks: { line: string; service: string }[] };
  /* which film fits each stage of their year (or a project's life) */
  year?: {
    kicker: string;
    title: string;
    text: string;
    stages: { name: string; services: string[]; text: string }[];
  };
  servicesTitle: string;
  services: Service[];
  /* the studio's projects for them, each with the service it was (Government) */
  portfolio?: {
    title: string;
    text: string;
    rows: { project: string; for: string; service: string; note?: string }[];
  };
  together: {
    title: string;
    text: string;
    /* how they can work with us: on its own and contracts, or how a department commissions */
    waysTitle?: string;
    ways: { title: string; text: string }[];
    plans?: { months: number; name: string; text: string; items: string[] }[];
    path?: { title: string; text: string }[];
    /* "What departments can expect" (Government) */
    expect?: { title: string; items: { title: string; text: string }[] };
  };
  compare?: {
    title: string;
    /* the options, left to right; `together.plans` match the ones after the first */
    columns: string[];
    rows: { service: string; cells: string[] }[];
    note: string;
    advice: string;
  };
  talk: {
    kicker: string;
    title: string;
    text: string;
    steps: { title: string; text: string }[];
  };
};

export const SERVICE_BOOKS: Partial<Record<PerspectiveId, ServiceBook>> = {
  ngo: NGO,
  corporate: CORPORATE,
  government: GOVERNMENT,
  "real-estate": REAL_ESTATE,
  education: EDUCATION,
};
