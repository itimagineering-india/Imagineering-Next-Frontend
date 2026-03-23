import PlanCard from "./PlanCard";
import { buyerFeatures, supplierFeatures, subscriptionPricing } from "@/data/subscription";

const PricingGrid = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PlanCard
          title="Buyer Premium – Unlock Direct Contact"
          subtitle="Direct calls, WhatsApp, and full profiles. No commission on direct deals."
          price={`₹${subscriptionPricing.buyerPremium.monthly}`}
          period="mo"
          features={buyerFeatures}
          cta="Upgrade to Buyer Premium"
        />
        <PlanCard
          title="Buyer Premium – Yearly"
          subtitle="Best value for power users who need unlimited unlocks."
          price={`₹${subscriptionPricing.buyerPremium.yearly}`}
          period="yr"
          features={buyerFeatures}
          cta="Upgrade to Buyer Premium"
        />
      </div>
      <div className="space-y-4">
        <PlanCard
          title="Supplier Premium – Grow Your Business"
          subtitle="Gold badge, featured in map/search, direct leads from premium buyers."
          price={`₹${subscriptionPricing.supplierPremium.monthly}`}
          period="mo"
          features={supplierFeatures}
          cta="Upgrade to Supplier Premium"
          tone="gold"
        />
        <PlanCard
          title="Supplier Premium – Yearly"
          subtitle="Maximize visibility, unlimited listings, and trusted positioning."
          price={`₹${subscriptionPricing.supplierPremium.yearly}`}
          period="yr"
          features={supplierFeatures}
          cta="Upgrade to Supplier Premium"
          tone="gold"
        />
      </div>
    </div>
  );
};

export default PricingGrid;

