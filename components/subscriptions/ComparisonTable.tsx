import { CheckCircle2, X } from "lucide-react";

type Row = {
  feature: string;
  buyer?: boolean;
  supplier?: boolean;
};

const rows: Row[] = [
  { feature: "Platform billing (default)", buyer: true, supplier: true },
  { feature: "Direct contact unlocks", buyer: true, supplier: false },
  { feature: "Gold badge & featured placement", buyer: false, supplier: true },
  { feature: "Top ranking in map & search", buyer: false, supplier: true },
  { feature: "Unlimited contact unlocks", buyer: true, supplier: false },
  { feature: "Unlimited listings", buyer: false, supplier: true },
  { feature: "No commission on direct deals", buyer: true, supplier: false },
  { feature: "Direct leads from premium buyers", buyer: false, supplier: true },
];

const ComparisonTable = () => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full min-w-[640px] border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted">
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Feature</th>
            <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Buyer Premium</th>
            <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Supplier Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-t">
              <td className="py-3 px-4 text-sm text-foreground">{row.feature}</td>
              <td className="py-3 px-4 text-center">
                {row.buyer ? (
                  <CheckCircle2 className="h-5 w-5 text-primary inline-flex" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground inline-flex" />
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {row.supplier ? (
                  <CheckCircle2 className="h-5 w-5 text-amber-500 inline-flex" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground inline-flex" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;

