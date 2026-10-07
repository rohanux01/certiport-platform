"use client";

import React, { useState } from "react";

export interface CardVisualPreviewProps {
  template: {
    name: string;
    type: string;
    backgroundUrl?: string | null;
    fieldLayout?: any;
  };
  fields: {
    fullName?: string;
    jobTitle?: string;
    employeeId?: string;
    email?: string;
    phone?: string;
    bloodGroup?: string;
    photoUrl?: string;
    department?: string;
    companyName?: string;
    [key: string]: any;
  };
  orgName?: string;
  fileUrl?: string | null;
}

export default function CardVisualPreview({
  template,
  fields,
  orgName = "CERTIPORT",
  fileUrl,
}: CardVisualPreviewProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  const layout = template.fieldLayout;
  const orientation =
    layout && typeof layout === "object" && !Array.isArray(layout) && layout.orientation === "PORTRAIT"
      ? "PORTRAIT"
      : "LANDSCAPE";

  const isPortrait = orientation === "PORTRAIT";
  const isBusinessCard = template.type === "BUSINESS_CARD";
  const isTwoSided = template.type === "ID_CARD" || template.type === "BUSINESS_CARD" || Boolean(layout?.sides?.back);

  // Extract front and back side fields & backgrounds
  const frontCustomFields: any[] = layout?.sides?.front?.fields
    ? layout.sides.front.fields
    : Array.isArray(layout)
      ? layout
      : Array.isArray(layout?.fields)
        ? layout.fields
        : [];

  const backCustomFields: any[] = layout?.sides?.back?.fields || [];
  const frontBgUrl = layout?.sides?.front?.backgroundUrl || template.backgroundUrl || null;
  const backBgUrl = layout?.sides?.back?.backgroundUrl || null;

  const hasCustomFront = frontCustomFields.length > 0;
  const hasCustomBack = backCustomFields.length > 0;

  // Resolve field values
  const getFieldValue = (fieldId: string) => {
    if (fields[fieldId] !== undefined) return fields[fieldId];
    if (fieldId === "recipientName" || fieldId === "fullName") return fields.fullName || "Candidate Name";
    if (fieldId === "jobTitle") return fields.jobTitle || "Job Title";
    if (fieldId === "employeeId") return fields.employeeId || "EMP-0000";
    if (fieldId === "email") return fields.email || "email@gttdata.ai";
    if (fieldId === "phone") return fields.phone || "+1 (555) 000-0000";
    if (fieldId === "bloodGroup") return fields.bloodGroup || "O+";
    if (fieldId === "department") return fields.department || "Corporate";
    if (fieldId === "companyName") return fields.companyName || orgName;
    if (fieldId === "termsText") return "This credential remains property of the issuer. If found, please return to any company facility.";
    if (fieldId === "emergencyContact") return "Emergency: +1 (800) 555-0199 (Security Operations)";
    if (fieldId === "address") return "124 Innovation Way, Tech Hub Suite 300";
    if (fieldId === "website") return "https://certiport.co";
    if (fieldId === "companySlogan") return "Securing Digital Credentials Worldwide";
    return fields[fieldId] || "";
  };

  // Render a list of fields onto card face
  const renderFieldItems = (items: any[], bgUrl: string | null) => {
    return items.map((f: any, idx: number) => {
      const val = getFieldValue(f.fieldId);
      const isQr = f.fieldId === "qrCode" || f.fieldId.startsWith("qrCode");

      return (
        <div
          key={f.fieldId || idx}
          style={{
            position: "absolute",
            left: f.left + "%",
            top: f.top + "%",
            transform: "translate(-50%, -50%)",
            fontSize: (f.fontSize || 14) * 0.85,
            fontWeight: f.fontStyle === "bold" ? 700 : 500,
            fontStyle: f.fontStyle === "italic" ? "italic" : "normal",
            fontFamily: f.fontFamily || "Inter, sans-serif",
            color: f.fontColor || (bgUrl ? "#111827" : "#FFFFFF"),
            textAlign: f.textAlign || "left",
            whiteSpace: "nowrap",
            zIndex: f.itemType === "shape" ? 2 : 10,
            opacity: typeof f.opacity === "number" ? f.opacity : 1,
          }}
        >
          {f.itemType === "shape" ? (
            <div
              style={{
                width: f.width ? `${(f.width / 100) * (isPortrait ? 300 : 460)}px` : "100px",
                height: f.shapeType === "line" ? (f.height || 2) : f.height ? `${(f.height / 100) * (isPortrait ? 470 : 290)}px` : "60px",
                backgroundColor: f.bgColor || "transparent",
                borderColor: f.borderColor || "#D1D5DB",
                borderWidth: f.shapeType === "line" ? 0 : (f.borderWidth ?? 1),
                borderStyle: "solid",
                borderRadius: f.shapeType === "circle" ? "50%" : f.borderRadius ?? 8,
              }}
            />
          ) : f.itemType === "element" ? (
            f.elementType === "seal" ? (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                border: "2px double #FEF3C7",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}>
                <span style={{ fontSize: 11 }}>★</span>
                <span style={{ fontSize: 6, fontWeight: 800 }}>OFFICIAL</span>
              </div>
            ) : f.elementType === "badge" ? (
              <div style={{
                padding: "3px 8px",
                borderRadius: 14,
                background: "#ECFDF5",
                border: "1px solid #10B981",
                color: "#065F46",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 8,
                fontWeight: 700,
              }}>
                <span>✓</span>
                <span>VERIFIED</span>
              </div>
            ) : f.elementType === "stamp" ? (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1.5px dashed #1E40AF",
                color: "#1E40AF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(-10deg)",
              }}>
                <span style={{ fontSize: 6, fontWeight: 900 }}>CERTIPORT</span>
                <span style={{ fontSize: 5, fontWeight: 700 }}>CERTIFIED</span>
              </div>
            ) : (
              <div style={{
                padding: "3px 6px",
                background: "#fff",
                border: "1px solid #111827",
                fontFamily: "monospace",
                fontSize: 8,
                letterSpacing: 2,
                color: "#111827",
              }}>
                |||| | ||| |||| | ||
              </div>
            )
          ) : f.itemType === "photo" ? (
            <div
              style={{
                width: f.width ? `${(f.width / 100) * (isPortrait ? 300 : 460)}px` : "70px",
                height: f.height ? `${(f.height / 100) * (isPortrait ? 470 : 290)}px` : "90px",
                borderRadius: f.borderRadius ?? 8,
                border: `${f.borderWidth ?? 1}px solid ${f.borderColor || "#D1D5DB"}`,
                overflow: "hidden",
                background: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {f.imageUrl || (f.photoType === "candidate" && fields.photoUrl) ? (
                <img
                  src={f.imageUrl || fields.photoUrl}
                  alt={f.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 4, color: "#9CA3AF" }}>
                  <div style={{ fontSize: 18 }}>{f.photoType === "logo" ? "🏢" : "👤"}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: "#64748B" }}>{f.label}</div>
                </div>
              )}
            </div>
          ) : isQr ? (
            <div
              style={{
                width: 44,
                height: 44,
                border: "1.5px solid currentColor",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              QR CODE
            </div>
          ) : (
            f.itemType === "text" ? (f.content || f.label) : (val || `[${f.label}]`)
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Dual-Sided Flip Segmented Switcher */}
      {isTwoSided && (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              background: "#F1F5F9",
              padding: "3px",
              borderRadius: 10,
              border: "1.5px solid #CBD5E1",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
              gap: 3,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSide("front")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 14px",
                borderRadius: 7,
                border: "none",
                fontSize: 11,
                fontWeight: activeSide === "front" ? 700 : 500,
                background: activeSide === "front" ? "#0F172A" : "transparent",
                color: activeSide === "front" ? "#FFFFFF" : "#475569",
                cursor: "pointer",
                boxShadow: activeSide === "front" ? "0 2px 4px rgba(15,23,42,0.2)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>📄</span>
              <span>Front Face</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("back")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 14px",
                borderRadius: 7,
                border: "none",
                fontSize: 11,
                fontWeight: activeSide === "back" ? 700 : 500,
                background: activeSide === "back" ? "#0F172A" : "transparent",
                color: activeSide === "back" ? "#FFFFFF" : "#475569",
                cursor: "pointer",
                boxShadow: activeSide === "back" ? "0 2px 4px rgba(15,23,42,0.2)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>🔄</span>
              <span>Back Face</span>
            </button>
          </div>

          {/* Quick 3D Flip Action */}
          <button
            type="button"
            onClick={() => setActiveSide(activeSide === "front" ? "back" : "front")}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              color: "#334151",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            title="Flip card in 3D"
          >
            <span>Flip 3D</span>
            <span style={{ fontSize: 13 }}>↺</span>
          </button>
        </div>
      )}

      {/* 3D Perspective Card Container */}
      <div
        style={{
          width: "100%",
          maxWidth: isPortrait ? 320 : 490,
          aspectRatio: isPortrait ? "54 / 85.6" : "85.6 / 54",
          position: "relative",
          perspective: 1200,
        }}
      >
        {/* Flip Inner Card Wrapper */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d",
            transform: activeSide === "back" ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ======================================================== */}
          {/* FRONT FACE                                               */}
          {/* ======================================================== */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 14px 35px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "#0F172A",
              userSelect: "none",
            }}
          >
            {/* Background Artwork */}
            {frontBgUrl ? (
              <img
                src={frontBgUrl}
                alt="Card front artwork"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isBusinessCard
                    ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #0F172A 100%)"
                    : "linear-gradient(135deg, #064E3B 0%, #0F172A 60%, #022C22 100%)",
                  zIndex: 1,
                }}
              >
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 16px)" }} />
              </div>
            )}

            {/* Front Content */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: isPortrait ? 20 : "18px 22px",
                color: frontBgUrl ? "#111827" : "#FFFFFF",
              }}
            >
              {hasCustomFront ? (
                <div style={{ position: "absolute", inset: 0 }}>
                  {renderFieldItems(frontCustomFields, frontBgUrl)}
                </div>
              ) : isPortrait ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "#10B981", color: "#022C22", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                        M
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "1px", color: frontBgUrl ? "#111827" : "#FFFFFF" }}>
                        {orgName.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: "monospace", background: "rgba(16, 185, 129, 0.15)", color: frontBgUrl ? "#065F46" : "#6EE7B7", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      {fields.employeeId || "EMP-ID"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "auto 0", textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "3px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: frontBgUrl ? "#065F46" : "#A7F3D0", marginBottom: 10, overflow: "hidden" }}>
                      {fields.photoUrl ? (
                        <img src={fields.photoUrl} alt="Candidate" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        fields.fullName ? fields.fullName[0].toUpperCase() : "?"
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: frontBgUrl ? "#111827" : "#FFFFFF" }}>
                      {fields.fullName || "Candidate Name"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: frontBgUrl ? "#065F46" : "#34D399", marginTop: 2 }}>
                      {fields.jobTitle || "Job Title"}
                    </div>
                    <div style={{ fontSize: 10, color: frontBgUrl ? "#6B7280" : "#94A3B8", marginTop: 4 }}>
                      {fields.email || "email@gttdata.ai"}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: frontBgUrl ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.1)", paddingTop: 8, fontSize: 9, color: frontBgUrl ? "#4B5563" : "#94A3B8" }}>
                    <div>
                      <div>Blood: <strong style={{ color: frontBgUrl ? "#DC2626" : "#F87171" }}>{fields.bloodGroup || "—"}</strong></div>
                      <div>Phone: {fields.phone || "—"}</div>
                    </div>
                    <div style={{ fontFamily: "monospace", color: frontBgUrl ? "#065F46" : "#34D399" }}>
                      {template.name}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#10B981", color: "#022C22", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                        M
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "1px", color: frontBgUrl ? "#111827" : "#FFFFFF" }}>
                        {orgName.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", background: "rgba(16, 185, 129, 0.15)", color: frontBgUrl ? "#065F46" : "#6EE7B7", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      {fields.employeeId || "EMP-ID"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "auto 0" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: frontBgUrl ? "#065F46" : "#A7F3D0", flexShrink: 0, overflow: "hidden" }}>
                      {fields.photoUrl ? (
                        <img src={fields.photoUrl} alt="Candidate" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        fields.fullName ? fields.fullName[0].toUpperCase() : "?"
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: frontBgUrl ? "#111827" : "#FFFFFF" }}>
                        {fields.fullName || "Candidate Full Name"}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: frontBgUrl ? "#065F46" : "#34D399", marginTop: 2 }}>
                        {fields.jobTitle || "Job Title"}
                      </div>
                      <div style={{ fontSize: 11, color: frontBgUrl ? "#6B7280" : "#94A3B8", marginTop: 4 }}>
                        {fields.email || "email@gttdata.ai"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: frontBgUrl ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.1)", paddingTop: 8, fontSize: 10, color: frontBgUrl ? "#4B5563" : "#94A3B8" }}>
                    <div>
                      Blood: <strong style={{ color: frontBgUrl ? "#DC2626" : "#F87171" }}>{fields.bloodGroup || "—"}</strong> · Phone: {fields.phone || "—"}
                    </div>
                    <div style={{ fontFamily: "monospace", color: frontBgUrl ? "#065F46" : "#34D399" }}>
                      {template.name}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* BACK FACE                                                */}
          {/* ======================================================== */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 14px 35px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "#1E293B",
              userSelect: "none",
            }}
          >
            {/* Background Artwork */}
            {backBgUrl ? (
              <img
                src={backBgUrl}
                alt="Card back artwork"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isBusinessCard
                    ? "linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)"
                    : "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #064E3B 100%)",
                  zIndex: 1,
                }}
              >
                <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 16px)" }} />
              </div>
            )}

            {/* Back Content */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: isPortrait ? "18px 16px" : "18px 22px",
                color: backBgUrl ? "#111827" : "#FFFFFF",
              }}
            >
              {hasCustomBack ? (
                <div style={{ position: "absolute", inset: 0 }}>
                  {renderFieldItems(backCustomFields, backBgUrl)}
                </div>
              ) : (
                /* Default Corporate Security Back Face */
                <>
                  {/* Top Barcode or Magnetic Stripe */}
                  <div>
                    <div style={{ background: "#0F172A", height: isPortrait ? 24 : 28, margin: "-18px -22px 12px -22px", opacity: 0.85, borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: backBgUrl ? "#475569" : "#94A3B8" }}>
                        OFFICIAL IDENTIFICATION
                      </span>
                      <span style={{ fontSize: 8, fontFamily: "monospace", color: backBgUrl ? "#166534" : "#34D399" }}>
                        CERTIPORT CERTIFIED
                      </span>
                    </div>
                  </div>

                  {/* Middle Disclaimer & Terms */}
                  <div style={{ fontSize: 8.5, lineHeight: 1.4, color: backBgUrl ? "#475569" : "#94A3B8", textAlign: "center", margin: "auto 0" }}>
                    <p style={{ margin: "0 0 6px 0" }}>
                      This card is non-transferable and remains property of {orgName}. Use implies acceptance of all company physical and digital security protocols.
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: backBgUrl ? "#DC2626" : "#F87171" }}>
                      If found, please return to any company office or contact Security Desk.
                    </p>
                  </div>

                  {/* Bottom Barcode & Serial */}
                  <div style={{ borderTop: backBgUrl ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.1)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#0F172A" }}>
                      |||| | ||| |||| | |||
                    </div>
                    <div style={{ textAlign: "right", fontSize: 8, color: backBgUrl ? "#64748B" : "#94A3B8" }}>
                      <div>{fields.employeeId || "CR80-SEC-01"}</div>
                      <div style={{ color: backBgUrl ? "#2563EB" : "#60A5FA" }}>certiport.co/verify</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Bar below card: orientation badge, side indicator, & PDF download */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: isPortrait ? 320 : 490, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B7280" }}>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              background: isPortrait ? "#F0FDF4" : "#EFF6FF",
              color: isPortrait ? "#166534" : "#1D4ED8",
            }}
          >
            {isPortrait ? "↕ Vertical (Portrait)" : "↔ Landscape"}
          </span>
          {isTwoSided && (
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: "#F1F5F9",
                color: "#475569",
              }}
            >
              {activeSide === "front" ? "Front Side Active" : "Back Side Active"}
            </span>
          )}
          <span>{template.type.replace(/_/g, " ")}</span>
        </div>

        {fileUrl && (
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "#12805A",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              padding: "3px 10px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            <span>Download Card PDF</span>
            <span style={{ fontSize: 10 }}>↓</span>
          </a>
        )}
      </div>
    </div>
  );
}
