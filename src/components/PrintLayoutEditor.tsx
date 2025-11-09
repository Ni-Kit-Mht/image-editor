import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Printer, Plus, Trash2, Check, RotateCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type PhotoOnPage = {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  hasBorder: boolean;
  rotation: number;
};

type PageSize = {
  name: string;
  widthIn: number;
  heightIn: number;
};

const PAGE_SIZES: Record<string, PageSize> = {
  "4x6": { name: "4×6 inches", widthIn: 4, heightIn: 6 },
  "a4": { name: "A4 (8.27×11.69 in)", widthIn: 8.27, heightIn: 11.69 },
};

export default function PrintLayoutEditorDemo() {
  const [isOpen, setIsOpen] = useState(true);
  
  const demoSavedCrops = [
    { id: '1', dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzRmNDZlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U2FtcGxlIFBob3RvIDE8L3RleHQ+PC9zdmc+', width: 400, height: 600 },
    { id: '2', dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U2FtcGxlIFBob3RvIDI8L3RleHQ+PC9zdmc+', width: 600, height: 400 },
  ];

  if (!isOpen) return null;

  return <PrintLayoutEditor savedCrops={demoSavedCrops} onClose={() => setIsOpen(false)} />;
}

interface PrintLayoutEditorProps {
  savedCrops: Array<{ id: string; dataUrl: string; width: number; height: number }>;
  onClose: () => void;
}

export function PrintLayoutEditor({ savedCrops, onClose }: PrintLayoutEditorProps){
  const [pageSize, setPageSize] = useState<string>("4x6");
  const [photos, setPhotos] = useState<PhotoOnPage[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showBorderByDefault, setShowBorderByDefault] = useState(true);
  const [rotateInPlace, setRotateInPlace] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; photoId: string } | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const pageRef = useRef<HTMLDivElement>(null);

  const DPI = 300;
  const currentPageSize = PAGE_SIZES[pageSize];
  const pageWidthPx = currentPageSize.widthIn * DPI;
  const pageHeightPx = currentPageSize.heightIn * DPI;

  const getBoundingBox = (photo: PhotoOnPage) => {
    if (rotateInPlace && (photo.rotation % 180 !== 0)) {
      const maxDim = Math.max(photo.width, photo.height);
      return { width: maxDim, height: maxDim };
    }
    return { width: photo.width, height: photo.height };
  };

  const handleAddPhoto = (crop: { id: string; dataUrl: string; width: number; height: number }) => {
    const photoWidth = crop.width;
    const photoHeight = crop.height;

    const newPhoto: PhotoOnPage = {
      id: `photo-${Date.now()}-${Math.random()}`,
      dataUrl: crop.dataUrl,
      x: (pageWidthPx - photoWidth) / 2,
      y: (pageHeightPx - photoHeight) / 2,
      width: photoWidth,
      height: photoHeight,
      originalWidth: crop.width,
      originalHeight: crop.height,
      hasBorder: showBorderByDefault,
      rotation: 0,
    };
    
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handleAddEightPhotos = (crop: { id: string; dataUrl: string; width: number; height: number }, count: number) => {
    const photoWidth = crop.width;
    const photoHeight = crop.height;

    const marginTop = 49;
    const marginLeft = 55;
    const marginRight = 55;
    const gapX = 9;
    const gapY = 9;

    const imageRotation = 90;
    const isRotated90or270 = imageRotation % 180 !== 0;
    const boundingWidth = isRotated90or270 ? photoHeight : photoWidth;
    const boundingHeight = isRotated90or270 ? photoWidth : photoHeight;

    let x = marginLeft;
    let y = marginTop;

    const newPhotos: PhotoOnPage[] = [];

    for (let i = 0; i < count; i++) {
      if (x + boundingWidth + marginRight > pageWidthPx) {
        x = marginLeft;
        y += boundingHeight + gapY;
      }

      newPhotos.push({
        id: `photo-${Date.now()}-${Math.random()}-${i}`,
        dataUrl: crop.dataUrl,
        x,
        y,
        width: boundingWidth,
        height: boundingHeight,
        originalWidth: crop.width,
        originalHeight: crop.height,  
        hasBorder: showBorderByDefault,
        rotation: imageRotation,
      });

      x += boundingWidth + gapX;
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleAddMultiplePhotos = (crop: { id: string; dataUrl: string; width: number; height: number }, count: number) => {
    const photoWidth = crop.width;
    const photoHeight = crop.height;

    const marginTop = 49;
    const marginLeft = 55;
    const marginRight = 55;
    const gapX = 29;
    const gapY = 22;

    let x = marginLeft;
    let y = marginTop;

    const newPhotos: PhotoOnPage[] = [];

    for (let i = 0; i < count; i++) {
      if (x + photoWidth + marginRight > pageWidthPx) {
        x = marginLeft;
        y += photoHeight + gapY;
      }

      newPhotos.push({
        id: `photo-${Date.now()}-${Math.random()}-${i}`,
        dataUrl: crop.dataUrl,
        x,
        y,
        width: photoWidth,
        height: photoHeight,
        originalWidth: crop.width,
        originalHeight: crop.height,
        hasBorder: showBorderByDefault,
        rotation: 0,
      });

      x += photoWidth + gapX;
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedPhotoIds.size === 0) return;
    setPhotos(prev => prev.filter(p => !selectedPhotoIds.has(p.id)));
    setSelectedPhotoIds(new Set());
  }, [selectedPhotoIds]);

  const handleMouseDown = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedPhotoIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photoId)) {
          newSet.delete(photoId);
        } else {
          newSet.add(photoId);
        }
        return newSet;
      });
      return;
    }
    
    if (!selectedPhotoIds.has(photoId)) {
      setSelectedPhotoIds(new Set([photoId]));
    }
    
    setDragging(true);
    
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - photo.x,
      y: (e.clientY - rect.top) / zoom - photo.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || selectedPhotoIds.size === 0) return;
    
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newX = (e.clientX - rect.left) / zoom - dragOffset.x;
    const newY = (e.clientY - rect.top) / zoom - dragOffset.y;
    
    const selectedIds = Array.from(selectedPhotoIds);
    const primaryPhoto = photos.find(p => selectedIds.includes(p.id));
    if (!primaryPhoto) return;
    
    const deltaX = newX - primaryPhoto.x;
    const deltaY = newY - primaryPhoto.y;
    
    setPhotos(prevPhotos => prevPhotos.map(p => {
      if (selectedPhotoIds.has(p.id)) {
        const bbox = getBoundingBox(p);
        const nextX = Math.max(0, Math.min(p.x + deltaX, pageWidthPx - bbox.width));
        const nextY = Math.max(0, Math.min(p.y + deltaY, pageHeightPx - bbox.height));
        return { ...p, x: nextX, y: nextY };
      }
      return p;
    }));
  }, [dragging, selectedPhotoIds, dragOffset, photos, pageWidthPx, pageHeightPx, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedPhotoIds.size === 0) return;
    
    const step = e.shiftKey ? 10 : 1;
    let handled = false;
    
    setPhotos(prevPhotos => {
      return prevPhotos.map(p => {
        if (!selectedPhotoIds.has(p.id)) return p;
        
        const bbox = getBoundingBox(p);
        let newX = p.x;
        let newY = p.y;
        
        switch (e.key) {
          case 'ArrowLeft':
            newX = Math.max(0, p.x - step);
            handled = true;
            break;
          case 'ArrowRight':
            newX = Math.min(pageWidthPx - bbox.width, p.x + step);
            handled = true;
            break;
          case 'ArrowUp':
            newY = Math.max(0, p.y - step);
            handled = true;
            break;
          case 'ArrowDown':
            newY = Math.min(pageHeightPx - bbox.height, p.y + step);
            handled = true;
            break;
          case 'Delete':
          case 'Backspace':
            setTimeout(() => handleDeleteSelected(), 0);
            handled = true;
            return p;
        }
        
        if (handled) e.preventDefault();
        return { ...p, x: newX, y: newY };
      });
    });
  }, [selectedPhotoIds, pageWidthPx, pageHeightPx, handleDeleteSelected]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleContextMenu = (e: React.MouseEvent, photoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, photoId });
  };

  const togglePhotoBorder = (photoId: string) => {
    setPhotos(prevPhotos => prevPhotos.map(p => 
      p.id === photoId ? { ...p, hasBorder: !p.hasBorder } : p
    ));
    setContextMenu(null);
  };

  const rotatePhoto = (photoId: string) => {
    setPhotos(prevPhotos => prevPhotos.map(p => {
      if (p.id !== photoId) return p;
      
      const newRotation = (p.rotation + 90) % 360;

      if (rotateInPlace) {
        return { ...p, rotation: newRotation };
      } else {
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;
        const newWidth = p.height;
        const newHeight = p.width;
        const newX = Math.max(0, Math.min(centerX - newWidth / 2, pageWidthPx - newWidth));
        const newY = Math.max(0, Math.min(centerY - newHeight / 2, pageHeightPx - newHeight));
        return { ...p, rotation: newRotation, width: newWidth, height: newHeight, x: newX, y: newY };
      }
    }));
    setContextMenu(null);
  };

  const selectPhoto = (photoId: string) => {
    setSelectedPhotoIds(new Set([photoId]));
    setContextMenu(null);
  };

  const handlePageMouseLeave = () => {
    setSelectedPhotoIds(new Set());
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);
    
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu]);

  const handlePrint = () => {
  if (photos.length === 0) {
    alert("Add at least one photo to print");
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Convert page size in inches to pixels at 96 DPI (typical screen DPI)
  const DPI = 96;
  const pageWidthPrintPx = currentPageSize.widthIn * DPI;
  const pageHeightPrintPx = currentPageSize.heightIn * DPI;

  // Scale factor: ratio between print size and canvas size
  const scaleFactorW = pageWidthPrintPx / pageWidthPx;
  const scaleFactorH = pageHeightPrintPx / pageHeightPx;
  const scaleFactor = Math.min(scaleFactorW, scaleFactorH);

  const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Print Layout</title>
    <style>
      @page {
        size: ${currentPageSize.widthIn}in ${currentPageSize.heightIn}in;
        margin: 0;
      }
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box;
      }
      html, body {
        width: ${currentPageSize.widthIn}in;
        height: ${currentPageSize.heightIn}in;
        overflow: hidden;
      }
      body {
        position: relative;
        background: white;
      }
      .photo {
        position: absolute;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .photo img {
        max-width: none;
        display: block;
        transform-origin: center center;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .photo {
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    </style>
  </head>
  <body>
    ${photos.map(photo => {
      const left = photo.x * scaleFactor;
      const top = photo.y * scaleFactor;
      const width = photo.width * scaleFactor;
      const height = photo.height * scaleFactor;

      const borderStyle = photo.hasBorder
        ? 'border:2px solid black;box-sizing:border-box;'
        : '';

      const isRotated90or270 = photo.rotation % 180 !== 0;
      const imgWidth = (isRotated90or270 ? photo.height : photo.width) * scaleFactor;
      const imgHeight = (isRotated90or270 ? photo.width : photo.height) * scaleFactor;
      const imgTransform = `rotate(${photo.rotation}deg)`;

      return `
        <div class="photo"
             style="left:${left}px; top:${top}px; width:${width}px; height:${height}px; ${borderStyle}">
          <img style="width:${imgWidth}px; height:${imgHeight}px; transform:${imgTransform};"
               src="${photo.dataUrl}" alt="Photo"/>
        </div>`;
    }).join('')}
    <script>
      window.onload = () => { setTimeout(() => { window.print(); }, 500); };
    </script>
  </body>
  </html>`;

  printWindow.document.write(printContent);
  printWindow.document.close();
};


  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-7xl bg-card border-border p-6 my-8 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card z-10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Print Layout Editor</h2>
            <p className="text-sm text-muted-foreground mt-1">Drag photos • Arrow keys • Right-click for options</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-[50px] w-[50px]" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Page Size</Label>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="4x6">4×6 inches</SelectItem>
                  <SelectItem value="a4">A4 (8.27×11.69 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Available Photos</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {savedCrops.map((crop) => (
                  <div key={crop.id} className="flex items-center gap-2 p-2 bg-secondary rounded-lg border border-border hover:border-primary transition-colors">
                    <img src={crop.dataUrl} alt="Crop" className="w-12 h-12 object-cover rounded" />
                    <div className="flex flex-col flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{crop.width}×{crop.height}px</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleAddPhoto(crop)} className="h-7 px-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAddEightPhotos(crop, 4)} className="h-7 px-2 text-xs">+x4</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAddEightPhotos(crop, 8)} className="h-7 px-2 text-xs">+x8</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAddMultiplePhotos(crop, 12)} className="h-7 px-2 text-xs">+x12</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAddMultiplePhotos(crop, 6)} className="h-7 px-2 text-xs">+x6</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex flex-col space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Zoom: {Math.round(zoom * 100)}%</Label>
                <input type="range" min="0.2" max="1" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox id="border-default" checked={showBorderByDefault} onCheckedChange={(checked) => setShowBorderByDefault(checked as boolean)} />
                <label htmlFor="border-default" className="text-sm font-medium cursor-pointer">Add border to new photos</label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox id="rotate-in-place" checked={rotateInPlace} onCheckedChange={(checked) => setRotateInPlace(checked as boolean)} />
                <label htmlFor="rotate-in-place" className="text-sm font-medium cursor-pointer">Rotate in place</label>
              </div>

              <Button onClick={handlePrint} disabled={photos.length === 0} className="w-full">
                <Printer className="h-4 w-4 mr-2" />Print Layout
              </Button>
              <Button variant="outline" onClick={handleDeleteSelected} disabled={selectedPhotoIds.size === 0} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedPhotoIds.size})
              </Button>
              <Button variant="outline" onClick={() => setPhotos([])} disabled={photos.length === 0} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />Clear All
              </Button>
            </div>

            {selectedPhotoIds.size > 0 && (
              <div className="p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">{selectedPhotoIds.size} selected • Ctrl/Cmd+Click • Arrow keys</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-muted/30 p-8 rounded-lg border border-border overflow-auto max-w-full">
              <div
                ref={pageRef}
                className="relative bg-white shadow-2xl cursor-crosshair"
                style={{ width: `${pageWidthPx}px`, height: `${pageHeightPx}px`, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                onClick={() => setSelectedPhotoIds(new Set())}
                onMouseLeave={handlePageMouseLeave}
              >
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`absolute cursor-move overflow-hidden ${selectedPhotoIds.has(photo.id) ? 'ring-2 ring-primary shadow-lg z-10' : 'hover:ring-2 hover:ring-primary/50'} ${photo.hasBorder ? 'border-2 border-black' : ''}`}
                    style={{
                      left: `${photo.x}px`,
                      top: `${photo.y}px`,
                      width: `${photo.width}px`,
                      height: `${photo.height}px`,
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, photo.id)}
                    onContextMenu={(e) => handleContextMenu(e, photo.id)}
                  >
                    <img
                      src={photo.dataUrl}
                      alt="Photo"
                      draggable={false}
                      className="pointer-events-none"
                      style={{
                        width: rotateInPlace && (photo.rotation % 180 !== 0) ? `${photo.height}px` : `${photo.width}px`,
                        height: rotateInPlace && (photo.rotation % 180 !== 0) ? `${photo.width}px` : `${photo.height}px`,
                        transform: `rotate(${photo.rotation}deg)`,
                        transformOrigin: 'center center',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                    />
                    {selectedPhotoIds.has(photo.id) && (
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-16 w-16 rounded-full shadow-lg"
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}>
                        <X className="h-16 w-16" />
                      </Button>
                    )}
                  </div>
                ))}

                {photos.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400 text-center">Click + to add photos</p>
                  </div>
                )}
              </div>
              <div className="text-center mt-4 text-sm text-muted-foreground">
                {currentPageSize.name} • {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {contextMenu && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
            onClick={() => selectPhoto(contextMenu.photoId)}
          >
            <Check className="h-3 w-3" />
            Select
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
            onClick={() => togglePhotoBorder(contextMenu.photoId)}
          >
            {photos.find(p => p.id === contextMenu.photoId)?.hasBorder ? (
              <>
                <X className="h-3 w-3" />
                Remove Border
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Apply Border
              </>
            )}
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
            onClick={() => rotatePhoto(contextMenu.photoId)}
          >
            <RotateCw className="h-3 w-3" />
            Rotate 90°
          </button>
        </div>
      )}
    </div>
  );
}