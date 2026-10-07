"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { renderPdfToDataUrl, isPdf } from "@/lib/pdfRenderer";
import { generateSvgVector, generateEpsVector } from "@/lib/vectorExporter";

export type FieldLayoutItem = {
  fieldId: string;
  label: string;
  left: number; // percentage (0-100)
  top: number; // percentage (0-100)
  width?: number; // percentage
  height?: number; // percentage or px
  fontSize?: number; // px
  fontColor?: string; // hex color
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  fontStyle?: "normal" | "bold" | "italic" | "bold-italic";
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: number; // px
  itemType?: "field" | "text" | "shape" | "element" | "photo";
  content?: string; // custom editable text content
  shapeType?: "rectangle" | "rounded" | "circle" | "line" | "badge";
  elementType?: "seal" | "ribbon" | "stamp" | "barcode" | "badge";
  photoType?: "candidate" | "logo" | "signature" | "custom";
  imageUrl?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  groupId?: string;
  comment?: string;
  isComponent?: boolean;
  timing?: string;
  gradient?: {
    enabled: boolean;
    from: string;
    to: string;
    direction: "to right" | "to bottom" | "to bottom right" | "to top right";
  };
};

type TemplateData = {
  id: string;
  name: string;
  type: string;
  source: string;
  version: number;
  fieldLayout: any;
  backgroundUrl?: string | null;
  backgroundHtml?: string | null;
};

export type CanvasOrientation = "LANDSCAPE" | "PORTRAIT";

const CANVAS_CONFIG: Record<
  string,
  Record<CanvasOrientation, { width: number; height: number; label: string; physicalSize: string }>
> = {
  CERTIFICATE: {
    LANDSCAPE: { width: 880, height: 620, label: "A4 Landscape", physicalSize: "297 × 210 mm" },
    PORTRAIT: { width: 620, height: 880, label: "A4 Portrait", physicalSize: "210 × 297 mm" },
  },
  ID_CARD: {
    LANDSCAPE: { width: 510, height: 322, label: "CR80 Landscape", physicalSize: "85.6 × 54 mm" },
    PORTRAIT: { width: 322, height: 510, label: "CR80 Portrait", physicalSize: "54 × 85.6 mm" },
  },
  BUSINESS_CARD: {
    LANDSCAPE: { width: 510, height: 292, label: "V-Card Landscape", physicalSize: "89 × 51 mm" },
    PORTRAIT: { width: 292, height: 510, label: "V-Card Portrait", physicalSize: "51 × 89 mm" },
  },
};

const SAMPLE_PREVIEW_DATA: Record<string, string> = {
  recipientName: "Miss. Vaishnavi Ingale",
  courseName: "Project Readiness Program: Vibe Coding Live",
  certificateRef: "MER/2026/VIBE/00142",
  issueDate: "07 September, 2026",
  grade: "Distinction (A+)",
  studentId: "STD-2026-8841",
  qrCode: "[QR CODE]",
  customText: "Prasanna Joshi · Head, SEED Infotech Ltd.",
  fullName: "Miss. Vaishnavi Ingale",
  jobTitle: "AI Workflow Specialist",
  employeeId: "EMP-2026-904",
  email: "vaishnavi.i@gttdata.ai",
  phone: "+91 98765 43210",
  bloodGroup: "B+",
  department: "Emerging Technologies",
  companyName: "SEED Infotech Ltd.",
  termsText: "This credential remains property of SEED Infotech Ltd. For verification, visit verify.seedinfotech.com.",
  emergencyContact: "Emergency: +91 98220 54321 (Campus Security)",
};

const FIELD_PRESETS_BY_TYPE: Record<string, Array<{ fieldId: string; label: string; fontSize: number; fontColor: string; fontStyle: string }>> = {
  CERTIFICATE: [
    { fieldId: "recipientName", label: "Recipient Name", fontSize: 24, fontColor: "#1E3A8A", fontStyle: "bold" },
    { fieldId: "courseName", label: "Program / Course", fontSize: 16, fontColor: "#0F172A", fontStyle: "bold" },
    { fieldId: "certificateRef", label: "Certificate ID", fontSize: 11, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "issueDate", label: "Date of Issue", fontSize: 11, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "grade", label: "Grade / Honors", fontSize: 13, fontColor: "#2563EB", fontStyle: "bold" },
    { fieldId: "studentId", label: "Student / Roll ID", fontSize: 12, fontColor: "#475569", fontStyle: "normal" },
    { fieldId: "qrCode", label: "Verification QR", fontSize: 12, fontColor: "#0F172A", fontStyle: "normal" },
    { fieldId: "customText", label: "Signatory Label", fontSize: 12, fontColor: "#334155", fontStyle: "normal" },
  ],
  ID_CARD: [
    { fieldId: "fullName", label: "Full Name", fontSize: 18, fontColor: "#0F172A", fontStyle: "bold" },
    { fieldId: "jobTitle", label: "Job Title", fontSize: 12, fontColor: "#475569", fontStyle: "normal" },
    { fieldId: "employeeId", label: "Employee ID", fontSize: 11, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "department", label: "Department", fontSize: 11, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "email", label: "Email Address", fontSize: 10, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "phone", label: "Phone Number", fontSize: 10, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "bloodGroup", label: "Blood Group", fontSize: 11, fontColor: "#DC2626", fontStyle: "bold" },
    { fieldId: "qrCode", label: "Access QR Code", fontSize: 12, fontColor: "#0F172A", fontStyle: "normal" },
  ],
  BUSINESS_CARD: [
    { fieldId: "fullName", label: "Full Name", fontSize: 16, fontColor: "#0F172A", fontStyle: "bold" },
    { fieldId: "jobTitle", label: "Job Title", fontSize: 11, fontColor: "#7C3AED", fontStyle: "normal" },
    { fieldId: "companyName", label: "Company Name", fontSize: 13, fontColor: "#334155", fontStyle: "bold" },
    { fieldId: "email", label: "Email", fontSize: 10, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "phone", label: "Phone", fontSize: 10, fontColor: "#64748B", fontStyle: "normal" },
    { fieldId: "qrCode", label: "vCard QR", fontSize: 12, fontColor: "#0F172A", fontStyle: "normal" },
    { fieldId: "customText", label: "Custom Note", fontSize: 11, fontColor: "#334155", fontStyle: "normal" },
  ],
};

const FONT_FAMILIES = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Anton", value: "'Anton', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Courier Prime", value: "ui-monospace, 'Courier New', monospace" },
];

const GRADIENT_PRESETS = [
  { name: "Sunset", from: "#FF5B37", to: "#F59E0B" },
  { name: "Ocean", from: "#0284C7", to: "#3B82F6" },
  { name: "Emerald", from: "#10B981", to: "#059669" },
  { name: "Midnight", from: "#7C3AED", to: "#1E293B" },
  { name: "Gold", from: "#D97706", to: "#FEF08A" },
  { name: "Rose", from: "#F43F5E", to: "#FB7185" },
];

function parseFields(raw: any): FieldLayoutItem[] {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.fields) ? raw.fields : [];
  const seenIds = new Set<string>();

  return arr.map((item: any, idx: number) => {
    let baseId = item.fieldId || `field_${idx}`;
    let uniqueId = baseId;
    let counter = 1;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${baseId}_${counter}`;
      counter++;
    }
    seenIds.add(uniqueId);

    return {
      fieldId: uniqueId,
      label: item.label || item.fieldId || `Field ${idx + 1}`,
      left: typeof item.left === "number" ? item.left : 15 + (idx % 5) * 8,
      top: typeof item.top === "number" ? item.top : 20 + Math.floor(idx / 5) * 12,
      fontSize: item.fontSize || 16,
      fontColor: item.fontColor || "#0F172A",
      fontFamily: item.fontFamily || "Inter, sans-serif",
      textAlign: item.textAlign || "left",
      fontStyle: item.fontStyle || "normal",
      textDecoration: item.textDecoration || "none",
      textTransform: item.textTransform || "none",
      letterSpacing: item.letterSpacing || 0,
      itemType: item.itemType || "field",
      content: item.content || item.label || "",
      shapeType: item.shapeType,
      elementType: item.elementType,
      photoType: item.photoType,
      imageUrl: item.imageUrl,
      bgColor: item.bgColor,
      borderColor: item.borderColor,
      borderWidth: item.borderWidth,
      borderRadius: item.borderRadius,
      opacity: typeof item.opacity === "number" ? item.opacity : 1,
      width: item.width,
      height: item.height,
      zIndex: item.zIndex || idx + 1,
      locked: item.locked || false,
      gradient: item.gradient,
    };
  });
}

interface TemplateDesignerCanvasProps {
  template: TemplateData;
  canEdit?: boolean;
  userRole?: string;
  organization?: { id: string; name: string };
}

export default function TemplateDesignerCanvas({
  template,
  canEdit: propCanEdit,
  userRole,
  organization = { id: "default", name: "CERTIPORT" },
}: TemplateDesignerCanvasProps) {
  const canEdit = propCanEdit ?? (userRole ? ["SUPER_ADMIN", "ORG_ADMIN", "CERT_ISSUER"].includes(userRole) : true);

  // Dual-sided layout extraction
  const layout = template.fieldLayout;
  const initialOrientation: CanvasOrientation =
    layout && typeof layout === "object" && !Array.isArray(layout) && layout.orientation === "PORTRAIT"
      ? "PORTRAIT"
      : "LANDSCAPE";

  const isTwoSidedSupported =
    template.type === "ID_CARD" || template.type === "BUSINESS_CARD" || Boolean(layout?.sides?.back);

  const [orientation, setOrientation] = useState<CanvasOrientation>(initialOrientation);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  // Front & Back state
  const [frontFields, setFrontFields] = useState<FieldLayoutItem[]>(() => {
    if (layout?.sides?.front?.fields) return parseFields(layout.sides.front.fields);
    return parseFields(layout);
  });
  const [backFields, setBackFields] = useState<FieldLayoutItem[]>(() => {
    if (layout?.sides?.back?.fields) return parseFields(layout.sides.back.fields);
    return [];
  });

  const [frontBgUrl, setFrontBgUrl] = useState<string | null>(
    layout?.sides?.front?.backgroundUrl || template.backgroundUrl || null
  );
  const [backBgUrl, setBackBgUrl] = useState<string | null>(
    layout?.sides?.back?.backgroundUrl || null
  );

  const [frontBgHtml, setFrontBgHtml] = useState<string | null>(
    layout?.sides?.front?.backgroundHtml || template.backgroundHtml || null
  );
  const [backBgHtml, setBackBgHtml] = useState<string | null>(
    layout?.sides?.back?.backgroundHtml || null
  );

  const [frontBgColor, setFrontBgColor] = useState<string>(
    layout?.sides?.front?.bgColor || "#FFFFFF"
  );
  const [backBgColor, setBackBgColor] = useState<string>(
    layout?.sides?.back?.bgColor || "#FFFFFF"
  );

  // Active fields & bg helper
  const currentFields = activeSide === "front" ? frontFields : backFields;
  const setCurrentFields = (updater: FieldLayoutItem[] | ((prev: FieldLayoutItem[]) => FieldLayoutItem[])) => {
    if (activeSide === "front") setFrontFields(updater);
    else setBackFields(updater);
  };

  const currentBgUrl = activeSide === "front" ? frontBgUrl : backBgUrl;
  const setCurrentBgUrl = (val: string | null) => {
    if (activeSide === "front") setFrontBgUrl(val);
    else setBackBgUrl(val);
  };

  const currentBgColor = activeSide === "front" ? frontBgColor : backBgColor;
  const setCurrentBgColor = (val: string) => {
    if (activeSide === "front") setFrontBgColor(val);
    else setBackBgColor(val);
  };

  const currentBgHtml = activeSide === "front" ? frontBgHtml : backBgHtml;
  const setCurrentBgHtml = (val: string | null) => {
    if (activeSide === "front") setFrontBgHtml(val);
    else setBackBgHtml(val);
  };

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<FieldLayoutItem[][]>([]);
  const [future, setFuture] = useState<FieldLayoutItem[][]>([]);

  // UI Rails & Drawers
  const [activeLeftTab, setActiveLeftTab] = useState<"media" | "text" | "graphics" | "fields" | "palette" | "code">("graphics");
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(true);

  // RIGHT INSPECTOR TABS: Properties & Layers (replacing Style with Layers)
  const [inspectorTab, setInspectorTab] = useState<"properties" | "layers">("properties");

  // Search & Filter in Drawer
  const [drawerSearch, setDrawerSearch] = useState("");
  const [graphicsCategory, setGraphicsCategory] = useState("all");

  // Canvas zoom & scale
  const [zoom, setZoom] = useState(100);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(template.version);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);

  // Code Import state with live Field Extraction
  const [importCodeType, setImportCodeType] = useState<"html" | "json" | "svg">("html");
  const [importCodeText, setImportCodeText] = useState("");
  const [detectedImportFields, setDetectedImportFields] = useState<FieldLayoutItem[]>([]);

  // Selection Action Toolbar & Context Menu state
  const copiedFieldsRef = useRef<FieldLayoutItem[] | null>(null);
  const copiedStyleRef = useRef<Partial<FieldLayoutItem> | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId?: string } | null>(null);
  const [timingToast, setTimingToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingItem = useRef(false);
  const dragStartMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPositions = useRef<Record<string, { left: number; top: number }>>({});

  // Interactive Resizer Handle Dragging
  const isResizingItem = useRef<string | null>(null);
  const resizeStartMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartDim = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Marquee selection
  const isMarqueeSelecting = useRef(false);
  const [marqueeBox, setMarqueeBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Dimensions
  const canvasConfig = CANVAS_CONFIG[template.type] || CANVAS_CONFIG.CERTIFICATE;
  const canvasDim = canvasConfig[orientation];

  // Helper to commit to undo stack
  const commitToHistory = (newFields: FieldLayoutItem[]) => {
    setHistory((prev) => [...prev.slice(-20), currentFields]);
    setFuture([]);
    setCurrentFields(newFields);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [currentFields, ...f]);
    setHistory((h) => h.slice(0, -1));
    setCurrentFields(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, currentFields]);
    setFuture((f) => f.slice(1));
    setCurrentFields(next);
  };

  // Load Google Fonts dynamically for designer canvas
  useEffect(() => {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Anton&family=Dancing+Script:wght@400;700&family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@400;600;700;800&family=Outfit:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;500;700&display=swap";
    fontLink.id = "designer-google-fonts";
    if (!document.getElementById("designer-google-fonts")) {
      document.head.appendChild(fontLink);
    }
    return () => {
      const existing = document.getElementById("designer-google-fonts");
      if (existing) existing.remove();
    };
  }, []);

  // Close context menu on window click
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Action handlers for selected elements
  const showToast = (msg: string) => {
    setTimingToast(msg);
    setTimeout(() => setTimingToast(null), 2500);
  };

  const handleCopy = useCallback(() => {
    const selectedItems = currentFields.filter((f) => selectedIds.includes(f.fieldId));
    if (selectedItems.length > 0) {
      copiedFieldsRef.current = JSON.parse(JSON.stringify(selectedItems));
      showToast(`${selectedItems.length} element(s) copied`);
    }
  }, [currentFields, selectedIds]);

  const handleCopyStyle = useCallback(() => {
    const target = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!target) return;
    copiedStyleRef.current = {
      fontSize: target.fontSize,
      fontColor: target.fontColor,
      fontFamily: target.fontFamily,
      fontStyle: target.fontStyle,
      textDecoration: target.textDecoration,
      textTransform: target.textTransform,
      letterSpacing: target.letterSpacing,
      bgColor: target.bgColor,
      borderColor: target.borderColor,
      borderWidth: target.borderWidth,
      borderRadius: target.borderRadius,
      opacity: target.opacity,
      gradient: target.gradient ? { ...target.gradient } : undefined,
    };
    showToast("Style copied!");
  }, [currentFields, selectedIds, activeFieldId]);

  const handlePaste = useCallback(() => {
    if (!copiedFieldsRef.current || copiedFieldsRef.current.length === 0) return;
    const newItems: FieldLayoutItem[] = [];
    const newSelectedIds: string[] = [];

    copiedFieldsRef.current.forEach((item, idx) => {
      let baseId = `${item.fieldId}_copy`;
      let uniqueId = baseId;
      let counter = 1;
      while (currentFields.some((f) => f.fieldId === uniqueId) || newItems.some((f) => f.fieldId === uniqueId)) {
        uniqueId = `${baseId}_${counter}`;
        counter++;
      }
      const pastedItem: FieldLayoutItem = {
        ...item,
        fieldId: uniqueId,
        left: Math.min(95, item.left + 3),
        top: Math.min(95, item.top + 3),
        zIndex: currentFields.length + idx + 1,
      };
      newItems.push(pastedItem);
      newSelectedIds.push(uniqueId);
    });

    commitToHistory([...currentFields, ...newItems]);
    setSelectedIds(newSelectedIds);
    if (newSelectedIds.length > 0) setActiveFieldId(newSelectedIds[0]);
    showToast("Pasted elements");
  }, [currentFields]);

  const handlePasteStyle = useCallback(() => {
    if (!copiedStyleRef.current || selectedIds.length === 0) return;
    const style = copiedStyleRef.current;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId) && !f.locked) {
          return { ...f, ...style };
        }
        return f;
      })
    );
    showToast("Style applied to selection");
  }, [currentFields, selectedIds]);

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toDuplicate = currentFields.filter((f) => selectedIds.includes(f.fieldId));
    const newItems: FieldLayoutItem[] = [];
    const newSelectedIds: string[] = [];

    toDuplicate.forEach((item, idx) => {
      let baseId = `${item.fieldId}_dup`;
      let uniqueId = baseId;
      let counter = 1;
      while (currentFields.some((f) => f.fieldId === uniqueId) || newItems.some((f) => f.fieldId === uniqueId)) {
        uniqueId = `${baseId}_${counter}`;
        counter++;
      }
      const dupItem: FieldLayoutItem = {
        ...item,
        fieldId: uniqueId,
        left: Math.min(95, item.left + 3),
        top: Math.min(95, item.top + 3),
        zIndex: currentFields.length + idx + 1,
      };
      newItems.push(dupItem);
      newSelectedIds.push(uniqueId);
    });

    commitToHistory([...currentFields, ...newItems]);
    setSelectedIds(newSelectedIds);
    if (newSelectedIds.length > 0) setActiveFieldId(newSelectedIds[0]);
    showToast("Duplicated selection");
  }, [currentFields, selectedIds]);

  const handleDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitToHistory(currentFields.filter((f) => !selectedIds.includes(f.fieldId)));
    setSelectedIds([]);
    setActiveFieldId(null);
    showToast("Deleted selection");
  }, [currentFields, selectedIds]);

  const handleGroup = useCallback(() => {
    if (selectedIds.length <= 1) return;
    const groupTag = `group_${Date.now()}`;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId)) {
          return { ...f, groupId: groupTag };
        }
        return f;
      })
    );
    showToast("Elements grouped");
  }, [currentFields, selectedIds]);

  const handleUngroup = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId)) {
          return { ...f, groupId: undefined };
        }
        return f;
      })
    );
    showToast("Elements ungrouped");
  }, [currentFields, selectedIds]);

  const handleToggleLock = useCallback(() => {
    if (selectedIds.length === 0) return;
    const allLocked = currentFields.filter((f) => selectedIds.includes(f.fieldId)).every((f) => f.locked);
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId)) {
          return { ...f, locked: !allLocked };
        }
        return f;
      })
    );
    showToast(allLocked ? "Selection unlocked" : "Selection locked");
  }, [currentFields, selectedIds]);

  const handleResizeCanvasToSelection = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    const targetW = Math.max(300, Math.round((active.width || 30) * (canvasDim.width / 100)));
    const targetH = Math.max(200, Math.round((active.height || 15) * (canvasDim.height / 100)));
    showToast(`Canvas size adjusted to selection (${targetW} × ${targetH}px)`);
  }, [currentFields, selectedIds, activeFieldId, canvasDim]);

  const handleCreateComponent = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId) || f.fieldId === active.fieldId) {
          return { ...f, isComponent: true };
        }
        return f;
      })
    );
    showToast(`Component "${active.label}" created!`);
  }, [currentFields, selectedIds, activeFieldId]);

  const handleAddComment = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    const commentText = prompt("Add comment for element:", active.comment || "");
    if (commentText !== null) {
      commitToHistory(
        currentFields.map((f) => {
          if (f.fieldId === active.fieldId) {
            return { ...f, comment: commentText };
          }
          return f;
        })
      );
      showToast("Comment saved");
    }
  }, [currentFields, selectedIds, activeFieldId]);

  const handleShowElementTiming = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    showToast(`Timing for "${active.label}": 0.0s - 5.0s (Static render)`);
  }, [currentFields, selectedIds, activeFieldId]);

  const handleApplyColoursToPage = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    const primaryColor = active.fontColor || active.bgColor || "#0F172A";
    commitToHistory(
      currentFields.map((f) => ({
        ...f,
        borderColor: primaryColor,
      }))
    );
    showToast("Applied color palette to all element borders");
  }, [currentFields, selectedIds, activeFieldId]);

  const handleDownloadSelection = useCallback(() => {
    const active = currentFields.find((f) => selectedIds.includes(f.fieldId)) || currentFields.find((f) => f.fieldId === activeFieldId);
    if (!active) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(100, Math.round(((active.width || 30) / 100) * canvasDim.width));
    canvas.height = Math.max(60, Math.round(((active.height || 15) / 100) * canvasDim.height));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = active.bgColor || "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = active.fontColor || "#0F172A";
      ctx.font = `bold ${active.fontSize || 16}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(active.content || active.label, canvas.width / 2, canvas.height / 2);

      const a = document.createElement("a");
      a.download = `${active.label.toLowerCase().replace(/\s+/g, "_")}_selection.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      showToast("Selection downloaded!");
    }
  }, [currentFields, selectedIds, activeFieldId, canvasDim]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "c" && !e.altKey) {
        e.preventDefault();
        handleCopy();
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleCopyStyle();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "v" && !e.altKey) {
        e.preventDefault();
        handlePaste();
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        handlePasteStyle();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        handleDuplicate();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "G" || e.key === "g")) {
        e.preventDefault();
        handleUngroup();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "G" || e.key === "g")) {
        e.preventDefault();
        handleGroup();
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        handleCreateComponent();
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleAddComment();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDelete();
        }
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.5;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        commitToHistory(
          currentFields.map((f) => {
            if (selectedIds.includes(f.fieldId) && !f.locked) {
              return {
                ...f,
                left: Math.max(0, Math.min(100, f.left + dx)),
                top: Math.max(0, Math.min(100, f.top + dy)),
              };
            }
            return f;
          })
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFields, selectedIds, history, future, handleCopy, handleCopyStyle, handlePaste, handlePasteStyle, handleDuplicate, handleDelete, handleGroup, handleUngroup, handleCreateComponent, handleAddComment]);

  // Active selected item
  const activeField = currentFields.find((f) => f.fieldId === activeFieldId) || currentFields.find((f) => selectedIds.includes(f.fieldId)) || null;

  // Add Item to Canvas
  const addItem = (item: Partial<FieldLayoutItem>) => {
    const baseId = item.fieldId || `elem_${Date.now()}`;
    let uniqueId = baseId;
    let counter = 1;
    while (currentFields.some((f) => f.fieldId === uniqueId)) {
      uniqueId = `${baseId}_${counter}`;
      counter++;
    }
    const newItem: FieldLayoutItem = {
      fieldId: uniqueId,
      label: item.label || "New Element",
      left: item.left ?? 50,
      top: item.top ?? 50,
      width: item.width ?? 30,
      height: item.height ?? 15,
      fontSize: item.fontSize ?? 16,
      fontColor: item.fontColor ?? "#0F172A",
      fontFamily: item.fontFamily ?? "Inter, sans-serif",
      textAlign: item.textAlign ?? "center",
      fontStyle: item.fontStyle ?? "normal",
      textDecoration: item.textDecoration ?? "none",
      textTransform: item.textTransform ?? "none",
      itemType: item.itemType ?? "text",
      content: item.content ?? item.label ?? "Editable Text",
      shapeType: item.shapeType,
      elementType: item.elementType,
      photoType: item.photoType,
      imageUrl: item.imageUrl,
      bgColor: item.bgColor ?? "transparent",
      borderColor: item.borderColor ?? "#E2E8F0",
      borderWidth: item.borderWidth ?? 0,
      borderRadius: item.borderRadius ?? 8,
      opacity: item.opacity ?? 1,
      zIndex: currentFields.length + 1,
      locked: false,
      gradient: item.gradient,
    };
    commitToHistory([...currentFields, newItem]);
    setSelectedIds([newItem.fieldId]);
    setActiveFieldId(newItem.fieldId);
  };

  // Modify active field attributes
  const updateActiveField = (props: Partial<FieldLayoutItem>) => {
    if (!activeField) return;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId) || f.fieldId === activeField.fieldId) {
          return { ...f, ...props };
        }
        return f;
      })
    );
  };

  // Alignment functions
  const handleAlign = (type: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!activeField && selectedIds.length === 0) return;
    commitToHistory(
      currentFields.map((f) => {
        if (selectedIds.includes(f.fieldId) || (activeField && f.fieldId === activeField.fieldId)) {
          const w = f.width || 25;
          const h = f.height || 10;
          if (type === "left") return { ...f, left: Math.max(5, w / 2 + 2) };
          if (type === "center") return { ...f, left: 50 };
          if (type === "right") return { ...f, left: Math.min(95, 100 - w / 2 - 2) };
          if (type === "top") return { ...f, top: Math.max(5, h / 2 + 2) };
          if (type === "middle") return { ...f, top: 50 };
          if (type === "bottom") return { ...f, top: Math.min(95, 100 - h / 2 - 2) };
        }
        return f;
      })
    );
  };

  // Layer Reordering functions
  const handleMoveLayer = (fieldId: string, direction: "up" | "down" | "top" | "bottom") => {
    const idx = currentFields.findIndex((f) => f.fieldId === fieldId);
    if (idx === -1) return;

    const list = [...currentFields];
    const [item] = list.splice(idx, 1);

    if (direction === "top") {
      list.push(item);
    } else if (direction === "bottom") {
      list.unshift(item);
    } else if (direction === "up") {
      list.splice(Math.min(list.length, idx + 1), 0, item);
    } else {
      list.splice(Math.max(0, idx - 1), 0, item);
    }

    // Re-index zIndices
    const reindexed = list.map((f, i) => ({ ...f, zIndex: i + 1 }));
    commitToHistory(reindexed);
  };

  // Mouse Handlers for Canvas, Marquee & Multi-drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const target = e.target as HTMLElement;
    // Don't start marquee if user clicked on an interactive control, button, or input
    if (target.closest(".group") || target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "SELECT") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!e.shiftKey && !e.ctrlKey) {
      setSelectedIds([]);
      setActiveFieldId(null);
    }
    isMarqueeSelecting.current = true;
    setMarqueeBox({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleItemMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    const field = currentFields.find((f) => f.fieldId === fieldId);
    if (!field || field.locked) return;

    let newSelected = [...selectedIds];
    if (e.shiftKey || e.ctrlKey) {
      if (newSelected.includes(fieldId)) {
        newSelected = newSelected.filter((id) => id !== fieldId);
      } else {
        newSelected.push(fieldId);
      }
    } else {
      if (!newSelected.includes(fieldId)) {
        newSelected = [fieldId];
      }
    }

    setSelectedIds(newSelected);
    setActiveFieldId(fieldId);

    // Initialize drag positions
    isDraggingItem.current = true;
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    const posMap: Record<string, { left: number; top: number }> = {};
    for (const f of currentFields) {
      if (newSelected.includes(f.fieldId)) {
        posMap[f.fieldId] = { left: f.left, top: f.top };
      }
    }
    dragStartPositions.current = posMap;
  };

  // Resize handle mouse down
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!activeField) return;
    isResizingItem.current = handle;
    resizeStartMouse.current = { x: e.clientX, y: e.clientY };
    resizeStartDim.current = {
      width: activeField.width || 30,
      height: activeField.height || 15,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (isResizingItem.current && activeField) {
      const dxPx = e.clientX - resizeStartMouse.current.x;
      const dyPx = e.clientY - resizeStartMouse.current.y;
      const dxPct = (dxPx / rect.width) * 100;
      const dyPct = (dyPx / rect.height) * 100;

      let newWidth = resizeStartDim.current.width;
      let newHeight = resizeStartDim.current.height;

      if (isResizingItem.current.includes("e")) newWidth += dxPct;
      if (isResizingItem.current.includes("s")) newHeight += dyPct;
      if (isResizingItem.current.includes("w")) newWidth -= dxPct;
      if (isResizingItem.current.includes("n")) newHeight -= dyPct;

      newWidth = Math.max(5, Math.min(95, Math.round(newWidth * 10) / 10));
      newHeight = Math.max(3, Math.min(95, Math.round(newHeight * 10) / 10));

      updateActiveField({ width: newWidth, height: newHeight });
    } else if (isDraggingItem.current && selectedIds.length > 0) {
      const dxPx = e.clientX - dragStartMouse.current.x;
      const dyPx = e.clientY - dragStartMouse.current.y;
      const dxPct = (dxPx / rect.width) * 100;
      const dyPct = (dyPx / rect.height) * 100;

      setCurrentFields((prev) =>
        prev.map((f) => {
          if (selectedIds.includes(f.fieldId) && dragStartPositions.current[f.fieldId]) {
            const start = dragStartPositions.current[f.fieldId];
            return {
              ...f,
              left: Math.round(Math.max(0, Math.min(100, start.left + dxPct)) * 10) / 10,
              top: Math.round(Math.max(0, Math.min(100, start.top + dyPct)) * 10) / 10,
            };
          }
          return f;
        })
      );
    } else if (isMarqueeSelecting.current && marqueeBox) {
      const curX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const curY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setMarqueeBox((prev) => prev ? { ...prev, currentX: curX, currentY: curY } : null);

      const minX = Math.min(marqueeBox.startX, curX);
      const maxX = Math.max(marqueeBox.startX, curX);
      const minY = Math.min(marqueeBox.startY, curY);
      const maxY = Math.max(marqueeBox.startY, curY);

      const inside = currentFields
        .filter((f) => f.left >= minX && f.left <= maxX && f.top >= minY && f.top <= maxY)
        .map((f) => f.fieldId);

      setSelectedIds(inside);
      if (inside.length > 0) setActiveFieldId(inside[0]);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingItem.current) {
      isDraggingItem.current = false;
      commitToHistory(currentFields);
    }
    if (isResizingItem.current) {
      isResizingItem.current = null;
      commitToHistory(currentFields);
    }
    if (isMarqueeSelecting.current) {
      isMarqueeSelecting.current = false;
      setMarqueeBox(null);
    }
  };

  // Upload Background
  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    setBgUploadError(null);

    try {
      if (isPdf(file.name)) {
        const pdfRes = await renderPdfToDataUrl(file);
        setCurrentBgUrl(pdfRes.dataUrl);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", template.type);

        const res = await fetch("/api/templates/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload image");
        }
        const data = await res.json();
        setCurrentBgUrl(data.url);
      }
    } catch (err: any) {
      setBgUploadError(err.message || "Failed to upload file");
    } finally {
      setUploadingBg(false);
    }
  };

  // ================================================================
  // Smart Import: Decompose SVG/HTML/JSON into Editable Elements
  // ================================================================

  // Helper: parse CSS color from SVG/HTML attribute
  const parseColor = (raw: string | null | undefined, fallback: string = "#0F172A"): string => {
    if (!raw || raw === "none" || raw === "inherit" || raw === "currentColor") return fallback;
    return raw;
  };

  // Helper: parse numeric attribute with fallback
  const parseNum = (raw: string | null | undefined, fallback: number = 0): number => {
    if (!raw) return fallback;
    const n = parseFloat(raw);
    return isNaN(n) ? fallback : n;
  };

  // Helper: generate unique field ID
  const makeUniqueId = (base: string, existing: Set<string>): string => {
    let id = base.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24) || "elem";
    let uniqueId = id;
    let counter = 1;
    while (existing.has(uniqueId)) {
      uniqueId = `${id}_${counter}`;
      counter++;
    }
    existing.add(uniqueId);
    return uniqueId;
  };

  // Decompose SVG into editable FieldLayoutItem elements
  const decomposeSvg = (svgText: string): FieldLayoutItem[] => {
    const items: FieldLayoutItem[] = [];
    const seenIds = new Set<string>();

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) return [];

      // Get SVG viewBox for coordinate mapping
      const vbAttr = svgEl.getAttribute("viewBox");
      let svgW = parseNum(svgEl.getAttribute("width"), 0);
      let svgH = parseNum(svgEl.getAttribute("height"), 0);
      if (vbAttr) {
        const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length >= 4) {
          svgW = parts[2] || svgW;
          svgH = parts[3] || svgH;
        }
      }
      if (!svgW) svgW = 800;
      if (!svgH) svgH = 600;

      // Convert SVG coordinate to canvas percentage
      const toLeftPct = (x: number) => Math.max(2, Math.min(98, (x / svgW) * 100));
      const toTopPct = (y: number) => Math.max(2, Math.min(98, (y / svgH) * 100));
      const toWidthPct = (w: number) => Math.max(3, Math.min(95, (w / svgW) * 100));
      const toHeightPct = (h: number) => Math.max(3, Math.min(95, (h / svgH) * 100));

      // Recursive element walker
      const walk = (el: Element, depth: number = 0) => {
        const tag = el.tagName.toLowerCase();

        // Skip defs, style, metadata, clipPath, mask
        if (["defs", "style", "metadata", "clippath", "mask", "pattern", "lineargradient", "radialgradient", "stop", "filter"].includes(tag)) return;

        // RECT elements → shape
        if (tag === "rect") {
          const x = parseNum(el.getAttribute("x"), 0);
          const y = parseNum(el.getAttribute("y"), 0);
          const w = parseNum(el.getAttribute("width"), 100);
          const h = parseNum(el.getAttribute("height"), 60);
          const rx = parseNum(el.getAttribute("rx"), 0);
          const fill = parseColor(el.getAttribute("fill") || (el as any).style?.fill, "#F8FAFC");
          const stroke = parseColor(el.getAttribute("stroke") || (el as any).style?.stroke, "transparent");
          const strokeW = parseNum(el.getAttribute("stroke-width"), 0);

          const id = makeUniqueId("rect_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || el.getAttribute("class") || `Rectangle ${items.length + 1}`,
            left: toLeftPct(x + w / 2),
            top: toTopPct(y + h / 2),
            width: toWidthPct(w),
            height: toHeightPct(h),
            itemType: "shape",
            shapeType: rx > 0 ? "rounded" : "rectangle",
            bgColor: fill === "transparent" || fill === "none" ? "transparent" : fill,
            borderColor: stroke === "transparent" ? "#CBD5E1" : stroke,
            borderWidth: strokeW,
            borderRadius: rx,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return; // Don't traverse children of primitive shapes
        }

        // CIRCLE elements → shape (circle)
        if (tag === "circle") {
          const cx = parseNum(el.getAttribute("cx"), 50);
          const cy = parseNum(el.getAttribute("cy"), 50);
          const r = parseNum(el.getAttribute("r"), 30);
          const fill = parseColor(el.getAttribute("fill"), "#EFF6FF");
          const stroke = parseColor(el.getAttribute("stroke"), "transparent");
          const strokeW = parseNum(el.getAttribute("stroke-width"), 0);

          const id = makeUniqueId("circle_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || `Circle ${items.length + 1}`,
            left: toLeftPct(cx),
            top: toTopPct(cy),
            width: toWidthPct(r * 2),
            height: toHeightPct(r * 2),
            itemType: "shape",
            shapeType: "circle",
            bgColor: fill,
            borderColor: stroke,
            borderWidth: strokeW,
            borderRadius: 50,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // ELLIPSE elements → shape (circle approximation)
        if (tag === "ellipse") {
          const cx = parseNum(el.getAttribute("cx"), 50);
          const cy = parseNum(el.getAttribute("cy"), 50);
          const rx = parseNum(el.getAttribute("rx"), 40);
          const ry = parseNum(el.getAttribute("ry"), 25);
          const fill = parseColor(el.getAttribute("fill"), "#EFF6FF");
          const stroke = parseColor(el.getAttribute("stroke"), "transparent");

          const id = makeUniqueId("ellipse_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || `Ellipse ${items.length + 1}`,
            left: toLeftPct(cx),
            top: toTopPct(cy),
            width: toWidthPct(rx * 2),
            height: toHeightPct(ry * 2),
            itemType: "shape",
            shapeType: "circle",
            bgColor: fill,
            borderColor: stroke,
            borderWidth: parseNum(el.getAttribute("stroke-width"), 0),
            borderRadius: 50,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // LINE elements → shape (line)
        if (tag === "line") {
          const x1 = parseNum(el.getAttribute("x1"), 0);
          const y1 = parseNum(el.getAttribute("y1"), 0);
          const x2 = parseNum(el.getAttribute("x2"), 100);
          const y2 = parseNum(el.getAttribute("y2"), 0);
          const stroke = parseColor(el.getAttribute("stroke"), "#CBD5E1");
          const strokeW = parseNum(el.getAttribute("stroke-width"), 2);

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

          const id = makeUniqueId("line_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || `Line ${items.length + 1}`,
            left: toLeftPct(midX),
            top: toTopPct(midY),
            width: toWidthPct(lineLen),
            height: strokeW,
            itemType: "shape",
            shapeType: "line",
            borderColor: stroke,
            borderWidth: strokeW,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // POLYGON / POLYLINE → shape (badge approximation)
        if (tag === "polygon" || tag === "polyline") {
          const points = el.getAttribute("points") || "";
          const fill = parseColor(el.getAttribute("fill"), "#F8FAFC");
          const stroke = parseColor(el.getAttribute("stroke"), "transparent");

          // Parse points to find bounding box
          const coords = points.trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
          const xs: number[] = [];
          const ys: number[] = [];
          for (let i = 0; i < coords.length; i += 2) {
            xs.push(coords[i]);
            ys.push(coords[i + 1] ?? 0);
          }
          if (xs.length === 0) return;

          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const id = makeUniqueId("polygon_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || `Polygon ${items.length + 1}`,
            left: toLeftPct((minX + maxX) / 2),
            top: toTopPct((minY + maxY) / 2),
            width: toWidthPct(maxX - minX),
            height: toHeightPct(maxY - minY),
            itemType: "shape",
            shapeType: "badge",
            bgColor: fill,
            borderColor: stroke,
            borderWidth: parseNum(el.getAttribute("stroke-width"), 0),
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // PATH elements → shape (use bounding box approximation)
        if (tag === "path") {
          const d = el.getAttribute("d") || "";
          const fill = parseColor(el.getAttribute("fill"), "#F8FAFC");
          const stroke = parseColor(el.getAttribute("stroke"), "transparent");

          // Extract numeric coordinates from path data for bounding box
          const nums = d.match(/-?[\d.]+/g)?.map(Number).filter((n) => !isNaN(n)) || [];
          if (nums.length < 2) return;

          const xs = nums.filter((_, i) => i % 2 === 0);
          const ys = nums.filter((_, i) => i % 2 === 1);
          if (xs.length === 0 || ys.length === 0) return;

          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const w = maxX - minX;
          const h = maxY - minY;

          // Skip very tiny paths (likely decoration/noise)
          if (w < 2 && h < 2) return;

          const id = makeUniqueId("path_shape", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || el.getAttribute("class") || `Path Shape ${items.length + 1}`,
            left: toLeftPct(minX + w / 2),
            top: toTopPct(minY + h / 2),
            width: Math.max(3, toWidthPct(w)),
            height: Math.max(3, toHeightPct(h)),
            itemType: "shape",
            shapeType: "rounded",
            bgColor: fill !== "none" && fill !== "transparent" ? fill : "transparent",
            borderColor: stroke !== "transparent" ? stroke : "#CBD5E1",
            borderWidth: parseNum(el.getAttribute("stroke-width"), fill !== "none" ? 0 : 1),
            borderRadius: 4,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // TEXT elements → text item
        if (tag === "text" || tag === "tspan") {
          const textContent = (el.textContent || "").trim();
          if (!textContent) return;

          const x = parseNum(el.getAttribute("x"), svgW / 2);
          const y = parseNum(el.getAttribute("y"), svgH / 2);
          const fill = parseColor(el.getAttribute("fill"), "#0F172A");
          const rawSize = el.getAttribute("font-size") || (el as any).style?.fontSize || "";
          const fontSize = parseNum(rawSize.replace("px", "").replace("pt", ""), 16);
          const fontWeight = el.getAttribute("font-weight") || (el as any).style?.fontWeight || "";
          const fontFamily = el.getAttribute("font-family") || (el as any).style?.fontFamily || "";

          const id = makeUniqueId("text_" + textContent.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "_"), seenIds);
          items.push({
            fieldId: id,
            label: textContent.length > 30 ? textContent.slice(0, 30) + "..." : textContent,
            content: textContent,
            left: toLeftPct(x),
            top: toTopPct(y),
            fontSize: Math.max(8, Math.min(72, fontSize)),
            fontColor: fill,
            fontFamily: fontFamily || "Inter, sans-serif",
            fontStyle: (fontWeight === "bold" || fontWeight === "700" || parseInt(fontWeight) >= 600) ? "bold" : "normal",
            itemType: "text",
            textAlign: (el.getAttribute("text-anchor") === "middle" ? "center" : el.getAttribute("text-anchor") === "end" ? "right" : "left") as any,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return; // Don't also process child tspans as separate items
        }

        // IMAGE elements → photo item
        if (tag === "image") {
          const href = el.getAttribute("href") || el.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
          const x = parseNum(el.getAttribute("x"), 0);
          const y = parseNum(el.getAttribute("y"), 0);
          const w = parseNum(el.getAttribute("width"), 100);
          const h = parseNum(el.getAttribute("height"), 100);

          const id = makeUniqueId("img_photo", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("id") || `Image ${items.length + 1}`,
            left: toLeftPct(x + w / 2),
            top: toTopPct(y + h / 2),
            width: toWidthPct(w),
            height: toHeightPct(h),
            itemType: "photo",
            photoType: "custom",
            imageUrl: href.startsWith("data:") || href.startsWith("http") ? href : undefined,
            borderRadius: 4,
            opacity: parseNum(el.getAttribute("opacity"), 1),
            zIndex: items.length + 1,
          });
          return;
        }

        // G (group) and other container elements → recurse into children
        for (const child of Array.from(el.children)) {
          walk(child, depth + 1);
        }
      };

      // Walk all children of the SVG root
      for (const child of Array.from(svgEl.children)) {
        walk(child, 0);
      }
    } catch (err) {
      console.warn("SVG decomposition error:", err);
    }

    return items;
  };

  // Decompose HTML into editable FieldLayoutItem elements
  const decomposeHtml = (htmlText: string): FieldLayoutItem[] => {
    const items: FieldLayoutItem[] = [];
    const seenIds = new Set<string>();

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const body = doc.body;
      if (!body) return [];

      // Also check for embedded SVG in the HTML
      const svgElements = body.querySelectorAll("svg");
      for (const svg of Array.from(svgElements)) {
        const svgStr = new XMLSerializer().serializeToString(svg);
        items.push(...decomposeSvg(svgStr));
      }

      // Track vertical offset for elements without explicit positioning
      let yOffset = 8;

      const walkHtml = (el: Element) => {
        const tag = el.tagName.toLowerCase();
        const style = (el as HTMLElement).style;

        // Skip script, style, svg (already handled), meta tags
        if (["script", "style", "svg", "meta", "link", "head", "br", "hr"].includes(tag)) {
          if (tag === "hr") {
            // HR → line shape
            const id = makeUniqueId("hr_line", seenIds);
            items.push({
              fieldId: id,
              label: "Divider Line",
              left: 50,
              top: yOffset,
              width: 60,
              height: 2,
              itemType: "shape",
              shapeType: "line",
              borderColor: "#CBD5E1",
              borderWidth: 2,
              zIndex: items.length + 1,
            });
            yOffset += 5;
          }
          return;
        }

        // IMG elements → photo
        if (tag === "img") {
          const src = el.getAttribute("src") || "";
          const id = makeUniqueId("html_img", seenIds);
          items.push({
            fieldId: id,
            label: el.getAttribute("alt") || `Image ${items.length + 1}`,
            left: 50,
            top: yOffset,
            width: 25,
            height: 20,
            itemType: "photo",
            photoType: "custom",
            imageUrl: src.startsWith("data:") || src.startsWith("http") ? src : undefined,
            borderRadius: 4,
            zIndex: items.length + 1,
          });
          yOffset += 22;
          return;
        }

        // Check for text content (only direct text, not child element text)
        const directText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3) // TEXT_NODE
          .map((n) => (n.textContent || "").trim())
          .join(" ")
          .trim();

        // Check for variable placeholders in text
        const hasChildren = el.children.length > 0;

        if (directText && directText.length > 0) {
          // Determine styling from tag and inline styles
          const isHeading = /^h[1-6]$/.test(tag);
          const isSpan = tag === "span" || tag === "label";
          const isP = tag === "p";

          let fontSize = 14;
          if (tag === "h1") fontSize = 28;
          else if (tag === "h2") fontSize = 22;
          else if (tag === "h3") fontSize = 18;
          else if (tag === "h4") fontSize = 16;
          else if (tag === "h5" || tag === "h6") fontSize = 13;
          else if (style?.fontSize) fontSize = parseNum(style.fontSize.replace("px", "").replace("pt", "").replace("em", ""), fontSize);

          const fontColor = parseColor(style?.color || el.getAttribute("color"), "#0F172A");
          const fontWeight = style?.fontWeight || (isHeading ? "bold" : "normal");
          const textAlign = (style?.textAlign || "left") as "left" | "center" | "right";

          // Check if text contains template variables
          const varMatch = directText.match(/\{\{(\w+)\}\}|\$\{(\w+)\}/);
          const isField = !!varMatch;
          const fieldKey = varMatch ? (varMatch[1] || varMatch[2]) : null;

          const id = isField && fieldKey
            ? makeUniqueId(fieldKey, seenIds)
            : makeUniqueId("text_" + directText.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "_"), seenIds);

          items.push({
            fieldId: id,
            label: isField && fieldKey ? fieldKey.replace(/([A-Z])/g, " $1").trim() : (directText.length > 40 ? directText.slice(0, 40) + "..." : directText),
            content: isField ? undefined : directText,
            left: textAlign === "center" ? 50 : textAlign === "right" ? 75 : 25,
            top: yOffset,
            fontSize,
            fontColor,
            fontStyle: (fontWeight === "bold" || fontWeight === "700" || parseInt(fontWeight as string) >= 600) ? "bold" : "normal",
            fontFamily: style?.fontFamily || "Inter, sans-serif",
            textAlign,
            itemType: isField ? "field" : "text",
            zIndex: items.length + 1,
          });

          yOffset += Math.max(5, fontSize * 0.35 + 4);
        }

        // Div/section with background color but no text → treat as shape
        if (!directText && (tag === "div" || tag === "section" || tag === "header" || tag === "footer" || tag === "aside" || tag === "nav")) {
          const bgColor = style?.backgroundColor || style?.background || "";
          const border = style?.border || "";
          const borderRadius = style?.borderRadius || "";

          if (bgColor && bgColor !== "transparent" && bgColor !== "inherit") {
            const id = makeUniqueId("div_shape", seenIds);
            items.push({
              fieldId: id,
              label: el.getAttribute("id") || el.getAttribute("class")?.split(" ")[0] || `Block ${items.length + 1}`,
              left: 50,
              top: yOffset,
              width: tag === "header" || tag === "footer" || tag === "nav" ? 90 : 40,
              height: 15,
              itemType: "shape",
              shapeType: "rounded",
              bgColor: bgColor,
              borderColor: border ? parseColor(border.split(" ").pop(), "#E2E8F0") : "#E2E8F0",
              borderWidth: border ? 1 : 0,
              borderRadius: parseNum(borderRadius.replace("px", ""), 8),
              zIndex: items.length + 1,
            });
            yOffset += 17;
          }
        }

        // Recurse into child elements
        for (const child of Array.from(el.children)) {
          walkHtml(child);
        }
      };

      walkHtml(body);
    } catch (err) {
      console.warn("HTML decomposition error:", err);
    }

    return items;
  };

  // Unified extraction function for live preview
  const extractFieldsFromText = (text: string, type: "html" | "svg" | "json"): FieldLayoutItem[] => {
    if (!text.trim()) return [];

    if (type === "json") {
      try {
        const parsed = JSON.parse(text);
        const fArray = parsed.sides?.front?.fields || parsed.fields || (Array.isArray(parsed) ? parsed : []);
        return parseFields(fArray);
      } catch (e) {
        return [];
      }
    }

    if (type === "svg") {
      return decomposeSvg(text);
    }

    // HTML
    return decomposeHtml(text);
  };

  // Re-detect fields when code input changes
  useEffect(() => {
    if (!importCodeText.trim()) {
      setDetectedImportFields([]);
      return;
    }
    const detected = extractFieldsFromText(importCodeText, importCodeType);
    setDetectedImportFields(detected);
  }, [importCodeText, importCodeType]);

  // Code Import Action: Add decomposed elements to canvas (NOT as background)
  const handleImportCode = () => {
    try {
      if (importCodeType === "json") {
        const parsed = JSON.parse(importCodeText);
        if (parsed.orientation) setOrientation(parsed.orientation);
        if (parsed.sides?.front?.fields) {
          setFrontFields(parseFields(parsed.sides.front.fields));
          if (parsed.sides.back?.fields) setBackFields(parseFields(parsed.sides.back.fields));
        } else if (parsed.fields) {
          setCurrentFields(parseFields(parsed.fields));
        }
      }

      // For HTML and SVG: decompose into editable elements and add to canvas
      if (detectedImportFields.length > 0) {
        // Assign proper z-indices starting after existing elements
        const startZ = currentFields.length + 1;
        const indexedFields = detectedImportFields.map((f, i) => ({
          ...f,
          zIndex: startZ + i,
        }));
        commitToHistory([...currentFields, ...indexedFields]);
      }

      setShowImportModal(false);
      setImportCodeText("");
      setDetectedImportFields([]);
    } catch (err: any) {
      setBgUploadError("Invalid code format: " + err.message);
    }
  };

  // Save to DB
  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        fieldLayout: {
          orientation,
          twoSided: isTwoSidedSupported,
          sides: {
            front: { fields: frontFields, backgroundUrl: frontBgUrl, backgroundHtml: frontBgHtml },
            back: { fields: backFields, backgroundUrl: backBgUrl, backgroundHtml: backBgHtml },
          },
          fields: frontFields,
        },
        backgroundUrl: frontBgUrl,
        backgroundHtml: frontBgHtml,
      };

      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save template layout");
      }

      const updated = await res.json();
      setVersion(updated.version);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || "Error saving layout");
    } finally {
      setSaving(false);
    }
  };

  // Export
  const handleExport = useCallback(async (format: "pdf" | "jpg" | "svg" | "eps", sideChoice: "both" | "front" | "back" = "both") => {
    if (!canvasRef.current) return;
    setExporting(true);
    setShowExportMenu(false);

    try {
      if (format === "svg") {
        const targetSide = sideChoice === "back" ? "back" : "front";
        const sideFields = targetSide === "back" ? backFields : frontFields;
        const sideBgUrl = targetSide === "back" ? backBgUrl : frontBgUrl;
        const sideBgColor = targetSide === "back" ? backBgColor : frontBgColor;
        const svgContent = generateSvgVector(sideFields, {
          width: canvasDim.width,
          height: canvasDim.height,
          bgColor: sideBgColor,
          bgUrl: sideBgUrl,
          previewData: SAMPLE_PREVIEW_DATA,
        });
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_${targetSide}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (format === "eps") {
        const targetSide = sideChoice === "back" ? "back" : "front";
        const sideFields = targetSide === "back" ? backFields : frontFields;
        const sideBgColor = targetSide === "back" ? backBgColor : frontBgColor;
        const epsContent = generateEpsVector(sideFields, {
          width: canvasDim.width,
          height: canvasDim.height,
          bgColor: sideBgColor,
          previewData: SAMPLE_PREVIEW_DATA,
        });
        const blob = new Blob([epsContent], { type: "application/postscript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_${targetSide}.eps`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const renderSideToDataUrl = async (side: "front" | "back") => {
        if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const fieldsToRender = side === "front" ? frontFields : backFields;
        const bgUrl = side === "front" ? frontBgUrl : backBgUrl;
        const bgColorToUse = side === "front" ? frontBgColor : backBgColor;

        const tempCanvas = document.createElement("canvas");
        const scale = 2;
        tempCanvas.width = canvasDim.width * scale;
        tempCanvas.height = canvasDim.height * scale;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) throw new Error("Could not create canvas context");
        ctx.scale(scale, scale);

        // Render Background Color & Image
        ctx.fillStyle = bgColorToUse || "#FFFFFF";
        ctx.fillRect(0, 0, canvasDim.width, canvasDim.height);

        if (bgUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvasDim.width, canvasDim.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = bgUrl;
          });
        }

        for (const field of fieldsToRender) {
          const x = (field.left / 100) * canvasDim.width;
          const y = (field.top / 100) * canvasDim.height;
          ctx.save();
          ctx.globalAlpha = typeof field.opacity === "number" ? field.opacity : 1;

          // Helper: Compute Gradient if enabled
          const hasGradient = field.gradient?.enabled && field.gradient.from && field.gradient.to;
          let fillStyleToUse: string | CanvasGradient = field.bgColor || field.fontColor || "#0F172A";

          if (hasGradient) {
            const w = field.width ? (field.width / 100) * canvasDim.width : 100;
            const h = field.height ? (field.height / 100) * canvasDim.height : 40;
            let grad: CanvasGradient;
            const dir = field.gradient!.direction;
            if (dir === "to right") {
              grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
            } else if (dir === "to bottom") {
              grad = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
            } else if (dir === "to bottom right") {
              grad = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
            } else {
              grad = ctx.createLinearGradient(x - w / 2, y + h / 2, x + w / 2, y - h / 2);
            }
            grad.addColorStop(0, field.gradient!.from);
            grad.addColorStop(1, field.gradient!.to);
            fillStyleToUse = grad;
          }

          if (field.itemType === "shape") {
            const w = field.width ? (field.width / 100) * canvasDim.width : 100;
            const h = field.shapeType === "line" ? (field.height || 2) : field.height ? (field.height / 100) * canvasDim.height : 60;
            ctx.fillStyle = fillStyleToUse;
            ctx.strokeStyle = field.borderColor || "#CBD5E1";
            ctx.lineWidth = field.borderWidth ?? 1;

            if (field.shapeType === "circle") {
              ctx.beginPath();
              ctx.arc(x, y, w / 2, 0, Math.PI * 2);
              ctx.fill();
              if (field.borderWidth) ctx.stroke();
            } else if (field.shapeType === "line") {
              ctx.beginPath();
              ctx.moveTo(x - w / 2, y);
              ctx.lineTo(x + w / 2, y);
              ctx.lineWidth = field.height || 2;
              ctx.strokeStyle = hasGradient ? fillStyleToUse : (field.borderColor || "#CBD5E1");
              ctx.stroke();
            } else {
              ctx.beginPath();
              const r = field.borderRadius || 8;
              ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
              ctx.fill();
              if (field.borderWidth) ctx.stroke();
            }
          } else if (field.itemType === "photo" && field.imageUrl) {
            const w = field.width ? (field.width / 100) * canvasDim.width : 80;
            const h = field.height ? (field.height / 100) * canvasDim.height : 80;
            await new Promise<void>((resolve) => {
              const pImg = new Image();
              pImg.crossOrigin = "anonymous";
              pImg.onload = () => {
                ctx.drawImage(pImg, x - w / 2, y - h / 2, w, h);
                resolve();
              };
              pImg.onerror = () => resolve();
              pImg.src = field.imageUrl!;
            });
          } else {
            const textToDraw = field.itemType === "text"
              ? (field.content || field.label)
              : (SAMPLE_PREVIEW_DATA[field.fieldId] || `[${field.label}]`);

            const isBold = field.fontStyle === "bold" || field.fontStyle === "bold-italic";
            const isItalic = field.fontStyle === "italic" || field.fontStyle === "bold-italic";
            const fontStyleStr = `${isBold ? "bold " : ""}${isItalic ? "italic " : ""}`.trim() || "normal";

            // Strip fallbacks for clean canvas font string
            const fontFamilyStr = field.fontFamily || "Inter, sans-serif";
            ctx.font = `${fontStyleStr} ${field.fontSize || 16}px ${fontFamilyStr}`;
            ctx.fillStyle = fillStyleToUse;
            ctx.textAlign = (field.textAlign || "left") as CanvasTextAlign;
            ctx.textBaseline = "middle";
            ctx.fillText(textToDraw, x, y);
          }
          ctx.restore();
        }
        return tempCanvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
      };

      if (format === "jpg") {
        const dataUrl = await renderSideToDataUrl(sideChoice === "back" ? "back" : "front");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_${sideChoice}.jpg`;
        a.click();
      } else {
        const { PDFDocument } = await import("pdf-lib");
        const pdfDoc = await PDFDocument.create();

        const addPageWithImage = async (side: "front" | "back") => {
          const imgDataUrl = await renderSideToDataUrl(side);
          const imgBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(imgBytes);
          const page = pdfDoc.addPage([canvasDim.width, canvasDim.height]);
          page.drawImage(pngImage, { x: 0, y: 0, width: canvasDim.width, height: canvasDim.height });
        };

        if (sideChoice === "both" && isTwoSidedSupported) {
          await addPageWithImage("front");
          await addPageWithImage("back");
        } else {
          await addPageWithImage(sideChoice === "back" ? "back" : "front");
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_${sideChoice}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError("Export error: " + err.message);
    } finally {
      setExporting(false);
    }
  }, [canvasDim, frontFields, backFields, frontBgUrl, backBgUrl, isTwoSidedSupported, template.name]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8F9FA] text-[#1E293B] select-none font-sans overflow-hidden">
      {/* ======================================================== */}
      {/* 1. TOP HEADER                                            */}
      {/* ======================================================== */}
      <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#475569] flex items-center justify-center transition-colors"
            title="Back to Templates"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#FF5B37] text-white flex items-center justify-center text-xs font-black shadow-xs">
              M
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#0F172A] leading-tight flex items-center gap-1.5">
                {template.name}
                <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                  v{version}
                </span>
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                {canvasConfig[orientation].label} • {canvasConfig[orientation].physicalSize}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Undo/Redo & Viewport / Side Switchers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E5E7EB] rounded-lg p-0.5 bg-[#F8F9FA]">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-md hover:bg-white text-[#475569] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Undo (Ctrl+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2a5 5 0 01-5 5H11M3 10l6-6M3 10l6 6" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1.5 rounded-md hover:bg-white text-[#475569] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Redo (Ctrl+Y)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2a5 5 0 005 5h2m8-12l-6-6m6 6l-6 6" />
              </svg>
            </button>
          </div>

          <div className="h-4 w-px bg-[#E5E7EB]" />

          {/* Orientation Segmented Switcher */}
          <div className="flex items-center border border-[#E5E7EB] rounded-lg p-0.5 bg-[#F8F9FA]">
            <button
              onClick={() => setOrientation("PORTRAIT")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${orientation === "PORTRAIT" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              title="Portrait Orientation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="2" width="14" height="20" rx="2" />
              </svg>
              <span>Portrait</span>
            </button>
            <button
              onClick={() => setOrientation("LANDSCAPE")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${orientation === "LANDSCAPE" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              title="Landscape Orientation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
              </svg>
              <span>Landscape</span>
            </button>
          </div>

          {/* Front / Back Face Switcher for Two-Sided Cards */}
          {isTwoSidedSupported && (
            <div className="flex items-center border border-[#E5E7EB] rounded-lg p-0.5 bg-[#F8F9FA]">
              <button
                onClick={() => { setActiveSide("front"); setSelectedIds([]); setActiveFieldId(null); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeSide === "front" ? "bg-white text-[#FF5B37] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
              >
                Front Face
              </button>
              <button
                onClick={() => { setActiveSide("back"); setSelectedIds([]); setActiveFieldId(null); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeSide === "back" ? "bg-white text-[#FF5B37] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
              >
                Back Face
              </button>
            </div>
          )}
        </div>

        {/* Right: Share / Preview, Export, and Save & Publish Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Share/Preview</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Export</span>
              <span className="text-[10px] text-[#94A3B8]">▾</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-52 overflow-hidden text-[#1E293B] z-50">
                {isTwoSidedSupported && (
                  <button
                    onClick={() => handleExport("pdf", "both")}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#FF5B37] hover:bg-[#FFF5F2] flex items-center gap-2 border-b border-[#F1F5F9]"
                  >
                    <span>🔄</span>
                    <span>2-Sided PDF (Front & Back)</span>
                  </button>
                )}
                <button
                  onClick={() => handleExport("pdf", activeSide)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F9FA] flex items-center gap-2"
                >
                  <span className="text-red-500 font-bold">PDF</span>
                  <span>PDF Document ({activeSide})</span>
                </button>
                <button
                  onClick={() => handleExport("jpg", activeSide)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F9FA] flex items-center gap-2"
                >
                  <span className="text-amber-500 font-bold">JPG</span>
                  <span>High-Res Image ({activeSide})</span>
                </button>
                <button
                  onClick={() => handleExport("svg", activeSide)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F9FA] flex items-center gap-2"
                >
                  <span className="text-emerald-600 font-bold">SVG</span>
                  <span>SVG Vector Graphic ({activeSide})</span>
                </button>
                <button
                  onClick={() => handleExport("eps", activeSide)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F9FA] flex items-center gap-2"
                >
                  <span className="text-purple-600 font-bold">EPS</span>
                  <span>CDR/Vector EPS (SRS §4.2)</span>
                </button>
              </div>
            )}
          </div>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-98"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save & Publish</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="absolute top-[64px] left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 z-50 animate-in fade-in duration-150">
          <span className="text-[#10B981]">✓</span>
          <span>Template layout published successfully</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE                                        */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ====================================================== */}
        {/* A. LEFT SLIM ICON RAIL WITH FLAT SVG ICONS             */}
        {/* ====================================================== */}
        <aside className="w-[68px] bg-white border-r border-[#E5E7EB] flex flex-col items-center py-3 shrink-0 z-20 gap-2">
          {[
            {
              key: "media",
              label: "Media",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              ),
            },
            {
              key: "text",
              label: "Text",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h16v3" />
                  <path d="M9 20h6" />
                  <path d="M12 4v16" />
                </svg>
              ),
            },
            {
              key: "graphics",
              label: "Graphics",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" />
                  <circle cx="17" cy="7" r="4" />
                  <polygon points="17 14 21 21 13 21" />
                </svg>
              ),
            },
            {
              key: "fields",
              label: "Fields",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              ),
            },
            {
              key: "palette",
              label: "Palette",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".7" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".7" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".7" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".7" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              ),
            },
            {
              key: "code",
              label: "Import",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              ),
            },
          ].map((item) => {
            const active = activeLeftTab === item.key && isLeftDrawerOpen;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (activeLeftTab === item.key && isLeftDrawerOpen) {
                    setIsLeftDrawerOpen(false);
                  } else {
                    setActiveLeftTab(item.key as any);
                    setIsLeftDrawerOpen(true);
                  }
                }}
                className={`w-12 h-13 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${active
                  ? "bg-[#FFF0EB] text-[#FF5B37] font-bold shadow-2xs border border-[#FFD8CF]"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FA]"
                  }`}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* ====================================================== */}
        {/* B. LEFT DRAWER SUBPANEL                                */}
        {/* ====================================================== */}
        {isLeftDrawerOpen && (
          <div className="w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 z-10 shadow-xs">
            <div className="p-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F172A] capitalize">
                {activeLeftTab}
              </span>
              <button
                onClick={() => setIsLeftDrawerOpen(false)}
                className="w-6 h-6 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="px-3 pt-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search elements..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-[#F3F4F6] text-[#0F172A] placeholder-[#94A3B8] text-xs rounded-xl px-3 py-2 pr-8 border border-transparent focus:border-[#CBD5E1] focus:bg-white outline-none transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-white/60 px-1 py-0.5 rounded border border-[#E2E8F0]">
                  ⌘K
                </span>
              </div>
            </div>

            {activeLeftTab === "graphics" && (
              <div className="px-3 pt-2.5">
                <select
                  value={graphicsCategory}
                  onChange={(e) => setGraphicsCategory(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] text-[#475569] text-xs rounded-xl px-3 py-1.5 outline-none font-medium cursor-pointer shadow-2xs"
                >
                  <option value="all">All categories ▾</option>
                  <option value="shapes">Basic Shapes</option>
                  <option value="badges">Badges & Seals</option>
                  <option value="barcodes">Barcodes & QR</option>
                  <option value="gradients">Gradients</option>
                </select>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* TAB 1: GRAPHICS */}
              {activeLeftTab === "graphics" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Shapes</span>
                      <span className="text-[10px] text-[#FF5B37] font-semibold cursor-pointer">View all</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => addItem({ itemType: "shape", shapeType: "rounded", label: "Card Box", width: 28, height: 18, bgColor: "#F8FAFC", borderColor: "#CBD5E1", borderWidth: 1, borderRadius: 8 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <div className="w-7 h-5 rounded-md border border-[#94A3B8] bg-[#F1F5F9] group-hover:border-[#FF5B37]" />
                        <span className="text-[9px] text-[#64748B]">Rounded</span>
                      </button>
                      <button
                        onClick={() => addItem({ itemType: "shape", shapeType: "circle", label: "Circle Frame", width: 20, height: 20, bgColor: "#EFF6FF", borderColor: "#3B82F6", borderWidth: 1, borderRadius: 50 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <div className="w-6 h-6 rounded-full border border-[#3B82F6] bg-[#DBEAFE]" />
                        <span className="text-[9px] text-[#64748B]">Circle</span>
                      </button>
                      <button
                        onClick={() => addItem({ itemType: "shape", shapeType: "line", label: "Divider Line", width: 40, height: 2, borderColor: "#CBD5E1", borderWidth: 2 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <div className="w-8 h-0.5 bg-[#64748B] group-hover:bg-[#FF5B37]" />
                        <span className="text-[9px] text-[#64748B]">Line</span>
                      </button>
                    </div>
                  </div>

                  {/* Badges & Seals */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Social / Seals</span>
                      <span className="text-[10px] text-[#FF5B37] font-semibold cursor-pointer">View all</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => addItem({ itemType: "element", elementType: "seal", label: "Official Seal", width: 15, height: 15 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-white flex items-center justify-center text-[10px] shadow-xs">
                          ★
                        </div>
                        <span className="text-[9px] text-[#64748B]">Gold Seal</span>
                      </button>
                      <button
                        onClick={() => addItem({ itemType: "element", elementType: "badge", label: "Verified Badge", width: 22, height: 8 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold border border-emerald-300">
                          ✓ Verified
                        </div>
                        <span className="text-[9px] text-[#64748B]">Badge</span>
                      </button>
                      <button
                        onClick={() => addItem({ itemType: "element", elementType: "stamp", label: "Security Stamp", width: 16, height: 16 })}
                        className="h-16 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#FF5B37] hover:shadow-2xs flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <div className="w-6 h-6 rounded-full border border-dashed border-blue-600 text-blue-600 flex items-center justify-center text-[8px] font-black -rotate-12">
                          CERT
                        </div>
                        <span className="text-[9px] text-[#64748B]">Stamp</span>
                      </button>
                    </div>
                  </div>

                  {/* Gradient Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Gradient Shapes</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {GRADIENT_PRESETS.map((gp) => (
                        <button
                          key={gp.name}
                          onClick={() => addItem({
                            itemType: "shape",
                            shapeType: "rounded",
                            label: `${gp.name} Shape`,
                            width: 30,
                            height: 18,
                            borderRadius: 10,
                            gradient: { enabled: true, from: gp.from, to: gp.to, direction: "to right" },
                          })}
                          className="h-14 rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#FF5B37] transition-all p-1"
                        >
                          <div
                            className="w-full h-full rounded-lg flex items-center justify-center text-[8px] font-bold text-white shadow-2xs"
                            style={{ background: `linear-gradient(to right, ${gp.from}, ${gp.to})` }}
                          >
                            {gp.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: TEXT */}
              {activeLeftTab === "text" && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Text Hierarchy</span>
                  <button
                    onClick={() => addItem({ itemType: "text", label: "Heading", content: "Add a heading", fontSize: 28, fontStyle: "bold", fontColor: "#0F172A" })}
                    className="w-full p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] text-left hover:bg-[#F8F9FA] transition-all"
                  >
                    <span className="text-lg font-black text-[#0F172A] block">Add a heading</span>
                    <span className="text-[10px] text-[#94A3B8]">28px • Bold Header</span>
                  </button>
                  <button
                    onClick={() => addItem({ itemType: "text", label: "Subheading", content: "Add a subheading", fontSize: 18, fontStyle: "bold", fontColor: "#334155" })}
                    className="w-full p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] text-left hover:bg-[#F8F9FA] transition-all"
                  >
                    <span className="text-sm font-bold text-[#334155] block">Add a subheading</span>
                    <span className="text-[10px] text-[#94A3B8]">18px • Section Title</span>
                  </button>
                  <button
                    onClick={() => addItem({ itemType: "text", label: "Body Text", content: "Add little bit of body text", fontSize: 13, fontStyle: "normal", fontColor: "#64748B" })}
                    className="w-full p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] text-left hover:bg-[#F8F9FA] transition-all"
                  >
                    <span className="text-xs font-normal text-[#64748B] block">Add little bit of body text</span>
                    <span className="text-[10px] text-[#94A3B8]">13px • Paragraph / Terms</span>
                  </button>
                </div>
              )}

              {/* TAB 3: FIELDS */}
              {activeLeftTab === "fields" && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Dynamic Fields</span>
                  {(FIELD_PRESETS_BY_TYPE[template.type] || FIELD_PRESETS_BY_TYPE.CERTIFICATE).map((f, idx) => {
                    const isAlreadyOnCanvas = currentFields.some((cf) => cf.fieldId === f.fieldId);
                    return (
                      <button
                        key={`preset_${f.fieldId}_${idx}`}
                        onClick={() => addItem({
                          itemType: "field",
                          fieldId: f.fieldId,
                          label: f.label,
                          fontSize: f.fontSize,
                          fontColor: f.fontColor,
                          fontStyle: f.fontStyle as any,
                        })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] bg-white hover:bg-[#F8F9FA] text-left flex items-center justify-between transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#0F172A]">{f.label}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">{" + f.fieldId + "}</span>
                        </div>
                        {isAlreadyOnCanvas ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Added</span>
                        ) : (
                          <span className="text-xs font-bold text-[#FF5B37]">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: MEDIA */}
              {activeLeftTab === "media" && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Canvas Background</span>
                  <label className="w-full p-4 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#FF5B37] flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#F8F9FA] transition-all">
                    <span className="text-xl">☁️</span>
                    <span className="text-xs font-bold text-[#0F172A]">Upload Artwork / PDF</span>
                    <span className="text-[10px] text-[#94A3B8]">PNG, JPG, SVG, or PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleUploadBg}
                      disabled={uploadingBg}
                      className="hidden"
                    />
                  </label>

                  {currentBgUrl && (
                    <div className="p-2 border border-[#E5E7EB] rounded-xl flex items-center justify-between bg-white">
                      <span className="text-xs text-[#0F172A] font-semibold truncate">Active Background</span>
                      <button
                        onClick={() => setCurrentBgUrl(null)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block pt-2">Photos & Badges</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addItem({ itemType: "photo", photoType: "candidate", label: "Candidate Photo", width: 22, height: 28, borderRadius: 8, borderColor: "#CBD5E1", borderWidth: 1 })}
                      className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-xl">👤</span>
                      <span className="text-[10px] font-bold text-[#0F172A]">Photo Box</span>
                    </button>
                    <button
                      onClick={() => addItem({ itemType: "photo", photoType: "logo", label: "Company Logo", width: 25, height: 15, borderRadius: 4 })}
                      className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-xl">🏢</span>
                      <span className="text-[10px] font-bold text-[#0F172A]">Org Logo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: PALETTE */}
              {activeLeftTab === "palette" && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Color Themes</span>
                  {[
                    { name: "Modern Coral", primary: "#FF5B37", bg: "#FFFFFF", text: "#0F172A" },
                    { name: "Royal Executive", primary: "#1E3A8A", bg: "#F8FAFC", text: "#0F172A" },
                    { name: "Emerald Honor", primary: "#059669", bg: "#F0FDF4", text: "#064E3B" },
                    { name: "Midnight Premium", primary: "#7C3AED", bg: "#0F172A", text: "#FFFFFF" },
                  ].map((thm) => (
                    <button
                      key={thm.name}
                      onClick={() => {
                        commitToHistory(currentFields.map((f, idx) => ({
                          ...f,
                          fontColor: idx === 0 ? thm.primary : thm.text,
                        })));
                      }}
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] flex items-center justify-between transition-all"
                    >
                      <span className="text-xs font-bold text-[#0F172A]">{thm.name}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: thm.primary }} />
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: thm.text }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 6: IMPORT */}
              {activeLeftTab === "code" && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Code & File Import</span>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full p-3 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] bg-white hover:bg-[#F8F9FA] text-left flex flex-col gap-1 transition-all"
                  >
                    <span className="text-xs font-bold text-[#0F172A]">Import HTML / SVG / JSON / PDF</span>
                    <span className="text-[10px] text-[#64748B]">Auto-detects and extracts variables, dynamic fields, and styling into canvas</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#F1F5F9]">
              <label className="w-full py-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#FF5B37] bg-white hover:bg-[#F8F9FA] text-[#0F172A] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Asset</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleUploadBg}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* C. CENTER CANVAS VIEWPORT                              */}
        {/* ====================================================== */}
        <main
          className="flex-1 overflow-auto relative flex items-center justify-center p-8 bg-[#F4F5F7]"
          style={{
            backgroundImage: "radial-gradient(#CBD5E1 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Zoom controls float */}
          <div className="absolute bottom-4 left-6 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] shadow-xs">
            <button
              onClick={() => setZoom((z) => Math.max(40, z - 10))}
              className="w-6 h-6 rounded-md hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] flex items-center justify-center"
            >
              —
            </button>
            <span className="text-xs font-bold text-[#0F172A] w-10 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(160, z + 10))}
              className="w-6 h-6 rounded-md hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] flex items-center justify-center"
            >
              +
            </button>
            <button
              onClick={() => setZoom(100)}
              className="text-[10px] font-semibold text-[#64748B] hover:text-[#0F172A] ml-1 pl-1 border-l border-[#E2E8F0]"
            >
              Reset
            </button>
          </div>

          {/* Canvas Card */}
          <div
            ref={canvasRef}
            id="template-canvas-viewport"
            style={{
              width: canvasDim.width,
              height: canvasDim.height,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.1s ease-out",
            }}
            className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] relative overflow-hidden shrink-0 select-none"
          >
            {currentBgHtml && (
              <div
                id="canvas-bg-layer"
                className="absolute inset-0 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: currentBgHtml }}
              />
            )}

            {currentBgUrl && (
              <img
                src={currentBgUrl}
                alt="Background"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
            )}

            {marqueeBox && (
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}%`,
                  top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}%`,
                  width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}%`,
                  height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}%`,
                  border: "1.5px dashed #FF5B37",
                  backgroundColor: "rgba(255, 91, 55, 0.08)",
                  pointerEvents: "none",
                  zIndex: 99,
                }}
              />
            )}

            {/* Active Selected Primary Field for single floating toolbar host */}
            {(() => {
              const primarySelectedId = activeFieldId && selectedIds.includes(activeFieldId) ? activeFieldId : selectedIds[0];

              return currentFields.map((field, idx) => {
                const isSelected = selectedIds.includes(field.fieldId);
                const isToolbarHost = isSelected && field.fieldId === primarySelectedId;
                const previewValue = field.itemType === "text"
                  ? (field.content || field.label)
                  : (SAMPLE_PREVIEW_DATA[field.fieldId] || `[${field.label}]`);

                const hasGradient = field.gradient?.enabled && field.gradient.from && field.gradient.to;
                const bgGradientStyle = hasGradient
                  ? `linear-gradient(${field.gradient!.direction}, ${field.gradient!.from}, ${field.gradient!.to})`
                  : field.bgColor || "transparent";

                return (
                  <div
                    key={`canvas_elem_${field.fieldId}_${idx}`}
                    onMouseDown={(e) => handleItemMouseDown(e, field.fieldId)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isSelected) {
                        setSelectedIds([field.fieldId]);
                        setActiveFieldId(field.fieldId);
                      }
                      setContextMenu({ x: e.clientX, y: e.clientY, fieldId: field.fieldId });
                    }}
                    style={{
                      position: "absolute",
                      left: `${field.left}%`,
                      top: `${field.top}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: field.zIndex || (isSelected ? 30 : 10),
                      cursor: field.locked ? "not-allowed" : "move",
                      opacity: typeof field.opacity === "number" ? field.opacity : 1,
                    }}
                    className={`group ${isSelected ? "ring-2 ring-[#FF5B37] ring-offset-1 rounded-sm" : ""}`}
                  >
                    {/* Floating Selection Quick Action Bar (Only 1 instance for the selection) */}
                    {isToolbarHost && (
                      <div
                        className="absolute -top-11 left-0 -translate-y-0.5 z-50 flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded-xl shadow-xl select-none animate-in fade-in duration-100"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* Ungroup / Group */}
                        <button
                          onClick={() => {
                            if (field.groupId || selectedIds.length > 1) {
                              if (field.groupId) handleUngroup();
                              else handleGroup();
                            } else {
                              handleGroup();
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#F8F9FA] rounded-lg text-[11px] font-bold text-[#0F172A] transition-colors whitespace-nowrap"
                          title={field.groupId ? "Ungroup elements (Ctrl+Shift+G)" : "Group elements (Ctrl+G)"}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          </svg>
                          <span>{field.groupId ? "Ungroup" : "Group"}</span>
                        </button>

                        <div className="w-px h-3.5 bg-[#E2E8F0] my-auto" />

                        {/* Layer Position */}
                        <button
                          onClick={() => handleMoveLayer(field.fieldId, "up")}
                          className="p-1 hover:bg-[#F8F9FA] rounded-md text-[#475569] hover:text-[#0F172A]"
                          title="Bring Layer Forward"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                        </button>

                        {/* Lock / Unlock */}
                        <button
                          onClick={handleToggleLock}
                          className={`p-1 rounded-md transition-colors ${field.locked ? "bg-amber-50 text-amber-600" : "hover:bg-[#F8F9FA] text-[#475569] hover:text-[#0F172A]"}`}
                          title={field.locked ? "Unlock element" : "Lock element"}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            {field.locked ? (
                              <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={2} />
                            ) : (
                              <path d="M7 11V7a5 5 0 0110 0v4M5 11h14v10H5z" />
                            )}
                          </svg>
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={handleDuplicate}
                          className="p-1 hover:bg-[#F8F9FA] rounded-md text-[#475569] hover:text-[#0F172A]"
                          title="Duplicate (Ctrl+D)"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="9" y="9" width="12" height="12" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={handleDelete}
                          className="p-1 hover:bg-red-50 rounded-md text-[#475569] hover:text-red-600"
                          title="Delete (Delete)"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="w-px h-3.5 bg-[#E2E8F0] my-auto" />

                        {/* Text Alignment for Text & Field Elements */}
                        {(field.itemType === "text" || field.itemType === "field") && (
                          <>
                            <div className="flex items-center gap-0.5 bg-[#F8F9FA] rounded-md p-0.5 border border-[#E2E8F0]">
                              {(["left", "center", "right", "justify"] as const).map((align) => (
                                <button
                                  key={align}
                                  onClick={() => updateActiveField({ textAlign: align })}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${(field.textAlign || "left") === align ? "bg-white text-[#FF5B37] shadow-2xs" : "text-[#64748B] hover:text-[#0F172A]"
                                    }`}
                                  title={`Align text ${align}`}
                                >
                                  {align === "left" ? "⇤" : align === "center" ? "☰" : align === "right" ? "⇥" : "≡"}
                                </button>
                              ))}
                            </div>
                            <div className="w-px h-3.5 bg-[#E2E8F0] my-auto" />
                          </>
                        )}

                        {/* More Options (...) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenu({ x: rect.right + 4, y: rect.top, fieldId: field.fieldId });
                          }}
                          className="p-1 hover:bg-[#F8F9FA] rounded-md text-[#475569] hover:text-[#0F172A]"
                          title="More options"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {/* Element Type 1: SHAPES */}
                    {field.itemType === "shape" ? (
                      <div
                        style={{
                          width: field.width ? `${(field.width / 100) * canvasDim.width}px` : "120px",
                          height: field.shapeType === "line" ? (field.height || 2) : field.height ? `${(field.height / 100) * canvasDim.height}px` : "60px",
                          background: bgGradientStyle,
                          borderColor: field.borderColor || "#CBD5E1",
                          borderWidth: field.shapeType === "line" ? 0 : (field.borderWidth ?? 1),
                          borderStyle: "solid",
                          borderRadius: field.shapeType === "circle" ? "50%" : field.borderRadius ?? 8,
                        }}
                      />
                    ) : field.itemType === "element" ? (
                      /* Element Type 2: GRAPHICS / SEALS */
                      field.elementType === "seal" ? (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-200 shadow-md flex flex-col items-center justify-center text-white font-serif">
                          <span className="text-sm">★</span>
                          <span className="text-[7px] font-black tracking-widest uppercase">OFFICIAL</span>
                        </div>
                      ) : field.elementType === "badge" ? (
                        <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-400 text-emerald-800 text-xs font-bold flex items-center gap-1 shadow-2xs">
                          <span>✓</span>
                          <span>VERIFIED</span>
                        </div>
                      ) : field.elementType === "stamp" ? (
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-blue-600 text-blue-700 flex flex-col items-center justify-center font-bold text-[8px] -rotate-12">
                          <span className="text-[9px] font-black">CERTIPORT</span>
                          <span>CERTIFIED</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-white border border-gray-900 font-mono text-xs tracking-widest text-gray-900">
                          |||| | ||| |||| | ||
                        </div>
                      )
                    ) : field.itemType === "photo" ? (
                      /* Element Type 3: PHOTOS */
                      <div
                        style={{
                          width: field.width ? `${(field.width / 100) * canvasDim.width}px` : "80px",
                          height: field.height ? `${(field.height / 100) * canvasDim.height}px` : "100px",
                          borderRadius: field.borderRadius ?? 8,
                          border: `${field.borderWidth ?? 1}px solid ${field.borderColor || "#CBD5E1"}`,
                          backgroundColor: "#F8FAFC",
                        }}
                        className="overflow-hidden flex items-center justify-center shadow-xs"
                      >
                        {field.imageUrl ? (
                          <img src={field.imageUrl} alt={field.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2 text-gray-400">
                            <span className="text-xl block">{field.photoType === "logo" ? "🏢" : "👤"}</span>
                            <span className="text-[9px] font-bold text-gray-500">{field.label}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Element Type 4: TEXT & CREDENTIAL FIELDS */
                      <div
                        style={{
                          fontSize: field.fontSize || 16,
                          color: hasGradient ? undefined : (field.fontColor || "#0F172A"),
                          background: hasGradient ? bgGradientStyle : undefined,
                          WebkitBackgroundClip: hasGradient ? "text" : undefined,
                          WebkitTextFillColor: hasGradient ? "transparent" : undefined,
                          fontFamily: field.fontFamily || "Inter, sans-serif",
                          fontWeight: field.fontStyle === "bold" || field.fontStyle === "bold-italic" ? 700 : field.fontStyle === "italic" ? 400 : 500,
                          fontStyle: field.fontStyle === "italic" || field.fontStyle === "bold-italic" ? "italic" : "normal",
                          textDecoration: field.textDecoration || "none",
                          textTransform: field.textTransform || "none",
                          textAlign: field.textAlign || "left",
                          letterSpacing: field.letterSpacing ? `${field.letterSpacing}px` : "normal",
                          whiteSpace: field.width ? "normal" : "nowrap",
                          width: field.width ? `${(field.width / 100) * canvasDim.width}px` : undefined,
                          lineHeight: field.width ? 1.6 : undefined,
                        }}
                      >
                        {previewValue}
                      </div>
                    )}

                    {/* Corner & Edge Interactive Resizer Handles */}
                    {isSelected && (
                      <>
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "nw")}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#FF5B37] rounded-full cursor-nwse-resize z-40"
                        />
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "ne")}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#FF5B37] rounded-full cursor-nesw-resize z-40"
                        />
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "sw")}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#FF5B37] rounded-full cursor-nesw-resize z-40"
                        />
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "se")}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#FF5B37] rounded-full cursor-nwse-resize z-40"
                        />
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "e")}
                          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border-2 border-[#FF5B37] rounded-sm cursor-ew-resize z-40"
                        />
                        <div
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "s")}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-[#FF5B37] rounded-sm cursor-ns-resize z-40"
                        />
                      </>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </main>

        {/* ====================================================== */}
        {/* D. RIGHT INSPECTOR PANEL: PROPERTIES & LAYERS          */}
        {/* ====================================================== */}
        <aside className="w-[320px] bg-white border-l border-[#E5E7EB] flex flex-col shrink-0 z-10 shadow-xs">
          {/* Header Segmented Pill: [ Properties | Layers ] */}
          <div className="p-3 border-b border-[#F1F5F9]">
            <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
              <button
                onClick={() => setInspectorTab("properties")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inspectorTab === "properties" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
              >
                Properties
              </button>
              <button
                onClick={() => setInspectorTab("layers")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${inspectorTab === "layers" ? "bg-white text-[#FF5B37] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
              >
                <span>Layers</span>
                <span className="text-[10px] bg-[#E2E8F0] text-[#475569] px-1.5 rounded-full font-mono">
                  {currentFields.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ================================================== */}
            {/* TAB 1: PROPERTIES (RESIZER, ALIGNMENT, COLOR, GRADIENT) */}
            {/* ================================================== */}
            {inspectorTab === "properties" && (
              <>
                {activeField ? (
                  <>
                    {/* 1. Alignment Toolbar */}
                    <div>
                      <span className="text-xs font-bold text-[#475569] mb-1.5 block">Alignment</span>
                      <div className="grid grid-cols-6 gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#E5E7EB]">
                        <button
                          onClick={() => handleAlign("left")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Left"
                        >
                          ⇤
                        </button>
                        <button
                          onClick={() => handleAlign("center")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Center"
                        >
                          ☰
                        </button>
                        <button
                          onClick={() => handleAlign("right")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Right"
                        >
                          ⇥
                        </button>
                        <button
                          onClick={() => handleAlign("top")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Top"
                        >
                          ⤒
                        </button>
                        <button
                          onClick={() => handleAlign("middle")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Middle"
                        >
                          ☲
                        </button>
                        <button
                          onClick={() => handleAlign("bottom")}
                          className="p-1.5 rounded-lg hover:bg-white text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center justify-center"
                          title="Align Bottom"
                        >
                          ⤓
                        </button>
                      </div>
                    </div>

                    {/* 2. Shape Resizer & Dimensions */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#475569]">Dimensions (Resizer)</span>
                        <span className="text-[10px] text-[#94A3B8]">W × H</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1">
                          <span className="text-[10px] font-bold text-[#64748B]">W%</span>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            value={Math.round(activeField.width || 30)}
                            onChange={(e) => updateActiveField({ width: parseFloat(e.target.value) || 10 })}
                            className="w-full bg-transparent text-xs font-bold text-[#0F172A] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1">
                          <span className="text-[10px] font-bold text-[#64748B]">H%</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={Math.round(activeField.height || 15)}
                            onChange={(e) => updateActiveField({ height: parseFloat(e.target.value) || 5 })}
                            className="w-full bg-transparent text-xs font-bold text-[#0F172A] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Corner Radius / Roundness */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#475569]">Corner Radius</span>
                        <span className="text-xs font-bold text-[#0F172A] font-mono">{activeField.borderRadius ?? 8}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={activeField.borderRadius ?? 8}
                        onChange={(e) => updateActiveField({ borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-[#FF5B37] cursor-pointer"
                      />
                    </div>

                    {/* 4. Color & Gradient Controls */}
                    <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#475569]">Fill Color</span>
                        <button
                          onClick={() => {
                            const current = activeField.gradient?.enabled;
                            updateActiveField({
                              gradient: {
                                enabled: !current,
                                from: activeField.gradient?.from || activeField.bgColor || "#FF5B37",
                                to: activeField.gradient?.to || "#F59E0B",
                                direction: activeField.gradient?.direction || "to right",
                              },
                            });
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${activeField.gradient?.enabled
                            ? "bg-[#FFF0EB] text-[#FF5B37] border-[#FFD8CF]"
                            : "bg-[#F8F9FA] text-[#64748B] border-[#E5E7EB]"
                            }`}
                        >
                          {activeField.gradient?.enabled ? "Gradient ON" : "Use Gradient"}
                        </button>
                      </div>

                      {/* Gradient Settings if Enabled */}
                      {activeField.gradient?.enabled ? (
                        <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-[#64748B] block mb-1">From</span>
                              <input
                                type="color"
                                value={activeField.gradient.from}
                                onChange={(e) => updateActiveField({
                                  gradient: { ...activeField.gradient!, from: e.target.value },
                                })}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-[#64748B] block mb-1">To</span>
                              <input
                                type="color"
                                value={activeField.gradient.to}
                                onChange={(e) => updateActiveField({
                                  gradient: { ...activeField.gradient!, to: e.target.value },
                                })}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-[#64748B] block mb-1">Direction</span>
                              <select
                                value={activeField.gradient.direction}
                                onChange={(e) => updateActiveField({
                                  gradient: { ...activeField.gradient!, direction: e.target.value as any },
                                })}
                                className="w-full bg-white border border-[#CBD5E1] text-[10px] font-semibold rounded-lg p-1.5"
                              >
                                <option value="to right">→ Right</option>
                                <option value="to bottom">↓ Bottom</option>
                                <option value="to bottom right">↘ Diagonal</option>
                                <option value="to top right">↗ Reverse</option>
                              </select>
                            </div>
                          </div>

                          {/* Preset gradient swatches */}
                          <div className="grid grid-cols-6 gap-1 pt-1">
                            {GRADIENT_PRESETS.map((gp) => (
                              <button
                                key={gp.name}
                                onClick={() => updateActiveField({
                                  gradient: { ...activeField.gradient!, from: gp.from, to: gp.to },
                                })}
                                style={{ background: `linear-gradient(to right, ${gp.from}, ${gp.to})` }}
                                className="h-5 rounded-md border border-white shadow-2xs hover:scale-105 transition-transform"
                                title={gp.name}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Solid Color Swatches */
                        <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={activeField.bgColor && activeField.bgColor !== "transparent" ? activeField.bgColor : "#0F172A"}
                            onChange={(e) => updateActiveField({ bgColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={activeField.bgColor || "transparent"}
                            onChange={(e) => updateActiveField({ bgColor: e.target.value })}
                            className="flex-1 bg-transparent text-xs font-mono font-bold text-[#0F172A] outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* 5. Typography Content & Font (for Text & Field) */}
                    <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                      <span className="text-xs font-bold text-[#475569] block">Typography</span>
                      <div>
                        <span className="text-[10px] text-[#64748B] mb-1 block">Label / Text</span>
                        <input
                          type="text"
                          value={activeField.itemType === "text" ? (activeField.content || "") : activeField.label}
                          onChange={(e) => {
                            if (activeField.itemType === "text") {
                              updateActiveField({ content: e.target.value, label: e.target.value });
                            } else {
                              updateActiveField({ label: e.target.value });
                            }
                          }}
                          className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-semibold focus:bg-white focus:border-[#CBD5E1] outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[#64748B] mb-1 block">Font Size</span>
                          <input
                            type="number"
                            value={activeField.fontSize || 16}
                            onChange={(e) => updateActiveField({ fontSize: parseInt(e.target.value) || 12 })}
                            className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-bold outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] mb-1 block">Font Color</span>
                          <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-2 py-1">
                            <input
                              type="color"
                              value={activeField.fontColor || "#0F172A"}
                              onChange={(e) => updateActiveField({ fontColor: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-xs font-mono font-bold text-[#475569] uppercase">
                              {activeField.fontColor || "#0F172A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Text Alignment */}
                      <div>
                        <span className="text-[10px] text-[#64748B] mb-1 block">Text Alignment</span>
                        <div className="grid grid-cols-4 gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#E5E7EB]">
                          {(["left", "center", "right", "justify"] as const).map((align) => (
                            <button
                              key={align}
                              onClick={() => updateActiveField({ textAlign: align })}
                              className={`py-1 rounded-lg text-xs font-bold transition-all ${(activeField.textAlign || "left") === align
                                ? "bg-white text-[#FF5B37] shadow-xs"
                                : "text-[#64748B] hover:text-[#0F172A]"
                                }`}
                              title={`Align text ${align}`}
                            >
                              {align === "left" ? "⇤ Left" : align === "center" ? "☰ Center" : align === "right" ? "⇥ Right" : "≡ Justify"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Delete and Lock Actions */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center gap-2">
                      <button
                        onClick={() => updateActiveField({ locked: !activeField.locked })}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeField.locked
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "bg-white border-[#E5E7EB] text-[#475569] hover:bg-[#F8F9FA]"
                          }`}
                      >
                        <span>{activeField.locked ? "🔒" : "🔓"}</span>
                        <span>{activeField.locked ? "Locked" : "Lock"}</span>
                      </button>
                      <button
                        onClick={() => {
                          commitToHistory(currentFields.filter((f) => f.fieldId !== activeField.fieldId));
                          setSelectedIds([]);
                          setActiveFieldId(null);
                        }}
                        className="py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all"
                        title="Delete element"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <span className="text-sm font-black text-[#0F172A]">Page Setup</span>
                    <div className="bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64748B]">Document:</span>
                        <span className="font-bold text-[#0F172A]">{template.type}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64748B]">Size:</span>
                        <span className="font-bold text-[#0F172A]">{canvasDim.label}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64748B]">Dimensions:</span>
                        <span className="font-bold text-[#0F172A]">{canvasDim.physicalSize}</span>
                      </div>
                    </div>

                    {/* Canvas Background Color Picker */}
                    <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                      <span className="text-xs font-bold text-[#475569] block">Canvas Background Color</span>
                      <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl p-2 shadow-2xs">
                        <input
                          type="color"
                          value={currentBgColor || "#FFFFFF"}
                          onChange={(e) => setCurrentBgColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentBgColor || "#FFFFFF"}
                          onChange={(e) => setCurrentBgColor(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold text-[#0F172A] outline-none uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {["#FFFFFF", "#F8FAFC", "#FFFCF5", "#EFF6FF", "#F0FDF4", "#FFF0EB", "#0F172A", "#1E3A8A", "#064E3B", "#7C3AED"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setCurrentBgColor(c)}
                            style={{ backgroundColor: c }}
                            className="w-full h-6 rounded-md border border-[#CBD5E1] hover:scale-105 transition-transform"
                            title={`Background ${c}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-[#94A3B8] text-center pt-4">
                      Click any element to resize, align, apply gradients, or switch to the Layers tab.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================================================== */}
            {/* TAB 2: LAYERS TAB (REPLACES STYLE)                 */}
            {/* ================================================== */}
            {inspectorTab === "layers" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">Canvas Layers</span>
                  <span className="text-[10px] text-[#94A3B8]">Top to Bottom</span>
                </div>

                {currentFields.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#94A3B8] bg-[#F8F9FA] rounded-2xl border border-dashed border-[#CBD5E1]">
                    No layers on canvas yet. Add shapes, text, or fields from the left drawer.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {/* Render layers in reverse zIndex order so top layer is on top of list */}
                    {[...currentFields].reverse().map((layer) => {
                      const isSelected = selectedIds.includes(layer.fieldId) || activeFieldId === layer.fieldId;
                      const typeIcon =
                        layer.itemType === "shape" ? "🔲" :
                          layer.itemType === "element" ? "🏅" :
                            layer.itemType === "photo" ? "🖼️" :
                              layer.itemType === "field" ? "🏷️" : "🔤";

                      return (
                        <div
                          key={layer.fieldId}
                          onClick={() => {
                            setSelectedIds([layer.fieldId]);
                            setActiveFieldId(layer.fieldId);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isSelected
                            ? "bg-white border-[#FF5B37] shadow-xs ring-1 ring-[#FF5B37]"
                            : "bg-[#F8F9FA] border-[#E5E7EB] hover:bg-white hover:border-[#CBD5E1]"
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{typeIcon}</span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#0F172A] block truncate leading-tight">
                                {layer.itemType === "text" ? (layer.content || layer.label) : layer.label}
                              </span>
                              <span className="text-[9px] text-[#94A3B8] font-mono">
                                {layer.itemType} • z{layer.zIndex || 1}
                              </span>
                            </div>
                          </div>

                          {/* Reorder and Toggle Controls */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleMoveLayer(layer.fieldId, "up")}
                              className="w-5 h-5 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]"
                              title="Move Layer Up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveLayer(layer.fieldId, "down")}
                              className="w-5 h-5 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]"
                              title="Move Layer Down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => updateActiveField({ opacity: (layer.opacity ?? 1) > 0 ? 0 : 1 })}
                              className="w-5 h-5 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]"
                              title="Toggle Visibility"
                            >
                              {(layer.opacity ?? 1) > 0 ? "👁️" : "🚫"}
                            </button>
                            <button
                              onClick={() => updateActiveField({ locked: !layer.locked })}
                              className="w-5 h-5 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]"
                              title="Toggle Lock"
                            >
                              {layer.locked ? "🔒" : "🔓"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 3. CODE IMPORT MODAL WITH AUTOMATIC FIELD EXTRACTION     */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E5E7EB] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#0F172A] block">Import Layout & Extract Fields</span>
                <span className="text-[11px] text-[#64748B]">Paste HTML/SVG/JSON code to automatically parse dynamic fields</span>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
              {(["html", "svg", "json"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setImportCodeType(fmt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg uppercase transition-all ${importCodeType === fmt ? "bg-white text-[#FF5B37] shadow-xs" : "text-[#64748B]"
                    }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              value={importCodeText}
              onChange={(e) => setImportCodeText(e.target.value)}
              placeholder={`Paste your ${importCodeType.toUpperCase()} code here...`}
              className="w-full font-mono text-xs p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] focus:bg-white outline-none"
            />

            {/* Live Detected Elements Preview */}
            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <span>⚡ Detected Elements:</span>
                  <span className="bg-[#FF5B37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                    {detectedImportFields.length}
                  </span>
                </span>
                <span className="text-[10px] text-[#94A3B8]">All elements will be editable on canvas</span>
              </div>

              {detectedImportFields.length === 0 ? (
                <span className="text-[11px] text-[#94A3B8] italic block">
                  Paste SVG, HTML, or JSON code. Elements will be decomposed into editable shapes, text, images, and fields.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {detectedImportFields.map((df, idx) => {
                    const typeIcon = df.itemType === "shape" ? "🔲" : df.itemType === "photo" ? "🖼️" : df.itemType === "field" ? "🏷️" : "🔤";
                    const typeBg = df.itemType === "shape" ? "bg-blue-50 border-blue-200" : df.itemType === "photo" ? "bg-amber-50 border-amber-200" : df.itemType === "field" ? "bg-emerald-50 border-emerald-200" : "bg-white border-[#E2E8F0]";
                    return (
                      <span
                        key={`detected_${idx}_${df.fieldId}`}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold text-[#0F172A] shadow-2xs flex items-center gap-1 ${typeBg}`}
                      >
                        <span>{typeIcon}</span>
                        <span className="truncate max-w-[100px]">{df.label}</span>
                        <span className="text-[#94A3B8] font-mono text-[8px]">{df.itemType}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-[#F8F9FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCode}
                className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-xs transition-all"
              >
                Import & Add to Canvas ({detectedImportFields.length} Elements)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SHARE / PREVIEW MODAL                                 */}
      {/* ======================================================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-6 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 border border-[#E5E7EB] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-black text-[#0F172A] block">Document Preview</span>
                <span className="text-xs text-[#64748B]">{template.name} • {organization.name}</span>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
            </div>
            <div className="flex justify-center p-4 bg-[#F8F9FA] rounded-2xl overflow-auto border border-[#E5E7EB]">
              <div
                style={{
                  width: canvasDim.width * 0.7,
                  height: canvasDim.height * 0.7,
                }}
                className="bg-white rounded-xl shadow-lg border border-[#CBD5E1] relative overflow-hidden"
              >
                {currentBgUrl && <img src={currentBgUrl} alt="Preview BG" className="absolute inset-0 w-full h-full object-fill" />}
                {currentFields.map((f, idx) => (
                  <div
                    key={`preview_${f.fieldId}_${idx}`}
                    style={{
                      position: "absolute",
                      left: `${f.left}%`,
                      top: `${f.top}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: (f.fontSize || 16) * 0.7,
                      color: f.fontColor || "#0F172A",
                      fontFamily: f.fontFamily || "Inter, sans-serif",
                      fontWeight: f.fontStyle === "bold" ? 700 : 500,
                    }}
                  >
                    {f.itemType === "text" ? (f.content || f.label) : (SAMPLE_PREVIEW_DATA[f.fieldId] || f.label)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 5. FLOATING CONTEXT MENU (RIGHT-CLICK / MORE OPTIONS)    */}
      {/* ======================================================== */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: Math.min(typeof window !== "undefined" ? window.innerWidth - 260 : 500, contextMenu.x),
            top: Math.min(typeof window !== "undefined" ? window.innerHeight - 520 : 400, contextMenu.y),
            zIndex: 9999,
          }}
          className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E2E8F0] py-1.5 w-64 text-[#0F172A] text-xs font-semibold animate-in fade-in zoom-in-95 duration-100 select-none overflow-visible"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Copy */}
          <button
            onClick={() => { handleCopy(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Copy</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+C</span>
          </button>

          {/* Copy style */}
          <button
            onClick={() => { handleCopyStyle(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
              <span>Copy style</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+Alt+C</span>
          </button>

          {/* Paste */}
          <button
            onClick={() => {
              if (copiedStyleRef.current && !copiedFieldsRef.current) handlePasteStyle();
              else handlePaste();
              setContextMenu(null);
            }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
              <span>Paste</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+V</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => { handleDuplicate(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Duplicate</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+D</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => { handleDelete(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-red-50 flex items-center justify-between text-left text-red-600 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">DELETE</span>
          </button>

          <div className="h-px bg-[#F1F5F9] my-1" />

          {/* Align to page Submenu */}
          <div className="relative group/align">
            <button className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors">
              <div className="flex items-center gap-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                <span>Align to page</span>
              </div>
              <span className="text-[#94A3B8] text-xs">›</span>
            </button>

            <div className="hidden group-hover/align:block absolute left-full top-0 ml-1 w-40 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] py-1 text-xs">
              <button onClick={() => { handleAlign("left"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Left</button>
              <button onClick={() => { handleAlign("center"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Center</button>
              <button onClick={() => { handleAlign("right"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Right</button>
              <div className="h-px bg-[#F1F5F9] my-0.5" />
              <button onClick={() => { handleAlign("top"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Top</button>
              <button onClick={() => { handleAlign("middle"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Middle</button>
              <button onClick={() => { handleAlign("bottom"); setContextMenu(null); }} className="w-full px-3 py-1.5 hover:bg-[#F8F9FA] text-left">Bottom</button>
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9] my-1" />

          {/* Ungroup / Group */}
          <button
            onClick={() => {
              if (selectedIds.some((id) => currentFields.find((f) => f.fieldId === id)?.groupId)) handleUngroup();
              else handleGroup();
              setContextMenu(null);
            }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>{selectedIds.some((id) => currentFields.find((f) => f.fieldId === id)?.groupId) ? "Ungroup" : "Group"}</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+Shift+G</span>
          </button>

          {/* Resize canvas to selection */}
          <button
            onClick={() => { handleResizeCanvasToSelection(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
              <span>Resize canvas to selection</span>
            </div>
            <span className="text-amber-500 text-[10px]">👑</span>
          </button>

          {/* Create component */}
          <button
            onClick={() => { handleCreateComponent(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Create component</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+Alt+K</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => { handleAddComment(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span>Comment</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Ctrl+Alt+N</span>
          </button>

          {/* Lock */}
          <button
            onClick={() => { handleToggleLock(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>{currentFields.filter((f) => selectedIds.includes(f.fieldId)).every((f) => f.locked) ? "Unlock" : "Lock"}</span>
            </div>
            <span className="text-[#94A3B8] text-xs">›</span>
          </button>

          {/* Show element timing */}
          <button
            onClick={() => { handleShowElementTiming(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Show element timing</span>
            </div>
          </button>

          {/* Apply colours to page */}
          <button
            onClick={() => { handleApplyColoursToPage(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.64-1.59-.41-.41-.64-.98-.64-1.59 0-1.38 1.12-2.5 2.5-2.5H18c2.21 0 4-1.79 4-4 0-5.51-4.49-10-10-10z" />
              </svg>
              <span>Apply colours to page</span>
            </div>
          </button>

          {/* Download selection */}
          <button
            onClick={() => { handleDownloadSelection(); setContextMenu(null); }}
            className="w-full px-3.5 py-2 hover:bg-[#F8F9FA] flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Download selection</span>
            </div>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TOAST NOTIFICATION OVERLAY                            */}
      {/* ======================================================== */}
      {timingToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-[#0F172A] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span>✨ {timingToast}</span>
        </div>
      )}
    </div>
  );
}
