"use client";

import { useParams } from "next/navigation";
import { GenericIntegrationDetail } from "@/components/integrations/generic-integration-detail";
import { GoogleConversionsDetail } from "@/components/integrations/google-conversions-detail";
import { GoogleFormsDetail } from "@/components/integrations/google-forms-detail";
import { MetaAdsDetail } from "@/components/integrations/meta-ads-detail";
import { MetaCapiDetail } from "@/components/integrations/meta-capi-detail";
import { WebsiteDetail } from "@/components/integrations/website-detail";

const DETAILS = {
  meta_ads: MetaAdsDetail,
  meta_capi: MetaCapiDetail,
  website: WebsiteDetail,
  google_ads: GoogleFormsDetail,
  google_oci: GoogleConversionsDetail,
};

export default function IntegrationDetailPage() {
  const { key } = useParams();
  const Detail = DETAILS[String(key).toLowerCase()] || GenericIntegrationDetail;
  return <Detail />;
}