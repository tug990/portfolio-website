import type { ServiceBook } from "@/content/service-books";

/*
  The healthcare Service Book: hospitals, clinics, diagnostic centres and health programmes, as
  its world shows it. Written within the National Medical Commission’s guidelines on ethical
  advertising and public communication (October 2026), ASCI’s healthcare guidelines and the DPDP
  Act: no cure or outcome claims, no superlatives, no promotional patient stories or testimonials,
  patients filmed only with informed, written consent. Its research findings are sourced.
*/
export const HEALTHCARE: ServiceBook = {
  // told as a film: the footage it’s cut with (supplied to us, one shot to a loop)
  reel: {
    loops: { intro: "hc-building", research: "hc-complex", talk: "hc-doctor" },
    services: {
      "hospital-story": "hc-complex",
      "care-team": "hc-gurney",
      "care-explainer": "hc-doctor",
      "health-awareness": "hc-building",
      "community-health": "hc-complex",
      "recruitment-film": "hc-gurney",
    },
    cut: { lines: ["Let patients", "see the care"], loop: "hc-gurney" },
    trail: ["hc-01", "hc-02", "hc-03", "hc-04", "hc-05", "hc-06", "hc-07", "hc-08", "hc-09"],
  },
  itemWord: "Film",
  cover: {
    kicker: "For hospitals and health programmes",
    title: "Show people the hospital your staff know.",
    text: "Documentary films made on your wards and at your outreach camps, with the doctors and nurses who work there.",
  },
  intro: {
    title: "What families see before they reach you",
    lead: "We make documentary films with the people who work in your hospital, for families who have only seen it from the road and for the doctors who refer patients to you.",
    text: [
      "The monthly review starts with the numbers. OPD (outpatient department) footfall first, then bed occupancy against the target. Referrals are broken down by consultant, and the claims stuck with TPAs (third-party administrators) or pending under PM-JAY (Ayushman Bharat) get a slide of their own. Near the end, someone reads out last month’s Google reviews. A two-line complaint about the wait at the billing counter can take more of that hour than the cardiac unit you opened in the spring.",
      "No one reads out what the night nurse did. At three in the morning she saw a patient’s oxygen saturation dropping and had the resident at the bedside within minutes. The counsellor who sat with a family over the insurance papers the evening before an operation isn’t on a slide either.",
      "Outside, a family bringing their mother in for an operation has your Google listing and a page of doctors’ names to go on. The rest they hear from a relative, or from their family doctor.",
      "We film your nurses and doctors at work, and they explain what they do. Each of the six films below is for someone different. A nurse choosing between your offer and one from a hospital in a metro will want to see a night shift on your wards first. A family that took their father home after a bypass may need the discharge instructions again, in Tamil, a few days later.",
    ],
    outcomesTitle: "Who the films are for",
    outcomes: [
      { title: "Families", text: "See the ward before the admission", icon: "heart" },
      { title: "Patients", text: "Arrive knowing what to bring and whether to fast", icon: "book" },
      {
        title: "Your catchment area",
        text: "Hears when to get checked, in the local language",
        icon: "megaphone",
      },
      {
        title: "CSR partners",
        text: "See a camp their corporate social responsibility (CSR) funds supported",
        icon: "chart",
      },
      {
        title: "Nurses",
        text: "See a shift on your wards before they accept the offer",
        icon: "people",
      },
      {
        title: "Online",
        text: "Your Google listing shows your nurses and doctors",
        icon: "globe",
      },
    ],
  },
  research: {
    title: "What patients look up, and who travels for care",
    text: "Patients search about their illness before and after they see your doctors, and many trust what they find. The figures below come from studies and government numbers published in 2025 and 2026.",
    stats: [
      {
        figure: "83%",
        text: "of patients in India say they look for objective information they can understand when making choices about their care, a 2025 study found. Only around a third can find it easily.",
        sources: [
          {
            label: "FICCI and EY-Parthenon, October 2025",
            href: "https://ey.com/en_in/newsroom/2025/10/transparency-drives-patient-choice-9-in-10-indians-willing-to-pay-more-for-certified-healthcare-ficci-ey-parthenon-report",
          },
        ],
      },
      {
        figure: "78.5%",
        text: "of patients surveyed in Delhi and the National Capital Region in 2026 went to Google or social media after seeing a doctor, because something about the diagnosis or the next steps wasn’t clear.",
        sources: [
          {
            label: "India Patient Navigation and Confusion Index 2026 (PTI), via ThePrint",
            href: "https://theprint.in/india/nearly-80-pc-delhi-ncr-patients-turn-to-google-after-doctor-visits-study/2955453/",
          },
        ],
      },
      {
        figure: "60%",
        text: "of Indian respondents in a 2026 survey said online health information is as reliable as advice from a health professional, 19 points above the global average. 61% would rather have an instant answer from an AI tool or a website than wait for a health professional.",
        sources: [
          {
            label: "BCG, The Consumerization of Health Care, 2026",
            href: "https://www.bcg.com/publications/2026/health-care-consumerization-patients",
          },
          {
            label: "BCG’s India findings, via Passionate in Marketing",
            href: "https://www.passionateinmarketing.com/six-in-ten-indian-consumers-trust-ai-and-online-health-information-as-much-as-advice-from-health-care-professionals-bcg-study/",
          },
        ],
      },
      {
        figure: "6.44 lakh",
        text: "foreign tourists came to India for medical treatment in 2024, according to Bureau of Immigration figures given in the Lok Sabha.",
        sources: [
          {
            label: "DD News, February 2026",
            href: "https://ddnews.gov.in/en/over-6-4-lakh-foreign-tourists-visited-india-for-medical-treatment-in-2024/",
          },
        ],
      },
    ],
    note: "Much of what your patients read about their illness is written by people who have never seen them. A short film from one of your own nurses, sent on WhatsApp in the family’s language, gives them something from your hospital to go back to.",
  },
  glance: {
    title: "Six films at a glance",
    columns: [
      { label: "Made for", key: "madeFor" },
      { label: "What it does", key: "short" },
    ],
  },
  start: {
    title: "Not sure where to start?",
    text: "Tap the line that sounds most like your hospital right now.",
    picks: [
      {
        line: "“People around here know where we are, and very little about what our teams do.”",
        service: "hospital-story",
      },
      {
        line: "“Our doctor pages list degrees and OPD timings, and nothing else.”",
        service: "care-team",
      },
      {
        line: "“Patients come in for procedures unprepared, and our theatre list slips.”",
        service: "care-explainer",
      },
      {
        line: "“Patients from our area come to us late, at an advanced stage.”",
        service: "health-awareness",
      },
      {
        line: "“Our CSR partner sees a spreadsheet of camps and a group photo.”",
        service: "community-health",
      },
      {
        line: "“We keep hiring nurses, and many leave within the year.”",
        service: "recruitment-film",
      },
    ],
  },
  servicesTitle: "Six films for your hospital or health programme",
  services: [
    {
      id: "hospital-story",
      name: "Hospital Story Film",
      short: "Shows a day and a night in your hospital",
      madeFor: "Families and referring doctors",
      line: "Your emergency team on a night shift and your OPD in the morning, filmed with the people on duty, for families and referring doctors.",
      tags: ["For: Families and referring doctors", "Languages: English and regional"],
      familiar: [
        "The video on your website starts with a drone shot over the building and moves on to the new machines. The voice-over could be describing any hospital in the city.",
        "Families ask your front office who looks after the patient at night, and whether someone will go through the bill with them before discharge. The website video doesn’t answer either.",
      ],
      does: [
        "We spend a week filming your emergency team, the wards and housekeeping, and the staff there say what their job is.",
        "Each department appears with the people who run it. Your emergency services and your NABH (National Accreditation Board for Hospitals and Healthcare Providers) accreditation are in it too, as plain facts.",
      ],
      receive: [
        "One documentary film about your hospital",
        "Short versions for your Google listing and social media pages",
        "Versions in English and in the languages your patients speak",
        "Subtitled versions for your international patient desk",
        "Photographs of your teams and wards",
      ],
      example: [
        "A trust-run hospital in a district town has looked after the area for decades. The trustees hear that younger families nearby think of it as the old building on the main road. We spend a week there, including a night in the emergency and the nurses’ handover the next morning.",
        "The film plays in the waiting areas and sits on the hospital’s Google listing. HR shows it to new staff on their first day.",
      ],
      fits: [
        "Your website and social pages show machines and rooms, and hardly any of your staff",
        "You’ve opened a new block or a new branch",
        "You’ve received or renewed NABH accreditation",
        "Patients come to you from other states or countries",
      ],
    },
    {
      id: "care-team",
      name: "Department and Care-team Films",
      short: "One film for each department, with its team",
      madeFor: "Patients and referring doctors",
      line: "Your doctor directory, with each department’s team on film. A patient knows who they’re going to see before their token number comes up.",
      tags: ["For: Patients and referring doctors"],
      familiar: [
        "The orthopaedics page on your website is a paragraph and a stock photograph of an X-ray.",
        "The front desk still takes calls all morning from patients asking which department to go to, and what happens after they’ve seen the doctor.",
      ],
      does: [
        "We film one department at a time, its team and the rooms a patient passes through, following a visit from registration to the follow-up appointment.",
        "It opens with the doctors’ qualifications and how to book, which is what patients ask the front desk first.",
      ],
      receive: [
        "One film for each department",
        "A short clip for each doctor’s directory entry, with their qualifications, specialty and OPD days",
        "A version for the screens in your OPD waiting area",
        "Versions in Hindi and the local language",
      ],
      example: [
        "A multi-speciality hospital is opening a cardiac sciences department. The marketing team has a launch date, and a web page with a list of names on it. We film the department over two days. A cardiologist explains what a first consultation involves, and a technician shows what happens during an ECG and an echocardiogram. The counsellor explains costs and cashless pre-authorisation, as she would to a family at her desk.",
        "The doctors’ introductions go on the directory page. In the OPD waiting area, the full film runs between token announcements.",
      ],
      fits: [
        "Your department pages don’t show the team",
        "You’re opening or expanding a department",
        "Patients often arrive unsure which department to go to",
      ],
    },
    {
      id: "care-explainer",
      name: "Care Explainer Film",
      short: "Tells patients what to expect",
      madeFor: "Patients and families",
      line: "What your nurses explain at the admission desk all day, filmed once, in the language the family speaks at home.",
      tags: ["For: Patients and families", "Languages: Hindi and regional"],
      familiar: [
        "Your nurses and front office answer the same questions every day. “Can she eat in the morning?” “What do we bring?”",
        "The printed instruction sheet is in English, and the family reads Odia.",
      ],
      does: [
        "We make short films in which one of your nurses takes the family through a procedure, or a discharge, a step at a time.",
        "Families get them on WhatsApp once the procedure is booked. Your quality team can keep them on file with your patient and family education material for NABH.",
      ],
      receive: [
        "Short explainer films, from admission to discharge",
        "Versions in Hindi and the local language",
        "Versions for WhatsApp and the waiting-area screens",
        "Scripts written with your nursing and clinical teams",
        "Simple on-screen graphics for each step and its timing",
      ],
      example: [
        "At a hospital’s monthly quality meeting, the nursing head raises it again. Day-care surgery patients keep arriving after breakfast, and their procedures get pushed down the list. We make a three-minute film with a staff nurse, in Hindi and Marathi. She goes through fasting first, because that is where the list breaks down, and ends with when the family can take the patient home.",
        "The front office sends it to every day-care patient, and it runs on a screen at the admission desk.",
      ],
      fits: [
        "Patients arrive unprepared for procedures or tests",
        "Your patients speak several languages",
        "You’re preparing for an NABH assessment",
      ],
    },
    {
      id: "health-awareness",
      name: "Health Awareness Film",
      short: "Explains screening and prevention",
      madeFor: "People in the area you serve",
      line: "When to get checked, explained by your doctors and by the health workers people in the villages already know.",
      tags: ["For: People in the area you serve", "Languages: Hindi and regional"],
      familiar: [
        "Your doctors see patients who present late, with illnesses a routine test a few months earlier might have picked up.",
        "The posters in the OPD corridor go unread, and a doctor’s talk at a camp reaches only the people who came that afternoon.",
      ],
      does: [
        "These are public health films for people in your area, in the local language. One of your doctors, or a community health worker, explains the early signs of an illness and when to get checked.",
      ],
      receive: [
        "Awareness films in the local language",
        "Versions for camp screenings and for WhatsApp",
        "Doctors and community health workers from your area on screen",
        "Simple graphics for warning signs and next steps",
        "Films planned around health days and your camp calendar",
      ],
      example: [
        "A medical superintendent in a district town keeps seeing people with diabetes arrive after the complications have set in. We make a short film in the local language, with one of its doctors and an ASHA (accredited social health activist) from a nearby village. Between them they explain who should get a sugar test, and how often.",
        "It plays at the hospital’s screening camps. The ASHA workers send it round their village WhatsApp groups.",
      ],
      fits: [
        "Your doctors already give health talks in the community",
        "You run screening camps or mark health days",
        "The people you serve speak more than one local language",
        "You run a public health programme with a government department or a non-profit",
      ],
    },
    {
      id: "community-health",
      name: "Community Health and CSR Film",
      short: "Takes your partners to your camps",
      madeFor: "CSR partners and trustees",
      line: "Your CSR report counts the camps. The film takes your partner’s CSR committee out to one with your outreach team, and back for the follow-up visits weeks later.",
      tags: ["For: CSR partners and trustees"],
      familiar: [
        "Your outreach team runs camps all year, in villages and the city’s bastis. Your CSR partner gets the number of people screened, and little else.",
        "Next year’s funding is decided in a committee room, often without anyone in it having stood at one of your camps.",
      ],
      does: [
        "We go out with your outreach team and film a full camp day. The figures from your own records appear on screen beside the work they count.",
      ],
      receive: [
        "A film of your camps or outreach programme",
        "Figures from your records shown on screen",
        "Interviews with your outreach staff and local health workers",
        "Versions for the CSR report and the board meeting",
        "Photographs of your outreach team for reports and your website",
      ],
      example: [
        "A hospital runs eye-screening camps in villages across two districts, paid for from a company’s CSR budget. The renewal is on the agenda at the company’s next CSR committee meeting. We go out with the team for one camp season. The film starts with a camp set up in a school, and it follows the team through the cataract referrals and back out for the follow-up visits weeks later.",
        "The company shows it to its CSR committee. The hospital puts it in its next proposal.",
      ],
      fits: [
        "You run camps or mobile health units",
        "Your work is funded by CSR partners or donors",
        "Your trustees rarely see the work in the field",
        "You’re preparing a CSR or annual report",
      ],
    },
    {
      id: "recruitment-film",
      name: "Recruitment and Induction Film",
      short: "Shows nurses a shift, and inducts new staff",
      madeFor: "Nurses and technicians",
      line: "A shift on your wards, for nurses deciding where to work, and induction films for their first week.",
      tags: ["For: Nurses and technicians", "Plus: Induction films for new staff"],
      familiar: [
        "Your nursing superintendent has vacancies on most wards. The good nurses have offers from the metros and from abroad. All they see of you is a job advertisement.",
        "When someone does join, the first two weeks go on forms and introductions, and some leave before they’ve settled on a ward.",
      ],
      does: [
        "We film a working week on your wards and at the hostel, with your nurses and technicians doing the talking.",
        "A second set of films is for induction. It takes new staff through your wards and routines, starting with infection control. Every batch of new joiners sees the same films.",
      ],
      receive: [
        "A recruitment film for your careers page and the nursing colleges you visit",
        "Short versions for social media and campus visits",
        "Induction films on your departments and routines",
        "Training films on routines such as hand hygiene and fire safety",
        "Interviews with nurses and technicians who already work with you",
      ],
      example: [
        "A hospital’s HR head has to hire several dozen nurses before a new wing opens, and the job posts are getting few replies. We film there for a week, handovers and tea breaks included, and ride the bus into town with the nurses from the hostel.",
        "The film goes out to nursing colleges and job portals. New joiners watch the induction films in their first week.",
      ],
      fits: [
        "You struggle to hire or keep nurses and technicians",
        "You’re adding beds and need the staff for them",
        "New staff take a long time to settle in",
        "You recruit from nursing colleges or other states",
      ],
    },
  ],
  together: {
    title: "How we work with your hospital",
    text: "We work with a hospital for 3, 6 or 12 months and spread the films across that time.",
    ways: [
      {
        title: "Six films",
        text: "Each one for someone different, from the families nearby to the nurses you hire",
      },
      {
        title: "For phones and screens",
        text: "Short versions to send on WhatsApp and to play in the OPD waiting area",
      },
      {
        title: "Films through the year",
        text: "The films are spaced across the months, in step with your health days and camp season",
      },
    ],
    plans: [
      {
        months: 3,
        name: "Starter",
        text: "For a first project, such as a department launch or an NABH assessment coming up.",
        items: [
          "Department Films: 1 department",
          "Care Explainer: 2 films",
          "Health Awareness Film: 1 local-language film",
          "Recruitment Film: 1 film",
        ],
      },
      {
        months: 6,
        name: "Growth",
        text: "Films for patients and partners across half a year.",
        items: [
          "Hospital Story Film: 1 film",
          "Department Films: up to 3 departments",
          "Care Explainer: up to 5 films",
          "Health Awareness Film: up to 3 films",
          "Community Health Film: 1 film",
          "Recruitment and Induction: recruitment film and induction films",
        ],
      },
      {
        months: 12,
        name: "Full Partnership",
        text: "For a hospital group or a health programme that wants a year of its work on film, across its departments and its outreach.",
        items: [
          "Hospital Story Film: 1 film and a year-end update",
          "Department Films: up to 6 departments",
          "Care Explainer: up to 10 films",
          "Health Awareness Film: up to 6 films, around health days",
          "Community Health Film: 2 films and 1 annual film",
          "Recruitment and Induction: recruitment film and a full induction set",
        ],
      },
    ],
  },
  compare: {
    title: "Compare the partnerships",
    columns: ["3 Months", "6 Months", "12 Months"],
    rows: [
      { service: "Hospital Story Film", cells: ["", "1", "1 + year-end update"] },
      {
        service: "Department and Care-team Films",
        cells: ["1 department", "Up to 3 departments", "Up to 6 departments"],
      },
      { service: "Care Explainer Film", cells: ["2", "Up to 5", "Up to 10"] },
      { service: "Health Awareness Film", cells: ["1", "Up to 3", "Up to 6"] },
      { service: "Community Health and CSR Film", cells: ["", "1", "2 + 1 annual"] },
      {
        service: "Recruitment and Induction Film",
        cells: [
          "Recruitment film",
          "Recruitment + induction films",
          "Recruitment + full induction set",
        ],
      },
    ],
    note: "Films marked “Not included” can be added at extra cost.",
    advice: "You can start with 3 or 6 months and extend to 12 later.",
  },
  talk: {
    kicker: "Let’s talk",
    title: "Tell us about your hospital",
    text: "Write to us about your hospital or health programme, and who outside it should see the work, whether that’s the families nearby or this year’s nursing graduates.",
    steps: [
      { title: "Talk", text: "A call about your hospital and who the films are for" },
      { title: "Plan", text: "We suggest which films to make" },
      { title: "Film", text: "We film your teams at work" },
    ],
  },
};
