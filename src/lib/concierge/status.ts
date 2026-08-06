import type { ConciergeRequestStatus } from "@/types/concierge";



export const CONCIERGE_STATUS_LABELS: Record<ConciergeRequestStatus, string> = {

  pending: "Under review",

  with_vendors: "Sourcing from partners",

  offers_ready: "Offers being prepared",

  client_reviewing: "Review recommendation",

  revision_requested: "Revision requested",

  vendor_selected: "Recommendation accepted",

  in_fulfilment: "Sourcing your item",

  in_progress: "In progress",

  completed: "Complete",

  closed: "Closed",

};



const CLIENT_STEPS: { key: ConciergeRequestStatus; label: string }[] = [

  { key: "pending", label: "Request received" },

  { key: "with_vendors", label: "Sourcing from partners" },

  { key: "offers_ready", label: "Kay reviewing offers" },

  { key: "client_reviewing", label: "Review recommendation" },

  { key: "vendor_selected", label: "Recommendation accepted" },

  { key: "in_fulfilment", label: "Sourcing your item" },

  { key: "completed", label: "Complete" },

];



function statusRank(status: ConciergeRequestStatus): number {

  if (status === "pending") return 0;

  if (status === "with_vendors") return 1;

  if (status === "offers_ready") return 2;

  if (status === "revision_requested") return 2;

  if (status === "client_reviewing") return 3;

  if (status === "vendor_selected") return 4;

  if (status === "in_fulfilment" || status === "in_progress") return 5;

  if (status === "completed") return 6;

  if (status === "closed") return -1;

  return 0;

}



export function getConciergeTrackingSteps(status: ConciergeRequestStatus) {

  if (status === "closed") {

    return [

      {

        key: "closed" as const,

        label: "Request closed",

        complete: true,

        active: true,

        description:

          "This sourcing request is no longer active. Contact concierge if you need help.",

      },

    ];

  }



  const current = statusRank(status);

  return CLIENT_STEPS.map((step, index) => ({

    ...step,

    complete: current > index || status === "completed",

    active:

      current === index ||

      (status === "revision_requested" && step.key === "offers_ready"),

    description: getStepDescription(step.key, status),

  }));

}



function getStepDescription(

  step: ConciergeRequestStatus,

  current: ConciergeRequestStatus,

): string | undefined {

  if (step !== current && statusRank(current) !== statusRank(step)) {

    if (current === "in_progress" && step === "in_fulfilment") {

      return getStepDescription("in_fulfilment", "in_fulfilment");

    }

    if (current === "revision_requested" && step === "offers_ready") {

      return getStepDescription("revision_requested", "revision_requested");

    }

    return undefined;

  }



  switch (current) {

    case "pending":

      return "Our concierge team is reviewing your request.";

    case "with_vendors":

      return "We're checking our vendor network for availability and pricing.";

    case "offers_ready":

      return "Kay is reviewing partner offers and will send you one curated recommendation.";

    case "revision_requested":

      return "We're sourcing another option based on your feedback.";

    case "client_reviewing":

      return "Review Kay's recommendation — accept, ask for changes, or cancel the request.";

    case "vendor_selected":

      return "Complete payment below. Sourcing begins once payment is confirmed.";

    case "in_fulfilment":

    case "in_progress":

      return "Your item is being sourced and prepared for Kay hub delivery.";

    case "completed":

      return "Your request has been handled — check your email for next steps.";

    default:

      return undefined;

  }

}



export function isConciergeReference(value: string): boolean {

  return /^CON-[A-F0-9]{6}$/i.test(value.trim());

}



export function normalizeConciergeReference(value: string): string {

  return value.trim().toUpperCase();

}



export function formatConciergeDate(iso: string): string {

  return new Intl.DateTimeFormat("en-NG", {

    day: "numeric",

    month: "short",

    year: "numeric",

  }).format(new Date(iso));

}

