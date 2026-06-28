import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";

export default function CheckoutPage() {
  return (
    <div className="checkout-page relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <CheckoutHeader />
        <CheckoutForm />
      </div>
    </div>
  );
}
