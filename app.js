const STORAGE_KEY = "methaq-agent-assistant-extra-kb";
const MANAGER_KEY = "METHAQ-MGR-7429";
const MANAGER_UNLOCK_KEY = "methaq-manager-unlocked";
const CRM_GATEWAY_KEY = "methaq-crm-gateway-url";
/* Gateway URL: Manager Hub localStorage first, then window.METHAQ_CRM_GATEWAY from crm-config.js.
   Do not fall back to the static-host /claim path (e.g. GitHub Pages). */

const routingRules = [
  ["Cash Settlement", "Please issue cash settlement.", ["cash", "settlement", "payment", "amount"]],
  ["Compensation", "Please check and process compensation.", ["compensation", "delay compensation", "claim compensation"]],
  ["Repair", "Please check and proceed with repair.", ["repair", "workshop", "garage", "fix", "lpo"]],
  ["Total Loss", "Please check and proceed with total loss.", ["total loss", "write off", "salvage"]],
  ["Documentation / Document Submitted", "Please check the submitted documents and proceed.", ["document", "documents", "submitted", "upload", "missing", "papers"]],
  ["Inspection / Survey Follow-up", "Please check and proceed with inspection.", ["inspection", "survey", "surveyor", "inspect"]],
  ["Property Damage", "Please check and proceed with property damage.", ["property damage", "third party property", "damage"]],
  ["Garage Issue / Change Garage", "Please check and proceed with the garage request.", ["change garage", "garage issue", "workshop issue", "garage"]],
  ["Complaint - Policy Refund", "Please check and process the policy refund.", ["refund", "policy refund", "cancel policy"]],
  ["Delay", "Please check the delay and proceed.", ["delay", "late", "waiting", "pending", "overdue"]],
  ["Claim Rejected", "Please review the rejected claim and advise.", ["rejected", "rejection", "declined", "not approved"]],
  ["Customer Service", "Please check and assist with the request.", ["customer service", "call back", "request", "assist"]],
  ["Medical - Settlement Agreement", "Please check and process the settlement agreement.", ["medical", "settlement agreement"]],
  ["Towing", "Please check and proceed with the towing request.", ["towing", "tow", "recovery truck"]],
  ["Duplicate", "Please check and proceed accordingly.", ["duplicate", "duplicated", "same claim"]],
  ["OTHER", "Please check and assist accordingly.", []],
];

const starterPrompts = [
  "How can I file a claim?",
  "What is the status of claim C-02-0826-35206?",
  "What should I tell a customer asking about claim status?",
  "Which comment should I leave for a repair delay?",
  "What documents are required before a claim can move forward?",
];

const directAnswers = [
  {
    id: "file-claim",
    match: [
      "file claim", "file a claim", "filing a claim", "how to file",
      "submit claim", "submit a claim", "submitting a claim",
      "open claim", "open a claim", "new claim", "fnol", "accident claim",
      "raise claim", "raise a claim", "raising claim", "raising a claim",
      "lodge claim", "lodge a claim", "register claim", "register a claim",
      "how to claim", "want to claim", "wants to claim", "customer wants to claim",
      "claim process", "after raising claim", "after submitting claim",
      "step after claim", "steps after claim", "next step after claim",
      "what happens after claim", "after claim is raised", "after claim submitted"
    ],
    department: "Documentation / Document Submitted",
    comment: "Please guide the customer to submit online and check documents once the claim is created.",
    source: "Methaq SOP - Claim Submission and FNOL Process",
    answer: [
      "If the customer wants to raise a motor claim, guide them to submit it themselves. Agents cannot open a claim or upload documents on the customer behalf.",
      "How to raise the claim: the customer goes to claim.methaq.ae/claim (or methaq.ae → Motor Claims), or visits a branch. Online submission is available 24/7.",
      "On the portal the customer completes the eligibility / qualification wizard, fills the FNOL form, uploads the required documents (Driving License, Mulkiya, Emirates ID of the owner, and the full Police Report PDF), reviews the details, then submits.",
      "After the claim is raised: the system runs an automatic duplicate-claim check, then the claim enters the Claims Department queue. Document review usually takes 1 to 2 working days. If documents are complete, the claim is accepted and a garage/workshop is assigned for the next stage. If documents are missing, the customer gets a link to re-upload.",
      "Agent next step: once you have the claim number, open it in CRM, read the latest Claims Team comment and status, then advise the customer only from confirmed system information."
    ],
    sources: [
      "Claim Submission: claim.methaq.ae/claim, 24/7, branch also available. Agents cannot open/upload for customers.",
      "FNOL flow: wizard → FNOL → upload docs → submit → duplicate check → Claims queue → doc review 1-2 WD → garage assignment."
    ],
  },
    {
    id: "required-documents",
    match: [
      "required document", "required documents", "documents needed", "what documents",
      "missing documents", "papers needed", "which documents", "docs needed", "document list",
      "what papers", "papers to upload", "which papers", "docs required", "documents required",
      "what docs", "documents to upload", "missing docs", "what to upload", "documents for claim",
      "claim documents", "supporting documents", "required papers", "police report needed",
    ],
    department: "Documentation / Document Submitted",
    comment: "Please check the submitted documents and proceed.",
    source: "Methaq SOP - Required Documents",
    answer: [
      "For a standard accident claim, the customer needs clear copies of the driving license for the driver at the time of accident, Mulkiya or vehicle registration card, Emirates ID or National ID for the vehicle owner, and the complete police report in PDF format.",
      "Damage photos are optional but recommended. Copies must be clear and legible from both sides where applicable.",
      "Documents must be uploaded through the portal. They should not be accepted through WhatsApp or email attachments.",
    ],
    sources: [
      "Required Documents: Valid Driving License, Mulkiya, Emirates ID / National ID, Complete Police Report, Damage Photos optional.",
      "SOP note: Documents must not be accepted via WhatsApp or email attachments.",
    ],
  },
    {
    id: "claim-status",
    match: [
      "claim status", "status of claim", "check claim", "follow up claim", "latest update",
      "where is claim", "any update on claim", "claim update", "what is happening with claim",
      "follow up on claim", "any update", "update on the claim", "claim progress",
      "progress of claim", "status update", "asking for status", "current status",
      "where is my claim"
    ],
    department: "Customer Service",
    comment: "Please check and assist with the request.",
    source: "Methaq SOP - Claim Status Inquiry",
    answer: [
      "First verify the customer, then open the claim in the system using the claim reference number. If the claim number is not available, use the plate number, policy number, or police report number.",
      "Read the latest Claims Team comment, check the current status, review pending actions or missing documents, then answer only from the confirmed system information.",
      "Document the call in the system after giving the customer the confirmed update.",
    ],
    sources: [
      "Claim Status Inquiry: Open the claim, read latest comment, check current status, review pending actions, answer customer, document the call.",
      "Customer Verification Process: Ask for claim reference first, then plate number, policy number, or police report.",
    ],
  },
  {
    id: "comprehensive-fault",
    match: [
      "comprehensive", "caused accident", "my fault", "at fault comprehensive",
      "will my car be repaired", "comprehensive insurance", "i caused the accident",
      "even if i caused", "regardless of fault"
    ],
    department: "Repair",
    comment: "Please check and proceed with repair.",
    source: "Methaq SOP - FAQ Q1 Comprehensive Insurance",
    answer: [
      "If the customer has Comprehensive insurance with Methaq, Methaq covers repair of the customer's own vehicle regardless of who caused the accident, subject to policy terms.",
      "The customer must still submit the claim online and upload the required documents (Police Report, Driving License, Mulkiya, Emirates ID).",
      "Important exclusions — do not promise repair if the case involves: driving without a valid license, driving under the influence of alcohol, or intentional damage.",
      "Never tell the customer the claim is approved or rejected unless the system / documented reason confirms it."
    ],
    sources: [
      "FAQ Q1: Comprehensive repairs policyholder vehicle regardless of fault, with stated exclusions.",
      "Data Privacy: Do not say approved/rejected without documented reason."
    ],
  },
  {
    id: "third-party-not-at-fault",
    match: [
      "third party", "third-party", "tp insurance", "another driver hit me",
      "other driver hit", "not at fault third", "will methaq repair my car third",
      "third party hit me", "someone hit me"
    ],
    department: "Customer Service",
    comment: "Please check and assist with the request.",
    source: "Methaq SOP - FAQ Q2 Third-Party not at fault",
    answer: [
      "Third-Party insurance never covers the Methaq policyholder's own vehicle.",
      "If another driver hit the customer (customer not at fault): the customer must claim with the other driver's insurer, because that insurer pays for the customer's repair.",
      "Do not tell the customer that Methaq will repair their own car under Third-Party cover."
    ],
    sources: [
      "FAQ Q2: Third-Party never covers policyholder own vehicle; claim other driver's insurer when other driver at fault."
    ],
  },
  {
    id: "third-party-at-fault",
    match: [
      "third party i caused", "third-party i caused", "i caused third party",
      "tp at fault", "third party at fault", "caused the accident third",
      "i hit someone third", "third party liability"
    ],
    department: "Customer Service",
    comment: "Please check and assist with the request.",
    source: "Methaq SOP - FAQ Q3 Third-Party at fault",
    answer: [
      "If the customer has Third-Party cover and caused the accident: Methaq handles liability for the other party's vehicle/property damage (whether or not that party is a Methaq customer).",
      "Methaq will NOT repair the at-fault Third-Party policyholder's own vehicle.",
      "Advise only from confirmed policy type and CRM/status — do not promise repair of the customer's own car under Third-Party."
    ],
    sources: [
      "FAQ Q3: Methaq pays other party damage; does not repair at-fault TP policyholder vehicle."
    ],
  },
  {
    id: "payment-delay",
    match: ["payment", "payment delayed", "did not receive payment", "haven't received payment", "bank transfer", "creditor notice", "credit note"],
    department: "Cash Settlement",
    comment: "Please issue cash settlement.",
    source: "Methaq SOP - Payment FAQ and Cash Settlement",
    answer: [
      "Payment timelines are calculated from the date the Creditor's Notice or approval appears in the portal.",
      "For settlement payments, Finance completes the bank transfer to the vehicle owner with a standard turnaround of 15 working days after the required approval and documents are in place.",
      "Check common blockers before escalating: missing IBAN certificate, unsigned settlement form, missing NOC, or the customer still being within the standard processing period."
    ],
    sources: [
      "FAQ Q12: Payment timelines are calculated from the Creditor's Notice or approval date in the portal.",
      "Cash Settlement stage: Bank transfer turnaround is 15 working days."
    ],
  },
    {
    id: "alternative-car",
    match: [
      "alternative car", "rental car", "replacement car", "car compensation", "compensation days",
      "hire car", "replacement vehicle", "vehicle allowance", "alternative vehicle",
      "temporary car", "temp car", "alt car", "courtesy car", "daily allowance",
      "days compensation"
    ],
    department: "Compensation",
    comment: "Please check and process compensation.",
    source: "Methaq SOP - Alternative Car Compensation",
    answer: [
      "Alternative car compensation is a daily cash allowance for the period the customer cannot use their vehicle during repair. It is not an actual rental car.",
      "Eligibility (confirm on the claim before promising): vehicles damaged by a Methaq policyholder, and Comprehensive customers who were not at fault. Maximum 15 working days. Conditions: LPO approved AND vehicle physically at the workshop.",
      "Not applicable for cash settlement or total loss. Daily amount is set by Methaq based on vehicle model and repair duration — not customer preference.",
      "Required documents: workshop job card (repair dates), valid vehicle owner ID, and owner IBAN certificate. For requests needing approval, raise a ticket / route to Claims Team.",
    ],
    sources: [
      "Alternative Car Compensation: Applies to vehicles damaged by a Methaq policyholder and Comprehensive customers not at fault; max 15 WD; LPO approved + vehicle at workshop.",
      "Not applicable for cash settlement or total loss. Daily amount by Methaq (model/duration). Docs: job card, owner ID, IBAN.",
    ],
  },
    {
    id: "total-loss",
    match: [
      "total loss", "repair cost exceeds", "car value", "vehicle value", "write off",
      "written off", "write-off", "written-off", "beyond repair", "totalled", "surrender vehicle",
      "plates after total loss", "collect plates"
    ],
    department: "Total Loss",
    comment: "Please check and proceed with total loss.",
    source: "Methaq SOP - Total Loss Compensation",
    answer: [
      "A claim is treated as total loss when the repair cost exceeds the vehicle market value, based on assessment. Do not tell the customer it is total loss unless the system / evaluation shows that.",
      "Timelines: assessment within 3 working days, internal approval within 5 working days, then payment within 15 working days after acceptance and required documents.",
      "Customer may need vehicle surrender and ownership transfer documents. If the offer is rejected, internal re-review is 7 working days (including legal counsel review).",
      "Plates remain at the original inspection workshop for collection, even if the vehicle is towed to an auction yard.",
    ],
    sources: [
      "Total Loss: repair cost exceeds market value; assessment 3 WD, internal approval 5 WD, payment 15 WD; rejection re-review 7 WD.",
      "SOP: plates remain at original inspection workshop (even if towed to auction).",
    ],
  },
    {
    id: "towing",
    match: [
      "towing", "tow", "recovery", "roadside", "road side", "roadside assistance",
      "road side assistance", "rsa", "car not drivable", "vehicle not drivable",
      "undrivable", "aaa", "breakdown", "flat tire", "flat tyre", "stuck on road",
      "tow truck", "recovery truck", "roadside number", "assistance number", "towing number",
      "need a tow", "emirates auction", "rsa number", "rsa provider"
    ],
    department: "Towing",
    comment: "Please check and proceed with the towing request. Identify the RSA provider first, share only that provider's number, and confirm the vehicle is undrivable.",
    source: "Methaq SOP - Roadside Assistance and Towing",
    answer: [
      "Before giving any RSA number, identify which roadside provider the customer has (policy lookup / CRM / portal benefits). Never give both AAA and Emirates Auction numbers together.",
      "If provider is AAA → call 600508181 only. Arabic 04 402 0738 / English 04 402 0737 only if needed for AAA.",
      "If provider is Emirates Auction Roadside Assistance → call 600500372 only.",
      "If provider is unknown: ask for the policy number, look up the policy / RSA benefits, and do not give numbers yet.",
      "Coverage is for undrivable vehicles only (no unnecessary or multiple trips). Methaq main line 600 565 695 (select RSA) may be mentioned as a general Methaq contact AFTER provider check — not as a substitute for AAA vs Emirates Auction.",
      "For non-Methaq customers hit by a Methaq customer, towing is usually their own insurer's responsibility; if they insist, ask them to keep the invoice without promising Methaq coverage.",
    ],
    sources: [
      "RSA check-first: identify provider via policy/CRM/portal before sharing any number.",
      "AAA only: 600508181 (Arabic 04 402 0738 / English 04 402 0737 if needed). Emirates Auction only: 600500372.",
      "FAQ Q17 / SOP: undrivable vehicles only; Methaq 600 565 695 select RSA is general contact after provider check.",
    ],
  },
  
    {
    id: "garage-change",
    match: [
      "change garage", "garage issue", "workshop issue", "change workshop", "assigned garage",
      "workshop change", "another workshop", "another garage", "different garage",
      "different workshop", "pick workshop", "choose garage", "select garage",
      "not happy with garage", "not happy with workshop", "wrong garage", "transfer workshop",
    ],
    department: "Garage Issue / Change Garage",
    comment: "Please check and proceed with the garage request.",
    source: "Methaq SOP - Workshop Policies",
    answer: [
      "Methaq selects the workshop based on quotations and vehicle models. Customers do not have a workshop selection list.",
      "If the customer requests a workshop change, first try to convince the customer to stay with the assigned workshop, then explain that a change may take 1 to 2 additional days.",
      "That extra time does not count toward alternative car compensation.",
    ],
    sources: [
      "Workshop Policies: Company selects workshop based on quotations and vehicle models.",
      "Workshop change: Explain change may take 1-2 additional days and does not count toward alternative car compensation.",
    ],
  },
    {
    id: "lpo",
    match: [
      "lpo", "repair approval", "local purchase order", "why does lpo matter",
      "lpo approved", "lpo status", "lpo pending", "waiting for lpo", "workshop approval",
      "repair order"
    ],
    department: "Repair",
    comment: "Please check and proceed with repair.",
    source: "Methaq SOP - FAQ LPO",
    answer: [
      "The LPO (Local Purchase Order) is Methaq's internal repair approval sent to the workshop. Without it, the workshop cannot legally start repair work.",
      "It matters because workshop repair and alternative car compensation depend on LPO approval. For alternative car compensation, the LPO must be approved and the vehicle must be physically at the workshop.",
      "Do not provide the LPO itself to the customer. Tell them only the status (pending / approved) from the system.",
    ],
    sources: [
      "FAQ Q6: The LPO is the internal repair approval from Methaq sent to the workshop.",
      "Data Privacy rule: Do not provide the LPO to the customer.",
    ],
  },
  {
    id: "cash-settlement",
    match: [
      "cash settlement", "cash instead of repair", "want cash", "prefer cash",
      "settlement instead of repair", "receive cash", "cash rather than repair",
      "choose cash", "request cash settlement", "digital settlement form"
    ],
    department: "Cash Settlement",
    comment: "Please review cash settlement request with Claims Team. Do not promise cash settlement.",
    source: "Methaq SOP - Cash Settlement / FAQ Q8",
    answer: [
      "Methaq does not proactively offer cash settlement. If the customer requests cash instead of repair, the Claims Team assesses damage after inspection and may send a digital settlement form for signature.",
      "Signing the settlement form means the customer waives the right to repair and is no longer eligible for alternative car compensation. Settlement amount is based on Methaq's negotiated repair/parts prices — not private garage quotes. Agents must never negotiate the amount.",
      "Requirements: official IBAN certificate (bank letterhead or stamped; name must match policyholder; handwritten IBAN not accepted) and signed settlement form (signature must match ID). Payment: up to 15 working days after approval.",
      "If an LPO was already issued: do not promise cash. Refer to Claims Team to review whether settlement is still possible (check if vehicle is at workshop / repair started). Raise a ticket for cash settlement requests that need approval.",
      "For third-party property damage: only the legal owner of the damaged property, or someone with official power of attorney, can request cash settlement."
    ],
    sources: [
      "FAQ Q8 / Cash Settlement: not proactive; Claims assesses after inspection; signing waives repair + alt car; Methaq negotiated prices; agents never negotiate.",
      "Payment up to 15 WD after approval. IBAN + signed form required. LPO already issued → refer Claims Team. Q16: owner or POA only for TP property cash."
    ],
  },

  {
    id: "excess-deductible",
    match: [
      "excess", "deductible", "excess amount", "what is excess", "do i pay excess",
      "policy excess", "customer excess"
    ],
    department: "Cash Settlement",
    comment: "Please check excess/deductible on the claim and advise from system information only.",
    source: "Methaq SOP - Excess/Deductible",
    answer: [
      "Excess (deductible) is the amount a Comprehensive policyholder who is at fault agrees to pay per claim.",
      "It is deducted from the claim settlement, or paid when the vehicle is collected after repair.",
      "It may be waived in minor cases such as windscreen damage — only confirm waiver if the system/SOP case supports it.",
      "Never invent an excess amount. Read the value from the claim/policy system before telling the customer any number."
    ],
    sources: [
      "SOP Excess/Deductible: at-fault Comprehensive amount per claim; deducted from settlement or paid on collection; possible waiver for minor windscreen cases."
    ],
  },
  {
    id: "privacy-rules",
    match: [
      "can i tell the amount", "share the quote", "settlement amount", "tell approved",
      "promise to call back", "share lpo", "internal number", "quote amount",
      "cash settlement amount", "can i say approved"
    ],
    department: "Customer Service",
    comment: "Please assist without sharing restricted internal figures.",
    source: "Methaq SOP - Data Privacy and Confidentiality",
    answer: [
      "Do not share quote amounts, cash settlement amounts, or other internal figures with the customer over the phone.",
      "Do not provide the LPO to the customer. Do not share internal workshop-selection process details.",
      "Do not tell the customer the claim is approved or rejected unless there is a documented system reason.",
      "Do not promise to call the customer back. If they insist on numbers, advise them to visit a Methaq branch for further assistance."
    ],
    sources: [
      "Data Privacy rules: no quotes/settlement figures/LPO/internal process; no approved/rejected without documentation; no promise to call back."
    ],
  },
    {
    id: "agent-permissions",
    match: [
      "can i open a claim", "can agent open claim", "upload for customer", "agent permissions",
      "what can agents do", "read only", "can i approve", "can i reject claim",
      "negotiate settlement", "can i open claim", "agents cannot", "can agents",
      "agent can", "open on behalf", "upload on behalf", "can i upload documents",
    ],
    department: "Customer Service",
    comment: "Please guide the customer within agent permissions.",
    source: "Methaq SOP - Agent Permissions Matrix",
    answer: [
      "Agents have read-only access. You can check claim stage, guide the customer, identify via plate/claim number, share workshop name/location when appropriate, and add a comment to route the case.",
      "Agents cannot: open new claims, upload documents on behalf of the customer, approve or reject claims, negotiate settlement amounts, determine premiums, or commit to timelines not stated in the SOP.",
      "If the customer needs a new claim or document upload, guide them to the portal or branch.",
    ],
    sources: [
      "Agent Permissions Matrix: read-only; cannot open claims/upload docs/approve/reject/negotiate/commit unlisted timelines.",
    ],
  },

];

const semanticExpansions = {
  file: ["submit", "open", "fnol", "claim", "website", "portal"],
  filing: ["submit", "open", "fnol", "claim", "website", "portal"],
  submit: ["file", "open", "fnol", "claim"],
  open: ["submit", "file", "fnol", "claim"],
  claim: ["fnol", "accident", "submission", "status"],
  docs: ["documents", "papers", "upload"],
  document: ["documents", "upload", "missing"],
  payment: ["creditor", "notice", "iban", "finance", "bank"],
  garage: ["workshop", "repair", "assigned"],
  workshop: ["garage", "repair", "assigned"],
  towing: ["recovery", "aaa", "roadside"],
  tow: ["recovery", "aaa", "roadside"],
};

const messages = document.querySelector("#messages");
const chatForm = document.querySelector("#chatForm");
const questionInput = document.querySelector("#questionInput");
const uploadForm = document.querySelector("#uploadForm");
const uploadInput = document.querySelector("#documentUpload");
const uploadStatus = document.querySelector("#uploadStatus");
const kbCount = document.querySelector("#kbCount");
const routingList = document.querySelector("#routingList");
const managerKeyForm = document.querySelector("#managerKeyForm");
const managerKeyInput = document.querySelector("#managerKey");
const managerContent = document.querySelector("#managerContent");
const keyStatus = document.querySelector("#keyStatus");
const fileList = document.querySelector("#fileList");
const crmStatus = document.querySelector("#crmStatus");
const crmGatewayUrl = document.querySelector("#crmGatewayUrl");
const saveCrmGateway = document.querySelector("#saveCrmGateway");

let baseKb = [];
let extraKb = loadExtraKb();
let allKb = [];
const conversation = {
  activeClaim: "",
  lastCrmData: null,
  activePolicy: null,
  turns: [],
};

function rememberTurn(role, text) {
  conversation.turns.push({ role, text: String(text || "").slice(0, 500), at: Date.now() });
  if (conversation.turns.length > 30) conversation.turns = conversation.turns.slice(-30);
}

function isClaimFollowUp(question) {
  const q = normalize(question);
  if (!conversation.activeClaim) return false;
  if (extractClaimNumber(question)) return false;
  const cues = [
    "document", "documents", "uploaded", "missing", "status", "stuck", "delay", "garage",
    "repair", "lpo", "quotation", "note", "comment", "reserve", "payment", "this claim",
    "the claim", "same claim", "that claim", "update", "what about", "issue", "issues",
    "check", "pending", "next step", "owner", "who", "where", "why", "progress"
  ];
  return cues.some((c) => q.includes(c)) || q.split(" ").length <= 12;
}

function extractClaimNumber(value) {
  return String(value || "").match(/\bC-\d{2}-\d{4}-\d{4,8}\b/i)?.[0]?.toUpperCase() || "";
}

function extractPolicyNumber(value) {
  const raw = String(value || "");
  if (extractClaimNumber(raw)) return "";
  const m = raw.match(/\b(?:POL(?:ICY)?[\s#:-]*)?(\d{10,14})\b/i);
  return m ? m[1] : "";
}

function wantsPolicyLookup(question) {
  const q = normalize(question);
  if (!extractPolicyNumber(question)) return false;
  return /(policy|rsa|roadside|road side|towing|cover|coverage|comprehensive|third party|third-party|meth)/i.test(q) || /\bpolicy\b/i.test(q);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "what", "when", "where", "how", "why", "are", "you", "can", "should", "please", "customer"]);
  const base = normalize(value).split(" ").filter((word) => word.length > 2 && !stop.has(word));
  return [...new Set(base.flatMap((word) => [word, ...(semanticExpansions[word] || [])]))];
}

function loadExtraKb() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveExtraKb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extraKb));
}

function refreshKb() {
  allKb = [...baseKb, ...extraKb];
  kbCount.textContent = `${allKb.length} searchable knowledge chunks`;
  renderFileList();
}

function setManagerUnlocked(unlocked) {
  managerContent.classList.toggle("locked", !unlocked);
  keyStatus.textContent = unlocked ? "Manager Hub unlocked." : "Uploads and knowledge controls are locked.";
  localStorage.setItem(MANAGER_UNLOCK_KEY, unlocked ? "yes" : "no");
}

function refreshCrmStatus() {
  const gateway = getCrmGatewayUrl();
  if (crmGatewayUrl) crmGatewayUrl.value = gateway;
  if (crmStatus) {
    crmStatus.textContent = gateway
      ? "CRM gateway configured. Claim/policy questions query live Methaq CRM via your gateway before falling back to the knowledge base."
      : "CRM gateway not configured. Set METHAQ_CRM_GATEWAY in crm-config.js or paste a tunnel URL ending in /claim in Manager Hub. Live claim/policy lookup stays off until a gateway is set (local CRM gateway + FortiClient VPN required).";
  }
}

const CRM_CONFIG_DISCOVERY_URLS = [
  "./crm-config.js",
  "https://raw.githubusercontent.com/abmobasher121/methaq-hannibal-assistant/main/crm-config.js",
];

function normalizeGatewayUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/\/claim\/?$/i.test(u)) return u.replace(/\/$/, "");
  return u.replace(/\/$/, "") + "/claim";
}

function getCrmGatewayUrl() {
  const fromStorage = (localStorage.getItem(CRM_GATEWAY_KEY) || "").trim();
  if (fromStorage) return normalizeGatewayUrl(fromStorage);
  try {
    const host = (typeof location !== "undefined" ? location.hostname : "") || "";
    if (/^(localhost|127\.0\.0\.1)$/i.test(host) || /trycloudflare\.com$/i.test(host)) {
      return location.origin + "/claim";
    }
  } catch (_) {}
  const fromConfig = (typeof window !== "undefined" && window.METHAQ_CRM_GATEWAY
    ? String(window.METHAQ_CRM_GATEWAY)
    : "").trim();
  if (fromConfig) return normalizeGatewayUrl(fromConfig);
  return "";
}

function clearStoredGateway() {
  try { localStorage.removeItem(CRM_GATEWAY_KEY); } catch (_) {}
}

async function discoverLatestGatewayUrl() {
  for (const src of CRM_CONFIG_DISCOVERY_URLS) {
    try {
      const response = await fetch(src + (src.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) continue;
      const body = await response.text();
      const m = body.match(/METHAQ_CRM_GATEWAY\s*=\s*["']([^"']+)["']/);
      if (m && m[1] && /^https?:\/\//i.test(m[1])) {
        const url = normalizeGatewayUrl(m[1]);
        if (typeof window !== "undefined") window.METHAQ_CRM_GATEWAY = url;
        return url;
      }
    } catch (_) {}
  }
  return getCrmGatewayUrl();
}

async function crmFetch(url, options = {}, retries = 4) {
  let lastError = null;
  let endpoint = url;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 90000) : null;
      const response = await fetch(endpoint, {
        ...options,
        signal: controller ? controller.signal : undefined,
        cache: "no-store",
      });
      if (timer) clearTimeout(timer);
      return { response, endpoint };
    } catch (error) {
      lastError = error;
      clearStoredGateway();
      const fresh = await discoverLatestGatewayUrl();
      if (fresh) {
        if (/\/policy\/?$/i.test(String(endpoint))) endpoint = fresh.replace(/\/claim\/?$/i, "/policy");
        else endpoint = fresh;
      }
      if (attempt < retries) await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }
  throw lastError || new Error("Failed to fetch CRM gateway");
}


function renderRoutingList() {
  routingList.innerHTML = routingRules.map(([department, comment]) => `
    <div class="route-item"><strong>${escapeHtml(department)}</strong>${escapeHtml(comment)}</div>
  `).join("");
}

function renderFileList() {
  if (!fileList) return;
  const builtIns = groupBySource(baseKb).map((item) => `
    <div class="file-item">
      <span>${escapeHtml(item.source)}<small>Built-in source · ${item.count} chunks</small></span>
    </div>
  `);
  const uploads = groupBySource(extraKb).map((item) => `
    <div class="file-item">
      <span>${escapeHtml(item.source)}<small>Uploaded or learned · ${item.count} chunks</small></span>
      <button class="remove-file" type="button" data-source="${escapeHtml(item.source)}">Remove</button>
    </div>
  `);
  fileList.innerHTML = [...builtIns, ...uploads].join("") || `<div class="file-item"><span>No active files loaded yet.</span></div>`;
}

function groupBySource(records) {
  const map = new Map();
  records.forEach((record) => {
    const source = record.source || "Unknown source";
    map.set(source, (map.get(source) || 0) + 1);
  });
  return [...map.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => a.source.localeCompare(b.source));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function addMessage(role, content, isHtml = false) {
  const node = document.createElement("div");
  node.className = `message ${role}`;
  if (isHtml) {
    node.innerHTML = content;
  } else {
    node.textContent = content;
  }
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function scoreChunk(queryTokens, chunk) {
  const text = normalize(chunk.text);
  let score = 0;
  const unique = new Set(queryTokens);
  unique.forEach((token) => {
    const matches = text.match(new RegExp(`\\b${escapeRegex(token)}\\b`, "g"));
    if (matches) score += Math.min(matches.length, 4) * (token.length > 5 ? 2.3 : 1.3);
  });
  const phrase = normalize(questionInput.value);
  if (phrase.length > 8 && text.includes(phrase)) score += 12;
  return score;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchKnowledge(question) {
  const tokens = tokenize(question);
  const scored = allKb
    .map((chunk) => ({ chunk, score: scoreChunk(tokens, chunk) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return scored;
}

function recommendRoute(question) {
  const q = normalize(question);
  let best = routingRules[routingRules.length - 1];
  let bestScore = 0;
  for (const rule of routingRules) {
    const score = rule[2].reduce((sum, keyword) => sum + (q.includes(normalize(keyword)) ? keyword.length : 0), 0);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  return { department: best[0], comment: best[1], confident: bestScore > 0 };
}


const GREETING_PATTERNS = [
  /^(hi|hello|hey|hiya|yo|salam|assalamu?\s*alaikum|good\s*(morning|afternoon|evening)|howdy)\b/i,
  /^(thanks|thank\s*you|thx|ty|merci|shukran)\b/i,
  /^(ok|okay|alright|got\s*it|cool|great|perfect|noted)\b/i,
  /^(bye|goodbye|see\s*you|take\s*care)\b/i,
  /^(who\s*are\s*you|what\s*can\s*you\s*do|help|what\s*do\s*you\s*do)\??$/i,
];

function isGreetingOrSmalltalk(question) {
  const q = String(question || "").trim();
  if (!q || q.length > 80) return false;
  if (extractClaimNumber(q)) return false;
  const normalized = normalize(q);
  if (!normalized) return false;
  // Pure greetings / short acknowledgements only
  if (GREETING_PATTERNS.some((re) => re.test(q.trim()))) return true;
  const tokens = normalized.split(" ");
  if (tokens.length <= 3 && ["hi", "hello", "hey", "thanks", "thank", "you", "ok", "okay", "bye"].includes(tokens[0])) {
    return true;
  }
  return false;
}

function renderGreetingAnswer(question) {
  const q = normalize(question);
  if (q.startsWith("thank") || q === "thx" || q === "ty" || q === "merci" || q === "shukran") {
    return `
    <div class="answer-block">
      <div><strong>AI Response</strong> You are welcome. Ask another Methaq claims, documents, routing, or SOP question anytime.</div>
    </div>`;
  }
  if (q.startsWith("bye") || q.startsWith("goodbye") || q.startsWith("see you") || q.startsWith("take care")) {
    return `
    <div class="answer-block">
      <div><strong>AI Response</strong>Goodbye. I am here when you need Methaq claim guidance again.</div>
    </div>`;
  }
  if (q.includes("who are you") || q.includes("what can you do") || q === "help" || q.includes("what do you do")) {
    return `
    <div class="answer-block">
      <div><strong>AI Response</strong> I am Hannibal, the Methaq agent assistant. I answer from the built-in SOP knowledge base, suggest department/comment routing, and look up live claim status through your local CRM gateway when a claim number is present.</div>
      <div class="recommendation"><strong>Try:</strong><br>${starterPrompts.map(escapeHtml).join("<br>")}</div>
    </div>`;
  }
  return `
    <div class="answer-block">
      <div><strong>AI Response</strong>Hello. I am Hannibal, your Methaq claims assistant. Ask about filing a claim, required documents, repair/total loss, comments to leave, or paste a claim number like C-02-0826-35206 for live CRM status.</div>
      <div class="recommendation"><strong>Try:</strong><br>${starterPrompts.map(escapeHtml).join("<br>")}</div>
    </div>`;
}

async function buildAnswer(question) {
  rememberTurn("user", question);
  if (isGreetingOrSmalltalk(question)) return renderGreetingAnswer(question);

  let claimNumber = extractClaimNumber(question);
  if (!claimNumber && isClaimFollowUp(question)) {
    claimNumber = conversation.activeClaim;
  }
  if (claimNumber) {
    conversation.activeClaim = claimNumber;
    return await renderClaimLookupAnswer(claimNumber, question);
  }

  const policyNumber = extractPolicyNumber(question);
  if (policyNumber && (wantsPolicyLookup(question) || /(rsa|roadside|road side|towing|cover|coverage)/i.test(question))) {
    conversation.activePolicy = policyNumber;
    return await renderPolicyLookupAnswer(policyNumber, question);
  }

  const direct = findDirectAnswer(question);
  if (direct) return renderDirectAnswer(direct);

  const hits = searchKnowledge(question);
  const route = recommendRoute(question);
  const topScore = hits[0]?.score || 0;
  const confidence = topScore >= 4.5 ? "high" : topScore >= 1.2 ? "medium" : "low";

  if (confidence === "low") {
    if (hits.length && topScore > 0) {
      const summary = synthesizeAnswer(question, hits);
      return `
    <div class="answer-block">
      <div><strong>AI Response</strong> ${summary}</div>
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> ${escapeHtml(route.department)}<br>
        <strong>SUGGESTED COMMENT:</strong> ${escapeHtml(route.comment)}
      </div>
    </div>`;
    }
    return unavailableAnswer(question, route);
  }

  const summary = synthesizeAnswer(question, hits);
  return `
    <div class="answer-block">
      <div><strong>AI Response</strong> ${summary}</div>
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> ${escapeHtml(route.department)}<br>
        <strong>SUGGESTED COMMENT:</strong> ${escapeHtml(route.comment)}
      </div>
    </div>
  `;
}



function pickRsaProviderFromText(text) {
  const t = String(text || "");
  const aaa = /\baaa\b/i.test(t);
  const ea = /emirates\s*auction/i.test(t);
  if (aaa && !ea) return "AAA";
  if (ea && !aaa) return "Emirates Auction";
  if (aaa && ea) return "AMBIGUOUS";
  return null;
}

function resolveRsaGuidance(crmData, question) {
  const q = String(question || "");
  const rsaQuestion = /(rsa|road\s*side|roadside|towing|tow\b|aaa|emirates\s*auction|breakdown|undrivable|not drivable|assistance number|towing number)/i.test(q);

  let provider = null;
  if (crmData && typeof crmData === "object") {
    const keys = ["roadsideHint", "rsaProvider", "rsa", "roadside", "assistanceProvider", "latestNote", "coverages", "benefits", "notes"];
    for (const key of keys) {
      if (crmData[key] == null) continue;
      const raw = typeof crmData[key] === "string" ? crmData[key] : JSON.stringify(crmData[key]);
      const found = pickRsaProviderFromText(raw);
      if (found === "AAA" || found === "Emirates Auction") {
        provider = found;
        break;
      }
      if (found === "AMBIGUOUS" && !provider) provider = "AMBIGUOUS";
    }
    if (!provider || provider === "AMBIGUOUS") {
      try {
        const found = pickRsaProviderFromText(JSON.stringify(crmData));
        if (found === "AAA" || found === "Emirates Auction") provider = found;
        else if (found === "AMBIGUOUS") provider = provider || "AMBIGUOUS";
      } catch (e) { /* ignore */ }
    }
  }

  const fromQuestion = pickRsaProviderFromText(q);
  if (fromQuestion === "AAA" || fromQuestion === "Emirates Auction") provider = fromQuestion;

  if (!rsaQuestion && !(provider === "AAA" || provider === "Emirates Auction")) return null;

  if (provider === "AAA") {
    return {
      provider: "AAA",
      number: "600508181",
      title: "Call this number — AAA",
      lines: [
        "Roadside provider identified: AAA.",
        "Call 600508181 only.",
        "Arabic (AAA only, if needed): 04 402 0738. English (AAA only, if needed): 04 402 0737.",
        "Do not give the Emirates Auction number.",
        "Undrivable-vehicle coverage only. Methaq main line 600 565 695 (select RSA) is a general Methaq contact after provider check — not a substitute for AAA."
      ]
    };
  }
  if (provider === "Emirates Auction") {
    return {
      provider: "Emirates Auction",
      number: "600500372",
      title: "Call this number — Emirates Auction",
      lines: [
        "Roadside provider identified: Emirates Auction Roadside Assistance.",
        "Call 600500372 only.",
        "Do not give the AAA number.",
        "Undrivable-vehicle coverage only. Methaq main line 600 565 695 (select RSA) is a general Methaq contact after provider check — not a substitute for Emirates Auction."
      ]
    };
  }
  return {
    provider: null,
    number: null,
    title: "RSA — identify provider first",
    lines: [
      "Before giving any RSA number, identify which roadside provider the customer has (policy lookup / CRM / portal benefits).",
      "Do not list AAA and Emirates Auction numbers together.",
      "Ask for the policy number and check RSA/benefits in the portal if the provider is unknown.",
      "Once identified: AAA → 600508181 only; Emirates Auction → 600500372 only.",
      "Coverage applies to undrivable vehicles only."
    ]
  };
}

function renderRsaGuidanceCard(guidance) {
  if (!guidance) return "";
  const numberHtml = guidance.number
    ? `<p class="crm-note"><strong>Call this number:</strong> ${escapeHtml(guidance.number)}</p>`
    : `<p class="crm-note"><strong>Do not share RSA numbers yet</strong> — provider not identified.</p>`;
  const lines = guidance.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  return `<div class="crm-card full"><h3>${escapeHtml(guidance.title)}</h3>${numberHtml}<ul>${lines}</ul></div>`;
}

async function renderPolicyLookupAnswer(policyNumber, question = "") {
  let gateway = getCrmGatewayUrl() || await discoverLatestGatewayUrl();
  if (!gateway) {
    return renderClaimGatewayError(policyNumber, "CRM gateway URL is not configured.");
  }
  try {
    const policyEndpoint = gateway.replace(/\/claim\/?$/, "/policy");
    const fetched = await crmFetch(policyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyNumber }),
    }, 4);
    const response = fetched.response;
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.found) {
      const msg = data.error || data.latestNote || `Gateway returned HTTP ${response.status}`;
      return renderClaimGatewayError(policyNumber, msg);
    }
    conversation.activePolicy = policyNumber;
    conversation.lastCrmData = data;
    const rsaGuidance = resolveRsaGuidance(data, question);
    const rsaBlock = rsaGuidance ? renderRsaGuidanceCard(rsaGuidance) : "";
    return `
      <div class="answer-block crm-expert">
        <div class="crm-head"><strong>AI Response</strong> Live CRM Policy lookup</div>
        <p class="crm-focus">Opened Policy section for <strong>${escapeHtml(policyNumber)}</strong>.</p>
        <div class="crm-grid">
          <div class="crm-card"><h3>Policy facts</h3><div class="crm-facts">
            <div class="crm-fact"><span>Policy</span><strong>${escapeHtml(data.policyNumber || policyNumber)}</strong></div>
            <div class="crm-fact"><span>Status</span><strong>${escapeHtml(data.status || "-")}</strong></div>
            <div class="crm-fact"><span>Product</span><strong>${escapeHtml(data.product || "-")}</strong></div>
            <div class="crm-fact"><span>Holder</span><strong>${escapeHtml(data.holder || "-")}</strong></div>
            <div class="crm-fact"><span>Plate</span><strong>${escapeHtml(data.plate || "-")}</strong></div>
            <div class="crm-fact"><span>Inception</span><strong>${escapeHtml(data.inceptionDate || "-")}</strong></div>
            <div class="crm-fact"><span>Expiry</span><strong>${escapeHtml(data.expiryDate || "-")}</strong></div>
          </div></div>
          <div class="crm-card"><h3>CRM note</h3><p class="crm-note">${escapeHtml(data.latestNote || data.roadsideHint || "-")}</p></div>
          ${rsaBlock}
        </div>
        <div class="recommendation"><strong>DEPARTMENT TO ASSIGN:</strong> Customer Service<br><strong>SUGGESTED COMMENT:</strong> Please check policy ${escapeHtml(policyNumber)} and assist.</div>
      </div>`;
  } catch (error) {
    return renderClaimGatewayError(policyNumber, error.message);
  }
}

async function renderClaimLookupAnswer(claimNumber, question = "") {
  let gateway = getCrmGatewayUrl() || await discoverLatestGatewayUrl();
  if (gateway) {
    try {
      const fetched = await crmFetch(gateway, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimNumber }),
      }, 4);
      const response = fetched.response;
      if (!response.ok) throw new Error(`Gateway returned HTTP ${response.status}`);
      const data = await response.json();
      conversation.activeClaim = claimNumber;
      conversation.lastCrmData = data;
      return renderCrmExpertAnswer(claimNumber, data, question);
    } catch (error) {
      return renderClaimGatewayError(claimNumber, /Failed to fetch|NetworkError|abort/i.test(String(error && error.message))
        ? "CRM connection dropped. I already retried and refreshed the tunnel URL — keep VPN on, ensure the PC keeper is running, then ask the claim again."
        : (error.message || String(error)));
    }
  }
  return renderClaimGatewayError(claimNumber, "CRM gateway URL is not configured.");
}

function analyzeCrmExpert(claimNumber, data, question) {
  const q = normalize(question || "");
  const status = data.status || data.claimStatus || data.stage || "Unknown";
  const lossStatus = data.loss?.status || "";
  const note = String(data.latestNote || data.latestComment || data.notes || "");
  const pending = Array.isArray(data.pendingActions) ? data.pendingActions : [data.pendingActions].filter(Boolean);
  const blob = `${status} ${lossStatus} ${note} ${pending.join(" ")}`.toLowerCase();

  const issues = [];
  const docsOk = [];
  const stuck = [];

  // Document signals
  if (/missing document|document pending|awaiting document|incomplete document|docs? missing/i.test(blob)) {
    issues.push("Documents appear incomplete or still pending in CRM notes.");
  } else if (/document submitted|documents received|docs uploaded|documentation/i.test(blob)) {
    docsOk.push("CRM notes mention documentation activity.");
  }
  if (data.policeReportNumber && data.policeReportNumber !== "-") docsOk.push(`Police Report is present (${data.policeReportNumber}).`);
  else issues.push("Police Report number is missing in the CRM record.");
  if (data.policyNumber) docsOk.push(`Policy Number is present (${data.policyNumber}).`);
  if (data.premiaClaimNumber) docsOk.push(`Premia Claim Number is present (${data.premiaClaimNumber}).`);

  // Stuck / blocker signals
  if (/repair in progress/i.test(lossStatus)) stuck.push("Loss status is Repair In Progress.");
  if (/quotation received/i.test(lossStatus)) stuck.push("Quotation received — likely waiting LPO / repair approval.");
  if (/awaiting|pending|follow up|expedite|doesn't want|does not want|assign another garage|garage/i.test(note)) {
    stuck.push("Latest CRM note shows an active customer/garage follow-up.");
  }
  if (/opened/i.test(status) && /repair in progress/i.test(lossStatus)) {
    stuck.push("Claim is still Open while repair is in progress — monitor workshop progress and customer satisfaction.");
  }
  if (!stuck.length && pending.length) stuck.push(...pending.slice(0, 2).map(String));
  if (!stuck.length) stuck.push("No clear blocker found beyond reviewing the latest note and loss status.");

  // Focused answer for document questions
  let focus = "";
  if (/document|uploaded|papers|missing/.test(q)) {
    if (issues.some((x) => /document|police/i.test(x))) {
      focus = "Document check: there are document-related gaps or missing identifiers. Do not tell the customer everything is complete until CRM confirms required docs.";
    } else {
      focus = "Document check: core identifiers (policy / police report / premia) look present. The current friction is more likely process/garage/repair follow-up than missing core documents — confirm any extra requested docs in the latest note.";
    }
  } else if (/stuck|delay|why|status|progress|issue|garage|repair/.test(q)) {
    focus = `Current friction: ${stuck[0]}`;
  } else {
    focus = `Claim ${claimNumber} is currently marked ${status}` + (lossStatus ? ` with loss status ${lossStatus}` : "") + ".";
  }

  const nextSteps = [];
  if (/garage/i.test(note)) nextSteps.push("Action the garage change / workshop reassignment requested in the latest note and update the customer.");
  if (/repair in progress/i.test(lossStatus)) nextSteps.push("Check workshop ETA and whether parts/LPO are delaying repair.");
  if (/document/i.test(blob)) nextSteps.push("Verify required documents checklist in CRM before promising timelines.");
  if (!nextSteps.length) nextSteps.push("Read latest CRM note, confirm loss status with the owner, then give the customer only confirmed facts.");

  const routeDept = data.recommendedDepartment || recommendRoute(`${status} ${lossStatus} ${note}`).department;
  const routeComment = data.recommendedComment || recommendRoute(`${status} ${lossStatus} ${note}`).comment;

  return {
    status,
    lossStatus,
    note,
    pending,
    owner: data.responsibleTeam || data.department || data.owner || "Not shown",
    issues,
    docsOk,
    stuck,
    focus,
    nextSteps,
    routeDept,
    routeComment,
    facts: [
      ["Claim", claimNumber],
      ["Status", status],
      ["Loss Status", lossStatus || "—"],
      ["Premia", data.premiaClaimNumber || "—"],
      ["Policy", data.policyNumber || "—"],
      ["Police Report", data.policeReportNumber || "—"],
      ["Accident", data.accidentDate || "—"],
      ["Location", data.accidentLocation || "—"],
      ["Opened", data.claimOpenDate || "—"],
      ["Closed", data.claimClosedDate || "—"],
      ["Reserve", data.totalReserve || "—"],
      ["Loss Ref", data.loss?.reference || "—"],
      ["Loss Type", data.loss?.type || "—"],
      ["Owner", data.responsibleTeam || data.loss?.agent || "—"],
    ],
  };
}

function renderCrmExpertAnswer(claimNumber, data, question) {
  const a = analyzeCrmExpert(claimNumber, data, question);
  const remembered = conversation.activeClaim === claimNumber
    ? `<div class="crm-chip">Active claim in this chat: <strong>${escapeHtml(claimNumber)}</strong></div>`
    : "";
  const factRows = a.facts.map(([k, v]) => `<div class="crm-fact"><span>${escapeHtml(k)}</span><strong>${escapeHtml(String(v))}</strong></div>`).join("");
  const stuckHtml = a.stuck.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const docsHtml = [
    ...a.docsOk.map((s) => `<li class="ok">${escapeHtml(s)}</li>`),
    ...a.issues.map((s) => `<li class="bad">${escapeHtml(s)}</li>`),
  ].join("") || "<li>No document signals found in the visible CRM fields.</li>";
  const nextHtml = a.nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const note = polishText(String(a.note).replace(/\n+/g, " ").slice(0, 420));

  return `
    <div class="answer-block crm-expert">
      <div class="crm-head">
        <strong>AI Response</strong>
        ${remembered}
        <p class="crm-focus">${escapeHtml(a.focus)}</p>
      </div>
      <div class="crm-grid">
        <div class="crm-card">
          <h3>Claim snapshot</h3>
          <div class="crm-facts">${factRows}</div>
        </div>
        <div class="crm-card">
          <h3>What it is stuck on</h3>
          <ul>${stuckHtml}</ul>
        </div>
        <div class="crm-card">
          <h3>Documents check</h3>
          <ul>${docsHtml}</ul>
        </div>
        <div class="crm-card">
          <h3>Latest CRM note</h3>
          <p class="crm-note">${escapeHtml(note)}</p>
        </div>
      </div>
      <div class="crm-card full">
        <h3>What you should do next</h3>
        <ul>${nextHtml}</ul>
      </div>
      ${renderRsaGuidanceCard(resolveRsaGuidance(data, question))}
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> ${escapeHtml(a.routeDept)}<br>
        <strong>SUGGESTED COMMENT:</strong> ${escapeHtml(a.routeComment)}
      </div>
    </div>
  `;
}

function renderCrmData(claimNumber, data) {
  return renderCrmExpertAnswer(claimNumber, data, "");
}

function renderClaimGatewayError(claimNumber, message) {
  return `
    <div class="answer-block">
      <div class="recommendation warning">
        <strong>AI Response</strong> I recognized ${escapeHtml(claimNumber)} and tried live CRM lookup, but the CRM gateway did not return data.
        <br><br>
        Status: ${escapeHtml(message)}
        <br><br>
        Check that the <strong>local CRM gateway on the PC is running</strong>, connect <strong>FortiClient VPN</strong> if required, then retry.
        I auto-retry and refresh the tunnel URL from your PC sync. Keep <strong>FortiClient VPN</strong> on and leave the PC CRM keeper running. Clear Manager Hub CRM URL if an old tunnel was saved.
        If it still fails, contact <strong>Nouran</strong> or <strong>Abdelhafiz</strong> to cross-check in CRM.
      </div>
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> Customer Service<br>
        <strong>SUGGESTED COMMENT:</strong> Please check and assist with the request.
      </div>
    </div>
  `;
}

function findDirectAnswer(question) {
  const q = normalize(question);
  let best = null;
  let bestScore = 0;

  // Intent boost: raise/file/submit/lodge + claim
  const claimIntent = /(raise|raising|file|filing|submit|submitting|lodge|register|open|new|fnol)/i.test(q) && /\bclaim\b/i.test(q);
  const afterIntent = /(after|next step|what happens|process)/i.test(q) && /\bclaim\b/i.test(q);

  for (const item of directAnswers) {
    let score = 0;
    for (const phrase of item.match) {
      const p = normalize(phrase);
      if (!p) continue;
      if (q.includes(p)) {
        score += p.length + 8;
        continue;
      }
      const words = p.split(" ").filter((w) => w.length > 2);
      if (words.length >= 2 && words.every((w) => q.includes(w))) {
        score += Math.floor(p.length / 2) + 4;
      }
    }
    if (item.id === "file-claim" && (claimIntent || afterIntent)) score += 20;
    if (item.id === "agent-permissions" && /(can i|can agent|agents? (can|cannot|can't)|what can agents|on behalf|upload for customer|negotiate settlement)/i.test(q) && !/(say approved|tell approved|settlement amount|quote amount|promise to call|share (the )?lpo)/i.test(q)) score += 28;
    if (item.id === "cash-settlement" && /(cash settlement|cash instead|prefer cash|want cash|choose cash|digital settlement)/i.test(q)) score += 22;
    if (item.id === "alternative-car" && /(alternative car|rental car|replacement (car|vehicle)|compensation days|daily allowance|hire car)/i.test(q)) score += 12;
    if (item.id === "third-party-at-fault" && /(at fault|i caused|caused the accident|i hit)/i.test(q) && /(third party|third-party|\btp\b)/i.test(q)) score += 18;
    if (item.id === "third-party-not-at-fault" && /(hit me|someone hit|other driver|not at fault|another driver)/i.test(q) && /(third party|third-party|\btp\b|repair my car)/i.test(q)) score += 18;
    if (item.id === "required-documents" && /(document|documents|docs|papers|mulkiya|police report|emirates id|what to upload)/i.test(q) && !/(raise|file|submit|lodge|register|open)\s+(a\s+)?claim/i.test(q)) score += 18;
    if (item.id === "privacy-rules" && /(settlement amount|quote amount|say approved|tell approved|can i say|promise to call|share (the )?lpo|share the quote|internal number|cash settlement amount)/i.test(q)) score += 30;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore >= 6 ? best : null;
}

function renderDirectAnswer(item) {
  return `
    <div class="answer-block">
      <div><strong>AI Response</strong><br><br>${item.answer.map((p) => escapeHtml(p)).join("<br><br>")}</div>
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> ${escapeHtml(item.department)}<br>
        <strong>SUGGESTED COMMENT:</strong> ${escapeHtml(item.comment)}
      </div>
    </div>
  `;
}

function polishText(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  const swaps = [
    [/\bpolicyholder\b/gi, "Policy Holder"],
    [/\bpolicyholders\b/gi, "Policy Holders"],
    [/\bthird-party\b/gi, "Third-Party"],
    [/\bthird party\b/gi, "Third Party"],
    [/\bcash settlement\b/gi, "Cash Settlement"],
    [/\btotal loss\b/gi, "Total Loss"],
    [/\bclaims team\b/gi, "Claims Team"],
    [/\bcustomer service\b/gi, "Customer Service"],
    [/\bdriving license\b/gi, "Driving License"],
    [/\bpolice report\b/gi, "Police Report"],
    [/\biban\b/gi, "IBAN"],
    [/\blpo\b/gi, "LPO"],
    [/\bnoc\b/gi, "NOC"],
    [/\bfnol\b/gi, "FNOL"],
  ];
  for (const [re, val] of swaps) t = t.replace(re, val);
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function synthesizeAnswer(question, hits) {
  const q = normalize(question);

  // Prefer structured direct answers for common intents even if matcher was weak
  const boosted = findDirectAnswer(question);
  if (boosted && boosted.answer && boosted.answer.length) {
    return escapeHtml(boosted.answer.join(" "));
  }

  const combined = hits.map(({ chunk }) => chunk.text).join("\n");
  const sentences = combined
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 50)
    .filter((s) => !/^(table of contents|quick navigation|confidential|created by|party action|step customer|document owner)/i.test(s))
    .filter((s) => !/search on google|←|→|YTILIBIGILE|ESAHP|TNEMUDOC/i.test(s))
    .filter((s) => !/\b(Action|System|Customer|Surveyor|Finance|Party)\s*:/i.test(s))
    .filter((s) => !/\b(and|or|after|to|for|with|the|a|an|on|of|by)\.?$/i.test(s))
    .filter((s) => /[.!?)]$/.test(s) || /[.!?]$/.test(s) || s.length > 90);

  const qTokens = new Set(tokenize(question));
  const ranked = sentences
    .map((sentence) => {
      const score = tokenize(sentence).reduce((sum, token) => sum + (qTokens.has(token) ? 1 : 0), 0);
      return { sentence, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const seen = new Set();
  for (const item of ranked) {
    const cleaned = polishText(item.sentence);
    if (/\b(and|or|after|to|for|with|the|a|an)\.?$/i.test(cleaned)) continue;
    const key = normalize(cleaned).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(cleaned);
    if (picked.length >= 3) break;
  }

  if (!picked.length) {
    return escapeHtml("I could not build a clear answer from the knowledge snippets for this question. Ask it another way, or paste a claim number like C-02-0826-35206 for a live CRM lookup.");
  }

  const wantsSteps = /(step|process|how|after|what do we do|what happens)/i.test(q);
  if (wantsSteps && picked.length > 1) {
    const steps = picked.map((s, i) => `${i + 1}. ${s}`).join("<br>");
    return `${escapeHtml("Here are the clear steps:")}<br><br>${steps}`;
  }
  return escapeHtml(picked.join(" "));
}

function unavailableAnswer(question, route) {
  return `
    <div class="answer-block">
      <div class="recommendation warning">
        <strong>AI Response</strong> I could not confirm a safe answer for this question from the available information.
        <br><br>
        Please contact <strong>Nouran</strong> or <strong>Abdelhafiz</strong> to cross-check before advising the customer.
        <br><br>
        If this is about a specific claim, paste the claim number (for example C-02-0826-35206) and I will look it up in CRM automatically.
      </div>
      <div class="recommendation">
        <strong>DEPARTMENT TO ASSIGN:</strong> ${escapeHtml(route.department)}<br>
        <strong>SUGGESTED COMMENT:</strong> ${escapeHtml(route.comment)}
      </div>
    </div>
  `;
}

function showTypingIndicator() {
  const node = document.createElement("div");
  node.className = "message agent typing-message";
  node.id = "typingIndicator";
  node.innerHTML = '<div class="typing-indicator" aria-label="Hannibal is typing"><span></span><span></span><span></span></div>';
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typingIndicator")?.remove();
}

async function sendCurrentQuestion() {
  const question = questionInput.value.trim();
  if (!question) return;
  addMessage("user", question);
  questionInput.value = "";
  questionInput.disabled = true;
  showTypingIndicator();
  const started = Date.now();
  try {
    const html = await buildAnswer(question);
    const wait = Math.max(500, 1100 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    removeTypingIndicator();
    addMessage("agent", html, true);
  } catch (err) {
    removeTypingIndicator();
    addMessage("agent", `<div class="answer-block"><div class="recommendation warning"><strong>AI Response</strong> Something went wrong while answering. Please contact Nouran or Abdelhafiz.<br><br>${escapeHtml(err.message || String(err))}</div></div>`, true);
  } finally {
    questionInput.disabled = false;
    questionInput.focus();
  }
}

function trimSource(text) {
  return text.length > 420 ? `${text.slice(0, 420).trim()}...` : text;
}

async function ingestFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const buffer = await file.arrayBuffer();
  let text = "";

  if (ext === "pdf") text = await readPdf(buffer);
  else if (["docx", "doc"].includes(ext)) text = (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  else if (["xlsx", "xls", "csv"].includes(ext)) text = readSpreadsheet(buffer, ext);
  else if (["pptx", "ppt"].includes(ext)) text = await readPptx(buffer);
  else text = new TextDecoder().decode(buffer);

  return chunkText(text).map((chunk, index) => ({
    source: file.name,
    type: `Uploaded ${ext.toUpperCase()}`,
    locator: `chunk ${index + 1}`,
    chunk: index + 1,
    text: chunk,
  }));
}

async function readPdf(buffer) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

function readSpreadsheet(buffer, ext) {
  const workbook = XLSX.read(buffer, { type: "array" });
  return workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
    return `Sheet: ${name}\n${rows}`;
  }).join("\n\n");
}

async function readPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  const slides = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("string");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const text = [...doc.getElementsByTagName("a:t")].map((node) => node.textContent).join(" ");
    slides.push(text);
  }
  return slides.join("\n\n");
}

function chunkText(text, size = 1200) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let start = 0; start < clean.length; start += size) {
    chunks.push(clean.slice(start, start + size));
  }
  return chunks.filter(Boolean);
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendCurrentQuestion();
});

function handleComposerKey(event) {
  const isEnter = event.key === "Enter" || event.code === "Enter" || event.keyCode === 13 || event.which === 13;
  if (!isEnter) return;
  if (event.shiftKey) return; // allow Shift+Enter only if textarea; ignored on input
  event.preventDefault();
  event.stopPropagation();
  sendCurrentQuestion();
}
if (questionInput) {
  questionInput.addEventListener("keydown", handleComposerKey, true);
}
document.addEventListener("keydown", (event) => {
  if (document.activeElement === questionInput) handleComposerKey(event);
}, true);

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (localStorage.getItem(MANAGER_UNLOCK_KEY) !== "yes") {
    uploadStatus.textContent = "Enter the manager key before uploading documents.";
    return;
  }
  const files = [...uploadInput.files];
  if (!files.length) {
    uploadStatus.textContent = "Choose at least one document first.";
    return;
  }
  uploadStatus.textContent = "Reading documents...";
  try {
    const batches = [];
    for (const file of files) batches.push(...await ingestFile(file));
    extraKb.push(...batches);
    saveExtraKb();
    refreshKb();
    uploadStatus.textContent = `Learned ${batches.length} new chunks from ${files.length} document(s).`;
    uploadInput.value = "";
  } catch (error) {
    uploadStatus.textContent = `Could not read one of the files: ${error.message}`;
  }
});

fileList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-file");
  if (!button) return;
  if (localStorage.getItem(MANAGER_UNLOCK_KEY) !== "yes") {
    keyStatus.textContent = "Enter the manager key before removing documents.";
    return;
  }
  const source = button.dataset.source;
  extraKb = extraKb.filter((record) => record.source !== source);
  saveExtraKb();
  refreshKb();
  uploadStatus.textContent = `Removed ${source} from uploaded knowledge.`;
});

managerKeyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = managerKeyInput.value.trim();
  if (key === MANAGER_KEY) {
    managerKeyInput.value = "";
    setManagerUnlocked(true);
  } else {
    keyStatus.textContent = "Wrong key. Manager Hub remains locked.";
  }
});

saveCrmGateway.addEventListener("click", () => {
  if (localStorage.getItem(MANAGER_UNLOCK_KEY) !== "yes") {
    keyStatus.textContent = "Enter the manager key before changing CRM settings.";
    return;
  }
  localStorage.setItem(CRM_GATEWAY_KEY, crmGatewayUrl.value.trim());
  refreshCrmStatus();
});

function welcome() {
  addMessage("agent", `
      <div class="answer-block">
      <div><strong>AI Response</strong> I am Hannibal, the dedicated Project Methaq AI specialist. Ask me about Methaq motor claims, services, workflow, documents, comments, and customer handling. I will answer from the active internal knowledge base, show the source, and suggest the department/comment to leave.</div>
      <div class="recommendation"><strong>Try:</strong><br>${starterPrompts.map(escapeHtml).join("<br>")}</div>
    </div>
  `, true);
}

function bootApp(embeddedOnly) {
  refreshKb();
  renderRoutingList();
  setManagerUnlocked(localStorage.getItem(MANAGER_UNLOCK_KEY) === "yes");
  refreshCrmStatus();
  if (!embeddedOnly) welcome();
}

function applyEmbeddedKb() {
  if (Array.isArray(window.METHAQ_KB) && window.METHAQ_KB.length) {
    baseKb = window.METHAQ_KB;
    return true;
  }
  return false;
}

const hadEmbedded = applyEmbeddedKb();
if (hadEmbedded) {
  bootApp(false);
} else {
  // Should not happen when kb-embed.js is shipped; keep UI usable.
  baseKb = [];
  bootApp(true);
  addMessage("agent", "Built-in knowledge embed was missing. Trying kb.json fetch...");
}

// Optional refresh from kb.json when the host serves it (never clears a working embed on failure).
fetch("./kb.json")
  .then((response) => {
    if (!response.ok) throw new Error("kb.json HTTP " + response.status);
    return response.json();
  })
  .then((data) => {
    if (Array.isArray(data) && data.length) {
      baseKb = data;
      window.METHAQ_KB = data;
      refreshKb();
    }
  })
  .catch(() => {
    if (!baseKb.length) {
      addMessage("agent", "I could not load the built-in knowledge base. Upload documents in Manager Hub, or republish with kb-embed.js included.");
    }
  });


/* HANNIBAL-ROADSIDE-AND-CRM-BOOT */
(function () {
  function crmParam() {
    try {
      var p = new URLSearchParams(location.search);
      return (p.get("crm") || p.get("claim") || "").trim();
    } catch (e) { return ""; }
  }
  var originalFindDirect = typeof findDirectAnswer === "function" ? findDirectAnswer : null;
  if (originalFindDirect) {
    findDirectAnswer = function (question) {
      var q = normalize(question);
      if (/(road\s*side|roadside|towing|tow\b|aaa|rsa|breakdown|undrivable|not drivable|assistance number|towing number)/i.test(q)) {
        var tow = directAnswers.find(function (item) { return item.id === "towing"; });
        if (tow) return tow;
      }
      return originalFindDirect(question);
    };
  }
  var param = crmParam();
  if (param) {
    var claim = extractClaimNumber(param) || extractClaimNumber("C-" + param) || "";
    if (!claim && /^C-\d{2}-\d{4}-\d{4,8}$/i.test(param)) claim = param.toUpperCase();
    if (claim) {
      setTimeout(function () {
        if (questionInput) questionInput.value = "What is the status of claim " + claim + "?";
        if (typeof sendCurrentQuestion === "function") sendCurrentQuestion();
      }, 600);
    }
  }
})();
