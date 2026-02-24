/**
 * IPS Questionnaire — Question definitions
 *
 * Question types:
 *   text      — free-form textarea
 *   combo     — single-select radio pills (click again to deselect)
 *               + optional followUp text + optional followUpCheck chips
 *   check     — multi-select checkbox pills + optional followUp text
 *               noneOptions clears others when selected
 *   goals     — repeating Goal / Amount / Timeline rows with "Add Goal"
 *   checkval  — checkbox pills that reveal inline value input when selected
 */

const SECTIONS = [
  {
    num: 1,
    title: "Investor Profile & Background",
    subtitle: "Personal, financial, and experience baseline",
    instruction:
      "This section establishes the client's personal and financial baseline.",
    subsections: [
      {
        label: "Personal Information",
        questions: [
          {
            id: "q1",
            q: "What is your full name, date of birth, and contact information?",
            type: "text",
          },
          {
            id: "q2",
            q: "What is your marital status, and do you have any dependents?",
            type: "combo",
            options: [
              "Single",
              "Married",
              "Divorced",
              "Widowed",
              "Domestic Partnership",
            ],
            radioName: "marital",
            followUp: "List dependents and their ages:",
          },
          {
            id: "q3",
            q: "What is your current occupation and employment status?",
            type: "combo",
            options: [
              "Employed Full-Time",
              "Employed Part-Time",
              "Self-Employed",
              "Retired",
              "Unemployed",
            ],
            radioName: "employment",
            followUp: "Employer and job title:",
          },
        ],
      },
      {
        label: "Financial Overview",
        questions: [
          {
            id: "q4",
            q: "What is your annual income from all sources (salary, bonuses, business income, rental income, Social Security, pensions, other)?",
            type: "text",
          },
          {
            id: "q5",
            q: "What are your current monthly and annual living expenses?",
            type: "text",
          },
          {
            id: "q6",
            q: "What is your approximate net worth? Please list major assets and liabilities.",
            type: "assets_liabilities",
          },
        ],
      },
      {
        label: "Existing Accounts & Holdings",
        questions: [
          {
            id: "q7",
            q: "Please list all investment, retirement, and bank accounts (types, custodians, balances).",
            type: "text",
          },
          {
            id: "q8",
            q: "Do you hold any concentrated positions (company stock, inherited holdings, single large asset)?",
            type: "text",
          },
          {
            id: "q9",
            q: "How are your current accounts titled? Are beneficiary designations current?",
            type: "check",
            options: [
              "Individual",
              "Joint Tenants",
              "Trust",
              "Community Property",
              "TOD/POD",
              "Other",
            ],
            followUp: "Beneficiary details:",
          },
        ],
      },
      {
        label: "Insurance Coverage",
        questions: [
          {
            id: "q10",
            q: "Do you carry life insurance? Type and coverage amount?",
            type: "check",
            options: [
              "Term Life",
              "Whole Life",
              "Universal Life",
              "Variable Life",
              "No Life Insurance",
            ],
            noneOptions: ["No Life Insurance"],
            followUp: "Coverage details:",
          },
          {
            id: "q11",
            q: "Disability, long-term care, and/or umbrella liability coverage?",
            type: "check",
            options: [
              "Disability Insurance",
              "Long-Term Care Insurance",
              "Umbrella Liability",
              "None",
            ],
            noneOptions: ["None"],
            followUp: "Details:",
          },
        ],
      },
      {
        label: "Investment Experience",
        questions: [
          {
            id: "q12",
            q: "What is your level of investment experience? What asset classes have you invested in?",
            type: "combo",
            options: ["Beginner", "Intermediate", "Advanced"],
            radioName: "experience",
            followUp: "Other asset classes:",
            followUpCheck: [
              "Stocks",
              "Bonds",
              "Mutual Funds/ETFs",
              "Real Estate",
              "Alternatives",
              "Options/Derivatives",
              "Cryptocurrency",
            ],
          },
          {
            id: "q13",
            q: "Have you worked with an investment advisor before? What went well / what would you change?",
            type: "text",
          },
        ],
      },
      {
        label: "Professional Team",
        questions: [
          {
            id: "q14",
            q: "Do you have an existing financial plan, IPS, or estate plan we should review? If so, how can we access it?",
            type: "text",
          },
          {
            id: "q15",
            q: "Do you work with a CPA, attorney, or other professionals? Provide contact info.",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 2,
    title: "Investment Objectives",
    subtitle: "Goals, milestones, and values",
    instruction: "Objectives define what this portfolio is designed to achieve.",
    subsections: [
      {
        label: "Goals & Milestones",
        questions: [
          {
            id: "q16",
            q: "What are your primary investment goals?",
            type: "check",
            options: [
              "Capital Preservation",
              "Income Generation",
              "Growth",
              "Aggressive Growth",
            ],
            followUp: "Additional detail:",
          },
          {
            id: "q17",
            q: "Do you have specific financial milestones? Provide goal, target amount, and timeline for each.",
            type: "goals",
          },
        ],
      },
      {
        label: "Income & Growth",
        questions: [
          {
            id: "q18",
            q: "Are you seeking current income from investments? How much annually?",
            type: "text",
          },
          {
            id: "q19",
            q: "Capital appreciation vs. income stability?",
            type: "combo",
            options: [
              "Strongly Favor Stability",
              "Slightly Favor Stability",
              "Equal Priority",
              "Slightly Favor Growth",
              "Strongly Favor Growth",
            ],
            radioName: "growthVsIncome",
            followUp: "Notes:",
          },
        ],
      },
      {
        label: "Values-Based Preferences",
        questions: [
          {
            id: "q20",
            q: "Ethical, social, environmental, religious, or cultural investment preferences?",
            type: "check",
            options: [
              "ESG / Socially Responsible",
              "Faith-Based",
              "Avoid Tobacco",
              "Avoid Firearms",
              "Avoid Fossil Fuels",
              "Avoid Gambling",
              "Avoid Alcohol",
              "No Preferences",
            ],
            noneOptions: ["No Preferences"],
            followUp: "Other restrictions:",
          },
        ],
      },
    ],
  },

  {
    num: 3,
    title: "Time Horizon",
    subtitle: "Duration and flexibility",
    instruction: "Affects volatility tolerance and appropriate investments.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q27",
            q: "Expected investment duration?",
            type: "combo",
            options: [
              "Short-Term (< 5 yr)",
              "Medium-Term (5–10 yr)",
              "Long-Term (10+ yr)",
            ],
            radioName: "timeHorizon",
            followUp: "Target date/age:",
          },
          {
            id: "q28",
            q: "When do you anticipate needing funds?",
            type: "text",
          },
          {
            id: "q29",
            q: "Multiple time horizons for different goals?",
            type: "text",
          },
          {
            id: "q30",
            q: "How flexible is your timeline?",
            type: "combo",
            options: ["Very Flexible", "Somewhat Flexible", "Not Flexible"],
            radioName: "flexibility",
            followUp: "Notes:",
          },
        ],
      },
    ],
  },

  {
    num: 4,
    title: "Risk Tolerance",
    subtitle: "Willingness and capacity to accept risk",
    instruction:
      "A validated risk assessment tool will supplement these responses.",
    subsections: [
      {
        label: "Willingness",
        questions: [
          {
            id: "q21",
            q: "How would you react to a 50% portfolio decline?",
            type: "combo",
            options: ["Sell Everything", "Sell Some", "Hold Steady", "Buy More"],
            radioName: "marketReaction",
            followUp: "Thoughts:",
          },
          {
            id: "q22",
            q: "Maximum annual decline you could tolerate?",
            type: "combo",
            options: ["10%", "20%", "30%", "40%", "50%", "60%", "70%+"],
            radioName: "maxDrawdown",
            followUp: "Notes:",
          },
          {
            id: "q23",
            q: "Past major investment losses? Emotional and financial impact?",
            type: "text",
          },
        ],
      },
      {
        label: "Capacity",
        questions: [
          {
            id: "q24",
            q: "Emergency fund size (months)? Held outside this portfolio?",
            type: "combo",
            options: [
              "< 3 months",
              "3–6 months",
              "6–12 months",
              "12+ months",
            ],
            radioName: "emergencyFund",
            followUp: "Outside this portfolio?",
          },
          {
            id: "q25",
            q: "Health, employment, or family factors affecting loss tolerance?",
            type: "text",
          },
          {
            id: "q26",
            q: "Income stability? Could it change significantly?",
            type: "combo",
            options: [
              "Very Stable",
              "Mostly Stable",
              "Somewhat Variable",
              "Highly Variable",
            ],
            radioName: "incomeStability",
            followUp: "Details:",
          },
        ],
      },
    ],
  },

  {
    num: 5,
    title: "Liquidity Needs",
    subtitle: "Cash flow requirements",
    instruction: "Ensures no forced selling.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q31",
            q: "Percentage that must remain liquid?",
            type: "combo",
            options: ["0–5%", "5–10%", "10–20%", "20%+"],
            radioName: "liquidity",
            followUp: "Details:",
          },
          {
            id: "q32",
            q: "Major cash needs within 1–3 years?",
            type: "text",
          },
          {
            id: "q33",
            q: "Liquidity restrictions from current assets?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 6,
    title: "Tax Considerations",
    subtitle: "Status, accounts, efficiency",
    instruction: "Advisor will coordinate with your CPA.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q34",
            q: "Filing status and tax bracket?",
            type: "combo",
            options: [
              "Single",
              "Married Filing Jointly",
              "Married Filing Separately",
              "Head of Household",
            ],
            radioName: "filingStatus",
            followUp: "Bracket:",
          },
          {
            id: "q35",
            q: "Tax-advantaged accounts and balances?",
            type: "checkval",
            options: [
              "401(k)",
              "403(b)",
              "Traditional IRA",
              "Roth IRA",
              "SEP IRA",
              "HSA",
              "529 Plan",
              "Pension",
              "None",
            ],
            noneOptions: ["None"],
          },
          {
            id: "q36",
            q: "Tax loss carryforwards, unrealized gains, prior tax events?",
            type: "text",
          },
          {
            id: "q37",
            q: "Importance of tax efficiency?",
            type: "combo",
            options: ["Very Important", "Somewhat Important", "Not a Priority"],
            radioName: "taxEfficiency",
            followUp: "Preferences:",
          },
          {
            id: "q38",
            q: "International tax considerations?",
            type: "text",
          },
          {
            id: "q39",
            q: "Interest in tax harvesting or charitable giving strategies?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 7,
    title: "Legal & Regulatory",
    subtitle: "Restrictions, trusts, fiduciary duties",
    instruction: null,
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q40",
            q: "Legal restrictions on investments?",
            type: "text",
          },
          {
            id: "q41",
            q: "Trusts, wills, or estate docs imposing guidelines?",
            type: "text",
          },
          { id: "q42", q: "Fiduciary responsibilities?", type: "text" },
          {
            id: "q43",
            q: "International residency/citizenship issues?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 8,
    title: "Unique Circumstances",
    subtitle: "Health, family, special factors",
    instruction: "Anything that may materially affect strategy.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q44",
            q: "Health issues or life events impacting financial needs?",
            type: "text",
          },
          {
            id: "q45",
            q: "Family dynamics, inheritance, or estate factors?",
            type: "text",
          },
          {
            id: "q46",
            q: "Views on leverage?",
            type: "combo",
            options: [
              "Comfortable",
              "Open to Discussion",
              "Prefer to Avoid",
            ],
            radioName: "leverage",
            followUp: "Notes:",
          },
          {
            id: "q47",
            q: "Active vs. passive preference? Vehicle preferences?",
            type: "check",
            options: [
              "Passive/Index",
              "Active",
              "ETFs",
              "Mutual Funds",
              "Individual Securities",
              "SMAs",
              "No Preference",
            ],
            noneOptions: ["No Preference"],
            followUp: "Details:",
          },
          {
            id: "q48",
            q: "Anything else your advisor should know?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 9,
    title: "Delegation & Authority",
    subtitle: "Advisory relationship",
    instruction: "Clarifies the advisory relationship.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q49",
            q: "Anyone else with trading authority, POA, or decision-making power?",
            type: "text",
          },
          {
            id: "q50",
            q: "Who should be involved in reviews?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 10,
    title: "Monitoring & Review",
    subtitle: "Reporting and communication",
    instruction:
      "Advisor will propose benchmarks and rebalancing in the IPS draft.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "q52",
            q: "Report frequency?",
            type: "combo",
            options: ["Monthly", "Quarterly", "Semi-Annually", "Annually"],
            radioName: "reportFreq",
          },
          {
            id: "q53",
            q: "Review meeting frequency?",
            type: "combo",
            options: [
              "Quarterly",
              "Semi-Annually",
              "Annually",
              "Only When Needed",
            ],
            radioName: "meetFreq",
          },
          {
            id: "q54",
            q: "Preferred communication methods?",
            type: "check",
            options: [
              "In-Person",
              "Video Calls",
              "Phone",
              "Email",
              "Digital Portal",
            ],
          },
          {
            id: "q55",
            q: "Circumstances warranting IPS revision outside regular reviews?",
            type: "text",
          },
        ],
      },
    ],
  },
];

export const ALL_QUESTION_IDS = SECTIONS.flatMap((s) =>
  s.subsections.flatMap((sub) => sub.questions.map((q) => q.id))
);

export default SECTIONS;

// ── CPS (Custody Policy Statement) Questions ─────────

export const CPS_SECTIONS = [
  {
    num: 1,
    title: "Digital Asset Background",
    subtitle: "Experience, holdings, and current custody",
    instruction:
      "This section establishes the client's cryptocurrency experience and current position.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "cps1",
            q: "What is your level of experience with cryptocurrencies? What is your most advanced exposure?",
            type: "combo",
            options: ["Beginner", "Intermediate", "Expert"],
            radioName: "cryptoExperience",
            followUp: "Describe your most advanced exposure:",
          },
          {
            id: "cps2",
            q: "What types of crypto assets do you currently own or plan to acquire?",
            type: "check",
            options: [
              "Bitcoin",
              "Ethereum",
              "Altcoins",
              "NFTs",
              "Stablecoins",
              "DeFi Tokens",
              "None Currently",
            ],
            noneOptions: ["None Currently"],
            followUp: "Other assets or details:",
          },
          {
            id: "cps3",
            q: "Approximately what is the total value of your crypto holdings?",
            type: "combo",
            options: [
              "$50,000–$100,000",
              "$100,000–$250,000",
              "$250,000–$500,000",
              "$500,000–$1M",
              "$1M–$2.5M",
              "Over $2.5M",
            ],
            radioName: "cryptoValue",
            followUp: "Additional context:",
          },
          {
            id: "cps4",
            q: "How are your crypto assets currently custodied?",
            type: "check",
            options: [
              "ETFs",
              "Digital Asset Trusts (DATs)",
              "Exchange (e.g., Coinbase, Kraken)",
              "Hardware Wallet (e.g., Ledger, Trezor)",
              "Software Wallet",
              "Paper Wallet",
              "Not Currently Holding",
            ],
            noneOptions: ["Not Currently Holding"],
            followUp: "Specify platforms or devices:",
          },
          {
            id: "cps5",
            q: "Have you ever experienced any security incidents with your crypto, such as hacks, lost keys, or scams? If so, how did you react?",
            type: "text",
          },
        ],
      },
    ],
  },

  {
    num: 2,
    title: "Risk & Security Preferences",
    subtitle: "Custody approach, key management, and security practices",
    instruction:
      "Determines the appropriate custody model based on the client's risk tolerance and technical comfort.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "cps6",
            q: "What is your risk tolerance for crypto custody?",
            type: "combo",
            options: [
              "Self-Custody (full control)",
              "Third-Party Custody (convenience & insurance)",
              "Hybrid (split between both)",
              "Unsure — Need Guidance",
            ],
            radioName: "custodyRisk",
            followUp: "Additional thoughts:",
          },
          {
            id: "cps7",
            q: "Are you comfortable managing private keys yourself, or would you prefer a custodial service?",
            type: "combo",
            options: [
              "Comfortable Self-Managing",
              "Prefer Custodial Service",
              "Open to Either",
            ],
            radioName: "keyManagement",
            followUp: "Notes:",
          },
          {
            id: "cps8",
            q: "Are you aware of the risks associated with self-custody (asset loss, social engineering, and wrench attacks)?",
            type: "combo",
            options: [
              "Yes, Fully Aware",
              "Somewhat Aware",
              "Not Aware — Need Education",
            ],
            radioName: "selfCustodyRisk",
          },
          {
            id: "cps9",
            q: "Do you prioritize any of the following custody features?",
            type: "check",
            options: [
              "Multi-Signature Wallets",
              "Cold Storage",
              "Insurance Against Theft/Loss",
              "Geographic Distribution",
              "Institutional-Grade Security",
              "No Specific Preferences",
            ],
            noneOptions: ["No Specific Preferences"],
            followUp: "Other priorities:",
          },
          {
            id: "cps10",
            q: "What security practices do you currently use?",
            type: "check",
            options: [
              "Two-Factor Authentication (2FA)",
              "Seed Phrase Backups",
              "Hardware Security Modules",
              "Password Manager",
              "Biometric Authentication",
              "Air-Gapped Devices",
              "None",
            ],
            noneOptions: ["None"],
            followUp: "Other practices:",
          },
        ],
      },
    ],
  },

  {
    num: 3,
    title: "Goals & Usage",
    subtitle: "Investment objectives, access frequency, and budget",
    instruction: null,
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "cps11",
            q: "What are your primary goals for these crypto assets?",
            type: "check",
            options: [
              "Long-Term Investment (HODL)",
              "Active Trading",
              "Staking / Yield Farming",
              "DeFi Participation",
              "Payments / Transactions",
              "Portfolio Diversification",
            ],
            followUp: "Additional objectives:",
          },
          {
            id: "cps12",
            q: "How frequently do you plan to access or transact with your crypto?",
            type: "combo",
            options: ["Daily", "Weekly", "Monthly", "Quarterly", "Rarely"],
            radioName: "accessFrequency",
          },
          {
            id: "cps13",
            q: "Are there specific use cases, like integrating with traditional portfolios or using crypto for payments?",
            type: "text",
          },
          {
            id: "cps14",
            q: "What budget do you have for custody solutions?",
            type: "combo",
            options: [
              "Minimal (free / low-cost tools)",
              "Moderate ($50–$300/yr for hardware/subscriptions)",
              "Significant (institutional custodian fees)",
              "Need Guidance on Options",
            ],
            radioName: "custodyBudget",
            followUp: "Notes:",
          },
        ],
      },
    ],
  },

  {
    num: 4,
    title: "Regulatory & Estate Planning",
    subtitle: "Jurisdiction, tax compliance, and succession",
    instruction:
      "Ensures custody solutions meet regulatory requirements and estate planning needs.",
    subsections: [
      {
        label: null,
        questions: [
          {
            id: "cps15",
            q: "In which jurisdictions are you tax-resident or hold citizenship?",
            type: "text",
          },
          {
            id: "cps16",
            q: "Are you aware of tax implications for your crypto holdings? Do you need custody options that support reporting (e.g., KYC-compliant platforms)?",
            type: "combo",
            options: [
              "Yes, Aware — Need Compliant Platform",
              "Somewhat Aware",
              "Not Aware — Need Education",
              "Already Working with a CPA on This",
            ],
            radioName: "cryptoTax",
            followUp: "Details:",
          },
          {
            id: "cps17",
            q: "Do you have an estate plan for the transfer of your digital assets?",
            type: "combo",
            options: [
              "Yes, Fully Documented",
              "Partially — Needs Updating",
              "No — Need to Create One",
            ],
            radioName: "cryptoEstate",
            followUp: "Details or concerns:",
          },
        ],
      },
    ],
  },
];

export const ALL_CPS_QUESTION_IDS = CPS_SECTIONS.flatMap((s) =>
  s.subsections.flatMap((sub) => sub.questions.map((q) => q.id))
);
