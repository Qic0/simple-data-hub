import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { PRICING_DATA, MATERIALS, MaterialType } from "@/types/dxf";
export function PricingSheet() {
  // Group pricing by material
  const pricingByMaterial = PRICING_DATA.reduce((acc, item) => {
    if (!acc[item.material]) {
      acc[item.material] = [];
    }
    acc[item.material].push(item);
    return acc;
  }, {} as Record<MaterialType, typeof PRICING_DATA>);
  const availableMaterials = Object.keys(pricingByMaterial) as MaterialType[];
  return <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Стоимость
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-2xl">Прайс-лист на резку металла</SheetTitle>
          <SheetDescription>
            Актуальные цены на лазерную резку заготовок
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-8">
          {availableMaterials.map(material => <div key={material}>
              <h3 className="text-lg font-semibold mb-4">{MATERIALS[material].name}</h3>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Толщина (мм)</TableHead>
                    <TableHead className="font-semibold">Резка (₽/м)</TableHead>
                    <TableHead className="font-semibold">Врезка (₽/точка)</TableHead>
                    <TableHead className="font-semibold">Металл (₽/м²)</TableHead>
                    <TableHead className="font-semibold">Формат (м)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingByMaterial[material].map(row => <TableRow key={`${row.material}-${row.thickness}`}>
                      <TableCell className="font-medium">{row.thickness}</TableCell>
                      <TableCell>{row.cutting}</TableCell>
                      <TableCell>{row.pierce}</TableCell>
                      <TableCell>{row.metal}</TableCell>
                      <TableCell className="text-muted-foreground">{row.format}</TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>)}
        </div>

        
      </SheetContent>
    </Sheet>;
}