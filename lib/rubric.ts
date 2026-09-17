export interface RubricBand {
  range: string;
  label: string;
  description: string;
}

export interface RubricCriterion {
  key: "theme_alignment" | "innovation" | "technical_implementation" | "scalability";
  title: string;
  prompt: string;
  bands: RubricBand[];
}

export const RUBRIC: RubricCriterion[] = [
  {
    key: "theme_alignment",
    title: "Theme Alignment",
    prompt:
      "Is the problem clearly defined? Does the solution directly address the hackathon theme and the identified problem?",
    bands: [
      {
        range: "1-3",
        label: "Needs Improvement",
        description: "Weak/unclear problem definition; limited connection to the theme.",
      },
      {
        range: "4-7",
        label: "Satisfactory",
        description: "Problem is clear and reasonably aligned with the theme; some gaps in relevance.",
      },
      {
        range: "8-10",
        label: "Excellent",
        description: "Problem is very clear; solution strongly and directly aligns with the theme.",
      },
    ],
  },
  {
    key: "innovation",
    title: "Innovation",
    prompt:
      "Is the idea original? Does it offer a creative or improved approach compared with existing solutions?",
    bands: [
      {
        range: "1-3",
        label: "Needs Improvement",
        description: "Mostly conventional idea; little originality or differentiation.",
      },
      {
        range: "4-7",
        label: "Satisfactory",
        description: "Shows some creativity or improvement over existing approaches.",
      },
      {
        range: "8-10",
        label: "Excellent",
        description:
          "Highly creative/original approach with clear differentiation and innovative use of technology.",
      },
    ],
  },
  {
    key: "technical_implementation",
    title: "Technical Implementation",
    prompt:
      "Does the prototype work? Is technology used appropriately? How well has the team implemented the proposed solution?",
    bands: [
      {
        range: "1-3",
        label: "Needs Improvement",
        description: "Limited/non-functional prototype; major technical gaps.",
      },
      {
        range: "4-7",
        label: "Satisfactory",
        description: "Basic working prototype with reasonable technical implementation; some gaps remain.",
      },
      {
        range: "8-10",
        label: "Excellent",
        description: "Well-functioning prototype with strong technical execution and effective use of technology.",
      },
    ],
  },
  {
    key: "scalability",
    title: "Scalability",
    prompt:
      "Can the solution be practically implemented and expanded? Is it feasible in terms of resources, users, cost, and technology?",
    bands: [
      {
        range: "1-3",
        label: "Needs Improvement",
        description: "Difficult to implement or scale; significant feasibility concerns.",
      },
      {
        range: "4-7",
        label: "Satisfactory",
        description: "Feasible at a basic level with some scalability potential; challenges remain.",
      },
      {
        range: "8-10",
        label: "Excellent",
        description:
          "Clearly feasible, practical, and capable of scaling to wider users/locations with a realistic approach.",
      },
    ],
  },
];

export const MAX_CRITERION_SCORE = 10;
export const MAX_TOTAL_SCORE = RUBRIC.length * MAX_CRITERION_SCORE;
