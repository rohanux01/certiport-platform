import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReviewActionButtons from "./ReviewActionButtons";
import CardVisualPreview from "@/components/CardVisualPreview";

export default async function CandidateReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const cardRequest = await db.cardRequest.findUnique({
    where: { candidateToken: token },
    include: {
      template: true,
      organization: { select: { name: true } },
    },
  });

  if (!cardRequest) {
    notFound();
  }

  const fields = cardRequest.fields as Record<string, any>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white font-bold text-xl shadow-md">
            M
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Card Verification & Review
          </h1>
          <p className="text-sm text-gray-500">
            Please verify your information for {cardRequest.organization.name}
          </p>
        </div>

        {/* Card Mockup */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
          <CardVisualPreview
            template={cardRequest.template}
            fields={fields}
            orgName={cardRequest.organization.name}
            fileUrl={cardRequest.fileUrl}
          />

          {/* Details breakdown */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Information Details
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <dt className="text-gray-400">Full Name</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{fields?.fullName || "—"}</dd>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <dt className="text-gray-400">Designation / Title</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{fields?.jobTitle || "—"}</dd>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <dt className="text-gray-400">Email</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{fields?.email || "—"}</dd>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <dt className="text-gray-400">Phone</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{fields?.phone || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Action buttons */}
          <ReviewActionButtons token={token} currentStatus={cardRequest.status} />
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mt-8">
        Secured by CertiPort Identity Platform · No login required
      </div>
    </div>
  );
}
