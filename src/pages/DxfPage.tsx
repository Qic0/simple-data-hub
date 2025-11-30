import { useState, useMemo } from "react";
import { DxfUploader } from "@/components/DxfUploader";
import { DxfViewer } from "@/components/DxfViewer";
import { NestingViewer } from "@/components/NestingViewer";
import { MaterialSelector } from "@/components/MaterialSelector";
import { MainNav } from "@/components/MainNav";
import { DxfThumbnailGenerator } from "@/components/DxfThumbnailGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Edit, Package, ChevronDown, FileText, Pencil, Ruler, Circle, Layers } from "lucide-react";
import { calculateNesting } from "@/lib/dxfNesting";
import type { NestingResult } from "@/lib/dxf/types";
import { DxfConfig, FinishedDxfPart, createDefaultDxfConfig, calculateDxfPrice, MaterialType, getPricingByThickness, MATERIALS } from "@/types/dxf";
import { toast } from "@/hooks/use-toast";
export default function DxfPage() {
  const [dxfConfig, setDxfConfig] = useState<DxfConfig>(createDefaultDxfConfig());
  const [finishedParts, setFinishedParts] = useState<FinishedDxfPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [selectedNestingVariant, setSelectedNestingVariant] = useState(0);
  const [isPriceDetailsOpen, setIsPriceDetailsOpen] = useState(false);

  // Расчет раскроя
  const nestingResults = useMemo<NestingResult[]>(() => {
    // Определяем текущую конфигурацию для расчета
    let currentDisplayConfig: DxfConfig | null = null;
    if (selectedPartId && !isCreatingNew) {
      const part = finishedParts.find(p => p.id === selectedPartId);
      currentDisplayConfig = part ? part.config : null;
    } else {
      currentDisplayConfig = dxfConfig.fileName ? dxfConfig : null;
    }
    if (!currentDisplayConfig?.fileContent || !currentDisplayConfig?.thickness) {
      return [];
    }
    try {
      return calculateNesting(currentDisplayConfig.fileContent, currentDisplayConfig.thickness);
    } catch (error) {
      console.error("Error calculating nesting:", error);
      return [];
    }
  }, [dxfConfig, finishedParts, selectedPartId, isCreatingNew]);
  const handleFileLoaded = (fileName: string, content: string, vectorLength: number) => {
    setDxfConfig({
      ...dxfConfig,
      fileName,
      fileContent: content,
      vectorLength,
      price: 0, // Will be calculated when nesting results are available
      previewImage: undefined // Will be generated
    });
    setIsCreatingNew(true);
    setSelectedPartId(null);
  };

  const handleThumbnailGenerated = (dataUrl: string) => {
    setDxfConfig(prev => ({
      ...prev,
      previewImage: dataUrl
    }));
  };
  const handleMaterialChange = (material: MaterialType) => {
    setDxfConfig({
      ...dxfConfig,
      material,
      price: 0 // Will be recalculated
    });
  };
  const handleThicknessChange = (thickness: number) => {
    setDxfConfig({
      ...dxfConfig,
      thickness,
      price: 0 // Will be recalculated
    });
  };
  const handleFinishPart = () => {
    if (!dxfConfig.fileName) {
      toast({
        title: "Ошибка",
        description: "Загрузите DXF файл",
        variant: "destructive"
      });
      return;
    }

    // Calculate price using current nesting results
    const currentNesting = nestingResults[selectedNestingVariant];
    const price = currentNesting ? calculateDxfPrice(dxfConfig.vectorLength, dxfConfig.thickness, dxfConfig.material, currentNesting.piercePoints, currentNesting.sheetArea) : 0;
    const newPart: FinishedDxfPart = {
      id: `DXF-${String(finishedParts.length + 1).padStart(3, "0")}`,
      config: {
        ...dxfConfig,
        price,
        sheetArea: currentNesting?.sheetArea,
        metalCost: currentNesting?.metalCost,
        efficiency: currentNesting?.efficiency,
        piercePoints: currentNesting?.piercePoints,
      },
      createdAt: new Date()
    };
    setFinishedParts([...finishedParts, newPart]);
    setDxfConfig(createDefaultDxfConfig());
    setIsCreatingNew(true);
    setSelectedPartId(null);
    toast({
      title: "Деталь добавлена",
      description: `Артикул: ${newPart.id}`
    });
  };
  const handleSelectPart = (partId: string) => {
    setSelectedPartId(partId);
    setIsCreatingNew(false);
  };
  const handleDeletePart = (partId: string) => {
    setFinishedParts(finishedParts.filter(p => p.id !== partId));
    if (selectedPartId === partId) {
      setSelectedPartId(null);
      setIsCreatingNew(true);
    }
    toast({
      title: "Деталь удалена"
    });
  };
  const handleEditPart = (partId: string) => {
    const part = finishedParts.find(p => p.id === partId);
    if (part) {
      setDxfConfig({
        ...part.config
      });
      setSelectedPartId(partId);
      setIsCreatingNew(false);
    }
  };
  const handleSaveEdit = () => {
    if (!selectedPartId) return;

    // Calculate price using current nesting results
    const currentNesting = nestingResults[selectedNestingVariant];
    const price = currentNesting ? calculateDxfPrice(dxfConfig.vectorLength, dxfConfig.thickness, dxfConfig.material, currentNesting.piercePoints, currentNesting.sheetArea) : 0;
    setFinishedParts(finishedParts.map(part => part.id === selectedPartId ? {
      ...part,
      config: {
        ...dxfConfig,
        price
      }
    } : part));
    toast({
      title: "Изменения сохранены"
    });
    setSelectedPartId(null);
    setIsCreatingNew(true);
    setDxfConfig(createDefaultDxfConfig());
  };
  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedPartId(null);
    setDxfConfig(createDefaultDxfConfig());
  };
  const getDisplayConfig = (): DxfConfig | null => {
    if (selectedPartId && !isCreatingNew) {
      const part = finishedParts.find(p => p.id === selectedPartId);
      return part ? part.config : null;
    }
    return dxfConfig.fileName ? dxfConfig : null;
  };
  const displayConfig = getDisplayConfig();
  const totalPrice = finishedParts.reduce((sum, part) => sum + part.config.price, 0);

  // Calculate current price for display
  const currentPrice = displayConfig && nestingResults.length > 0 && nestingResults[selectedNestingVariant] ? calculateDxfPrice(displayConfig.vectorLength, displayConfig.thickness, displayConfig.material, nestingResults[selectedNestingVariant].piercePoints, nestingResults[selectedNestingVariant].sheetArea) : 0;
  return <div className="h-screen flex flex-col">
      <MainNav />

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-4 p-4">
          {/* Left Column - Configurator */}
          <div className="w-80 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">
                  {isCreatingNew ? "Новая деталь" : "Редактирование"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {isCreatingNew ? <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Загрузка файла</h3>
                      <DxfUploader onFileLoaded={handleFileLoaded} />
                    </div>

                    {dxfConfig.fileName && <MaterialSelector selectedMaterial={dxfConfig.material} selectedThickness={dxfConfig.thickness} onMaterialChange={handleMaterialChange} onThicknessChange={handleThicknessChange} />}
                  </> : <>
                    <div className="space-y-2 text-xs p-3 bg-muted/50 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Артикул:</span>
                        <span className="font-medium">{selectedPartId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Файл:</span>
                        <span className="font-medium truncate ml-2">{dxfConfig.fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Длина реза:</span>
                        <span className="font-medium">
                          {dxfConfig.vectorLength.toFixed(2)} м
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Стоимость:</span>
                        <span className="font-bold text-primary">
                          {dxfConfig.price.toFixed(2)} ₽
                        </span>
                      </div>
                    </div>

                    <MaterialSelector selectedMaterial={dxfConfig.material} selectedThickness={dxfConfig.thickness} onMaterialChange={handleMaterialChange} onThicknessChange={handleThicknessChange} />

                    <div className="space-y-2">
                      <Button onClick={handleSaveEdit} className="w-full">
                        Сохранить изменения
                      </Button>
                      <Button onClick={handleCreateNew} variant="outline" className="w-full">
                        Создать новую деталь
                      </Button>
                    </div>
                  </>}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Viewer */}
          <div className="flex-1 flex flex-col min-w-0">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="py-2 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Предварительный просмотр</CardTitle>
                {isCreatingNew && dxfConfig.fileName && <Button onClick={handleFinishPart}>
                    В корзину
 
                  </Button>}
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                {displayConfig && displayConfig.fileContent ? <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
                      <TabsTrigger value="nesting">Раскрой</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="flex-1 mt-4 min-h-0 overflow-hidden data-[state=inactive]:hidden">
                      <div className="h-full overflow-auto">
                        <div className="p-4 space-y-4">
                          <div className="space-y-2 text-xs p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Файл:</span>
                              <span className="font-medium truncate ml-2">{displayConfig.fileName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Длина реза:</span>
                              <span className="font-medium">
                                {displayConfig.vectorLength.toFixed(2)} м
                              </span>
                            </div>
                            {nestingResults.length > 0 && nestingResults[selectedNestingVariant] && <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Площадь листа:</span>
                                  <span className="font-medium">
                                    {nestingResults[selectedNestingVariant].sheetArea.toFixed(2)} м²
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Точек врезки:</span>
                                  <span className="font-medium">
                                    {nestingResults[selectedNestingVariant].piercePoints}
                                  </span>
                                </div>
                              </>}
                            <Collapsible open={isPriceDetailsOpen} onOpenChange={setIsPriceDetailsOpen} className="pt-2 mt-2 border-t">
                              <CollapsibleTrigger className="flex justify-between items-center w-full hover:bg-muted/50 p-2 rounded-md transition-colors">
                                <span className="text-muted-foreground text-sm">Стоимость:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary text-2xl">
                                    {currentPrice.toFixed(2)} ₽
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground collapsible-chevron" data-state={isPriceDetailsOpen ? "open" : "closed"} />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3 space-y-2 text-xs">
                                {displayConfig && nestingResults.length > 0 && nestingResults[selectedNestingVariant] && (() => {
                              const pricing = getPricingByThickness(displayConfig.thickness, displayConfig.material);
                              if (!pricing) return null;
                              const piercePoints = nestingResults[selectedNestingVariant].piercePoints;
                              const pierceCost = piercePoints * pricing.pierce;
                              const cuttingLength = displayConfig.vectorLength;
                              const cuttingCost = cuttingLength * pricing.cutting;
                              const sheetArea = nestingResults[selectedNestingVariant].sheetArea;
                              const metalCost = sheetArea * pricing.metal;
                              return <>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Точки врезки:</span>
                                        <span className="font-medium">
                                          {piercePoints} × {pricing.pierce} ₽ = {pierceCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Длина реза:</span>
                                        <span className="font-medium">
                                          {cuttingLength.toFixed(2)} м × {pricing.cutting} ₽/м = {cuttingCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Материал:</span>
                                        <span className="font-medium">
                                          {sheetArea.toFixed(2)} м² × {pricing.metal} ₽/м² = {metalCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                    </>;
                            })()}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                          <div className="flex items-center justify-center min-h-[400px]">
                            <DxfViewer fileContent={displayConfig.fileContent} fileName={displayConfig.fileName} />
                          </div>
                          {/* Hidden thumbnail generator */}
                          {isCreatingNew && dxfConfig.fileContent && !dxfConfig.previewImage && (
                            <DxfThumbnailGenerator 
                              fileContent={dxfConfig.fileContent} 
                              onGenerated={handleThumbnailGenerated}
                            />
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="nesting" className="flex-1 mt-4 min-h-0 overflow-hidden data-[state=inactive]:hidden">
                      <div className="h-full overflow-auto">
                        <div className="p-4 space-y-4">
                          {nestingResults.length > 0 && <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Вариант раскроя:</span>
                              <Select value={selectedNestingVariant.toString()} onValueChange={value => setSelectedNestingVariant(parseInt(value))}>
                                <SelectTrigger className="w-[240px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {nestingResults.map((result, index) => <SelectItem key={index} value={index.toString()}>
                                      Вариант {index + 1} - Эффективность: {result.efficiency.toFixed(1)}%
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>}
                          <div className="min-h-[400px]">
                            <NestingViewer nestingResults={nestingResults} selectedVariant={selectedNestingVariant} />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs> : <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                    <p>Загрузите DXF файл для предварительного просмотра</p>
                  </div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Finished Parts List */}
          <div className="w-80 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Корзина

                  <Badge variant="secondary" className="ml-auto">{finishedParts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 flex flex-col">
                <div className="flex-1">
                  {finishedParts.length === 0 ? <div className="text-center text-muted-foreground py-8 text-sm">
                      <p>Нет готовых деталей</p>
                    </div> : <div className="space-y-3">
                      {finishedParts.map(part => {
                        const materialInfo = MATERIALS[part.config.material];
                        
                        return (
                          <Card 
                            key={part.id} 
                            className={`group cursor-pointer transition-all duration-200 hover-card ${
                              selectedPartId === part.id && !isCreatingNew ? "ring-2 ring-primary bg-primary/5" : ""
                            }`} 
                            onClick={() => handleSelectPart(part.id)}
                          >
                            <div className="flex items-center gap-2.5 p-2.5">
                              {/* Left content - vertical layout */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                {/* Header row with ID and actions */}
                                <div className="flex justify-between items-start gap-2">
                                  <Badge 
                                    variant={selectedPartId === part.id && !isCreatingNew ? "default" : "outline"} 
                                    className="text-xs font-mono"
                                  >
                                    {part.id}
                                  </Badge>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary" 
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleEditPart(part.id);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive" 
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeletePart(part.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* File name */}
                                <div className="text-xs font-medium text-foreground truncate" title={part.config.fileName}>
                                  {part.config.fileName}
                                </div>

                                {/* Parameters - compact */}
                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Ruler className="h-3 w-3 flex-shrink-0" />
                                    <span>{part.config.vectorLength.toFixed(2)} м</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Circle className="h-3 w-3 flex-shrink-0" />
                                    <span>{part.config.piercePoints || 0} точек</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Layers className="h-3 w-3 flex-shrink-0" />
                                    <span>
                                      {part.config.material === 'steel' ? 'Сталь СТ3' : materialInfo.name} {part.config.thickness}мм: {part.config.sheetArea?.toFixed(2) || 0} м²
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="h-20 w-px bg-border flex-shrink-0" />

                              {/* Right content - avatar and price */}
                              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                                <Avatar className="w-16 h-16 rounded-lg border border-border">
                                  {part.config.previewImage ? (
                                    <AvatarImage 
                                      src={part.config.previewImage} 
                                      alt={part.config.fileName}
                                      className="object-contain p-1.5"
                                    />
                                  ) : (
                                    <AvatarFallback className="rounded-lg bg-muted">
                                      <FileText className="w-8 h-8 text-muted-foreground" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="text-sm font-bold text-primary whitespace-nowrap">
                                  {part.config.price.toFixed(2)} ₽
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>}
                </div>
                
                {finishedParts.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Итого:</span>
                      <span className="text-xl font-bold text-primary">
                        {totalPrice.toFixed(2)} ₽
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>;
}