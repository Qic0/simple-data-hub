import { MaterialType, MATERIALS, getAvailableThicknesses, isMaterialAvailable } from "@/types/dxf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface MaterialSelectorProps {
  selectedMaterial: MaterialType;
  selectedThickness: number;
  onMaterialChange: (material: MaterialType) => void;
  onThicknessChange: (thickness: number) => void;
}

export const MaterialSelector = ({
  selectedMaterial,
  selectedThickness,
  onMaterialChange,
  onThicknessChange,
}: MaterialSelectorProps) => {
  const materialKeys = Object.keys(MATERIALS) as MaterialType[];
  const [openPopover, setOpenPopover] = useState<MaterialType | null>(null);

  const handleMaterialSelect = (materialKey: MaterialType) => {
    onMaterialChange(materialKey);
    setOpenPopover(null);
  };

  const handleThicknessSelect = (thickness: number) => {
    onThicknessChange(thickness);
    setOpenPopover(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Материал и толщина</h3>
        <div className="grid grid-cols-1 gap-2">
          {materialKeys.map((materialKey) => {
            const isAvailable = isMaterialAvailable(materialKey);
            const availableThicknesses = getAvailableThicknesses(materialKey);
            
            return (
              <Popover
                key={materialKey}
                open={openPopover === materialKey}
                onOpenChange={(open) => setOpenPopover(open && isAvailable ? materialKey : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedMaterial === materialKey ? "default" : "outline"}
                    onClick={() => isAvailable && handleMaterialSelect(materialKey)}
                    className="justify-start text-left h-auto py-3"
                    disabled={!isAvailable}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1">{MATERIALS[materialKey].name}</span>
                      {!isAvailable && (
                        <Badge variant="warning" className="text-xs">
                          Нет в наличии
                        </Badge>
                      )}
                      {isAvailable && selectedMaterial === materialKey && selectedThickness && (
                        <span className="ml-auto text-xs opacity-80">
                          {selectedThickness} мм
                        </span>
                      )}
                    </div>
                  </Button>
                </PopoverTrigger>
                {isAvailable && (
                  <PopoverContent 
                    side="right" 
                    align="start" 
                    className="w-auto p-3 z-[100]"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Выберите толщину
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {availableThicknesses.map((thickness) => (
                          <Button
                            key={thickness}
                            variant={
                              selectedMaterial === materialKey && selectedThickness === thickness
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleThicknessSelect(thickness)}
                            size="sm"
                          >
                            {thickness} мм
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>
      </div>
    </div>
  );
};
