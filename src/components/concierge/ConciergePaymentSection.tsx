"use client";



import { formatNaira } from "@/lib/data/home";

import { FlutterwavePayButton } from "@/components/payments/FlutterwavePayButton";

import type { ClientConciergeDetail } from "@/types/concierge";



type Props = {

  detail: ClientConciergeDetail;

};



export function ConciergePaymentSection({ detail }: Props) {

  if (!detail.canPay || !detail.paymentBreakdown) return null;



  const { clientPrice } = detail.paymentBreakdown;



  return (

    <div className="mt-6 rounded-xl border border-amber-200/70 bg-amber-50/60 p-5">

      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">

        Complete payment

      </p>

      <p className="mt-2 text-[13px] text-amber-950">

        Pay to confirm your selection. Sourcing begins after payment is received.

      </p>

      <p className="mt-4 font-serif text-[28px] text-amber-950">

        {formatNaira(clientPrice)}

      </p>

      <FlutterwavePayButton

        kind="concierge"

        id={detail.id}

        className="mt-4 w-full sm:w-auto"

        label={`Pay ${formatNaira(clientPrice)}`}

      />

    </div>

  );

}


